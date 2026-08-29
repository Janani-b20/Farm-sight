import sys
import os
import math
import unittest
from unittest.mock import patch, MagicMock

# ---------------------------------------------------------------------------
# Path setup so tests can import from src/transport without installing
# ---------------------------------------------------------------------------
src_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if src_dir not in sys.path:
    sys.path.insert(0, src_dir)

from transport.transport_service import TransportService, MandiNotFoundError


class TestHaversineDistance(unittest.TestCase):
    """Tests for the internal Haversine calculation."""

    def setUp(self):
        self.service = TransportService()

    def test_zero_distance_same_point(self):
        """Distance between a point and itself must be 0."""
        dist = self.service._haversine(22.3039, 70.8022, 22.3039, 70.8022)
        self.assertAlmostEqual(dist, 0.0, places=5)

    def test_known_distance_rajkot_gondal(self):
        """
        Rajkot (22.3039, 70.8022) to Gondal (21.961, 70.7986).
        Known aerial distance is approximately 38 km.
        """
        dist = self.service._haversine(22.3039, 70.8022, 21.961, 70.7986)
        self.assertGreater(dist, 35.0)
        self.assertLess(dist, 45.0)

    def test_known_distance_amritsar_tarn_taran(self):
        """
        Amritsar (31.634, 74.8723) to Tarn Taran (31.452, 74.9257).
        Known aerial distance is approximately 21 km.
        """
        dist = self.service._haversine(31.634, 74.8723, 31.452, 74.9257)
        self.assertGreater(dist, 18.0)
        self.assertLess(dist, 26.0)

    def test_distance_is_symmetric(self):
        """Distance A→B must equal distance B→A."""
        d1 = self.service._haversine(21.7645, 72.1519, 22.3039, 70.8022)
        d2 = self.service._haversine(22.3039, 70.8022, 21.7645, 72.1519)
        self.assertAlmostEqual(d1, d2, places=5)

    def test_distance_positive(self):
        """All distances must be non-negative."""
        dist = self.service._haversine(28.6139, 77.2090, 19.0760, 72.8777)
        self.assertGreater(dist, 0.0)


class TestMandiLookup(unittest.TestCase):
    """Tests for mandi coordinate lookup."""

    def setUp(self):
        self.service = TransportService()

    def test_known_mandi_rajkot(self):
        mandi = self.service.get_mandi_coordinates("Rajkot", "Rajkot", "Gujarat")
        self.assertIsNotNone(mandi)
        self.assertAlmostEqual(mandi["lat"], 22.3039)
        self.assertAlmostEqual(mandi["lng"], 70.8022)

    def test_known_mandi_gondal(self):
        mandi = self.service.get_mandi_coordinates("Gondal", "Rajkot", "Gujarat")
        self.assertIsNotNone(mandi)
        self.assertAlmostEqual(mandi["lat"], 21.961)

    def test_known_mandi_amritsar(self):
        mandi = self.service.get_mandi_coordinates("Amritsar", "Amritsar", "Punjab")
        self.assertIsNotNone(mandi)
        self.assertAlmostEqual(mandi["lat"], 31.634)

    def test_unknown_mandi_returns_none(self):
        result = self.service.get_mandi_coordinates("NonExistentMandi", "SomeDistrict", "SomeState")
        self.assertIsNone(result)

    def test_unknown_mandi_raises_in_calculate(self):
        with self.assertRaises(MandiNotFoundError):
            self.service.calculate_transport(
                market_name="GhostMandi",
                district="UnknownDistrict",
                state="UnknownState",
                user_lat=22.0,
                user_lng=71.0,
            )

    def test_case_insensitive_lookup(self):
        """Market name lookup should be case-insensitive."""
        mandi = self.service.get_mandi_coordinates("RAJKOT", "rajkot", "GUJARAT")
        self.assertIsNotNone(mandi)

    def test_whitespace_tolerant_lookup(self):
        """Leading/trailing whitespace in market name should be tolerated."""
        mandi = self.service.get_mandi_coordinates("  gondal  ", "Rajkot", "Gujarat")
        self.assertIsNotNone(mandi)


