from src.schemas import MLPredictionInput

# Adjustable threshold — tune this once you see real .keras model confidence
# distributions. 60 is a reasonable starting point for a first pass.
CONFIDENCE_THRESHOLD = 60.0

# Labels your model might emit for a healthy/no-disease prediction.
# Add more variants here once you know your model's exact class names.
NORMAL_LABELS = {"normal", "healthy", "no_disease", "none"}


def evaluate_prediction(prediction: MLPredictionInput) -> dict:
    """
    Central guardrail decision point. Everything downstream (RAG trigger,
    What-If module visibility, frontend messaging) branches off this.
    """

    # 1. Low-confidence guardrail — stop pipeline, ask for re-upload.
    #    This must be checked FIRST, before looking at the disease label,
    #    because a low-confidence "normal" prediction is just as unreliable
    #    as a low-confidence disease prediction.
    if prediction.confidence < CONFIDENCE_THRESHOLD:
        return {
            "status": "uncertain",
            "trigger_rag": False,
            "show_whatif": False,
            "message": (
                f"Confidence too low ({prediction.confidence:.1f}%) to give a reliable diagnosis. "
                "Please re-upload a clearer, well-lit photo of the affected crop area."
            ),
        }

    # 2. Healthy-crop guardrail — no disease treatment needed, no RAG call.
    if prediction.disease.strip().lower() in NORMAL_LABELS:
        return {
            "status": "normal",
            "trigger_rag": False,
            "show_whatif": False,
            "message": (
                f"Good news! Your {prediction.crop} crop looks healthy "
                f"(confidence: {prediction.confidence:.1f}%). No disease detected — "
                "continue regular monitoring and standard agronomic practices."
            ),
        }

    # 3. Disease detected with acceptable confidence — proceed to RAG + Gemini.
    return {
        "status": "disease_detected",
        "trigger_rag": True,
        "show_whatif": True,
        "message": None,  # filled in by the RAG pipeline
    }