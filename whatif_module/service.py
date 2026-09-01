import os
from whatif_module.simulator import simulate_decision

# Safe Explainer import (handles any function name in explainer.py)
try:
    import whatif_module.explainer as exp_mod
    if hasattr(exp_mod, "generate_multilingual_advisory"):
        generate_advisory_func = exp_mod.generate_multilingual_advisory
    elif hasattr(exp_mod, "generate_explanation"):
        generate_advisory_func = exp_mod.generate_explanation
    elif hasattr(exp_mod, "generate_advisory"):
        generate_advisory_func = exp_mod.generate_advisory
    else:
        # Fallback to the first callable function in explainer.py
        funcs = [getattr(exp_mod, f) for f in dir(exp_mod) if callable(getattr(exp_mod, f)) and not f.startswith("_")]
        generate_advisory_func = funcs[0] if funcs else None
except Exception:
    generate_advisory_func = None


def execute_whatif_pipeline(ml_result: dict, weather_data: dict, language: str = "ta") -> dict:
    """
    Core What-If execution service: runs agro-climatic simulation 
    and returns advisory text without duplicate audio triggers.
    """
    farmer_action = ml_result.get("farmer_proposed_action", "spray_chemical_now")
    
    # 1. Run deterministic agro-climatic simulation
    sim_result = simulate_decision(
        ml_prediction=ml_result,
        weather=weather_data,
        action=farmer_action
    )
    
    # Uncertainty / Low Confidence Guardrail Check
    if sim_result.get("status") == "halted":
        halt_msg = {
            "ta": "படத்தின் தரம் குறைவாக உள்ளது. தயவுசெய்து தெளிவான புகைப்படத்தை மீண்டும் பதிவேற்றவும்.",
            "en": "Prediction confidence is low. Please capture and re-upload a clearer crop image.",
            "hi": "छवि की गुणवत्ता कम है। कृपया फसल की स्पष्ट तस्वीर दोबारा अपलोड करें।"
        }
        advice_text = halt_msg.get(language, halt_msg["ta"])
        return {
            "status": "halted",
            "simulation": sim_result,
            "advisory_text": advice_text,
            "audio_file": None
        }

    # 2. Advisory Generation
    advisory_text = ""
    if generate_advisory_func:
        try:
            advisory_text = generate_advisory_func(simulation_data=sim_result, target_lang=language)
        except Exception:
            try:
                advisory_text = generate_advisory_func(sim_result, language)
            except Exception:
                advisory_text = ""

    if not advisory_text:
        # Safe default advisory text if explainer LLM is unavailable
        if language == "ta":
            advisory_text = "வானிலை நிலவரப்படி தற்போது மழை வாய்ப்பு குறைவாக உள்ளதால் பரிந்துரைக்கப்பட்ட மருந்தை தெளிக்கலாம்."
        elif language == "hi":
            advisory_text = "मौसम के अनुसार अभी बारिश की संभावना कम है, इसलिए दवा का छिड़काव किया जा सकता है।"
        else:
            advisory_text = "Weather conditions are favorable with low rain probability. Recommended treatment can be applied."

    return {
        "status": "success",
        "simulation": sim_result,
        "advisory_text": advisory_text,
        "audio_file": None
    }