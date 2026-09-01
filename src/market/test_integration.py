import sys
import os
import unittest
from unittest.mock import patch, MagicMock
import requests

# Ensure target import path works
src_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if src_dir not in sys.path:
    sys.path.insert(0, src_dir)

try:
    from market.market_service import MarketService
    from market.market_analyzer import MarketAnalyzer
except ImportError:
    from market_service import MarketService
    from market_analyzer import MarketAnalyzer

class TestMarketServiceAnalyzerIntegration(unittest.TestCase):

    def test_integration_flow(self) -> None:
        # Determine the correct patching target path based on import availability
        try:
            import market.market_service
            patch_target = 'market.market_service.requests.get'
        except ImportError:
            patch_target = 'market_service.requests.get'

        # Mock API response from data.gov.in
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "index_name": "agmarknet",
            "records": [
                {
                    "commodity": "Paddy(Dhan)",
                    "state": "Punjab",
                    "district": "Amritsar",
                    "market": "Rayya",
                    "variety": "Common",
                    "min_price": "2100",
                    "max_price": "2300",
                    "modal_price": "2200",
                    "arrival_date": "28/08/2026"
                },
                {
                    "commodity": "Paddy(Dhan)",
                    "state": "Punjab",
                    "district": "Amritsar",
                    "market": "Amritsar",
                    "variety": "Common",
                    "min_price": "2200",
                    "max_price": "2400",
                    "modal_price": "2300",
                    "arrival_date": "28/08/2026"
                }
            ]
        }

        # Run integration flow with requests.get mocked
        with patch(patch_target) as mock_get:
            mock_get.return_value = mock_response

            # Instantiate service with a dummy key
            service = MarketService()
            service.api_key = "dummy_api_key"

            # 1. Fetch records via service
            records = service.get_market_prices(commodity="Paddy", state="Punjab")

            # Verify data parsing and mapping by MarketService
            self.assertEqual(len(records), 2)
            self.assertEqual(records[0]["market"], "Rayya")
            self.assertEqual(records[0]["modal_price"], 2200.0)

            # 2. Pass records directly into MarketAnalyzer
            analyzer = MarketAnalyzer(records)
            analysis = analyzer.analyze(quantity_kg=500.0)

            # 3. Verify analytics processing
            self.assertEqual(analysis["valid_records_analyzed"], 2)

            # Amritsar has higher modal price (2300) vs Rayya (2200)
            self.assertEqual(analysis["best_market"]["market"], "Amritsar")
            self.assertEqual(analysis["best_market"]["modal_price"], 2300.0)

            # Average modal price: (2200 + 2300) / 2 = 2250.0
            self.assertEqual(analysis["price_summary"]["average_modal_price"], 2250.0)

            # Gross value calculation: 500 kg * (2300 / 100) = 11,500 Rs
            self.assertEqual(analysis["estimated_gross_value"]["gross_value_rs"], 11500.0)

    def test_primary_timeout_trigger_secondary(self) -> None:
        """
        When data.gov.in times out, _fetch_secondary is called.
        farmer.in only provides national aggregate prices — no state-level mandi data.
        _fetch_secondary must raise ValueError, causing the cascade to fall through
        to the local JSON fallback with real state-specific mandi records.
        """
        try:
            import market.market_service
            patch_target = 'market.market_service.requests.get'
        except ImportError:
            patch_target = 'market_service.requests.get'

        mock_primary_timeout = requests.Timeout("Primary API timed out")

        # Simulate a valid farmer.in response (real schema with major_states)
        mock_secondary_response = MagicMock()
        mock_secondary_response.status_code = 200
        mock_secondary_response.json.return_value = {
            "source": "farmer.in",
            "commodities": [
                {
                    "id": "cotton",
                    "name": "Cotton",
                    "price": 8950,
                    "min": 8000,
                    "max": 9400,
                    "major_states": ["Gujarat", "Maharashtra", "Telangana"],
                    "varieties": ["Kalyan", "MCU-12"],
                    "updated": "2026-08-26"
                }
            ]
        }

        with patch(patch_target) as mock_get:
            mock_get.side_effect = [mock_primary_timeout, mock_secondary_response]

            service = MarketService()
            service.api_key = "dummy_api_key"

            records = service.get_market_prices(commodity="Cotton", state="Gujarat")

            # _fetch_secondary raises ValueError → cascade lands on local fallback
            # Local fallback has real Gujarat Cotton mandis
            self.assertTrue(len(records) > 0)
            self.assertEqual(records[0]["commodity"], "Cotton")
            self.assertEqual(records[0]["state"], "Gujarat")
            # Real Gujarat mandi names — not fake farmer.in names
            real_markets = {"Bhavnagar", "Damnagar", "Rajkot", "Wadhwan"}
            returned_markets = {r["market"] for r in records}
            self.assertTrue(
                returned_markets & real_markets,
                f"Expected real Gujarat Cotton markets in local fallback, got: {returned_markets}"
            )
            for r in records:
                self.assertNotIn(r["market"], {"Market A", "Market B", "Market C"})


    def test_primary_timeout_secondary_failure_trigger_local(self) -> None:
        try:
            import market.market_service
            patch_target = 'market.market_service.requests.get'
        except ImportError:
            patch_target = 'market_service.requests.get'

        mock_primary_timeout = requests.Timeout("Primary API timed out")
        mock_secondary_failure = requests.RequestException("Secondary API failed")

        with patch(patch_target) as mock_get:
            mock_get.side_effect = [mock_primary_timeout, mock_secondary_failure]

            service = MarketService()
            service.api_key = "dummy_api_key"

            records = service.get_market_prices(commodity="Cotton", state="Gujarat")

            # Verify it fell back to local fallback JSON
            self.assertTrue(len(records) > 0)
            self.assertEqual(records[0]["commodity"], "Cotton")
            self.assertEqual(records[0]["state"], "Gujarat")
            self.assertEqual(records[0]["arrival_date"], "28/08/2026")

    def test_invalid_secondary_response_trigger_local(self) -> None:
        try:
            import market.market_service
            patch_target = 'market.market_service.requests.get'
        except ImportError:
            patch_target = 'market_service.requests.get'

        mock_primary_timeout = requests.Timeout("Primary API timed out")

        mock_invalid_secondary = MagicMock()
        mock_invalid_secondary.status_code = 200
        mock_invalid_secondary.json.return_value = {"invalid": "schema"} # missing commodities key

        with patch(patch_target) as mock_get:
            mock_get.side_effect = [mock_primary_timeout, mock_invalid_secondary]

            service = MarketService()
            service.api_key = "dummy_api_key"

            records = service.get_market_prices(commodity="Cotton", state="Gujarat")

            # Verify it still fell back to local fallback JSON
            self.assertTrue(len(records) > 0)
            self.assertEqual(records[0]["commodity"], "Cotton")
            self.assertEqual(records[0]["state"], "Gujarat")

    def test_primary_timeout_secondary_always_falls_to_local(self) -> None:
        """
        farmer.in is a national-aggregate API with no state-level mandi data.
        Even when it responds successfully, _fetch_secondary must raise ValueError
        so the cascade always lands on the accurate local JSON fallback.
        """
        try:
            import market.market_service
            patch_target = 'market.market_service.requests.get'
        except ImportError:
            patch_target = 'market_service.requests.get'

        mock_primary_timeout = requests.Timeout("Primary API timed out")

        # Simulate a successful farmer.in response (real schema)
        mock_secondary_ok = MagicMock()
        mock_secondary_ok.status_code = 200
        mock_secondary_ok.json.return_value = {
            "source": "farmer.in",
            "commodities": [
                {
                    "id": "cotton",
                    "name": "Cotton",
                    "price": 7200,
                    "min": 6800,
                    "max": 7500,
                    "major_states": ["Gujarat", "Maharashtra", "Telangana"],
                    "varieties": ["Kalyan", "H-4"],
                    "updated": "2026-08-28"
                }
            ]
        }

        with patch(patch_target) as mock_get:
            mock_get.side_effect = [mock_primary_timeout, mock_secondary_ok]

            service = MarketService()
            service.api_key = "dummy_api_key"

            # Should fall through secondary → local fallback with real Gujarat mandis
            records = service.get_market_prices(commodity="Cotton", state="Gujarat")

            # Records must come from local fallback (real Gujarat market names)
            self.assertTrue(len(records) > 0)
            real_markets = {"Bhavnagar", "Damnagar", "Rajkot", "Wadhwan"}
            returned_markets = {r["market"] for r in records}
            # At least one real Gujarat market name must appear
            self.assertTrue(
                returned_markets & real_markets,
                f"Expected real Gujarat markets, got: {returned_markets}"
            )
            # No fake generic names from farmer.in secondary
            for r in records:
                self.assertNotIn(r["market"], {"Market A", "Market B", "Market C"})
                self.assertNotIn(r["district"], {"District 1", "District 2", "District 3"})

    # -------------------------------------------------------------------------
    # State-isolation tests
    # -------------------------------------------------------------------------

    def _local_fallback_records(self, commodity: str, state: str):
        """Helper: patch both APIs to fail so we get local fallback records."""
        try:
            import market.market_service
            patch_target = 'market.market_service.requests.get'
        except ImportError:
            patch_target = 'market_service.requests.get'

        with patch(patch_target) as mock_get:
            # Provide enough exceptions to cover all commodity variants plus fallback API calls
            mock_get.side_effect = [requests.RequestException("forced")] * 10
            service = MarketService()
            service.api_key = "dummy_api_key"
            return service.get_market_prices(commodity=commodity, state=state)

    def test_gujarat_cotton_returns_gujarat_records(self) -> None:
        records = self._local_fallback_records("Cotton", "Gujarat")
        self.assertTrue(len(records) > 0, "Expected Gujarat Cotton records")
        for r in records:
            self.assertEqual(r["state"], "Gujarat")
            self.assertEqual(r["commodity"], "Cotton")

    def test_tamil_nadu_paddy_does_not_return_gujarat_markets(self) -> None:
        records = self._local_fallback_records("Paddy", "Tamil Nadu")
        self.assertTrue(len(records) > 0, "Expected Tamil Nadu Paddy records")
        gujarat_markets = {"Bhavnagar", "Damnagar", "Rajkot", "Gondal"}
        for r in records:
            self.assertEqual(r["state"], "Tamil Nadu")
            self.assertNotIn(r["market"], gujarat_markets)

    def test_punjab_paddy_does_not_return_tamil_nadu_markets(self) -> None:
        records = self._local_fallback_records("Paddy", "Punjab")
        self.assertTrue(len(records) > 0, "Expected Punjab Paddy records")
        tn_markets = {"Thanjavur", "Kumbakonam", "Nagapattinam", "Srirangam"}
        for r in records:
            self.assertEqual(r["state"], "Punjab")
            self.assertNotIn(r["market"], tn_markets)

    def test_gujarat_groundnut_returns_only_gujarat(self) -> None:
        records = self._local_fallback_records("Groundnut", "Gujarat")
        self.assertTrue(len(records) > 0)
        for r in records:
            self.assertEqual(r["state"], "Gujarat")
            self.assertEqual(r["commodity"], "Groundnut")

    def test_maharashtra_cotton_does_not_return_gujarat_records(self) -> None:
        records = self._local_fallback_records("Cotton", "Maharashtra")
        self.assertTrue(len(records) > 0, "Expected Maharashtra Cotton records")
        gujarat_markets = {"Bhavnagar", "Damnagar", "Wadhwan"}
        for r in records:
            self.assertEqual(r["state"], "Maharashtra")
            self.assertNotIn(r["market"], gujarat_markets)

    def test_unknown_state_returns_empty_not_unrelated_records(self) -> None:
        records = self._local_fallback_records("Cotton", "Uttarakhand")
        # Uttarakhand has no Cotton records in the local fallback — must return []
        self.assertEqual(records, [], f"Expected empty list, got: {records}")

    def test_west_bengal_paddy_state_isolation(self) -> None:
        records = self._local_fallback_records("Paddy", "West Bengal")
        self.assertTrue(len(records) > 0, "Expected West Bengal Paddy records")
        for r in records:
            self.assertEqual(r["state"], "West Bengal")
            self.assertNotEqual(r["market"], "Amritsar")
            self.assertNotEqual(r["market"], "Thanjavur")

    def test_current_record_available(self) -> None:
        try:
            import market.market_service
            patch_target = 'market.market_service.requests.get'
        except ImportError:
            patch_target = 'market_service.requests.get'

        from datetime import datetime
        today_str = datetime.now().strftime("%d/%m/%Y")

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "records": [
                {
                    "commodity": "Paddy(Common)",
                    "state": "Tamil Nadu",
                    "district": "Kanchipuram",
                    "market": "Kanchipuram",
                    "variety": "Common",
                    "min_price": "2100",
                    "max_price": "2300",
                    "modal_price": "2200",
                    "arrival_date": today_str
                }
            ]
        }

        with patch(patch_target) as mock_get:
            mock_get.return_value = mock_response
            service = MarketService()
            service.api_key = "dummy_api_key"
            records = service.get_market_prices(commodity="Paddy", state="Tamil Nadu", district="Kanchipuram")
            self.assertEqual(len(records), 1)
            self.assertEqual(records[0]["data_status"], "current")
            self.assertEqual(records[0]["last_updated"], today_str)
            self.assertFalse(records[0]["district_unavailable"])

    def test_recent_district_record_available(self) -> None:
        try:
            import market.market_service
            patch_target = 'market.market_service.requests.get'
        except ImportError:
            patch_target = 'market_service.requests.get'

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "records": [
                {
                    "commodity": "Paddy(Common)",
                    "state": "Tamil Nadu",
                    "district": "Kanchipuram",

                    "market": "Kanchipuram",
                    "variety": "Common",
                    "min_price": "2100",
                    "max_price": "2300",
                    "modal_price": "2200",
                    "arrival_date": "20/08/2026"
                }
            ]
        }

        with patch(patch_target) as mock_get:
            mock_get.return_value = mock_response
            service = MarketService()
            service.api_key = "dummy_api_key"
            records = service.get_market_prices(commodity="Paddy", state="Tamil Nadu", district="Kanchipuram")
            self.assertEqual(len(records), 1)
            self.assertEqual(records[0]["data_status"], "recent")
            self.assertEqual(records[0]["last_updated"], "20/08/2026")
            self.assertFalse(records[0]["district_unavailable"])

    def test_recent_state_alternatives_available(self) -> None:
        try:
            import market.market_service
            patch_target = 'market.market_service.requests.get'
        except ImportError:
            patch_target = 'market_service.requests.get'

        mock_empty = MagicMock()
        mock_empty.status_code = 200
        mock_empty.json.return_value = {"records": []}

        mock_state = MagicMock()
        mock_state.status_code = 200
        mock_state.json.return_value = {
            "records": [
                {
                    "commodity": "Cotton",
                    "state": "Tamil Nadu",
                    "district": "Madurai",
                    "market": "Madurai",
                    "variety": "MCU-5",
                    "min_price": "7000",
                    "max_price": "7500",
                    "modal_price": "7200",
                    "arrival_date": "25/08/2026"
                }
            ]
        }

        with patch(patch_target) as mock_get:
            # First variant query with district returns empty, then state query returns alternatives
            mock_get.side_effect = [mock_empty, mock_state]
            service = MarketService()
            service.api_key = "dummy_api_key"
            records = service.get_market_prices(commodity="Cotton", state="Tamil Nadu", district="Thanjavur")
            self.assertEqual(len(records), 1)
            self.assertEqual(records[0]["data_status"], "recent")
            self.assertEqual(records[0]["last_updated"], "25/08/2026")
            self.assertTrue(records[0]["district_unavailable"])

    def test_zero_data_gov_records_fallback_not_current(self) -> None:
        try:
            import market.market_service
            patch_target = 'market.market_service.requests.get'
        except ImportError:
            patch_target = 'market_service.requests.get'

        mock_empty = MagicMock()
        mock_empty.status_code = 200
        mock_empty.json.return_value = {"records": []}

        with patch(patch_target) as mock_get:
            # data.gov.in returns 0 records, falling back to local fallback
            mock_get.side_effect = [mock_empty] * 10
            service = MarketService()
            service.api_key = "dummy_api_key"
            records = service.get_market_prices(commodity="Paddy", state="Tamil Nadu", district="Kanchipuram")
            self.assertTrue(len(records) > 0)

            # Analyze
            analyzer = MarketAnalyzer(records)
            result = analyzer.analyze()
            self.assertEqual(result["data_source"], "local_fallback")
            self.assertEqual(result["data_status"], "recent")

    def test_no_district_records_but_state_level_available(self) -> None:
        try:
            import market.market_service
            patch_target = 'market.market_service.requests.get'
        except ImportError:
            patch_target = 'market_service.requests.get'

        mock_empty = MagicMock()
        mock_empty.status_code = 200
        mock_empty.json.return_value = {"records": []}

        mock_state = MagicMock()
        mock_state.status_code = 200
        mock_state.json.return_value = {
            "records": [
                {
                    "commodity": "Cotton",
                    "state": "Tamil Nadu",
                    "district": "Salem",
                    "market": "Salem",
                    "variety": "MCU-5",
                    "min_price": "7000",
                    "max_price": "7500",
                    "modal_price": "7200",
                    "arrival_date": "28/08/2026"
                }
            ]
        }

        with patch(patch_target) as mock_get:
            mock_get.side_effect = [mock_empty, mock_state]
            service = MarketService()
            service.api_key = "dummy_api_key"
            records = service.get_market_prices(commodity="Cotton", state="Tamil Nadu", district="Kanchipuram")
            self.assertEqual(len(records), 1)
            self.assertEqual(records[0]["data_source"], "data.gov.in")
            self.assertTrue(records[0]["district_unavailable"])
            self.assertEqual(records[0]["market"], "Salem")

    def test_recent_government_record(self) -> None:
        try:
            import market.market_service
            patch_target = 'market.market_service.requests.get'
        except ImportError:
            patch_target = 'market_service.requests.get'

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "records": [
                {
                    "commodity": "Groundnut",
                    "state": "Tamil Nadu",
                    "district": "Cuddalore",
                    "market": "Cuddalore",
                    "variety": "Local",
                    "min_price": "6000",
                    "max_price": "7000",
                    "modal_price": "6500",
                    "arrival_date": "20/08/2026"
                }
            ]
        }

        with patch(patch_target) as mock_get:
            mock_get.return_value = mock_response
            service = MarketService()
            service.api_key = "dummy_api_key"
            records = service.get_market_prices(commodity="Groundnut", state="Tamil Nadu", district="Cuddalore")
            self.assertEqual(len(records), 1)
            self.assertEqual(records[0]["data_source"], "data.gov.in")
            self.assertEqual(records[0]["data_status"], "recent")
            self.assertEqual(records[0]["last_updated"], "20/08/2026")
            self.assertFalse(records[0]["district_unavailable"])

    def test_complete_no_data_case(self) -> None:
        try:
            import market.market_service
            patch_target = 'market.market_service.requests.get'
        except ImportError:
            patch_target = 'market_service.requests.get'

        mock_empty = MagicMock()
        mock_empty.status_code = 200
        mock_empty.json.return_value = {"records": []}

        with patch(patch_target) as mock_get:
            mock_get.side_effect = [mock_empty] * 20
            service = MarketService()
            service.api_key = "dummy_api_key"
            # Thanjavur + Cotton has zero records in fallback as well
            records = service.get_market_prices(commodity="Cotton", state="Tamil Nadu", district="Thanjavur")
            self.assertEqual(records, [])

            analyzer = MarketAnalyzer(records)
            result = analyzer.analyze()
            self.assertEqual(result["data_source"], "unavailable")
            self.assertEqual(result["data_status"], "unavailable")
            self.assertIsNone(result["best_market"])

    def test_existing_groundnut_tamil_nadu_live_case(self) -> None:
        try:
            import market.market_service
            patch_target = 'market.market_service.requests.get'
        except ImportError:
            patch_target = 'market_service.requests.get'

        from datetime import datetime
        today_str = datetime.now().strftime("%d/%m/%Y")

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "records": [
                {
                    "commodity": "Groundnut",
                    "state": "Tamil Nadu",
                    "district": "Cuddalore",
                    "market": "Cuddalore",
                    "variety": "Local",
                    "min_price": "6000",
                    "max_price": "7000",
                    "modal_price": "6500",
                    "arrival_date": today_str
                }
            ]
        }

        with patch(patch_target) as mock_get:
            mock_get.return_value = mock_response
            service = MarketService()
            service.api_key = "dummy_api_key"
            records = service.get_market_prices(commodity="Groundnut", state="Tamil Nadu")
            self.assertEqual(len(records), 1)
            self.assertEqual(records[0]["commodity"], "Groundnut")
            self.assertEqual(records[0]["state"], "Tamil Nadu")
            self.assertEqual(records[0]["data_source"], "data.gov.in")
            self.assertEqual(records[0]["data_status"], "current")

