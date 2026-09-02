"""
FarmSight - Deterministic Agro-Climatic What-If Simulation Engine
"""


def simulate_decision(
    ml_prediction: dict,
    weather: dict,
    action: str = "spray_chemical_now"
) -> dict:
    """
    Simulates estimated outcomes for a farmer action using
    disease status and available weather context.

    The ML layer is responsible for deciding whether a
    prediction is uncertain. This simulator does not apply
    another confidence threshold.
    """

    crop = str(ml_prediction.get("crop", "unknown")).lower()
    disease = str(ml_prediction.get("disease", "")).strip().lower()
    confidence = float(ml_prediction.get("confidence", 0.0))

    # Support either weather field naming style.
    rain_prob = weather.get(
        "rain_probability",
        weather.get("rain_prob")
    )

    try:
        rain_prob = float(rain_prob) if rain_prob is not None else None
    except (TypeError, ValueError):
        rain_prob = None

    # Guardrail 1:
    # Trust the disease ML pipeline's explicit uncertainty result.
    if disease in {"uncertain", "low_confidence"}:
        return {
            "status": "halted",
            "crop": crop,
            "disease": disease,
            "confidence": confidence,
            "reason": (
                ml_prediction.get("message")
                or "Prediction is uncertain. Please upload a clearer crop image."
            ),
            "show_whatif": False
        }

    # Guardrail 2:
    # Healthy crops should not receive unnecessary treatment simulation.
    if disease in {"normal", "healthy", "no_disease", "none"}:
        return {
            "status": "healthy_crop",
            "crop": crop,
            "disease": disease,
            "confidence": confidence,
            "reason": (
                "Crop is identified as healthy. Disease-treatment simulation "
                "is not required."
            ),
            "show_whatif": False
        }

    # Disease was detected, so What-If is available.
    action_lower = str(action).lower()

    # Spray-related action
    if "spray" in action_lower:
        if rain_prob is None:
            return {
                "status": "simulated",
                "crop": crop,
                "disease": disease,
                "confidence": confidence,
                "action": action,
                "weather_conditions": weather,
                "simulation_outcome": (
                    "Rainfall probability is unavailable, so spray timing "
                    "cannot be evaluated reliably."
                ),
                "risk_level": "Weather Data Unavailable",
                "recommendation": (
                    "Check current weather conditions before applying the "
                    "recommended treatment."
                ),
                "estimate_notice": (
                    "This is a decision-support estimate, not a guaranteed "
                    "agronomic outcome."
                ),
                "show_whatif": True
            }

        if rain_prob >= 70:
            return {
                "status": "simulated",
                "crop": crop,
                "disease": disease,
                "confidence": confidence,
                "action": action,
                "weather_conditions": weather,
                "simulation_outcome": (
                    "High rainfall probability may reduce treatment "
                    "effectiveness through wash-off and runoff."
                ),
                "risk_level": "High Weather-Related Risk",
                "recommendation": (
                    "Consider delaying spraying until rainfall risk reduces, "
                    "while following the recommended disease-management advice."
                ),
                "estimate_notice": (
                    "This is an estimated scenario based on available weather "
                    "context, not a guaranteed field outcome."
                ),
                "show_whatif": True
            }

        return {
            "status": "simulated",
            "crop": crop,
            "disease": disease,
            "confidence": confidence,
            "action": action,
            "weather_conditions": weather,
            "simulation_outcome": (
                "Current rainfall probability indicates comparatively lower "
                "wash-off risk for the proposed treatment."
            ),
            "risk_level": "Lower Weather-Related Risk",
            "recommendation": (
                "The proposed timing may be suitable, provided the farmer "
                "follows the recommended treatment instructions."
            ),
            "estimate_notice": (
                "This is an estimated scenario based on available weather "
                "context, not a guaranteed field outcome."
            ),
            "show_whatif": True
        }

    # Non-spray action
    return {
        "status": "simulated",
        "crop": crop,
        "disease": disease,
        "confidence": confidence,
        "action": action,
        "weather_conditions": weather,
        "simulation_outcome": (
            "The selected action follows the standard monitoring "
            "decision-support path."
        ),
        "risk_level": "Context Dependent",
        "recommendation": (
            "Continue monitoring the crop and follow the disease advisory."
        ),
        "estimate_notice": (
            "This is a decision-support estimate, not a guaranteed agronomic "
            "outcome."
        ),
        "show_whatif": True
    }