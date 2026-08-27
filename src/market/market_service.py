import os
import logging
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

        # Mapping of user-friendly names to API commodity values
        self.commodity_mapping: Dict[str, str] = {
            "paddy": "Paddy(Dhan)",
            "cotton": "Cotton",
            "groundnut": "Groundnut"
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
        Queries daily commodity prices and arrival details from the data.gov.in Mandi dataset.

        Args:
            commodity: The user-friendly crop/commodity name (e.g. 'Paddy', 'Cotton', 'Groundnut').
            state: The name of the Indian State (e.g. 'Punjab', 'Gujarat').
            district: Optional name of the district to filter by.
            market: Optional name of the specific wholesale market (Mandi) to filter by.
            limit: Maximum number of records to retrieve (default is 100).

        Returns:
            A list of cleaned and structured dictionaries containing:
                - commodity (str)
                - state (str)
                - district (str)
                - market (str)
                - variety (str)
                - minimum_price (float or None)
                - maximum_price (float or None)
                - modal_price (float or None)
                - arrival_date (str)

        Raises:
            ValueError: If the DATA_GOV_API_KEY environment variable is not configured.
            requests.RequestException: If the HTTP request fails or times out.
        """
        if not self.api_key:
            raise ValueError(
                "DATA_GOV_API_KEY environment variable is missing. "
                "Please configure it in your environment or .env file."
            )

        # Map commodity to the API's expected spelling
        normalized_commodity = commodity.lower().strip()
        api_commodity = self.commodity_mapping.get(normalized_commodity)

        if not api_commodity:
            # Fallback: Try title-casing the input value
            api_commodity = commodity.title().strip()
            logger.info(
                f"Commodity '{commodity}' not in mapping. "
                f"Falling back to title-case value: '{api_commodity}'"
            )

        # Construct query parameters
        params: Dict[str, Any] = {
            "api-key": self.api_key,
            "format": "json",
            "limit": limit,
            "filters[state]": state,
            "filters[commodity]": api_commodity
        }

        # Apply optional filters if provided
        if district:
            params["filters[district]"] = district
        if market:
            params["filters[market]"] = market

        try:
            logger.info(
                f"Sending request to data.gov.in for commodity: '{api_commodity}', "
                f"state: '{state}'"
            )
            response = requests.get(self.base_url, params=params, timeout=10)
            response.raise_for_status()

            data = response.json()

            # The OGD platform API contains a 'records' key for the data entries
            if "records" not in data:
                logger.warning("API response does not contain 'records' field.")
                return []

            raw_records = data["records"]
            if not raw_records:
                logger.info("No records found matching the query criteria.")
                return []

            parsed_records = []
            for record in raw_records:
                parsed_records.append(self._parse_record(record))

            return parsed_records

        except requests.Timeout as e:
            logger.error(f"Request timed out while contacting data.gov.in: {e}")
            raise
        except requests.HTTPError as e:
            logger.error(f"HTTP error occurred while calling data.gov.in: {e}")
            raise
        except requests.RequestException as e:
            logger.error(f"An error occurred while calling data.gov.in: {e}")
            raise
        except (ValueError, KeyError) as e:
            logger.error(f"Failed to parse JSON response from data.gov.in: {e}")
            raise

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
            # Strip whitespace and formatting characters if they exist
            if isinstance(val, str):
                val = val.strip()
            return float(val)
        except (ValueError, TypeError):
            return None
