from src.schemas import MLPredictionInput

# Downstream safety threshold.
# The ML models can already mark predictions as "uncertain"
# using their own crop-specific confidence thresholds.
CONFIDENCE_THRESHOLD = 60.0

# Healthy/no-disease labels
NORMAL_LABELS = {"normal", "healthy", "no_disease", "none"}

# Labels already marked uncertain by the ML prediction layer
UNCERTAIN_LABELS = {"uncertain", "low_confidence"}


def evaluate_prediction(prediction: MLPredictionInput) -> dict:
    """
    Central guardrail decision point.
    Everything downstream (RAG, What-If, frontend messaging)
    branches from this result.
    """

    disease_label = prediction.disease.strip().lower()

    # 1. Respect uncertainty already decided by the ML model.
    if disease_label in UNCERTAIN_LABELS:
        return {
            "status": "uncertain",
            "trigger_rag": False,
            "show_whatif": False,
            "message": (
                prediction.message
                or "Prediction is uncertain. Please upload a clearer, well-lit image."
            ),
        }

    # 2. Additional safety guardrail for very low-confidence predictions.
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

    # 3. Healthy crop — no RAG or What-If needed.
    if disease_label in NORMAL_LABELS:
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

    # 4. Disease detected — continue to RAG + Gemini + What-If.
    return {
        "status": "disease_detected",
        "trigger_rag": True,
        "show_whatif": True,
        "message": None,
    }