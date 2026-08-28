import os
from google import genai

API_KEY = os.environ.get("GEMINI_API_KEY", "YOUR_GEMINI_API_KEY")

client = genai.Client(api_key=API_KEY)

def generate_farmer_explanation(simulation_result, crop_name="நெல் (Paddy)", language="Tamil"):
    """
    Translates rule engine output into farmer-friendly conversational advice in Tamil.
    """
    prompt = f"""
You are an empathetic agricultural advisor talking directly to an Indian farmer.

Data:
- Crop: {crop_name}
- Action: {simulation_result.get('action_selected')}
- Recommended: {simulation_result.get('recommended')}
- Water Impact: {simulation_result.get('water_usage')}
- Risk Factor: {simulation_result.get('disease_worsening_risk')}
- Reason: {simulation_result.get('reason')}

Instruction:
Explain the outcome clearly to the farmer strictly in Tamil script (தமிழ் எழுத்துக்களில் மட்டும்).
Format with these 3 bullet points:
1. நேரடி பரிந்துரை (Direct recommendation)
2. முக்கிய ஆபத்து (Primary risk / consequence)
3. மாற்று யோசனை (Helpful alternative action)

Keep the tone supportive, direct, and respectful. Do not use English words in the explanation.
"""

    try:
        response = client.models.generate_content(
            model="gemini-3.6-flash",
            contents=prompt,
        )
        return response.text
    except Exception as e:
        return f"பரிந்துரை: {simulation_result.get('reason')}"