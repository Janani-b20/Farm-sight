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
        result = self.service.calculate_transport(
            market_name="GhostMandi",
            district="UnknownDistrict",
            state="UnknownState",
            user_lat=22.0,
            user_lng=71.0,
        )
        self.assertEqual(result["status"], "coordinate_unavailable")
        self.assertIsNone(result["mandi_lat"])
        self.assertIsNone(result["mandi_lng"])
        self.assertIsNone(result["aerial_distance_km"])
        self.assertIsNone(result["estimated_road_distance_km"])
        self.assertIsNone(result["base_transport_cost_rs"])
        self.assertIsNone(result["estimated_quantity_transport_cost_rs"])

    def test_case_insensitive_lookup(self):
        """Market name lookup should be case-insensitive."""
        mandi = self.service.get_mandi_coordinates("RAJKOT", "rajkot", "GUJARAT")
        self.assertIsNotNone(mandi)

    def test_whitespace_tolerant_lookup(self):
        """Leading/trailing whitespace in market name should be tolerated."""
        mandi = self.service.get_mandi_coordinates("  gondal  ", "Rajkot", "Gujarat")
        self.assertIsNotNone(mandi)


class TestAPMCNameNormalization(unittest.TestCase):
    """
    Tests for APMC verbose committee name normalization.
    Covers the exact market names returned by the live data.gov.in API
    that differ from the short city-key names in mandi_coordinates.json.
    """

    def setUp(self):
        self.service = TransportService()
        self.post_patcher = patch('requests.post')
        self.mock_post = self.post_patcher.start()
        self.mock_post.side_effect = Exception("ORS live calls disabled in tests")

    def tearDown(self):
        self.post_patcher.stop()

    def test_full_apmc_name_amreli_resolves(self):
        """
        'The Agricultural Produce Market Committee-Amreli' (live data.gov.in name)
        must resolve to the Amreli mandi coordinate entry via APMC normalization.
        """
        mandi = self.service.get_mandi_coordinates(
            "The Agricultural Produce Market Committee-Amreli",
            district="Amreli",
            state="Gujarat",
        )
        self.assertIsNotNone(
            mandi,
            "Amreli APMC mandi must resolve — coordinate entry exists in mandi_coordinates.json",
        )
        self.assertAlmostEqual(mandi["lat"], 21.6038, places=3)
        self.assertAlmostEqual(mandi["lng"], 71.2221, places=3)

    def test_full_apmc_name_amreli_calculate_transport(self):
        """
        calculate_transport must succeed for the live data.gov.in Amreli market name.
        """
        result = self.service.calculate_transport(
            market_name="The Agricultural Produce Market Committee-Amreli",
            district="Amreli",
            state="Gujarat",
            user_lat=21.6038,
            user_lng=71.2221,
            quantity_kg=1000.0,
        )
        self.assertIn("estimated_road_distance_km", result)
        self.assertIn("base_transport_cost_rs", result)
        self.assertIsNotNone(result["estimated_quantity_transport_cost_rs"])

    def test_apmc_prefix_without_the_resolves(self):
        """
        'Agricultural Produce Market Committee-Amreli' (without 'The') must also resolve.
        """
        mandi = self.service.get_mandi_coordinates(
            "Agricultural Produce Market Committee-Amreli",
            district="Amreli",
            state="Gujarat",
        )
        self.assertIsNotNone(mandi)
        self.assertAlmostEqual(mandi["lat"], 21.6038, places=3)

    def test_apmc_shorthand_resolves(self):
        """'APMC Amreli' shorthand must also resolve."""
        mandi = self.service.get_mandi_coordinates(
            "APMC Amreli", district="Amreli", state="Gujarat"
        )
        self.assertIsNotNone(mandi)

    def test_normalize_does_not_cross_state(self):
        """
        APMC normalization must NOT match a mandi from a different state/district
        even if the city name token matches.
        """
        # "The Agricultural Produce Market Committee-Rajkot" with wrong state
        result = self.service.get_mandi_coordinates(
            "The Agricultural Produce Market Committee-Rajkot",
            district="NoDistrict",
            state="NoState",
        )
        # Must return None — no cross-state/district collision allowed
        self.assertIsNone(result)

    def test_normalize_apmc_name_utility(self):
        """Unit test for the _normalize_apmc_name static helper."""
        cases = [
            ("the agricultural produce market committee-amreli", "amreli"),
            ("agricultural produce market committee-amreli", "amreli"),
            ("agricultural produce market committee, rajkot", "rajkot"),
            ("apmc amreli", "amreli"),
            ("apmc-rajkot", "rajkot"),
            # Non-APMC name must pass through unchanged
            ("gondal", "gondal"),
            ("rajkot", "rajkot"),
        ]
        for raw, expected in cases:
            with self.subTest(raw=raw):
                self.assertEqual(
                    TransportService._normalize_apmc_name(raw),
                    expected,
                    f"normalize_apmc_name('{raw}') should return '{expected}'",
                )


