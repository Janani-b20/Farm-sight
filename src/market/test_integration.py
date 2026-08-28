import sys
import os
import unittest
from unittest.mock import patch, MagicMock

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

if __name__ == "__main__":
    unittest.main()
