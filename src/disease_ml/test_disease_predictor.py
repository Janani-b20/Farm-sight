import sys
import tensorflow as tf

from src.disease_ml.disease_predictor import predict_disease


def test_prediction(crop, image_path):
    print(f"\nTesting Disease ML Router")
    print("-------------------------")
    print(f"Crop  : {crop}")
    print(f"Image : {image_path}")

    image = tf.io.read_file(image_path)
    image = tf.io.decode_image(
        image,
        channels=3,
        expand_animations=False
    )

    result = predict_disease(crop, image)

    print("\nPrediction Result")
    print("-----------------")
    print(f"Crop       : {result['crop']}")
    print(f"Disease    : {result['disease']}")
    print(f"Confidence : {result['confidence']}%")
    print(f"Message    : {result['message']}")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(
            "Usage: python -m src.disease_ml.test_disease_predictor "
            "<crop> <image_path>"
        )
        sys.exit(1)

    test_prediction(sys.argv[1], sys.argv[2])