import os
from dotenv import load_dotenv
from google import genai

load_dotenv()

def generate_farmer_explanation(simulation_result: dict, crop_name: str = "நெல்", weather_info: dict = None) -> str:
    # Handle halted condition (Uncertain disease)
    if simulation_result.get("status") == "halted":
        return simulation_result.get("reason", "பயிரின் புகைப்படத்தை மீண்டும் தெளிவாக பதிவேற்றவும்.")

    # Handle healthy crop path
    if simulation_result.get("condition") == "healthy":
        return f"பயிர் ஆரோக்கியமாக உள்ளது. {simulation_result.get('reason')}"

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        # Fallback if API key is missing
        return f"பரிந்துரை: {simulation_result.get('reason')}"

    prompt = f"""
    You are an expert Tamil Agricultural Advisor speaking directly to a rural farmer.
    
    Context Details:
    - Crop: {crop_name}
    - Simulation Result: {simulation_result}
    - Weather Information: {weather_info}

    CRITICAL RULES:
    1. Respond STRICTLY and ENTIRELY in pure Tamil script (தமிழ் எழுத்துகளில் மட்டும்).
    2. Do NOT use English words or Tanglish.
    3. Provide exactly 3 short bullet points:
       * தற்போதைய சூழல் மற்றும் ஆபத்து
       * விவசாயி செய்ய வேண்டிய உடனடி நடவடிக்கை
       * இதனால் கிடைக்கும் நேரடி பலன்
    4. Keep it natural and simple for audio speech.
    """

    try:
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )
        return response.text.strip()
    except Exception as e:
        # Graceful fallback if Gemini API fails
        print(f"[Gemini Fallback Warning]: {e}")
        return f"வானிலை எச்சரிக்கை: {simulation_result.get('reason')}"