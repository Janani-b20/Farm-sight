from src.disease_ml.paddy.predictor import (
    load_paddy_model,
    predict_paddy_image,
)

_paddy_model = None


def predict_disease(crop, image):
    """
    Common Disease ML router.

    Args:
        crop (str): paddy, cotton, or groundnut
        image: RGB image tensor

    Returns:
        dict:
        {
            "crop": "...",
            "disease": "...",
            "confidence": ...,
            "message": "..."
        }
    """

    global _paddy_model

    crop = crop.strip().lower()

    if crop == "paddy":
        if _paddy_model is None:
            _paddy_model = load_paddy_model()

        return predict_paddy_image(_paddy_model, image)

    if crop == "cotton":
        return {
            "crop": "cotton",
            "disease": "unavailable",
            "confidence": 0.0,
            "message": "Cotton disease model is not integrated yet.",
        }

    if crop == "groundnut":
        return {
            "crop": "groundnut",
            "disease": "unavailable",
            "confidence": 0.0,
            "message": "Groundnut disease model is not integrated yet.",
        }

    return {
        "crop": crop,
        "disease": "unsupported",
        "confidence": 0.0,
        "message": "Unsupported crop. Please select paddy, cotton, or groundnut.",
    }