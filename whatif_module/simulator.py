"""
FarmSight - Deterministic Agro-Climatic What-If Simulation Engine
"""

ACTION_ALIASES = {
    "wait_weather": "wait_for_better_weather",
    "wait_for_better_weather": "wait_for_better_weather",
    "wait": "wait_for_better_weather",
    "delay": "wait_for_better_weather",

    "treat_now": "spray_chemical_now",
    "spray_immediately": "spray_chemical_now",
    "spray_chemical_now": "spray_chemical_now",
    "spray": "spray_chemical_now",
    "chemical": "spray_chemical_now",

    "use_bio_control": "bio_control",
    "bio_control": "bio_control",
    "bio": "bio_control",

    "monitor": "monitor_first",
    "monitor_first": "monitor_first",
    "observe": "monitor_first",
}


def simulate_decision(
    ml_prediction: dict,
    weather: dict,
    action: str = "spray_chemical_now"
) -> dict:
    """
    Simulates estimated outcomes for a farmer action using
    disease status and available weather context.
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

    # Guardrail 1: Trust ML uncertainty decision.
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

    # Guardrail 2: Healthy crops should not receive treatment simulation.
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

    # Normalize action ID before scenario branching
    raw_action = str(action).strip().lower()
    canonical_action = ACTION_ALIASES.get(raw_action, raw_action)

    # -------------------------------------------------------------
    # 1. WAIT FOR BETTER WEATHER
    # -------------------------------------------------------------
    if canonical_action == "wait_for_better_weather":
        is_rainy = rain_prob is not None and rain_prob >= 60
        return {
            "status": "simulated",
            "crop": crop,
            "disease": disease,
            "confidence": confidence,
            "action": canonical_action,
            "weather_conditions": weather,
            "simulation_outcome": (
                "Delaying chemical application avoids treatment wash-off during rain, "
                "but requires daily field inspection to prevent unchecked pathogen spread."
            ),
            "risk_level": "Lower Wash-Off Risk" if is_rainy else "Moderate Delay Risk",
            "recommendation": (
                "Delay treatment until rain subsides; re-evaluate crop health under clear weather."
            ),
            "yield_protection": "75% - 85% (Estimated)",
            "cost_impact": "Low Initial Cost (₹0 now)",
            "estimate_notice": (
                "This is an estimated scenario based on weather context, not a guaranteed outcome."
            ),
            "show_whatif": True
        }

    # -------------------------------------------------------------
    # 2. BIO-CONTROL
    # -------------------------------------------------------------
    if canonical_action == "bio_control":
        return {
            "status": "simulated",
            "crop": crop,
            "disease": disease,
            "confidence": confidence,
            "action": canonical_action,
            "weather_conditions": weather,
            "simulation_outcome": (
                "Biological intervention (botanical extracts or bio-fungicides like Neem oil / Trichoderma) "
                "provides sustainable disease control with zero chemical residue risk."
            ),
            "risk_level": "Low Environmental Risk",
            "recommendation": (
                "Apply bio-control agent during cool morning or evening hours for optimal biological activity."
            ),
            "yield_protection": "80% - 88% (Estimated)",
            "cost_impact": "Moderate Cost (₹400 - ₹800)",
            "estimate_notice": (
                "This is an estimated scenario based on biological control rules."
            ),
            "show_whatif": True
        }

    # -------------------------------------------------------------
    # 3. MONITOR FIRST
    # -------------------------------------------------------------
    if canonical_action == "monitor_first":
        return {
            "status": "simulated",
            "crop": crop,
            "disease": disease,
            "confidence": confidence,
            "action": canonical_action,
            "weather_conditions": weather,
            "simulation_outcome": (
                "Daily field monitoring tracks disease progression for 3–5 days "
                "before committing financial capital to chemical or organic treatments."
            ),
            "risk_level": "Moderate Progression Risk",
            "recommendation": (
                "Observe leaf symptoms daily. Prepare treatment if disease severity increases beyond 5% of canopy."
            ),
            "yield_protection": "60% - 75% (Estimated)",
            "cost_impact": "Zero Immediate Cost (₹0)",
            "estimate_notice": (
                "This is an estimated scenario for monitoring workflows."
            ),
            "show_whatif": True
        }

    # -------------------------------------------------------------
    # 4. SPRAY CHEMICAL NOW (TREAT NOW)
    # -------------------------------------------------------------
    if canonical_action == "spray_chemical_now":
        if rain_prob is None:
            return {
                "status": "simulated",
                "crop": crop,
                "disease": disease,
                "confidence": confidence,
                "action": canonical_action,
                "weather_conditions": weather,
                "simulation_outcome": (
                    "Rainfall probability is unavailable, so spray timing "
                    "cannot be evaluated reliably."
                ),
                "risk_level": "Weather Data Unavailable",
                "recommendation": (
                    "Check current weather conditions before applying chemical treatment."
                ),
                "yield_protection": "85% - 90% (Estimated)",
                "cost_impact": "Higher Initial Cost (₹800 - ₹1500)",
                "estimate_notice": (
                    "This is an estimated scenario based on available weather context."
                ),
                "show_whatif": True
            }

        if rain_prob >= 70:
            return {
                "status": "simulated",
                "crop": crop,
                "disease": disease,
                "confidence": confidence,
                "action": canonical_action,
                "weather_conditions": weather,
                "simulation_outcome": (
                    "High rainfall probability (>70%) increases chemical wash-off "
                    "and runoff risk, significantly reducing treatment efficacy."
                ),
                "risk_level": "High Weather-Related Risk",
                "recommendation": (
                    "Consider delaying spraying until rainfall risk reduces below 60%."
                ),
                "yield_protection": "60% - 70% (Estimated due to wash-off)",
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
            "action": canonical_action,
            "weather_conditions": weather,
            "simulation_outcome": (
                "Immediate targeted chemical application halts active pathogen spread "
                "with high control efficiency under suitable weather conditions."
            ),
            "risk_level": "Lower Weather-Related Risk",
            "recommendation": (
                "Apply recommended chemical treatment promptly under dry weather conditions."
            ),
            "yield_protection": "90% - 95% (Estimated)",
            "cost_impact": "Higher Initial Cost (₹800 - ₹1500)",
            "estimate_notice": (
                "This is an estimated scenario based on available weather context."
            ),
            "show_whatif": True
        }

    # Truly unknown action fallback
    return {
        "status": "simulated",
        "crop": crop,
        "disease": disease,
        "confidence": confidence,
        "action": canonical_action,
        "weather_conditions": weather,
        "simulation_outcome": (
            f"The action '{action}' was evaluated. Continue monitoring the crop and follow general agricultural advice."
        ),
        "risk_level": "Standard Monitoring Risk",
        "recommendation": (
            "Monitor crop symptoms and consult local extension officers."
        ),
        "yield_protection": "70% - 80% (Estimated)",
        "cost_impact": "Variable Cost",
        "estimate_notice": (
            "This is a general decision-support estimate for an unmapped action."
        ),
        "show_whatif": True
    }