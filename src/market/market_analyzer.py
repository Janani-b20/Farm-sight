import logging
from typing import List, Dict, Any, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

class MarketAnalyzer:
    """
    MarketAnalyzer handles statistical analysis and reporting for agricultural
    commodity prices returned by MarketService.
    """

    def __init__(self, records: List[Dict[str, Any]]) -> None:
        """
        Initializes the analyzer with a list of market records.
        Filters out invalid records (e.g., missing modal_price or market name) for safety.
        """
        self.raw_records = records
        self.records = [
            r for r in records
            if r.get("modal_price") is not None and r.get("market") is not None
        ]
        
    def get_best_market(self) -> Optional[Dict[str, Any]]:
        """
        Finds the market with the highest modal_price.
        """
        if not self.records:
            return None
        return max(self.records, key=lambda x: x["modal_price"])

    def get_price_extremes(self) -> Dict[str, Optional[float]]:
        """
        Returns the highest and lowest modal prices found among the records.
        """
        if not self.records:
            return {"highest_modal_price": None, "lowest_modal_price": None}
        prices = [r["modal_price"] for r in self.records]
        return {
            "highest_modal_price": max(prices),
            "lowest_modal_price": min(prices)
        }

    def get_average_modal_price(self) -> Optional[float]:
        """
        Calculates the average modal price across all valid records.
        """
        if not self.records:
            return None
        prices = [r["modal_price"] for r in self.records]
        return sum(prices) / len(prices)

    def get_market_comparison(self) -> List[Dict[str, Any]]:
        """
        Returns a list comparing prices across all available markets,
        sorted by modal price in descending order.
        """
        comparison = []
        for r in self.records:
            comparison.append({
                "market": r["market"],
                "district": r.get("district", ""),
                "state": r.get("state", ""),
                "variety": r.get("variety", ""),
                "modal_price": r["modal_price"]
            })
        return sorted(comparison, key=lambda x: x["modal_price"], reverse=True)

    def get_price_trend(self) -> Dict[str, Any]:
        """
        Calculates a simple chronological price trend when multiple dates are available.
        Sorts records by date and calculates percentage change between the oldest and newest.
        """
        trend_info = {
            "trend_direction": "insufficient_data",
            "percentage_change": 0.0,
            "oldest_price": None,
            "newest_price": None,
            "oldest_date": None,
            "newest_date": None
        }

        # Filter and extract records with valid dates
        dated_records = []
        for r in self.records:
            date_str = r.get("arrival_date")
            if not date_str:
                continue
            try:
                # API dates are expected to be dd/mm/yyyy
                parsed_date = datetime.strptime(date_str.strip(), "%d/%m/%Y")
                dated_records.append((parsed_date, r["modal_price"], date_str))
            except ValueError:
                logger.warning(f"Could not parse date: {date_str}. Expected 'dd/mm/yyyy'.")
                continue

        if len(dated_records) < 2:
            return trend_info

        # Sort chronologically by datetime object
        dated_records.sort(key=lambda x: x[0])

        oldest = dated_records[0]
        newest = dated_records[-1]

        oldest_price = oldest[1]
        newest_price = newest[1]

        trend_info["oldest_price"] = oldest_price
        trend_info["newest_price"] = newest_price
        trend_info["oldest_date"] = oldest[2]
        trend_info["newest_date"] = newest[2]

        if oldest_price == 0:
            trend_info["percentage_change"] = 0.0
        else:
            trend_info["percentage_change"] = round(((newest_price - oldest_price) / oldest_price) * 100.0, 2)

        if newest_price > oldest_price:
            trend_info["trend_direction"] = "increasing"
        elif newest_price < oldest_price:
            trend_info["trend_direction"] = "decreasing"
        else:
            trend_info["trend_direction"] = "stable"

        return trend_info

    @staticmethod
    def calculate_gross_value(quantity_kg: float, modal_price_per_quintal: float) -> float:
        """
        Calculates estimated gross value.
        AGMARKNET/data.gov.in prices are in Rupees per Quintal (1 Quintal = 100 kg).
        Formula: quantity_kg * (modal_price_per_quintal / 100.0)
        """
        modal_price_per_kg = modal_price_per_quintal / 100.0
        return quantity_kg * modal_price_per_kg

    def analyze(self, quantity_kg: Optional[float] = None) -> Dict[str, Any]:
        """
        Generates a clean structured analysis summary suitable for backend APIs (e.g. FastAPI).
        """
        best_market = self.get_best_market()
        extremes = self.get_price_extremes()
        avg_price = self.get_average_modal_price()
        comparison = self.get_market_comparison()
        trend = self.get_price_trend()

        estimated_gross_value = None
        if quantity_kg is not None and best_market is not None:
            estimated_gross_value = self.calculate_gross_value(
                quantity_kg, best_market["modal_price"]
            )

        return {
            "total_records_processed": len(self.raw_records),
            "valid_records_analyzed": len(self.records),
            "best_market": {
                "market": best_market["market"],
                "district": best_market.get("district", ""),
                "state": best_market.get("state", ""),
                "variety": best_market.get("variety", ""),
                "modal_price": best_market["modal_price"]
            } if best_market else None,
            "price_summary": {
                "highest_modal_price": extremes["highest_modal_price"],
                "lowest_modal_price": extremes["lowest_modal_price"],
                "average_modal_price": round(avg_price, 2) if avg_price is not None else None
            },
            "market_comparison": comparison,
            "price_trend": trend,
            "estimated_gross_value": {
                "quantity_kg": quantity_kg,
                "gross_value_rs": round(estimated_gross_value, 2),
                "calculation_basis": "Best market modal price per kg (modal_price / 100.0)"
            } if (quantity_kg is not None and estimated_gross_value is not None) else None
        }
