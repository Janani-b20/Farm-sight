from whatif_module.simulator import simulate_decision

try:
    from whatif_module.explainer import generate_multilingual_advisory
except Exception:
    generate_multilingual_advisory = None


def execute_whatif_pipeline(
    ml_result: dict,
    weather_data: dict,
    language: str = "en"
) -> dict:
    """
    Runs the What-If simulation and generates a farmer-facing advisory.

    Audio generation is intentionally not handled here.
    The frontend/accessibility layer can decide when to request or play TTS.
    """

    farmer_action = ml_result.get(
        "farmer_proposed_action",
        "spray_chemical_now"
    )

    sim_result = simulate_decision(
        ml_prediction=ml_result,
        weather=weather_data,
        action=farmer_action
    )

    # Stop immediately for uncertain predictions.
    if sim_result.get("status") == "halted":
        messages = {
            "en": (
                "The disease prediction is uncertain. "
                "Please upload a clearer, well-lit crop image."
            ),
            "ta": (
                "நோய் கணிப்பு தெளிவாக இல்லை. "
                "தயவுசெய்து தெளிவான, நல்ல வெளிச்சம் உள்ள பயிர் படத்தை மீண்டும் பதிவேற்றவும்."
            ),
            "hi": (
                "रोग की पहचान निश्चित नहीं है। "
                "कृपया फसल की एक साफ और अच्छी रोशनी वाली तस्वीर दोबारा अपलोड करें।"
            )
        }

        return {
            "status": "halted",
            "simulation": sim_result,
            "advisory_text": messages.get(language, messages["en"]),
            "audio_file": None,
            "show_whatif": False
        }

    # No treatment simulation for healthy crop.
    if sim_result.get("status") == "healthy_crop":
        messages = {
            "en": (
                "The crop appears healthy. "
                "No disease-treatment simulation is required."
            ),
            "ta": (
                "பயிர் ஆரோக்கியமாக உள்ளது. "
                "நோய் சிகிச்சைக்கான What-If simulation தேவையில்லை."
            ),
            "hi": (
                "फसल स्वस्थ दिखाई दे रही है। "
                "रोग उपचार के लिए What-If simulation की आवश्यकता नहीं है।"
            )
        }

        return {
            "status": "healthy_crop",
            "simulation": sim_result,
            "advisory_text": messages.get(language, messages["en"]),
            "audio_file": None,
            "show_whatif": False
        }

    advisory_text = ""

    if generate_multilingual_advisory:
        try:
            advisory_text = generate_multilingual_advisory(
                simulation_data=sim_result,
                target_lang=language
            )
        except Exception:
            advisory_text = ""

    # Safe fallback if Gemini/explainer is unavailable.
    if not advisory_text:
        if language == "ta":
            advisory_text = (
                "கிடைக்கும் வானிலை தகவல் மற்றும் நோய் நிலையை அடிப்படையாகக் கொண்டு "
                "இந்த What-If முடிவு உருவாக்கப்பட்டுள்ளது. "
                "சிகிச்சையை செய்வதற்கு முன் பரிந்துரைக்கப்பட்ட வழிமுறைகளைப் பின்பற்றவும்."
            )

        elif language == "hi":
            advisory_text = (
                "यह What-If परिणाम उपलब्ध मौसम और रोग की जानकारी पर आधारित है। "
                "उपचार करने से पहले सुझाए गए निर्देशों का पालन करें।"
            )

        else:
            advisory_text = (
                "This What-If result is based on the available disease and "
                "weather context. Follow the recommended treatment guidance "
                "before taking action."
            )

    return {
        "status": "success",
        "simulation": sim_result,
        "advisory_text": advisory_text,
        "audio_file": None,
        "show_whatif": True
    }