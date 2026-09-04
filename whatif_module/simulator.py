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

    # Action-specific simulation branches
    if "wait" in action_lower or "delay" in action_lower:
        is_rainy = rain_prob is not None and rain_prob >= 60
        return {
            "status": "simulated",
            "crop": crop,
            "disease": disease,
            "confidence": confidence,
            "action": action,
            "weather_conditions": weather,
            "simulation_outcome": (
                "Delaying chemical application avoids treatment wash-off during rain, "
                "but requires daily field inspection to prevent unchecked pathogen spread."
            ),
            "risk_level": "Lower Wash-Off Risk" if is_rainy else "Moderate Delay Risk",
            "recommendation": (
                "Delay treatment until rain subsides; re-evaluate crop health under clear weather."
            ),
            "yield_protection": "75% - 85%",
            "cost_impact": "Low Initial Cost (₹0 now)",
            "estimate_notice": (
                "This is a decision-support estimate based on current weather context."
            ),
            "show_whatif": True
        }

    if "bio" in action_lower:
        return {
            "status": "simulated",
            "crop": crop,
            "disease": disease,
            "confidence": confidence,
            "action": action,
            "weather_conditions": weather,
            "simulation_outcome": (
                "Biological intervention (botanical extracts or bio-fungicides like Neem oil / Trichoderma) "
                "provides sustainable disease control with zero chemical residue risk."
            ),
            "risk_level": "Low Environmental Risk",
            "recommendation": (
                "Apply bio-control agent during cool morning or evening hours for optimal biological activity."
            ),
            "yield_protection": "80% - 88%",
            "cost_impact": "Moderate Cost (₹400 - ₹800)",
            "estimate_notice": (
                "This is a decision-support estimate based on biological control rules."
            ),
            "show_whatif": True
        }

    if "monitor" in action_lower or "observe" in action_lower:
        return {
            "status": "simulated",
            "crop": crop,
            "disease": disease,
            "confidence": confidence,
            "action": action,
            "weather_conditions": weather,
            "simulation_outcome": (
                "Daily field monitoring tracks disease progression for 3–5 days "
                "before committing financial capital to chemical or organic treatments."
            ),
            "risk_level": "Moderate Progression Risk",
            "recommendation": (
                "Observe leaf symptoms daily. Prepare treatment if disease severity increases beyond 5% of canopy."
            ),
            "yield_protection": "60% - 75%",
            "cost_impact": "Zero Cost (₹0)",
            "estimate_notice": (
                "This is a decision-support estimate for monitoring workflows."
            ),
            "show_whatif": True
        }

    # Default / Spray-related action
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
                "Check current weather conditions before applying chemical treatment."
            ),
            "yield_protection": "85% - 90%",
            "cost_impact": "Higher Initial Cost (₹800 - ₹1500)",
            "estimate_notice": (
                "This is a decision-support estimate, not a guaranteed agronomic outcome."
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
                "High rainfall probability (>70%) increases chemical wash-off "
                "and runoff risk, significantly reducing treatment efficacy."
            ),
            "risk_level": "High Weather-Related Risk",
            "recommendation": (
                "Consider delaying spraying until rainfall risk reduces below 60%."
            ),
            "yield_protection": "60% - 70% (due to wash-off)",
            "cost_impact": "Higher Initial Cost (₹800 - ₹1500)",
            "estimate_notice": (
                "This is an estimated scenario based on available weather context."
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
            "Immediate targeted chemical application halts active pathogen spread "
            "with high control efficiency under suitable weather conditions."
        ),
        "risk_level": "Lower Weather-Related Risk",
        "recommendation": (
            "Apply recommended chemical treatment promptly under dry weather conditions."
        ),
        "yield_protection": "90% - 95%",
        "cost_impact": "Higher Initial Cost (₹800 - ₹1500)",
        "estimate_notice": (
            "This is an estimated scenario based on available weather context."
        ),
        "show_whatif": True
    }