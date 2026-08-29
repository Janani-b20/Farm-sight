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

        t = requests.Timeout("forced")
        f = requests.RequestException("forced")
        with patch(patch_target) as mock_get:
            mock_get.side_effect = [t, f]
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

if __name__ == "__main__":
    unittest.main()
