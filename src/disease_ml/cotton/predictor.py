import json
import numpy as np
import tensorflow as tf
from pathlib import Path

BASE_DIR = Path(__file__).parent

MODEL_PATH = BASE_DIR / "models" / "cotton_disease_model.keras"
CLASS_NAMES_PATH = BASE_DIR / "models" / "cotton_classes.json"

CONFIDENCE_THRESHOLD = 70.0


def load_class_names():
    with open(CLASS_NAMES_PATH, "r") as f:
        return json.load(f)


def load_cotton_model():
    return tf.keras.models.load_model(MODEL_PATH)


def normalize_disease_name(name):
    name = name.lower().replace(" ", "_")

    if name in ["healthy", "healthy_leaf", "normal"]:
        return "normal"

    return name


def predict_cotton_image(model, image):
    class_names = load_class_names()

    image = tf.image.resize(image, (224, 224))
    image = tf.cast(image, tf.float32)
    image = tf.expand_dims(image, axis=0)

    predictions = model.predict(image, verbose=0)[0]

    predicted_index = int(np.argmax(predictions))
    confidence = float(predictions[predicted_index] * 100)

    if confidence < CONFIDENCE_THRESHOLD:
        return {
            "crop": "cotton",
            "disease": "uncertain",
            "confidence": round(confidence, 2),
            "message": "Low-confidence prediction. Please reupload a clearer image.",
        }

    return {
        "crop": "cotton",
        "disease": normalize_disease_name(class_names[predicted_index]),
        "confidence": round(confidence, 2),
        "message": "Prediction successful.",
    }