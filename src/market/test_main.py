import sys
import os
import unittest
from unittest.mock import patch
from fastapi.testclient import TestClient
import requests

# Ensure target import path works
src_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if src_dir not in sys.path:
    sys.path.insert(0, src_dir)

try:
    from main import app
except ImportError:
    sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))
    from main import app

class TestMarketAPI(unittest.TestCase):

    def setUp(self) -> None:
        self.client = TestClient(app)
        self.mock_records = [
            {
                "commodity": "Cotton",
                "state": "Gujarat",
                "district": "Amreli",
                "market": "Damnagar",
                "variety": "Other",
                "minimum_price": 6000.0,
                "maximum_price": 7400.0,
                "modal_price": 6800.0,
                "arrival_date": "20/08/2026"
            },
            {
                "commodity": "Cotton",
                "state": "Gujarat",
                "district": "Amreli",
                "market": "Bhavnagar",
                "variety": "Other",
                "minimum_price": 6500.0,
                "maximum_price": 7800.0,
                "modal_price": 7200.0,
                "arrival_date": "22/08/2026"
            }
        ]

    @patch('main.MarketService.get_market_prices')
    def test_get_market_analysis_success(self, mock_get_prices) -> None:
        mock_get_prices.return_value = self.mock_records

        response = self.client.get("/api/market?commodity=Cotton&state=Gujarat&quantity_kg=1000")
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertEqual(data["valid_records_analyzed"], 2)
        self.assertEqual(data["best_market"]["market"], "Bhavnagar")
        self.assertEqual(data["best_market"]["modal_price"], 7200.0)
        # 1000 kg * (7200 / 100) = 72,000.0
        self.assertEqual(data["estimated_gross_value"]["gross_value_rs"], 72000.0)

    @patch('main.MarketService.get_market_prices')
    def test_get_market_analysis_empty_results(self, mock_get_prices) -> None:
        mock_get_prices.return_value = []

        response = self.client.get("/api/market?commodity=Cotton&state=Gujarat")
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertEqual(data["valid_records_analyzed"], 0)
        self.assertIsNone(data["best_market"])
        self.assertIsNone(data["estimated_gross_value"])

    @patch('main.MarketService.get_market_prices')
    def test_get_market_analysis_missing_api_key(self, mock_get_prices) -> None:
        mock_get_prices.side_effect = ValueError("DATA_GOV_API_KEY environment variable is missing")

        response = self.client.get("/api/market?commodity=Cotton&state=Gujarat")
        self.assertEqual(response.status_code, 503)
        self.assertIn("Configuration error", response.json()["detail"])

    @patch('main.MarketService.get_market_prices')
    def test_get_market_analysis_timeout(self, mock_get_prices) -> None:
        mock_get_prices.side_effect = requests.Timeout("Connection timed out")

        response = self.client.get("/api/market?commodity=Cotton&state=Gujarat")
        self.assertEqual(response.status_code, 504)
        self.assertIn("Timeout occurred", response.json()["detail"])

    @patch('main.MarketService.get_market_prices')
    def test_get_market_analysis_bad_gateway(self, mock_get_prices) -> None:
        mock_get_prices.side_effect = requests.RequestException("Network connection failed")

        response = self.client.get("/api/market?commodity=Cotton&state=Gujarat")
        self.assertEqual(response.status_code, 502)
        self.assertIn("Failed to connect", response.json()["detail"])

if __name__ == "__main__":
    unittest.main()
