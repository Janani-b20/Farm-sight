import os
import sys
import time
from dotenv import load_dotenv

# Project root setup
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(current_dir, ".."))

if project_root not in sys.path:
    sys.path.insert(0, project_root)

load_dotenv(os.path.join(project_root, ".env"))

from src.services.weather_service import get_weather_data, apply_weather_rules
from src.services.rag_service import get_disease_advice
from src.market.market_service import MarketService

from whatif_module.service import execute_whatif_pipeline


UNCERTAIN_LABELS = {
    "uncertain",
    "low_confidence"
}

HEALTHY_LABELS = {
    "normal",
    "healthy",
    "no_disease",
    "none"
}


class FarmSightUnifiedPipeline:
    def __init__(self):
        try:
            self.market_service = MarketService()
        except Exception:
            self.market_service = None

    def run_live_pipeline(
        self,
        crop: str,
        disease: str,
        confidence: float,
        state: str = "Tamil Nadu",
        district: str = "Thanjavur",
        lat: float | None = None,
        lon: float | None = None,
        farmer_action: str = "spray_immediately",
        language: str = "en"
    ) -> dict:

        crop = str(crop).strip().lower()
        disease = str(disease).strip().lower()

        confidence = (
            confidence * 100.0
            if confidence <= 1.0
            else confidence
        )

        # -------------------------------------------------
        # 1. Trust upstream ML uncertainty decision
        # -------------------------------------------------

        if disease in UNCERTAIN_LABELS:
            return {
                "status": "uncertain",
                "crop": crop,
                "disease": disease,
                "confidence": confidence,
                "message": (
                    "Prediction is uncertain. "
                    "Please upload a clearer, well-lit crop image."
                ),
                "show_whatif": False
            }

        # -------------------------------------------------
        # 2. Healthy crop does not need disease What-If
        # -------------------------------------------------

        if disease in HEALTHY_LABELS:
            return {
                "status": "normal",
                "crop": crop,
                "disease": disease,
                "confidence": confidence,
                "message": (
                    "The crop appears healthy. "
                    "No disease-treatment simulation is required."
                ),
                "show_whatif": False
            }

        # -------------------------------------------------
        # 3. Weather
        # -------------------------------------------------

        weather_data = {}
        weather_warning_text = None

        if lat is not None and lon is not None:
            try:
                weather_data = get_weather_data(
                    lat=lat,
                    lon=lon
                )

                weather_warning_text = apply_weather_rules(
                    crop=crop,
                    disease=disease,
                    weather=weather_data
                )

            except Exception as exc:
                weather_data = {
                    "status": "unavailable",
                    "message": (
                        "Live weather data could not be retrieved."
                    )
                }

                weather_warning_text = (
                    "Live weather information is currently unavailable."
                )

        else:
            weather_data = {
                "status": "unavailable",
                "message": (
                    "Location was not provided for live weather analysis."
                )
            }

            weather_warning_text = (
                "Weather-based timing could not be evaluated "
                "because location data was unavailable."
            )

        # -------------------------------------------------
        # 4. Disease Intelligence
        # -------------------------------------------------

        try:
            disease_rag_context = get_disease_advice(
                crop=crop,
                disease=disease,
                confidence=confidence,
                weather_context=weather_warning_text
            )

        except Exception:
            disease_rag_context = {
                "why_this_happening": [],
                "what_to_do_now": [],
                "treatment": [],
                "weather_warning": weather_warning_text,
                "sources": [],
                "status": "unavailable"
            }

        # -------------------------------------------------
        # 5. Market context
        # -------------------------------------------------

        market_records = []
        modal_price = None
        market_source = "unavailable"

        if self.market_service:
            try:
                records = self.market_service.get_market_prices(
                    commodity=crop,
                    state=state,
                    district=district
                )

                if records and isinstance(records, list):
                    market_records = records

                    first_record = records[0]

                    raw_modal_price = first_record.get(
                        "modal_price"
                    )

                    if raw_modal_price is not None:
                        modal_price = float(raw_modal_price)

                    market_source = first_record.get(
                        "source",
                        "market_service"
                    )

            except Exception:
                pass

        # -------------------------------------------------
        # 6. What-If simulation
        # -------------------------------------------------

        ml_result_payload = {
            "crop": crop,
            "disease": disease,
            "confidence": confidence,
            "message": "",
            "rag_treatment": disease_rag_context.get(
                "treatment",
                []
            ),
            "market_price": modal_price,
            "farmer_proposed_action": farmer_action,
            "status": "disease_detected"
        }

        advisory_result = execute_whatif_pipeline(
            ml_result=ml_result_payload,
            weather_data=weather_data,
            language=language
        )

        # -------------------------------------------------
        # 7. Unified structured output
        # -------------------------------------------------

        return {
            "status": "disease_detected",
            "crop": crop,
            "disease": disease,
            "confidence": confidence,

            "weather": weather_data,
            "weather_warning": weather_warning_text,

            "disease_rag": disease_rag_context,

            "market": {
                "records": market_records[:3],
                "modal_price": modal_price,
                "source": market_source
            },

            "whatif": advisory_result,

            "show_whatif": advisory_result.get(
                "show_whatif",
                True
            )
        }

    def run_batch_pipeline(
        self,
        farm_reports: list,
        state: str = "Tamil Nadu",
        district: str = "Thanjavur",
        language: str = "en"
    ) -> list:
        """
        Developer/demo helper.

        The farmer-facing application should normally process
        one user-selected crop and one uploaded image at a time.
        """

        all_results = []

        for report in farm_reports:
            result = self.run_live_pipeline(
                crop=report.get("crop"),
                disease=report.get("disease"),
                confidence=report.get(
                    "confidence",
                    0.0
                ),
                state=state,
                district=district,
                lat=report.get("lat"),
                lon=report.get("lon"),
                farmer_action=report.get(
                    "action",
                    "spray_immediately"
                ),
                language=language
            )

            all_results.append(result)
            time.sleep(0.2)

        return all_results