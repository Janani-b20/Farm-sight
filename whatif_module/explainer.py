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
        "1. மழையின் காரணமாக பூச்சிக்கொல்லி மருந்து வீணாக வாய்ப்புள்ளது, எனவே தெளிப்பதை தள்ளிப்போடவும்.\n"
        "2. மழை நின்ற பிறகு வயலை ஆய்வு செய்து சரியான மருந்தினை தெளிக்கவும்."
    ),
    "en": (
        "1. High risk of chemical wash-off due to rain; postpone spraying.\n"
        "2. Inspect field after rainfall and apply recommended treatment under clear skies."
    ),
    "hi": (
        "1. बारिश के कारण कीटनाशक बहने का जोखिम है, कृपया छिड़काव स्थगित करें।\n"
        "2. बारिश रुकने के बाद खेत का निरीक्षण करें और मौसम साफ होने पर छिड़काव करें।"
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
    crop = sim_result.get('crop', 'பயிர்')
    disease = sim_result.get('disease', 'நோய்')
    action = sim_result.get('action', 'பரிந்துரைக்கப்பட்ட நடவடிக்கை')
    
    if lang == "ta":
        return f"1. {crop} பயிரில் {disease} பாதிப்பு கண்டறியப்பட்டுள்ளது. உடனடியாக உரிய பூஞ்சாண தடுப்பு மருந்தை தெளிக்கவும்.\n2. தற்போதைய வானிலை சூழலைக் கவனித்து {action} மேற்கொள்வது மகசூல் இழப்பை தடுக்கும்."
    elif lang == "hi":
        return f"1. {crop} फसल में {disease} के लक्षण हैं, तुरंत अनुशंसित कीटनाशक का छिड़काव करें।\n2. मौसम की स्थिति को ध्यान में रखकर ही उचित कदम उठाएं।"
    else:
        return f"1. {disease} detected in {crop}. Apply targeted agronomic treatment promptly.\n2. Monitor current weather conditions carefully before {action}."