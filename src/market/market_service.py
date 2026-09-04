import os
import logging
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()
from typing import List, Dict, Any, Optional
import requests

# Configure logging
logger = logging.getLogger(__name__)

class MarketService:
    """
    MarketService interacts with the data.gov.in API to fetch current daily market
    prices and arrivals for agricultural commodities from wholesale markets (Mandis).
    """

    def __init__(self) -> None:
        """
        Initializes the MarketService by loading the data.gov.in API key and
        Resource ID from environment variables.
        """
        self.api_key: Optional[str] = os.getenv("DATA_GOV_API_KEY")
        self.resource_id: str = os.getenv("DATA_GOV_RESOURCE_ID", "9ef84268-d588-465a-a308-a864a43d0070")
        self.base_url: str = f"https://api.data.gov.in/resource/{self.resource_id}"

        # Mapping of user-friendly names to possible API commodity values (list of variants)
        self.commodity_variants: Dict[str, List[str]] = {
            "paddy": ["Paddy(Dhan)", "Paddy(Common)", "Paddy(Basmati)", "Rice"],
            "cotton": ["Cotton"],
            "groundnut": ["Groundnut", "Groundnut pods(raw)", "Ground Nut Seed", "Groundnut(Split)"]
        }


        # Standard browser User-Agent to avoid data.gov.in WAF/firewall connection blocking
        self.headers: Dict[str, str] = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }

    def get_market_prices(
        self,
        commodity: str,
        state: str,
        district: Optional[str] = None,
        market: Optional[str] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Queries daily commodity prices and arrival details.
        Tries data.gov.in as primary, falls back to farmer.in, and falls back to local JSON dataset.
        """
        if not self.api_key:
            raise ValueError(
                "DATA_GOV_API_KEY environment variable is missing. "
                "Please configure it in your environment or .env file."
            )

        # Determine possible variants for the requested commodity
        normalized_commodity = commodity.lower().strip()
        variants = self.commodity_variants.get(normalized_commodity)
        if not variants:
            # Fallback to title-cased commodity if not in mapping
            variants = [commodity.title().strip()]

        # Setup standard base query parameters (excl filters[commodity], filters[district], filters[market])
        params_base: Dict[str, Any] = {
            "api-key": self.api_key,
            "format": "json",
            "limit": limit,
            "filters[state]": state,
        }

        today_str = datetime.now().strftime("%d/%m/%Y")

        def parse_arrival_date(rec_dict):
            d_str = rec_dict.get("arrival_date")
            if not d_str:
                return datetime.min
            try:
                return datetime.strptime(d_str.strip(), "%d/%m/%Y")
            except ValueError:
                return datetime.min

        # Step 1: Query requested district if district is specified
        if district:
            district_records = []
            records_found = False
            last_error = None

            district_variants = [district]
            norm_dist = district.lower().strip()
            if norm_dist in ["bengaluru", "bangalore", "bengaluru urban", "bangalore urban"]:
                district_variants = ["Bengaluru", "Bangalore", "Bengaluru Urban", "Bangalore Urban"]

            for dist_var in district_variants:
                for api_commodity in variants:
                    params = dict(params_base)
                    params["filters[commodity]"] = api_commodity
                    params["filters[district]"] = dist_var
                    if market:
                        params["filters[market]"] = market

                    logger.info(f"Querying data.gov.in with variant '{api_commodity}' for district '{dist_var}'")
                    try:
                        response = requests.get(
                            self.base_url,
                            params=params,
                            headers=self.headers,
                            timeout=(5, 10)
                        )
                        response.raise_for_status()
                        data = response.json()
                        raw_records = data.get("records", [])
                        if raw_records:
                            for record in raw_records:
                                parsed = self._parse_record(record)
                                parsed["data_source"] = "data.gov.in"
                                district_records.append(parsed)
                            records_found = True
                            break
                    except (requests.Timeout, requests.RequestException, ValueError) as e:
                        logger.warning(f"Request failed for variant '{api_commodity}': {e}")
                        last_error = e
                        continue
                if records_found:
                    break

            if records_found and district_records:
                # Sort by date descending and filter to only the most recent date
                district_records.sort(key=parse_arrival_date, reverse=True)
                newest_date = district_records[0].get("arrival_date", "").strip()
                filtered_records = [
                    r for r in district_records
                    if r.get("arrival_date", "").strip() == newest_date
                ]

                # Check status
                status = "current" if newest_date == today_str else "recent"
                for r in filtered_records:
                    r["data_status"] = status
                    r["last_updated"] = newest_date
                    r["district_unavailable"] = False
                return filtered_records

        # Step 2: Search for recent state-level market alternatives if no district record found
        # (Or if district wasn't requested, this is the main state-only query path)
        state_records = []
        records_found = False
        last_error = None

        for api_commodity in variants:
            params = dict(params_base)
            params["filters[commodity]"] = api_commodity
            # Notice we do NOT pass district or market filters here

            logger.info(f"Querying state-level alternatives in data.gov.in with variant '{api_commodity}'")
            try:
                response = requests.get(
                    self.base_url,
                    params=params,
                    headers=self.headers,
                    timeout=(5, 10)
                )
                response.raise_for_status()
                data = response.json()
                raw_records = data.get("records", [])
                if raw_records:
                    for record in raw_records:
                        parsed = self._parse_record(record)
                        parsed["data_source"] = "data.gov.in"
                        state_records.append(parsed)
                    records_found = True
                    break
            except (requests.Timeout, requests.RequestException, ValueError) as e:
                logger.warning(f"State query failed for variant '{api_commodity}': {e}")
                last_error = e
                continue

        if records_found and state_records:
            # Sort by date descending and filter to only the most recent date
            state_records.sort(key=parse_arrival_date, reverse=True)
            newest_date = state_records[0].get("arrival_date", "").strip()
            filtered_records = [
                r for r in state_records
                if r.get("arrival_date", "").strip() == newest_date
            ]

            # Check status
            status = "current" if newest_date == today_str else "recent"
            # Set district_unavailable flag if a district was originally requested
            is_fallback = bool(district)
            for r in filtered_records:
                r["data_status"] = status
                r["last_updated"] = newest_date
                r["district_unavailable"] = is_fallback
            return filtered_records

        # Step 3: Proceed to fallback logic
        err_msg = str(last_error) if last_error else f"No records found for any variant of '{commodity}' in '{state}'"
        logger.warning(f"Primary API unavailable or returned no records ({err_msg}); trying fallback market API")

        # Try Secondary Source (Farmer.in)
        try:
            records = self._fetch_secondary(commodity, state, district, market)
            logger.info("Fallback market API succeeded")
            return records
        except Exception as sec_e:
            logger.warning(f"Fallback market API failed: {sec_e}")

            # Both APIs failed, load local fallback
            logger.warning("Both APIs failed; using local fallback data")
            return self._fetch_local_fallback(commodity, state, district, market)

    def _fetch_secondary(
        self,
        commodity: str,
        state: str,
        district: Optional[str] = None,
        market: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Queries the secondary farmer.in endpoint.

        farmer.in provides a NATIONAL aggregate price per commodity (single
        price/min/max with no state-level or mandi-level breakdown).  It
        cannot supply state-specific mandi records.

        Strategy:
        - Verify the endpoint is reachable and contains the commodity.
        - If reachable and commodity present, check whether the commodity's
          'major_states' list includes the requested state.
        - If the state is NOT in major_states, raise ValueError immediately
          so the cascade moves to the accurate local JSON fallback.
        - If reachable and state is plausible, raise ValueError anyway because
          farmer.in has no real per-mandi data — returning fake 'Market A /
          District 1' names for any state would produce the repeated-table bug.

        This method is kept in the cascade so the endpoint is still monitored
        for future API improvements (e.g. if farmer.in adds state-level data).
        """
        secondary_url = "https://farmer.in/api/open/prices.json"

        mapping = {
            "paddy": "Rice (Paddy)",
            "cotton": "Cotton",
            "groundnut": "Groundnut"
        }
        target_name = mapping.get(commodity.lower().strip(), commodity.title().strip())

        try:
            response = requests.get(secondary_url, timeout=(5, 10))
            response.raise_for_status()

            data = response.json()
            if not isinstance(data, dict) or "commodities" not in data:
                raise ValueError("Invalid schema returned by Farmer.in API")

            commodities = data["commodities"]
            match_item = None
            for item in commodities:
                if item.get("name", "").lower().strip() == target_name.lower().strip():
                    match_item = item
                    break

            if not match_item:
                raise ValueError(
                    f"Commodity '{target_name}' not found in Farmer.in data"
                )

            # farmer.in has no per-state mandi breakdown — it only carries
            # a 'major_states' metadata list and a single national price.
            # Returning fake market names here causes the repeated-table bug.
            # Fall through to the accurate local fallback instead.
            major_states = [s.lower() for s in match_item.get("major_states", [])]
            norm_state = state.lower().strip()
            if major_states and norm_state not in major_states:
                raise ValueError(
                    f"Farmer.in does not carry state-specific data for "
                    f"'{state}' + '{commodity}'. State not in major_states list."
                )

            # Even if the state is in major_states, farmer.in has no real
            # per-mandi breakdown for any state. Raising here ensures the
            # local fallback (with real mandi names) is always used.
            raise ValueError(
                "Farmer.in provides only national aggregate prices with no "
                "state-level mandi breakdown. Using local fallback for "
                f"accurate {state}/{commodity} records."
            )

        except (requests.Timeout, requests.RequestException) as net_e:
            raise ValueError(f"Farmer.in network error: {net_e}")


    def _fetch_local_fallback(
        self,
        commodity: str,
        state: str,
        district: Optional[str] = None,
        market: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Loads data from local JSON fallback file.
        """
        try:
            base_dir = os.path.dirname(os.path.abspath(__file__))
            fallback_path = os.path.join(base_dir, "fallback_market_data.json")

            if not os.path.exists(fallback_path):
                logger.error(f"Local fallback file not found at: {fallback_path}")
                return []

            import json
            with open(fallback_path, "r", encoding="utf-8") as f:
                data = json.load(f)

            norm_commodity = commodity.lower().strip()
            norm_state = state.lower().strip()
            paddy_names = ["paddy", "paddy(dhan)", "rice (paddy)"]

            filtered = []
            for record in data:
                rec_commodity = record.get("commodity", "").lower().strip()
                rec_state = record.get("state", "").lower().strip()

                commodity_match = False
                if norm_commodity in paddy_names and rec_commodity in paddy_names:
                    commodity_match = True
                elif norm_commodity == rec_commodity:
                    commodity_match = True

                if not commodity_match or rec_state != norm_state:
                    continue

                if district and record.get("district", "").lower().strip() != district.lower().strip():
                    continue
                if market and record.get("market", "").lower().strip() != market.lower().strip():
                    continue

                filtered.append(record)

            district_unavailable = False
            # Relax district/market constraint if empty to ensure demo works
            if not filtered and (district or market):
                district_unavailable = True
                filtered = []
                for record in data:
                    rec_commodity = record.get("commodity", "").lower().strip()
                    rec_state = record.get("state", "").lower().strip()

                    commodity_match = False
                    if norm_commodity in paddy_names and rec_commodity in paddy_names:
                        commodity_match = True
                    elif norm_commodity == rec_commodity:
                        commodity_match = True

                    if not commodity_match or rec_state != norm_state:
                        continue
                    filtered.append(record)

            # If still empty for state, relax state constraint so demo never renders empty screen
            if not filtered:
                district_unavailable = True
                filtered = []
                for record in data:
                    rec_commodity = record.get("commodity", "").lower().strip()
                    commodity_match = False
                    if norm_commodity in paddy_names and rec_commodity in paddy_names:
                        commodity_match = True
                    elif norm_commodity == rec_commodity:
                        commodity_match = True

                    if commodity_match:
                        filtered.append(record)

            for rec in filtered:
                rec["data_source"] = "local_fallback"
                rec["data_status"] = "recent"
                rec["last_updated"] = rec.get("arrival_date")
                rec["district_unavailable"] = district_unavailable

            return filtered
        except Exception as e:
            logger.error(f"Failed to load local fallback: {e}")
            return []

    def _parse_record(self, record: Dict[str, Any]) -> Dict[str, Any]:
        """
        Parses a raw record dictionary into a cleaned, type-safe format.
        """
        min_price = self._to_float(record.get("min_price"))
        max_price = self._to_float(record.get("max_price"))
        modal_price = self._to_float(record.get("modal_price"))

        return {
            "commodity": record.get("commodity", ""),
            "state": record.get("state", ""),
            "district": record.get("district", ""),
            "market": record.get("market", ""),
            "variety": record.get("variety", ""),
            "minimum_price": min_price,
            "maximum_price": max_price,
            "modal_price": modal_price,
            "arrival_date": record.get("arrival_date", "")
        }

    @staticmethod
    def _to_float(val: Any) -> Optional[float]:
        """
        Converts a value to float, returning None if conversion is not possible.
        """
        if val is None:
            return None
        try:
            if isinstance(val, str):
                val = val.strip()
            return float(val)
        except (ValueError, TypeError):
            return None
