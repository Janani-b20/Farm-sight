import tensorflow as tf

IMG_SIZE = (224, 224)

def preprocess_image(image):
    image = tf.image.resize(image, IMG_SIZE)
    image = tf.cast(image, tf.float32)
    return image


def check_image_quality(image):
    """
    Basic image-quality validation.
    Returns:
        (is_valid, message)
    """

    image = tf.cast(image, tf.float32)

    # Check brightness
    brightness = tf.reduce_mean(image).numpy()

    if brightness < 35:
        return False, "Image is too dark. Please retake or upload a brighter image."

    if brightness > 225:
        return False, "Image is too bright. Please retake or upload a clearer image."

    # Check image sharpness using variance
    gray = tf.image.rgb_to_grayscale(image)

    variance = tf.math.reduce_variance(gray).numpy()

    if variance < 150:
        return False, "Image appears unclear or blurry. Please retake or upload a clearer image."

    return True, "Image quality is acceptable."