"""
FarmSight - Centralized What-If & Accessibility Service Wrapper
"""
from whatif_module.simulator import simulate_decision
from whatif_module.explainer import generate_tamil_advisory, FALLBACK_MESSAGES
from whatif_module.tts import text_to_speech

def execute_whatif_pipeline(ml_result: dict, weather_data: dict, farmer_action: str = "spray_chemical_now", language: str = "ta") -> dict:
    """
    Unified entry point consuming standard ML dictionary, Weather payload, and Target Language.
    """
    lang = language.lower() if language.lower() in ["ta", "en", "hi"] else "ta"
    
    # Run deterministic simulation & guardrails
    sim_result = simulate_decision(
        ml_prediction=ml_result,
        weather=weather_data,
        action=farmer_action
    )

    # Uncertainty Guardrail Halt Check
    if sim_result.get("status") == "halted":
        halt_msg = {
            "ta": "படத்தின் தரம் குறைவாக உள்ளது. தயவுசெய்து தெளிவான புகைப்படத்தை மீண்டும் பதிவேற்றவும்.",
            "en": "Prediction confidence is low. Please capture and re-upload a clearer crop image.",
            "hi": "छवि की गुणवत्ता कम है। कृपया फसल की स्पष्ट तस्वीर दोबारा अपलोड करें।"
        }
        advice_text = halt_msg.get(lang, halt_msg["ta"])
        audio_file = text_to_speech(advice_text, output_path="halt_advisory.mp3", language=lang, auto_play=True)
        return {
            "status": "halted",
            "simulation": sim_result,
            "advisory_text": advice_text,
            "audio_file": audio_file
        }

    # Healthy Crop Guardrail Check
    if sim_result.get("status") == "healthy_crop":
        healthy_msg = {
            "ta": "உங்கள் பயிர் நலமாக உள்ளது! இரசாயன மருந்துகள் தெளிக்க தேவையில்லை. வழக்கமான பராமரிப்பு போதுமானது.",
            "en": "Your crop is healthy! Chemical spraying is unnecessary. Regular maintenance is sufficient.",
            "hi": "आपकी फसल स्वस्थ है! रासायनिक छिड़काव की आवश्यकता नहीं है। सामान्य देखभाल पर्याप्त है।"
        }
        advice_text = healthy_msg.get(lang, healthy_msg["ta"])
        audio_file = text_to_speech(advice_text, output_path="healthy_advisory.mp3", language=lang, auto_play=True)
        return {
            "status": "healthy_crop",
            "simulation": sim_result,
            "advisory_text": advice_text,
            "audio_file": audio_file
        }

    # Standard Advisory Generation
    advisory_text = generate_tamil_advisory(sim_result, language=lang)
    audio_file = text_to_speech(advisory_text, output_path="decision_advisory.mp3", language=lang, auto_play=True)

    return {
        "status": "success",
        "simulation": sim_result,
        "advisory_text": advisory_text,
        "audio_file": audio_file
    }