class TestTransportCostCalculation(unittest.TestCase):
    """Tests for distance, cost, and result structure."""

    def setUp(self):
        self.service = TransportService()

    def test_calculate_transport_basic_structure(self):
        """Result must contain all required keys."""
        result = self.service.calculate_transport(
            market_name="Rajkot",
            district="Rajkot",
            state="Gujarat",
            user_lat=22.0,
            user_lng=71.0,
        )
        required_keys = [
            "market_name", "district", "state",
            "mandi_lat", "mandi_lng",
            "user_lat", "user_lng",
            "aerial_distance_km", "estimated_road_distance_km",
            "cost_per_quintal_per_km", "base_transport_cost_rs",
            "quantity_kg", "estimated_quantity_transport_cost_rs",
            "note",
        ]
        for key in required_keys:
            self.assertIn(key, result, f"Missing key: {key}")

    def test_road_distance_greater_than_aerial(self):
        """Estimated road distance must be > aerial distance (correction factor)."""
        result = self.service.calculate_transport(
            market_name="Gondal",
            district="Rajkot",
            state="Gujarat",
            user_lat=22.5,
            user_lng=71.0,
        )
        self.assertGreater(
            result["estimated_road_distance_km"],
            result["aerial_distance_km"]
        )

    def test_base_cost_includes_fixed_charge(self):
        """Base transport cost must be >= the fixed base charge."""
        result = self.service.calculate_transport(
            market_name="Junagadh",
            district="Junagadh",
            state="Gujarat",
            user_lat=22.0,
            user_lng=70.5,
        )
        self.assertGreaterEqual(
            result["base_transport_cost_rs"],
            self.service.base_cost_rs
        )

    def test_quantity_cost_returned_when_quantity_provided(self):
        """When quantity_kg is provided, quantity cost must be returned and > base cost."""
        result = self.service.calculate_transport(
            market_name="Rajkot",
            district="Rajkot",
            state="Gujarat",
            user_lat=22.0,
            user_lng=71.0,
            quantity_kg=1000.0,
        )
        self.assertIsNotNone(result["estimated_quantity_transport_cost_rs"])
        self.assertEqual(result["quantity_kg"], 1000.0)
        # 1000 kg = 10 quintals — quantity-based cost should be higher than 1-quintal base
        self.assertGreater(
            result["estimated_quantity_transport_cost_rs"],
            result["base_transport_cost_rs"]
        )

    def test_quantity_cost_none_when_not_provided(self):
        """When quantity_kg is not provided, quantity cost must be None."""
        result = self.service.calculate_transport(
            market_name="Rajkot",
            district="Rajkot",
            state="Gujarat",
            user_lat=22.0,
            user_lng=71.0,
        )
        self.assertIsNone(result["estimated_quantity_transport_cost_rs"])
        self.assertIsNone(result["quantity_kg"])

    def test_zero_quantity_no_quantity_cost(self):
        """When quantity_kg is 0, quantity cost should not be computed."""
        result = self.service.calculate_transport(
            market_name="Rajkot",
            district="Rajkot",
            state="Gujarat",
            user_lat=22.0,
            user_lng=71.0,
            quantity_kg=0.0,
        )
        self.assertIsNone(result["estimated_quantity_transport_cost_rs"])

    def test_echoes_user_coordinates(self):
        """Result must echo back the user's lat/lng for frontend display."""
        result = self.service.calculate_transport(
            market_name="Gondal",
            district="Rajkot",
            state="Gujarat",
            user_lat=21.5,
            user_lng=70.9,
        )
        self.assertEqual(result["user_lat"], 21.5)
        self.assertEqual(result["user_lng"], 70.9)


class TestTransportAPIEndpoint(unittest.TestCase):
    """Tests for the FastAPI /api/transport endpoint."""

    def setUp(self):
        # Import here to isolate potential import errors
        sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))
        import importlib
        import dotenv
        dotenv.load_dotenv()
        from fastapi.testclient import TestClient
        # Import app from main (already in src/)
        main_path = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
        if main_path not in sys.path:
            sys.path.insert(0, main_path)
        from main import app
        self.client = TestClient(app)

    def test_transport_endpoint_success(self):
        """Valid request must return 200 with all expected fields."""
        response = self.client.get(
            "/api/transport",
            params={
                "market_name": "Rajkot",
                "district": "Rajkot",
                "state": "Gujarat",
                "user_lat": 22.0,
                "user_lng": 71.0,
            },
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("estimated_road_distance_km", data)
        self.assertIn("base_transport_cost_rs", data)
        self.assertIn("note", data)

    def test_transport_endpoint_with_quantity(self):
        """With quantity_kg, endpoint must return quantity-based cost."""
        response = self.client.get(
            "/api/transport",
            params={
                "market_name": "Gondal",
                "district": "Rajkot",
                "state": "Gujarat",
                "user_lat": 22.0,
                "user_lng": 71.0,
                "quantity_kg": 500.0,
            },
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIsNotNone(data["estimated_quantity_transport_cost_rs"])
        self.assertEqual(data["quantity_kg"], 500.0)

    def test_transport_endpoint_unknown_mandi_404(self):
        """Unknown mandi must return 404."""
        response = self.client.get(
            "/api/transport",
            params={
                "market_name": "GhostMandi",
                "district": "NoDistrict",
                "state": "NoState",
                "user_lat": 22.0,
                "user_lng": 71.0,
            },
        )
        self.assertEqual(response.status_code, 404)

    def test_transport_endpoint_missing_params_422(self):
        """Request with missing required params must return 422."""
        response = self.client.get("/api/transport", params={"market_name": "Rajkot"})
        self.assertEqual(response.status_code, 422)


if __name__ == "__main__":
    unittest.main()
