"""
FarmSight - Deterministic Agro-Climatic Simulation Engine & Guardrails
"""

def simulate_decision(ml_prediction: dict, weather: dict, action: str = "spray_chemical_now") -> dict:
    """
    Simulates outcomes and evaluates safety guardrails based on ML predictions and weather metrics.
    """
    crop = ml_prediction.get("crop", "unknown")
    disease = str(ml_prediction.get("disease", "")).lower()
    confidence = float(ml_prediction.get("confidence", 0.0))
    rain_prob = int(weather.get("rain_probability", 0))

    # Guardrail 1: Low Confidence / Uncertain Check
    if disease == "uncertain" or confidence < 50.0:
        return {
            "status": "halted",
            "crop": crop,
            "disease": disease,
            "confidence": confidence,
            "reason": "Model confidence is below threshold or image is unclear."
        }

    # Guardrail 2: Healthy Crop Check
    if disease in ["normal", "healthy"]:
        return {
            "status": "healthy_crop",
            "crop": crop,
            "disease": disease,
            "confidence": confidence,
            "reason": "Crop is identified as healthy; chemical application is discouraged."
        }

    # Simulation Logic for Disease Detection + Farmer Action
    if "spray" in action.lower():
        if rain_prob >= 70:
            return {
                "status": "simulated",
                "crop": crop,
                "disease": disease,
                "action": action,
                "weather_conditions": weather,
                "simulation_outcome": "High wash-off risk (~80% chemical waste) and potential soil runoff due to heavy rain.",
                "risk_level": "High Financial & Environmental Risk",
                "recommendation": "Postpone spraying until rainfall ceases and weather clears."
            }
        else:
            return {
                "status": "simulated",
                "crop": crop,
                "disease": disease,
                "action": action,
                "weather_conditions": weather,
                "simulation_outcome": "Optimal conditions for effective pesticide/fungicide application.",
                "risk_level": "Low Risk",
                "recommendation": "Proceed with recommended dosage application."
            }

    return {
        "status": "simulated",
        "crop": crop,
        "disease": disease,
        "action": action,
        "weather_conditions": weather,
        "simulation_outcome": "Standard monitoring path selected.",
        "risk_level": "Moderate Risk",
        "recommendation": "Regular observation recommended."
    }