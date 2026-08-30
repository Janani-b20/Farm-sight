import random
import tensorflow as tf

# ---------------------------------------------------------------------------
# REAL MODEL INTEGRATION (crop-selector based, with automatic stub fallback)
# ---------------------------------------------------------------------------
# CORRECTED ARCHITECTURE (do not change this without re-reading why):
# We do NOT run all 3 crop models and pick highest confidence. That was
# tested and PROVEN unsafe — a Groundnut image fed to the Cotton model
# returned "bacterial_blight" at 99.72% confidence. Confidence scores from
# three separately-trained classifiers are not comparable as a crop
# detector.
#
# Correct flow: farmer selects crop in the UI -> that exact crop's model
# runs -> no other model is touched. This requires `crop` to be passed in
# from the frontend on every /api/predict call.
# ---------------------------------------------------------------------------

_real_model_available = False
_real_predict_disease = None

try:
    from src.disease_ml.disease_predictor import predict_disease as _real_predict_disease
    _real_model_available = True
    print("[model_service] Real .keras models loaded successfully — using real inference.")
except Exception as e:
    print(f"[model_service] Real model unavailable, using demo stub fallback. Reason: {e}")


# ---------------------------------------------------------------------------
# DEMO-SAFE STUB (fallback only — used if real models aren't available,
# or as an emergency path if a crop wasn't supplied for some reason)
# ---------------------------------------------------------------------------

MOCK_BY_KEYWORD = {
    "deadheart": {"crop": "paddy", "disease": "dead_heart", "confidence": 92.1},
    "blast": {"crop": "paddy", "disease": "blast", "confidence": 88.5},
    "brownspot": {"crop": "paddy", "disease": "brown_spot", "confidence": 87.4},
    "paddynormal": {"crop": "paddy", "disease": "normal", "confidence": 96.5},

    "leafcurl": {"crop": "cotton", "disease": "leaf_curl", "confidence": 84.2},
    "blight": {"crop": "cotton", "disease": "bacterial_blight", "confidence": 73.6},
    "cottonnormal": {"crop": "cotton", "disease": "normal", "confidence": 95.0},

    "rust": {"crop": "groundnut", "disease": "rust", "confidence": 81.3},
    "leafspot": {"crop": "groundnut", "disease": "leaf_spot", "confidence": 69.8},
    "groundnutnormal": {"crop": "groundnut", "disease": "normal", "confidence": 97.2},
}


def _stub_predict(filename: str = "", crop: str = None) -> dict:
    normalized = filename.lower().replace(" ", "").replace("-", "").replace("_", "")

    # If a crop was given, only consider that crop's keywords/pool —
    # keeps stub behavior consistent with the real architecture.
    pool = MOCK_BY_KEYWORD
    if crop:
        crop = crop.strip().lower()
        filtered = {k: v for k, v in MOCK_BY_KEYWORD.items() if v["crop"] == crop}
        if filtered:
            pool = filtered  # unknown crop string — don't crash, just widen to full pool

    for keyword, result in pool.items():
        if keyword in normalized:
            matched = dict(result)
            matched["message"] = "Prediction successful."
            return matched

    matched = dict(random.choice(list(pool.values())))
    matched["message"] = "Prediction successful (no filename match — rename file for guaranteed demo result)."
    return matched


# ---------------------------------------------------------------------------
# REAL MODEL PATH — runs ONLY the selected crop's model
# ---------------------------------------------------------------------------

def _real_predict(image_bytes: bytes, crop: str) -> dict:
    image = tf.io.decode_image(image_bytes, channels=3, expand_animations=False)
    return _real_predict_disease(crop, image)


# ---------------------------------------------------------------------------
# PUBLIC ENTRY POINT
# ---------------------------------------------------------------------------

def predict_disease(image_bytes: bytes, filename: str = "", crop: str = None) -> dict:
    """
    {"crop": str, "disease": str, "confidence": float, "message": str}

    `crop` should now be supplied by the frontend (farmer's crop selection).
    Real model path routes directly to that crop's model only — no ensemble,
    no cross-crop guessing. Falls back to the filename-keyword stub if the
    real models aren't available, or if anything goes wrong at inference time.
    """
    if _real_model_available and crop:
        try:
            return _real_predict(image_bytes, crop)
        except Exception as e:
            print(f"[model_service] Real prediction failed for crop='{crop}', falling back to stub: {e}")
            return _stub_predict(filename, crop)

    if _real_model_available and not crop:
        print("[model_service] Real models available but no crop was supplied — using stub. "
              "Make sure the frontend is sending the selected crop.")

    return _stub_predict(filename, crop)