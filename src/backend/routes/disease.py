from fastapi import APIRouter, UploadFile, File, Form, HTTPException
import tensorflow as tf

from src.disease_ml.disease_predictor import predict_disease

router = APIRouter(
    prefix="/api/disease",
    tags=["Disease Detection"]
)


@router.post("/predict")
async def disease_prediction(
    crop: str = Form(...),
    image: UploadFile = File(...)
):
    crop = crop.strip().lower()

    if crop not in {"paddy", "cotton", "groundnut"}:
        raise HTTPException(
            status_code=400,
            detail="Unsupported crop. Select paddy, cotton, or groundnut."
        )

    if image.content_type not in {
        "image/jpeg",
        "image/png",
        "image/webp"
    }:
        raise HTTPException(
            status_code=400,
            detail="Please upload a JPEG, PNG, or WEBP image."
        )

    try:
        image_bytes = await image.read()

        decoded_image = tf.io.decode_image(
            image_bytes,
            channels=3,
            expand_animations=False
        )

        result = predict_disease(
            crop=crop,
            image=decoded_image
        )

        return result

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Disease prediction failed: {str(exc)}"
        )