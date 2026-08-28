import sys
import tensorflow as tf

from .predictor import (
    load_paddy_model,
    predict_paddy_image,
)

def test_prediction(image_path):
    print("Loading Paddy disease model...")
    model = load_paddy_model()
    print("Model loaded successfully.")

    image = tf.io.read_file(image_path)
    image = tf.io.decode_image(
        image,
        channels=3,
        expand_animations=False
    )

    result = predict_paddy_image(model, image)

    print("\nPrediction Result")
    print("-----------------")
    print(f"Crop       : {result['crop']}")
    print(f"Disease    : {result['disease']}")
    print(f"Confidence : {result['confidence']}%")
    print(f"Message    : {result.get('message', '')}")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage:")
        print("python -m src.disease_ml.paddy.test_prediction <image_path>")
        sys.exit(1)

    test_prediction(sys.argv[1])