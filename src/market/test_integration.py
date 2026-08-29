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
        try:
            import market.market_service
            patch_target = 'market.market_service.requests.get'
        except ImportError:
            patch_target = 'market_service.requests.get'

        mock_primary_timeout = requests.Timeout("Primary API timed out")

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

            # Verify the secondary response was normalized
            self.assertEqual(len(records), 2)
            self.assertEqual(records[0]["commodity"], "Cotton")
            self.assertEqual(records[0]["state"], "Gujarat")
            self.assertEqual(records[0]["variety"], "Kalyan")
            self.assertEqual(records[0]["arrival_date"], "26/08/2026") # normalized format

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

if __name__ == "__main__":
    unittest.main()