class TestMarketNetValueIntegration(unittest.TestCase):
    """Tests for Net Value and Transport Type integration inside MarketAnalyzer."""

    def setUp(self):
        # Rayya is in Amritsar, Punjab
        # Amritsar coordinates in JSON are at lat=31.634, lng=74.8723
        self.records = [
            {
                "commodity": "Paddy",
                "state": "Punjab",
                "district": "Amritsar",
                "market": "Rayya",
                "variety": "Common",
                "min_price": 2100.0,
                "max_price": 2300.0,
                "modal_price": 2200.0,
                "arrival_date": "28/08/2026",
                "data_source": "data.gov.in",
                "data_status": "current"
            }
        ]

    @patch('requests.post')
    @patch.dict(os.environ, {"OPENROUTESERVICE_API_KEY": "test_key"})
    def test_ors_success_net_value(self, mock_post):
        """Verify ORS success uses vehicle specific rate, calculates transport cost, and net value."""
        # Mock ORS: distance 20 km (20000 m), duration 1800 s
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "routes": [{"summary": {"distance": 20000.0, "duration": 1800.0}}]
        }
        mock_post.return_value = mock_response

        analyzer = MarketAnalyzer(self.records)
        # Quantity 1000 kg -> mini_truck (base: 250, per-qtl-km: 1.8)
        # Gross crop value = 1000 kg * 22.0 Rs/kg = 22,000.0 Rs
        # Transport cost = 250.0 + (20.0 km * 1.8 * 10 quintals) = 250.0 + 360.0 = 610.0 Rs
        # Net value = 22,000.0 - 610.0 = 21,390.0 Rs
        analysis = analyzer.analyze(quantity_kg=1000.0, user_lat=31.63, user_lng=74.87)

        self.assertIsNotNone(analysis["estimated_net_value"])
        net_val_data = analysis["estimated_net_value"]
        self.assertEqual(net_val_data["gross_value_rs"], 22000.0)
        self.assertEqual(net_val_data["transport_cost_rs"], 610.0)
        self.assertEqual(net_val_data["net_value_rs"], 21390.0)
        self.assertEqual(analysis["net_value_rs"], 21390.0)
        self.assertEqual(analysis["transport_type"], "mini_truck")
        self.assertEqual(analysis["estimated_transport_cost_rs"], 610.0)
        self.assertIn("mini_truck", net_val_data["calculation_basis"])

    @patch('requests.post')
    @patch.dict(os.environ, {"OPENROUTESERVICE_API_KEY": "test_key"})
    def test_ors_failure_fallback_net_value(self, mock_post):
        """Verify ORS failure falls back to Haversine * 1.3 and calculates net value."""
        # Mock ORS failure
        mock_post.side_effect = Exception("ORS Connection Failed")

        analyzer = MarketAnalyzer(self.records)
        # Quantity 3000 kg -> truck (base: 400.0, per-qtl-km: 2.5)
        # We check that net value is calculated using fallback Haversine distance
        analysis = analyzer.analyze(quantity_kg=3000.0, user_lat=31.63, user_lng=74.87)

        self.assertIsNotNone(analysis["estimated_net_value"])
        net_val_data = analysis["estimated_net_value"]
        self.assertEqual(analysis["transport_type"], "truck")
        self.assertIsNotNone(net_val_data["transport_cost_rs"])
        self.assertIsNotNone(net_val_data["net_value_rs"])
        self.assertEqual(analysis["net_value_rs"], net_val_data["net_value_rs"])
        self.assertIn("haversine", analysis["transport_estimate"]["distance_source"])

    def test_missing_coordinates(self):
        """Verify that when coordinates are missing, net value is None and message indicates why."""
        analyzer = MarketAnalyzer(self.records)
        analysis = analyzer.analyze(quantity_kg=1000.0, user_lat=None, user_lng=None)

        self.assertIsNotNone(analysis["estimated_net_value"])
        self.assertIsNone(analysis["net_value_rs"])
        self.assertIsNone(analysis["estimated_net_value"]["net_value_rs"])
        self.assertIn("required", analysis["net_value_calculation_basis"])

    def test_missing_quantity(self):
        """Verify that when quantity is missing, net value is None."""
        analyzer = MarketAnalyzer(self.records)
        analysis = analyzer.analyze(quantity_kg=None, user_lat=31.63, user_lng=74.87)

        self.assertIsNotNone(analysis["estimated_net_value"])
        self.assertIsNone(analysis["net_value_rs"])
        self.assertIsNone(analysis["estimated_net_value"]["net_value_rs"])
        self.assertIn("required", analysis["net_value_calculation_basis"])


if __name__ == "__main__":
    unittest.main()
