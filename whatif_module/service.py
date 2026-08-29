"""
FarmSight - What-If & Accessibility Service Wrapper
Standard integration point for Dev (ML), Kundhani (Weather), and Backend router.
"""

from whatif_module.simulator import run_simulation
from whatif_module.explainer import generate_farmer_explanation
from whatif_module.tts import speak_tamil_advice

def execute_whatif_pipeline(ml_result: dict, weather_data: dict, farmer_action: str) -> dict:
    """
    Unified entry point for What-If simulation + Tamil AI explanation + Voice synthesis.
    
    Accepts standardized ML format:
    {
        "crop": "paddy",
        "disease": "dead_heart",
        "confidence": 99.69,
        "message": "Prediction successful."
    }
    """
    crop_name = ml_result.get("crop", "paddy")
    
    # 1. Run deterministic simulation logic
    sim_result = run_simulation(ml_result, weather_data, farmer_action)
    
    # 2. Guardrail Check: If uncertain / low confidence, halt further processing
    if sim_result.get("status") == "halted":
        reason_text = sim_result.get("reason", "பயிரின் புகைப்படத்தை மீண்டும் தெளிவாக பதிவேற்றவும்.")
        audio_path = speak_tamil_advice(reason_text)
        return {
            "status": "halted",
            "condition": "uncertain",
            "simulation": sim_result,
            "tamil_advice": reason_text,
            "audio_file": audio_path
        }

    # 3. Generate Gemini contextual advisory in Pure Tamil
    tamil_advice = generate_farmer_explanation(sim_result, crop_name=crop_name, weather_info=weather_data)
    
    # 4. Generate Tamil Audio
    audio_path = speak_tamil_advice(tamil_advice)

    return {
        "status": "success",
        "condition": sim_result.get("condition"),
        "simulation": sim_result,
        "tamil_advice": tamil_advice,
        "audio_file": audio_path
    }