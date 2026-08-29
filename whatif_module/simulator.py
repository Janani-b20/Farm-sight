"""
FarmSight - What-If Simulation Engine
Deterministic rule engine mapping Paddy ML labels to weather-aware agricultural simulations.
"""

def run_simulation(crop_info: dict, weather_info: dict, user_action: str) -> dict:
    disease = crop_info.get("disease", "").lower()
    crop = crop_info.get("crop", "paddy").lower()
    confidence = crop_info.get("confidence", 0.0)
    
    rain_prob = weather_info.get("rain_probability", 0)
    humidity = weather_info.get("humidity", 0)
    temp = weather_info.get("temperature", 30)

    # 1. Guardrail: Uncertain / Low Confidence Check
    if disease == "uncertain" or confidence < 50.0:
        return {
            "status": "halted",
            "condition": "uncertain",
            "recommended": False,
            "risk_level": "N/A",
            "reason": "நோய்க்கான அறிகுறியை துல்லியமாக கண்டறிய முடியவில்லை. தயவுசெய்து பயிரின் தெளிவான புதிய புகைப்படத்தை மீண்டும் பதிவேற்றவும்.",
            "action_selected": user_action
        }

    # 2. Guardrail: Normal / Healthy Crop Path
    if disease == "normal":
        if user_action in ["spray_chemical_now", "apply_fungicide", "spray_pesticide"]:
            return {
                "status": "completed",
                "condition": "healthy",
                "action_selected": user_action,
                "chemical_waste_percentage": "100%",
                "risk_level": "Medium (Unnecessary Cost)",
                "recommended": False,
                "reason": "பயிர் ஆரோக்கியமாக உள்ளது. தற்போது எந்தவித பூச்சிக்கொல்லி அல்லது ரசாயன தெளிப்பும் தேவையில்லை."
            }
        else:
            return {
                "status": "completed",
                "condition": "healthy",
                "action_selected": user_action,
                "risk_level": "Low",
                "recommended": True,
                "reason": "பயிர் ஆரோக்கியமாக உள்ளது. சீரான நீர்ப்பாசனம் மற்றும் பராமரிப்பை தொடரவும்."
            }

    # 3. Confirmed Disease Scenarios (bacterial_leaf_blight, blast, brown_spot, dead_heart, etc.)
    disease_display = disease.replace("_", " ").title()

    # Scenario A: Rain Forecast + Chemical Spray (Washout Risk)
    if user_action in ["spray_chemical_now", "apply_fungicide", "spray_pesticide"] and rain_prob > 50:
        return {
            "status": "completed",
            "condition": "disease_detected",
            "disease_name": disease_display,
            "action_selected": "Spray Chemical Now",
            "chemical_waste_percentage": "85%",
            "cost_loss_risk": "High",
            "risk_level": "High",
            "disease_worsening_risk": f"High ({disease_display} will persist and spread)",
            "recommended": False,
            "reason": "மழை பெய்ய வாய்ப்புள்ளதால் பூச்சிக்கொல்லி நீரில் அடித்துச் செல்லப்பட்டு வீணாகும். மருந்து தெளிப்பதை தள்ளிப்போடவும்."
        }

    # Scenario B: High Humidity + Nitrogen/Urea Fertilizer (Spore Explosion for Blast/Blight)
    elif user_action in ["apply_fertilizer_urea", "apply_nitrogen"] and humidity > 80:
        return {
            "status": "completed",
            "condition": "disease_detected",
            "disease_name": disease_display,
            "action_selected": "Apply Fertilizer (Urea)",
            "risk_level": "High",
            "disease_worsening_risk": f"Severe ({disease_display} spores thrive on quick nitrogen)",
            "recommended": False,
            "reason": "அதிக காற்றில் ஈரப்பதம் இருக்கும்போது யூரியா இடுவது நோய்த்தொற்றை பலமடங்கு தீவிரப்படுத்தும்."
        }

    # Scenario C: Rain Forecast + Irrigation (Overwatering & Root Leaching)
    elif user_action == "irrigate_now" and rain_prob > 60:
        return {
            "status": "completed",
            "condition": "disease_detected",
            "disease_name": disease_display,
            "action_selected": "Irrigate Today",
            "water_usage": "High (Wasted)",
            "risk_level": "High",
            "disease_worsening_risk": "High (Fungal root multiplication)",
            "recommended": False,
            "reason": "மழை எதிர்பார்க்கப்படுவதால் பாசனம் செய்வது வேரழுகல் மற்றும் பூஞ்சாண பரவலை உண்டாக்கும்."
        }

    # Scenario D: Delay Spray Strategy (Post-Rain Targeted Control)
    elif user_action == "delay_spray_2_days":
        return {
            "status": "completed",
            "condition": "disease_detected",
            "disease_name": disease_display,
            "action_selected": "Delay Spray by 2 Days",
            "chemical_waste_percentage": "0%",
            "cost_loss_risk": "Low",
            "risk_level": "Low",
            "disease_worsening_risk": f"Managed (Post-rain spray will cure {disease_display})",
            "recommended": True,
            "reason": "மழை நின்ற பிறகு மருந்து தெளிப்பது முழுப் பலனைத் தரும்."
        }

    # Scenario E: Standard Optimal Treatment
    else:
        return {
            "status": "completed",
            "condition": "disease_detected",
            "disease_name": disease_display,
            "action_selected": user_action,
            "risk_level": "Low",
            "disease_worsening_risk": f"Low ({disease_display} under control)",
            "recommended": True,
            "reason": "வானிலை சாதகமாக உள்ளது. திட்டமிட்டபடி பராமரிப்பு பணிகளை மேற்கொள்ளலாம்."
        }