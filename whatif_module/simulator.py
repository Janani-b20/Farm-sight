def run_simulation(crop_info, weather_info, user_action):
    """
    Deterministic multi-scenario rule engine for paddy farming decisions.
    """
    rain_prob = weather_info.get("rain_probability", 0)
    humidity = weather_info.get("humidity", 0)
    temp = weather_info.get("temperature", 30)
    moisture = weather_info.get("soil_moisture", 50)
    disease = crop_info.get("disease", "None")

    result = {}

    # Scenario 1: Rain Forecast + Irrigation (Overwatering Risk)
    if user_action == "irrigate_now" and rain_prob > 60:
        result = {
            "action_selected": "Irrigate Today",
            "water_usage": "High (Wasted)",
            "risk_level": "High",
            "disease_worsening_risk": "High (Blight / Fungal Spread)",
            "recommended": False,
            "reason": "Rainfall is expected soon. Irrigating now causes waterlogging and fungal spread."
        }

    # Scenario 2: Severe Dryness + Skipping Irrigation (Drought Stress)
    elif user_action == "skip_irrigation" and (moisture < 35 or temp > 36):
        result = {
            "action_selected": "Skip Irrigation",
            "water_usage": "Zero (Deficit)",
            "risk_level": "Critical",
            "disease_worsening_risk": "Crop Wilting & Stress",
            "recommended": False,
            "reason": "Soil moisture is very low and temperature is high. Skipping irrigation will cause crop damage."
        }

    # Scenario 3: High Humidity/Rain + Urea Fertilizer (Washout & Pest Risk)
    elif user_action == "apply_fertilizer" and (rain_prob > 50 or humidity > 80):
        result = {
            "action_selected": "Apply Fertilizer (Urea)",
            "water_usage": "N/A",
            "risk_level": "High",
            "disease_worsening_risk": "Pest Explosion (Stem Borer / Leaf Blast)",
            "recommended": False,
            "reason": "High humidity or rain will wash away fertilizer and accelerate pest and fungal attacks."
        }

    # Scenario 4: Optimal Conditions (Safe Action)
    else:
        result = {
            "action_selected": user_action,
            "water_usage": "Optimal",
            "risk_level": "Low",
            "disease_worsening_risk": "Low",
            "recommended": True,
            "reason": "Weather and soil conditions are stable for this action."
        }

    return result