class TestTransportCostCalculation(unittest.TestCase):
    """Tests for distance, cost, and result structure."""

    def setUp(self):
        self.service = TransportService()
        self.post_patcher = patch('requests.post')
        self.mock_post = self.post_patcher.start()
        self.mock_post.side_effect = Exception("ORS live calls disabled in tests")

    def tearDown(self):
        self.post_patcher.stop()

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
        self.post_patcher = patch('requests.post')
        self.mock_post = self.post_patcher.start()
        self.mock_post.side_effect = Exception("ORS live calls disabled in tests")

    def tearDown(self):
        self.post_patcher.stop()

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

    def test_transport_endpoint_unknown_mandi_graceful(self):
        """Unknown mandi must return 200 with coordinate_unavailable status."""
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
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "coordinate_unavailable")
        self.assertIsNone(data["estimated_road_distance_km"])
        self.assertIsNone(data["base_transport_cost_rs"])

    def test_transport_endpoint_missing_params_422(self):
        """Request with missing required params must return 422."""
        response = self.client.get("/api/transport", params={"market_name": "Rajkot"})
        self.assertEqual(response.status_code, 422)


class TestOpenRouteServiceIntegration(unittest.TestCase):
    """Tests for OpenRouteService integration and fallback behavior."""

    def setUp(self):
        self.service = TransportService()
        self.post_patcher = patch('requests.post')
        self.mock_post = self.post_patcher.start()

    def tearDown(self):
        self.post_patcher.stop()

    @patch.dict(os.environ, {"OPENROUTESERVICE_API_KEY": "test_key"})
    def test_ors_success_flow(self):
        """When ORS returns 200, calculate_transport should use ORS road distance and add duration."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "routes": [
                {
                    "summary": {
                        "distance": 15500.0,
                        "duration": 1500.0
                    }
                }
            ]
        }
        self.mock_post.return_value = mock_response

        result = self.service.calculate_transport(
            market_name="Rajkot",
            district="Rajkot",
            state="Gujarat",
            user_lat=22.0,
            user_lng=71.0,
        )

        self.mock_post.assert_called_once()
        _, kwargs = self.mock_post.call_args
        self.assertEqual(kwargs["headers"]["Authorization"], "test_key")
        self.assertEqual(kwargs["json"]["coordinates"], [[71.0, 22.0], [70.8022, 22.3039]])

        self.assertEqual(result["ors_road_distance_km"], 15.5)
        self.assertEqual(result["estimated_travel_duration"], "25 mins")
        self.assertEqual(result["distance_source"], "openrouteservice")
        self.assertEqual(result["estimated_road_distance_km"], 15.5)
        self.assertIn("OpenRouteService", result["note"])

        expected_base_cost = round(self.service.base_cost_rs + (15.5 * self.service.cost_per_quintal_per_km), 2)
        self.assertEqual(result["base_transport_cost_rs"], expected_base_cost)

    @patch.dict(os.environ, {"OPENROUTESERVICE_API_KEY": "test_key"})
    def test_ors_non_200_fallback(self):
        """When ORS returns non-200, fallback to Haversine."""
        mock_response = MagicMock()
        mock_response.status_code = 500
        mock_response.text = "Internal Server Error"
        self.mock_post.return_value = mock_response

        result = self.service.calculate_transport(
            market_name="Rajkot",
            district="Rajkot",
            state="Gujarat",
            user_lat=22.0,
            user_lng=71.0,
        )

        self.mock_post.assert_called_once()
        self.assertIsNone(result["ors_road_distance_km"])
        self.assertIsNone(result["estimated_travel_duration"])
        self.assertEqual(result["distance_source"], "haversine")
        self.assertIn("Haversine", result["note"])

    @patch.dict(os.environ, {"OPENROUTESERVICE_API_KEY": "test_key"})
    def test_ors_timeout_fallback(self):
        """When ORS request times out, fallback to Haversine."""
        from requests.exceptions import Timeout
        self.mock_post.side_effect = Timeout("Request timed out")

        result = self.service.calculate_transport(
            market_name="Rajkot",
            district="Rajkot",
            state="Gujarat",
            user_lat=22.0,
            user_lng=71.0,
        )

        self.mock_post.assert_called_once()
        self.assertIsNone(result["ors_road_distance_km"])
        self.assertIsNone(result["estimated_travel_duration"])
        self.assertEqual(result["distance_source"], "haversine")

    def test_ors_missing_api_key_fallback(self):
        """When API key is missing from environment, fallback immediately without call."""
        with patch.dict(os.environ, {}):
            if "OPENROUTESERVICE_API_KEY" in os.environ:
                del os.environ["OPENROUTESERVICE_API_KEY"]
            result = self.service.calculate_transport(
                market_name="Rajkot",
                district="Rajkot",
                state="Gujarat",
                user_lat=22.0,
                user_lng=71.0,
            )

        self.mock_post.assert_not_called()
        self.assertIsNone(result["ors_road_distance_km"])
        self.assertIsNone(result["estimated_travel_duration"])
        self.assertEqual(result["distance_source"], "haversine")

    @patch.dict(os.environ, {"OPENROUTESERVICE_API_KEY": "test_key"})
    def test_vehicle_rates_tractor_trolley(self):
        """Verify tractor_trolley mapping and cost parameters (<= 500 kg)."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "routes": [{"summary": {"distance": 10000.0, "duration": 600.0}}]
        }
        self.mock_post.return_value = mock_response

        # 450 kg -> tractor_trolley (base = 150.0, per_quintal_per_km = 1.2)
        result = self.service.calculate_transport(
            market_name="Rajkot",
            district="Rajkot",
            state="Gujarat",
            user_lat=22.0,
            user_lng=71.0,
            quantity_kg=450.0,
        )
        self.assertEqual(result["transport_type"], "tractor_trolley")
        self.assertEqual(result["transport_type_display"], "Tractor Trolley")
        self.assertEqual(result["base_transport_cost_rs"], 162.0)
        self.assertEqual(result["estimated_quantity_transport_cost_rs"], 204.0)

    @patch.dict(os.environ, {"OPENROUTESERVICE_API_KEY": "test_key"})
    def test_vehicle_rates_mini_truck(self):
        """Verify mini_truck mapping and cost parameters (501-2000 kg)."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "routes": [{"summary": {"distance": 10000.0, "duration": 600.0}}]
        }
        self.mock_post.return_value = mock_response

        # 1000 kg -> mini_truck (base = 250.0, per_quintal_per_km = 1.8)
        result = self.service.calculate_transport(
            market_name="Rajkot",
            district="Rajkot",
            state="Gujarat",
            user_lat=22.0,
            user_lng=71.0,
            quantity_kg=1000.0,
        )
        self.assertEqual(result["transport_type"], "mini_truck")
        self.assertEqual(result["transport_type_display"], "Mini Truck")
        self.assertEqual(result["base_transport_cost_rs"], 268.0)
        self.assertEqual(result["estimated_quantity_transport_cost_rs"], 430.0)

    @patch.dict(os.environ, {"OPENROUTESERVICE_API_KEY": "test_key"})
    def test_vehicle_rates_truck(self):
        """Verify truck mapping and cost parameters (> 2000 kg)."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "routes": [{"summary": {"distance": 10000.0, "duration": 600.0}}]
        }
        self.mock_post.return_value = mock_response

        # 3000 kg -> truck (base = 400.0, per_quintal_per_km = 2.5)
        result = self.service.calculate_transport(
            market_name="Rajkot",
            district="Rajkot",
            state="Gujarat",
            user_lat=22.0,
            user_lng=71.0,
            quantity_kg=3000.0,
        )
        self.assertEqual(result["transport_type"], "truck")
        self.assertEqual(result["transport_type_display"], "Truck")
        self.assertEqual(result["base_transport_cost_rs"], 425.0)
        self.assertEqual(result["estimated_quantity_transport_cost_rs"], 1150.0)

    @patch.dict(os.environ, {"OPENROUTESERVICE_API_KEY": "test_key"})
    def test_vehicle_rates_fallback_haversine(self):
        """Verify vehicle rates are used correctly when ORS fails and we fallback to Haversine."""
        mock_response = MagicMock()
        mock_response.status_code = 500
        self.mock_post.return_value = mock_response

        result = self.service.calculate_transport(
            market_name="Rajkot",
            district="Rajkot",
            state="Gujarat",
            user_lat=22.0,
            user_lng=71.0,
            quantity_kg=1000.0,
        )
        self.assertEqual(result["distance_source"], "haversine")
        self.assertEqual(result["transport_type"], "mini_truck")
        self.assertIsNotNone(result["estimated_quantity_transport_cost_rs"])


if __name__ == "__main__":
    unittest.main()
