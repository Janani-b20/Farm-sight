import json
import numpy as np
import tensorflow as tf
from pathlib import Path

from .preprocessing import preprocess_image, check_image_quality


BASE_DIR = Path(__file__).parent

MODEL_PATH = BASE_DIR / "models" / "paddy_disease_model.keras"
CLASS_NAMES_PATH = BASE_DIR / "models" / "paddy_class_names.json"


def load_class_names():
    """
    Load Paddy disease class names in the same order
    used during model training.
    """
    with open(CLASS_NAMES_PATH, "r") as f:
        return json.load(f)


def load_paddy_model(model_path=MODEL_PATH):
    """
    Load the trained EfficientNetB0 Paddy disease model.
    """
    return tf.keras.models.load_model(model_path)


def predict_paddy_image(model, image):
    """
    Check image quality and predict Paddy disease.
    """

    # 1. Image quality check
    is_valid, message = check_image_quality(image)

    if not is_valid:
        return {
            "crop": "paddy",
            "disease": "uncertain",
            "confidence": 0.0,
            "message": message,
        }

    # 2. Load class names
    class_names = load_class_names()

    # 3. Preprocess image
    image = preprocess_image(image)
    image = tf.expand_dims(image, axis=0)

    # 4. Predict
    predictions = model.predict(image, verbose=0)

    predicted_index = int(np.argmax(predictions[0]))
    confidence = float(np.max(predictions[0]) * 100)

    disease_name = class_names[predicted_index]

    # 5. Low-confidence protection
    if confidence < 60:
        return {
            "crop": "paddy",
            "disease": "uncertain",
            "confidence": round(confidence, 2),
            "message": (
                "Disease could not be identified confidently. "
                "Please upload another clear image showing the affected area."
            ),
        }

    # 6. Successful prediction
    return {
        "crop": "paddy",
        "disease": disease_name,
        "confidence": round(confidence, 2),
        "message": "Prediction successful.",
    }