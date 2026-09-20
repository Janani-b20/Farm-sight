import sys
import os
import unittest
from typing import List, Dict, Any

# Ensure target import path works
src_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if src_dir not in sys.path:
    sys.path.insert(0, src_dir)

try:
    from market.market_analyzer import MarketAnalyzer
except ImportError:
    from market_analyzer import MarketAnalyzer

class TestMarketAnalyzer(unittest.TestCase):

    def setUp(self) -> None:
        # Mock records matching the output of MarketService
        self.mock_records: List[Dict[str, Any]] = [
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
            },
            {
                "commodity": "Cotton",
                "state": "Gujarat",
                "district": "Amreli",
                "market": "Rajkot",
                "variety": "Other",
                "minimum_price": 6200.0,
                "maximum_price": 7500.0,
                "modal_price": 7000.0,
                "arrival_date": "24/08/2026"
            }
        ]

    def test_best_market(self) -> None:
        analyzer = MarketAnalyzer(self.mock_records)
        best = analyzer.get_best_market()
        self.assertIsNotNone(best)
        self.assertEqual(best["market"], "Bhavnagar")
        self.assertEqual(best["modal_price"], 7200.0)

    def test_price_extremes(self) -> None:
        analyzer = MarketAnalyzer(self.mock_records)
        extremes = analyzer.get_price_extremes()
        self.assertEqual(extremes["highest_modal_price"], 7200.0)
        self.assertEqual(extremes["lowest_modal_price"], 6800.0)

    def test_average_modal_price(self) -> None:
        analyzer = MarketAnalyzer(self.mock_records)
        avg = analyzer.get_average_modal_price()
        self.assertAlmostEqual(avg, 7000.0)

    def test_market_comparison(self) -> None:
        analyzer = MarketAnalyzer(self.mock_records)
        comparison = analyzer.get_market_comparison()
        self.assertEqual(len(comparison), 3)
        self.assertEqual(comparison[0]["market"], "Bhavnagar")
        self.assertEqual(comparison[1]["market"], "Rajkot")
        self.assertEqual(comparison[2]["market"], "Damnagar")

    def test_price_trend_increasing(self) -> None:
        analyzer = MarketAnalyzer(self.mock_records)
        trend = analyzer.get_price_trend()
        self.assertEqual(trend["trend_direction"], "increasing")
        # Rajkot (7000) on 24/08 is newest, Damnagar (6800) on 20/08 is oldest.
        # Bhavnagar (7200) on 22/08 is in the middle.
        self.assertEqual(trend["oldest_price"], 6800.0)
        self.assertEqual(trend["newest_price"], 7000.0)
        self.assertEqual(trend["oldest_date"], "20/08/2026")
        self.assertEqual(trend["newest_date"], "24/08/2026")
        self.assertAlmostEqual(trend["percentage_change"], 2.94, places=2)

    def test_price_trend_insufficient_data(self) -> None:
        single_record = [self.mock_records[0]]
        analyzer = MarketAnalyzer(single_record)
        trend = analyzer.get_price_trend()
        self.assertEqual(trend["trend_direction"], "insufficient_data")

    def test_gross_value_calculation(self) -> None:
        analyzer = MarketAnalyzer(self.mock_records)
        # Quantity 500 kg, price 7000 per quintal (70 per kg) -> 35,000.0 Rs.
        value = analyzer.calculate_gross_value(500.0, 7000.0)
        self.assertEqual(value, 35000.0)

    def test_null_price_handling(self) -> None:
        records_with_null = self.mock_records + [
            {
                "commodity": "Cotton",
                "state": "Gujarat",
                "district": "Amreli",
                "market": "NullMarket",
                "variety": "Other",
                "minimum_price": None,
                "maximum_price": None,
                "modal_price": None,
                "arrival_date": "25/08/2026"
            }
        ]
        analyzer = MarketAnalyzer(records_with_null)
        # Verify null price record is excluded from analysis
        self.assertEqual(analyzer.analyze()["valid_records_analyzed"], 3)
        self.assertEqual(analyzer.get_best_market()["market"], "Bhavnagar")

    def test_empty_records(self) -> None:
        analyzer = MarketAnalyzer([])
        analysis = analyzer.analyze(500.0)
        self.assertEqual(analysis["valid_records_analyzed"], 0)
        self.assertIsNone(analysis["best_market"])
        self.assertIsNone(analysis["price_summary"]["average_modal_price"])
        self.assertEqual(len(analysis["market_comparison"]), 0)
        self.assertEqual(analysis["price_trend"]["trend_direction"], "insufficient_data")
        self.assertIsNone(analysis["estimated_gross_value"])

if __name__ == "__main__":
    unittest.main()
