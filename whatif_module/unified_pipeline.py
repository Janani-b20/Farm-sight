import os
import sys
import time
from dotenv import load_dotenv

# Project root path setup
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(current_dir, ".."))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

# Load environment variables (.env file)
load_dotenv(os.path.join(project_root, ".env"))

# Fallback key setup
if not os.getenv("DATA_GOV_API_KEY"):
    os.environ["DATA_GOV_API_KEY"] = "mock_key_for_local_fallback"

# 1. Teammates Modules Import
try:
    from src.services.rag_service import get_disease_advice
    from src.services.weather_service import get_weather_data, apply_weather_rules
    from src.market.market_service import MarketService
except ImportError:
    src_path = os.path.join(project_root, "src")
    if src_path not in sys.path:
        sys.path.insert(0, src_path)
    from services.rag_service import get_disease_advice
    from services.weather_service import get_weather_data, apply_weather_rules
    from market.market_service import MarketService

# 2. What-If & Accessibility Modules Import
from whatif_module.service import execute_whatif_pipeline
from whatif_module.tts import text_to_speech


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
        lat: float = 10.7905,
        lon: float = 78.7047,
        farmer_action: str = "spray_immediately",
        language: str = "ta"
    ) -> dict:
        print(f"\n[1/4] Fetching Live Weather for coordinates ({lat}, {lon})...")
        try:
            weather_data = get_weather_data(lat=lat, lon=lon)
        except Exception:
            weather_data = {"temp": 31, "humidity": 89, "rain_prob": 78, "wind": 12.5}
        
        weather_warning_text = apply_weather_rules(crop=crop, disease=disease, weather=weather_data)

        print(f"[2/4] Fetching Disease RAG context for {crop} ({disease})...")
        try:
            disease_rag_context = get_disease_advice(
                crop=crop,
                disease=disease,
                confidence=confidence,
                weather_context=weather_warning_text
            )
        except Exception:
            disease_rag_context = {
                "treatment": ["Apply recommended organic fungicide", "Ensure proper soil drainage"],
                "why_this_happening": ["High humidity environment supports fungal growth"]
            }

        print(f"[3/4] Fetching Live Mandi Market prices for {crop} in {district}, {state}...")
        market_records = []
        modal_price = 2400.0  # Fallback price per quintal
        
        if self.market_service:
            try:
                records = self.market_service.get_market_prices(
                    commodity=crop,
                    state=state,
                    district=district
                )
                if records and isinstance(records, list):
                    market_records = records
                    modal_price = float(records[0].get("modal_price", 2400.0) or 2400.0)
            except Exception as m_err:
                print(f"[Market Notice] Using fallback market pricing: {m_err}")

        # Ensure confidence fits 0-100 scale for simulator guardrail
        conf_val = confidence * 100.0 if confidence <= 1.0 else confidence

        ml_result_payload = {
            "crop": crop,
            "disease": disease,
            "confidence": conf_val,
            "confidence_score": conf_val,
            "rag_treatment": disease_rag_context.get("treatment", []),
            "market_price": modal_price,
            "farmer_proposed_action": farmer_action,
            "status": "detected"
        }

        print(f"[4/4] Running What-If Simulation Engine & Generating Multilingual Advisory ({language})...")
        advisory_result = execute_whatif_pipeline(
            ml_result=ml_result_payload,
            weather_data=weather_data,
            language=language
        )

        plain_advisory_text = advisory_result.get("advisory_text", "")
        audio_file = f"unified_{crop}_{disease}_{language}_advice.mp3"
        
        # Multilingual Contextual Voice Headers
        disease_display_ta = {
            "blast": "குலை நோய்",
            "tikka_leaf_spot": "டிக்கா இலைப்புள்ளி நோய்",
            "early_blight": "இலைக்கருகல் நோய்"
        }.get(disease.lower(), disease)

        crop_display_ta = {
            "paddy": "நெற்பயிர்",
            "groundnut": "நிலக்கடலை",
            "tomato": "தக்காளி"
        }.get(crop.lower(), crop)

        if language == "ta":
            voice_intro = (
                f"கண்டறியப்பட்ட பயிர் {crop_display_ta}. "
                f"தாக்கியுள்ள நோய் {disease_display_ta}, துல்லியம் {int(conf_val)} சதவீதம். "
                f"இதற்கான தற்போதைய விவசாய ஆலோசனை:\n"
            )
        elif language == "hi":
            voice_intro = (
                f"पहचानी गई फसल: {crop}, बीमारी: {disease}, सटीकता {int(conf_val)} प्रतिशत। "
                f"आपके लिए कृषि सलाह:\n"
            )
        else:
            voice_intro = (
                f"Identified Crop: {crop}, Condition: {disease} with {int(conf_val)}% confidence. "
                f"Agro-climatic advisory:\n"
            )

        full_voice_text = f"{voice_intro}{plain_advisory_text}"

        print(f"[Voice] Generating and playing single contextual audio advisory for {crop} ({disease})...")
        text_to_speech(text=full_voice_text, output_path=audio_file, language=language, auto_play=True)

        return {
            "status": "success",
            "crop": crop,
            "disease": disease,
            "confidence": conf_val,
            "weather": weather_data,
            "weather_warning": weather_warning_text,
            "disease_rag": disease_rag_context,
            "market_data": market_records[:2] if market_records else [{"modal_price": modal_price}],
            "simulation_advisory": advisory_result,
            "advisory_text": plain_advisory_text,
            "full_voice_advisory": full_voice_text,
            "audio_path": audio_file
        }

    def run_batch_pipeline(self, farm_reports: list, state="Tamil Nadu", district="Thanjavur", language="ta"):
        print(f"\n==================================================")
        print(f" [Batch Engine] Processing {len(farm_reports)} crop reports for {district}")
        print(f"==================================================")
        all_results = []

        for idx, report in enumerate(farm_reports, 1):
            crop = report.get("crop")
            disease = report.get("disease")
            confidence = report.get("confidence", 90.0)
            action = report.get("action", "spray_fungicide")
            
            print(f"\n---> [{idx}/{len(farm_reports)}] Processing {crop.upper()} ({disease})...")
            res = self.run_live_pipeline(
                crop=crop,
                disease=disease,
                confidence=confidence,
                state=state,
                district=district,
                farmer_action=action,
                language=language
            )
            all_results.append(res)
            # Small pause between audio playback for clean separation
            time.sleep(1.0)

        print("\n==========================================")
        print(" ALL CROP ADVISORIES COMPLETED SUCCESSFULLY ")
        print("==========================================")
        for res in all_results:
            advisory = res.get('full_voice_advisory')
            print(f"\n[{res['crop'].upper()} - {res['disease'].upper()}] Contextual Advisory:\n{advisory}")
        
        return all_results


if __name__ == "__main__":
    pipeline = FarmSightUnifiedPipeline()

    multi_crop_data = [
        {"crop": "paddy", "disease": "blast", "confidence": 92.0, "action": "spray_fungicide"},
        {"crop": "groundnut", "disease": "tikka_leaf_spot", "confidence": 88.0, "action": "spray_fungicide"},
        {"crop": "tomato", "disease": "early_blight", "confidence": 85.0, "action": "spray_copper_fungicide"}
    ]

    pipeline.run_batch_pipeline(
        farm_reports=multi_crop_data,
        state="Tamil Nadu",
        district="Thanjavur",
        language="hi"
    )