from src.disease_ml.paddy.predictor import (
    load_paddy_model,
    predict_paddy_image,
)

from src.disease_ml.cotton.predictor import (
    load_cotton_model,
    predict_cotton_image,
)

from src.disease_ml.groundnut.predictor import (
    load_groundnut_model,
    predict_groundnut_image,
)


_paddy_model = None
_cotton_model = None
_groundnut_model = None


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
    global _cotton_model
    global _groundnut_model

    crop = crop.strip().lower()

    if crop == "paddy":
        if _paddy_model is None:
            _paddy_model = load_paddy_model()

        return predict_paddy_image(
            _paddy_model,
            image
        )

    if crop == "cotton":
        if _cotton_model is None:
            _cotton_model = load_cotton_model()

        return predict_cotton_image(
            _cotton_model,
            image
        )

    if crop == "groundnut":
        if _groundnut_model is None:
            _groundnut_model = load_groundnut_model()

        return predict_groundnut_image(
            _groundnut_model,
            image
        )

    return {
        "crop": crop,
        "disease": "unsupported",
        "confidence": 0.0,
        "message": (
            "Unsupported crop. "
            "Please select paddy, cotton, or groundnut."
        ),
    }