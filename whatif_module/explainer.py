"""
FarmSight - Multilingual AI Advisory Engine with Fallbacks
Supports: Tamil (ta), English (en), Hindi (hi)
"""
import os
from dotenv import load_dotenv
from google import genai

load_dotenv()

FALLBACK_MESSAGES = {
    "ta": (
        "1. à®®à®´à¯ˆà®¯à®¿à®©à¯ à®•à®¾à®°à®£à®®à®¾à®• à®ªà¯‚à®šà¯à®šà®¿à®•à¯à®•à¯Šà®²à¯à®²à®¿ à®®à®°à¯à®¨à¯à®¤à¯ à®µà¯€à®£à®¾à®• à®µà®¾à®¯à¯à®ªà¯à®ªà¯à®³à¯à®³à®¤à¯, à®Žà®©à®µà¯‡ à®¤à¯†à®³à®¿à®ªà¯à®ªà®¤à¯ˆ à®¤à®³à¯à®³à®¿à®ªà¯à®ªà¯‹à®Ÿà®µà¯à®®à¯.\n"
        "2. à®®à®´à¯ˆ à®¨à®¿à®©à¯à®± à®ªà®¿à®±à®•à¯ à®µà®¯à®²à¯ˆ à®†à®¯à¯à®µà¯ à®šà¯†à®¯à¯à®¤à¯ à®šà®°à®¿à®¯à®¾à®© à®®à®°à¯à®¨à¯à®¤à®¿à®©à¯ˆ à®¤à¯†à®³à®¿à®•à¯à®•à®µà¯à®®à¯."
    ),
    "en": (
        "1. High risk of chemical wash-off due to rain; postpone spraying.\n"
        "2. Inspect field after rainfall and apply recommended treatment under clear skies."
    ),
    "hi": (
        "1. à¤¬à¤¾à¤°à¤¿à¤¶ à¤•à¥‡ à¤•à¤¾à¤°à¤£ à¤•à¥€à¤Ÿà¤¨à¤¾à¤¶à¤• à¤¬à¤¹à¤¨à¥‡ à¤•à¤¾ à¤œà¥‹à¤–à¤¿à¤® à¤¹à¥ˆ, à¤•à¥ƒà¤ªà¤¯à¤¾ à¤›à¤¿à¤¡à¤¼à¤•à¤¾à¤µ à¤¸à¥à¤¥à¤—à¤¿à¤¤ à¤•à¤°à¥‡à¤‚à¥¤\n"
        "2. à¤¬à¤¾à¤°à¤¿à¤¶ à¤°à¥à¤•à¤¨à¥‡ à¤•à¥‡ à¤¬à¤¾à¤¦ à¤–à¥‡à¤¤ à¤•à¤¾ à¤¨à¤¿à¤°à¥€à¤•à¥à¤·à¤£ à¤•à¤°à¥‡à¤‚ à¤”à¤° à¤®à¥Œà¤¸à¤® à¤¸à¤¾à¤« à¤¹à¥‹à¤¨à¥‡ à¤ªà¤° à¤›à¤¿à¤¡à¤¼à¤•à¤¾à¤µ à¤•à¤°à¥‡à¤‚à¥¤"
    )
}

LANGUAGE_PROMPTS = {
    "ta": "Explain in simple, conversational Tamil for rural farmers using 2 short bullet points.",
    "en": "Explain in simple, clear English using 2 short bullet points for farmers.",
    "hi": "Explain in simple, conversational Hindi (Devanagari script) using 2 short bullet points for farmers."
}

def generate_tamil_advisory(sim_result: dict, language: str = "ta") -> str:
    """
    Generates localized plain-language advisory using Gemini.
    Language code: 'ta' (Tamil), 'en' (English), 'hi' (Hindi).
    """
    api_key = os.getenv("GEMINI_API_KEY")
    lang = language.lower() if language.lower() in FALLBACK_MESSAGES else "ta"

    if not api_key:
        return FALLBACK_MESSAGES[lang]

    try:
        client = genai.Client(api_key=api_key)
        instruction = LANGUAGE_PROMPTS[lang]

        prompt = f"""
You are an agricultural advisor assistant for the FarmSight app.
Language Instruction: {instruction}

Simulation Data:
- Crop: {sim_result.get('crop')}
- Detected Condition: {sim_result.get('disease')}
- Action Planned: {sim_result.get('action')}
- Weather Risk Factor: Rain {sim_result.get('weather_conditions', {}).get('rain_probability')}%
- Simulation Outcome: {sim_result.get('simulation_outcome')}
- Financial / Yield Risk: {sim_result.get('risk_level')}

Provide only the 2 actionable bullet points without any introductory or markdown heading text.
"""
        response = client.models.generate_content(
          model="gemini-3.6-flash",
            contents=prompt,
        )
        if response and response.text:
            return response.text.strip()
    except Exception as e:
        print(f"[Notice] Gemini call switched to rule-based fallback: {e}")

    # Smart agronomy fallback based on simulation inputs
    outcome = sim_result.get("simulation_outcome", "")
    recommendation = sim_result.get("recommendation", "")

    if outcome and recommendation:
        return f"1. {outcome}\n2. {recommendation}"

    crop = sim_result.get('crop', 'crop')
    disease = sim_result.get('disease', 'condition')
    action = sim_result.get('action', 'action')

    if lang == "ta":
        return f"1. {crop} பயிரில் {disease} பாதிப்பு கவனிக்கப்பட்டுள்ளது.\n2. தற்போதைய வானிலை சூழலை கவனித்து {action} மேற்கொள்ளவும்."
    elif lang == "hi":
        return f"1. {crop} फसल में {disease} के लक्षण हैं।\n2. मौसम की स्थिति को ध्यान में रखकर ही निर्णय लें।"
    else:
        return f"1. {disease} detected in {crop}.\n2. Monitor current weather conditions before {action}."
