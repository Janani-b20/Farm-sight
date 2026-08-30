import os
import json
import math
import logging
from typing import Optional, Dict, Any, List

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Default cost parameters (fully configurable via environment variables).
# ---------------------------------------------------------------------------
# Cost in Rs per quintal (100 kg) per km.
DEFAULT_COST_PER_QUINTAL_PER_KM: float = float(
    os.getenv("TRANSPORT_COST_PER_QUINTAL_PER_KM", "1.5")
)
# Minimum base transport cost in Rs (loading/unloading fixed charge).
DEFAULT_BASE_COST_RS: float = float(
    os.getenv("TRANSPORT_BASE_COST_RS", "200.0")
)


class MandiNotFoundError(Exception):
    """Raised when the requested mandi is not in the coordinate dataset."""


class TransportService:
    """
    Calculates road-distance estimates and transportation cost between a
    farmer's location and an APMC mandi.

    Distance is computed using the Haversine formula (great-circle distance).
    An on-road correction factor of 1.3 is applied to approximate actual road
    distance from the straight-line aerial distance.

    Integration note
    ----------------
    `user_lat` and `user_lng` are accepted as explicit parameters so this
    service is decoupled from any location implementation.  When the
    live-location feature is merged into this branch, the caller (API route)
    simply forwards the coordinates it receives from the location context —
    no changes to this service are required.
    """

    # On-road distance is typically ~1.2–1.4× the aerial Haversine distance.
    ROAD_CORRECTION_FACTOR: float = 1.3
    EARTH_RADIUS_KM: float = 6371.0

    def __init__(self) -> None:
        self.cost_per_quintal_per_km: float = DEFAULT_COST_PER_QUINTAL_PER_KM
        self.base_cost_rs: float = DEFAULT_BASE_COST_RS
        self._coordinates: List[Dict[str, Any]] = self._load_coordinates()

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def calculate_transport(
        self,
        market_name: str,
        district: str,
        state: str,
        user_lat: float,
        user_lng: float,
        quantity_kg: Optional[float] = None,
    ) -> Dict[str, Any]:
        """
        Main entry point.  Looks up mandi coordinates, computes distance,
        and returns a structured cost estimate.

        Parameters
        ----------
        market_name : str
            Name of the mandi (e.g. "Gondal").
        district : str
            District the mandi belongs to (e.g. "Rajkot").
        state : str
            State the mandi belongs to (e.g. "Gujarat").
        user_lat : float
            Farmer's latitude (degrees).
        user_lng : float
            Farmer's longitude (degrees).
        quantity_kg : float, optional
            Quantity of produce in kg.  When provided, a quantity-based cost
            estimate is also returned.

        Returns
        -------
        dict with keys:
            market_name, district, state,
            mandi_lat, mandi_lng,
            aerial_distance_km, estimated_road_distance_km,
            base_transport_cost_rs,
            cost_per_quintal_per_km,
            quantity_kg (echoed, or None),
            estimated_quantity_transport_cost_rs (or None),
            note
        """
        try:
            mandi = self._lookup_mandi(market_name, district, state)
        except MandiNotFoundError as e:
            return {
                "market_name": market_name,
                "district": district,
                "state": state,
                "mandi_lat": None,
                "mandi_lng": None,
                "user_lat": user_lat,
                "user_lng": user_lng,
                "aerial_distance_km": None,
                "estimated_road_distance_km": None,
                "cost_per_quintal_per_km": None,
                "base_transport_cost_rs": None,
                "quantity_kg": quantity_kg,
                "estimated_quantity_transport_cost_rs": None,
                "status": "coordinate_unavailable",
                "message": "Transport estimate is unavailable for this market.",
                "note": str(e),
            }

        aerial_km = self._haversine(
            user_lat, user_lng, mandi["lat"], mandi["lng"]
        )

        # Try to get distance and duration from OpenRouteService
        ors_data = self._query_openrouteservice(
            user_lat, user_lng, mandi["lat"], mandi["lng"]
        )

        if ors_data is not None:
            road_km = ors_data["road_distance_km"]
            ors_road_distance_km = road_km
            estimated_travel_duration = self._format_duration(ors_data["duration_seconds"])
            distance_source = "openrouteservice"
            note = (
                "Distance and travel duration are calculated using OpenRouteService live driving routes. "
                "Cost figures are illustrative; actual rates depend on vehicle type and route."
            )
        else:
            road_km = round(aerial_km * self.ROAD_CORRECTION_FACTOR, 2)
            ors_road_distance_km = None
            estimated_travel_duration = None
            distance_source = "haversine"
            note = (
                "Distance is a Haversine aerial estimate with a 1.3x road correction factor. "
                "Actual road distance may vary. "
                "Cost figures are illustrative; actual rates depend on vehicle type and route."
            )

        # Base transport cost (fixed for any load)
        base_cost = round(self.base_cost_rs + (road_km * self.cost_per_quintal_per_km), 2)

        result: Dict[str, Any] = {
            "market_name": mandi["display_name"],
            "district": mandi["district"].title(),
            "state": mandi["state"].title(),
            "mandi_lat": mandi["lat"],
            "mandi_lng": mandi["lng"],
            "user_lat": user_lat,
            "user_lng": user_lng,
            "aerial_distance_km": round(aerial_km, 2),
            "estimated_road_distance_km": road_km,
            "cost_per_quintal_per_km": self.cost_per_quintal_per_km,
            "base_transport_cost_rs": base_cost,
            "quantity_kg": quantity_kg,
            "estimated_quantity_transport_cost_rs": None,
            "status": "success",
            "message": "Transport estimate calculated successfully.",
            "note": note,
            "ors_road_distance_km": ors_road_distance_km,
            "estimated_travel_duration": estimated_travel_duration,
            "distance_source": distance_source,
        }

        if quantity_kg is not None and quantity_kg > 0:
            quantity_quintals = quantity_kg / 100.0
            qty_cost = round(
                self.base_cost_rs
                + (road_km * self.cost_per_quintal_per_km * quantity_quintals),
                2,
            )
            result["estimated_quantity_transport_cost_rs"] = qty_cost

        return result

    def get_mandi_coordinates(
        self, market_name: str, district: str, state: str
    ) -> Optional[Dict[str, Any]]:
        """
        Returns the coordinate entry for the specified mandi, or None if
        the mandi is not found in the dataset.
        """
        try:
            return self._lookup_mandi(market_name, district, state)
        except MandiNotFoundError:
            return None

    def _query_openrouteservice(
        self, user_lat: float, user_lng: float, mandi_lat: float, mandi_lng: float
    ) -> Optional[Dict[str, Any]]:
        """
        Queries OpenRouteService for directions between user and mandi coordinates.
        Returns a dictionary with 'road_distance_km' and 'duration_seconds' if successful,
        or None if the lookup fails or key is missing.
        """
        api_key = os.getenv("OPENROUTESERVICE_API_KEY")
        if not api_key:
            logger.warning("OPENROUTESERVICE_API_KEY is not set. Falling back to Haversine.")
            return None

        url = os.getenv(
            "OPENROUTESERVICE_URL",
            "https://api.openrouteservice.org/v2/directions/driving-car",
        )

        headers = {
            "Authorization": api_key,
            "Content-Type": "application/json",
        }

        # Coordinates in [longitude, latitude] order per ORS spec
        payload = {
            "coordinates": [[user_lng, user_lat], [mandi_lng, mandi_lat]]
        }

        try:
            import requests
            response = requests.post(url, json=payload, headers=headers, timeout=5.0)
            if response.status_code == 200:
                data = response.json()
                if "routes" in data and len(data["routes"]) > 0:
                    summary = data["routes"][0].get("summary", {})
                    distance_meters = summary.get("distance")
                    duration_seconds = summary.get("duration")
                    if distance_meters is not None and duration_seconds is not None:
                        return {
                            "road_distance_km": round(distance_meters / 1000.0, 2),
                            "duration_seconds": float(duration_seconds),
                        }
                logger.warning(f"Unexpected ORS response structure: {data}")
            else:
                logger.warning(
                    f"OpenRouteService returned status code {response.status_code}"
                )
        except Exception as e:
            logger.warning(f"Error querying OpenRouteService: {e}")

        return None

    @staticmethod
    def _format_duration(seconds: float) -> str:
        """Formats duration in seconds to a human-readable string."""
        minutes = int(round(seconds / 60.0))
        if minutes < 60:
            return f"{minutes} min" + ("s" if minutes != 1 else "")
        hours = minutes // 60
        rem_mins = minutes % 60
        if rem_mins == 0:
            return f"{hours} hour" + ("s" if hours != 1 else "")
        return f"{hours} hour" + ("s" if hours != 1 else "") + f" {rem_mins} min" + ("s" if rem_mins != 1 else "")

    def _haversine(
        self, lat1: float, lng1: float, lat2: float, lng2: float
    ) -> float:
        """Returns the great-circle distance in km between two lat/lng points."""
        lat1_r = math.radians(lat1)
        lat2_r = math.radians(lat2)
        dlat = math.radians(lat2 - lat1)
        dlng = math.radians(lng2 - lng1)

        a = (
            math.sin(dlat / 2) ** 2
            + math.cos(lat1_r) * math.cos(lat2_r) * math.sin(dlng / 2) ** 2
        )
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return self.EARTH_RADIUS_KM * c

    def _lookup_mandi(
        self, market_name: str, district: str, state: str
    ) -> Dict[str, Any]:
        """
        Looks up mandi coordinates by market_name + state match.
        Falls back to market_name only if state is ambiguous.

        Also handles verbose APMC committee names returned by data.gov.in, e.g.:
          "The Agricultural Produce Market Committee-Amreli"
        These are normalized by stripping the known committee prefix and
        extracting the short city name for matching. This is an exact prefix
        strip — not fuzzy matching — and always requires district+state match
        to prevent cross-state collisions.

        Raises MandiNotFoundError if no match is found.
        """
        market_key = market_name.lower().strip()
        state_key = state.lower().strip()
        district_key = district.lower().strip()

        # Priority 1: exact match on market + state
        for entry in self._coordinates:
            if (
                entry.get("market", "").lower().strip() == market_key
                and entry.get("state", "").lower().strip() == state_key
            ):
                return entry

        # Priority 2: market name only (broader match)
        for entry in self._coordinates:
            if entry.get("market", "").lower().strip() == market_key:
                logger.warning(
                    f"Mandi '{market_name}' matched by name only (state '{state}' "
                    f"not found; used entry with state '{entry.get('state')}')."
                )
                return entry

        # Priority 3: APMC committee name normalization.
        # data.gov.in returns verbose names like:
        #   "The Agricultural Produce Market Committee-Amreli"
        #   "Agricultural Produce Market Committee, Rajkot"
        # Strip known prefixes and extract the city token, then re-run
        # Priority-1 lookup (district + state required to prevent collisions).
        normalized = self._normalize_apmc_name(market_key)
        if normalized and normalized != market_key:
            for entry in self._coordinates:
                if (
                    entry.get("market", "").lower().strip() == normalized
                    and entry.get("state", "").lower().strip() == state_key
                    and entry.get("district", "").lower().strip() == district_key
                ):
                    logger.info(
                        f"Mandi '{market_name}' resolved via APMC name normalization "
                        f"to coordinate key '{normalized}' "
                        f"(district='{district}', state='{state}')."
                    )
                    return entry

        raise MandiNotFoundError(
            f"No coordinates found for mandi '{market_name}' "
            f"(district='{district}', state='{state}'). "
            "Please expand mandi_coordinates.json."
        )

    @staticmethod
    def _normalize_apmc_name(market_key: str) -> str:
        """
        Strips known verbose APMC/committee prefixes from a lowercased market
        name to extract the short city name used as the coordinate key.

        Examples
        --------
        "the agricultural produce market committee-amreli" -> "amreli"
        "agricultural produce market committee, rajkot"    -> "rajkot"
        "apmc amreli"                                      -> "amreli"

        Only strips clearly identifiable prefixes. Returns the original string
        unchanged if no known prefix is detected.
        """
        import re

        # Known verbose prefix patterns (lowercased)
        patterns = [
            # "The Agricultural Produce Market Committee-<city>"
            r"^the\s+agricultural\s+produce\s+market\s+committee[-,\s]+",
            # "Agricultural Produce Market Committee-<city>" / ", <city>"
            r"^agricultural\s+produce\s+market\s+committee[-,\s]+",
            # "APMC <city>" / "APMC-<city>"
            r"^apmc[-\s]+",
        ]
        for pattern in patterns:
            result = re.sub(pattern, "", market_key).strip().rstrip(",").strip()
            if result and result != market_key:
                return result
        return market_key

    @staticmethod
    def _load_coordinates() -> List[Dict[str, Any]]:
        """Loads the mandi coordinate JSON file bundled with the transport module."""
        base_dir = os.path.dirname(os.path.abspath(__file__))
        path = os.path.join(base_dir, "mandi_coordinates.json")
        if not os.path.exists(path):
            logger.error(f"mandi_coordinates.json not found at {path}")
            return []
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        # Filter out comment/metadata entries (they lack 'lat'/'lng')
        return [entry for entry in data if "lat" in entry and "lng" in entry]
