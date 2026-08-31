import base64
from google import genai
from google.genai import types
from src.services.rag_service import client  # reuse existing Gemini client

VALID_CROPS = {"paddy", "cotton", "groundnut"}


def detect_crop_from_image(image_bytes: bytes) -> dict:
    """
    Uses Gemini Vision to identify which crop is in the photo, BEFORE
    routing to the crop-specific disease model. This is a much easier
    task than disease classification (3-way crop ID vs fine-grained
    disease detection), so it's safe to trust — unlike running all 3
    disease models and picking highest confidence, which was already
    tested and proven unsafe.

    Returns: {"crop": "paddy"|"cotton"|"groundnut"|"unknown", "note": str}
    Never raises — falls back to "unknown" so the frontend can ask the
    farmer to confirm manually instead of crashing.
    """
    prompt = (
        "Look at this crop leaf/plant photo. Identify ONLY which crop it is. "
        "Respond with EXACTLY ONE WORD, lowercase, no punctuation: "
        "paddy, cotton, or groundnut. "
        "If you cannot tell confidently, respond with: unknown"
    )
    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[
                types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"),
                prompt,
            ],
        )
        guess = (response.text or "").strip().lower()
        guess = "".join(ch for ch in guess if ch.isalpha())  # strip stray punctuation

        if guess in VALID_CROPS:
            return {"crop": guess, "note": "auto-detected"}
        return {"crop": "unknown", "note": "Could not confidently identify the crop from the photo."}

    except Exception as e:
        print(f"[crop_vision_service] Gemini crop detection failed: {e}")
        return {"crop": "unknown", "note": "Auto-detection unavailable — please select your crop."}