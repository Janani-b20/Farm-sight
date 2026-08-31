from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from src.services.weather_service import get_weather_data as get_weather
from src.services.rag_service import get_rag_response, get_disease_advice
from src.services.model_service import predict_disease
from src.schemas import MLPredictionInput, AnalysisResponse
from src.services.guardrail_service import evaluate_prediction
from src.services.crop_vision_service import detect_crop_from_image

app = FastAPI(title="Farm-Sight API")

# Allow the React dev server to call this API. Without this, the browser's
# preflight OPTIONS request gets rejected with 405 before the real POST
# request is ever sent.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",   # Vite default
        "http://127.0.0.1:5173",
        "http://localhost:3000",   # in case CRA/other tooling is used
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------- Existing models (unchanged) ----------
class WeatherRequest(BaseModel):
    lat: float
    lon: float


class RAGRequest(BaseModel):
    user_query: str
    crop_name: str = ""


@app.get("/")
def home():
    return {"message": "Farm-Sight API is running successfully!"}


@app.post("/api/weather")
def fetch_weather(data: WeatherRequest):
    weather_data = get_weather(data.lat, data.lon)
    if "error" in weather_data:
        raise HTTPException(status_code=500, detail=weather_data["error"])
    return weather_data


@app.post("/api/rag")
def fetch_rag_response(data: RAGRequest):
    response = get_rag_response(data.user_query, data.crop_name)
    return {"response": response}


# ---------- Image upload -> real model (crop-routed) / stub fallback ----------
VALID_CROPS = {"paddy", "cotton", "groundnut"}


@app.post("/api/predict")
async def predict_image(file: UploadFile = File(...), crop: str = Form(...)):
    """
    Accepts an uploaded crop photo PLUS the farmer's selected crop, and
    routes to that exact crop's model (see src/services/model_service.py).

    IMPORTANT: we intentionally do NOT auto-detect crop from the photo.
    Each crop has its own separately-trained model, and confidence scores
    across different models aren't comparable — running all three and
    picking "highest confidence" was tested and proven unsafe (a Groundnut
    photo was misclassified by the Cotton model at 99.72% confidence). The
    farmer selecting their crop up front is the safe, correct design.
    """
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be an image.")

    crop_normalized = crop.strip().lower()
    if crop_normalized not in VALID_CROPS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid crop '{crop}'. Must be one of: {', '.join(sorted(VALID_CROPS))}",
        )

    try:
        image_bytes = await file.read()
        prediction = predict_disease(image_bytes, filename=file.filename or "", crop=crop_normalized)
        return prediction
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


# ---------- Guardrail + RAG pipeline for ML predictions ----------
@app.post("/api/analyze", response_model=AnalysisResponse)
def analyze_prediction(data: MLPredictionInput):
    """
    Entry point for the standardized ML output contract:
    {"crop": "paddy", "disease": "dead_heart", "confidence": 99.69, "message": "..."}

    Routes through the guardrail first, then only calls Gemini/RAG when
    confidence is acceptable AND a real disease was detected.
    """
    verdict = evaluate_prediction(data)

    # Case 1: low confidence -> stop everything, ask for re-upload
    if verdict["status"] == "uncertain":
        return AnalysisResponse(
            status="uncertain",
            analysis=verdict["message"],
            sources=[],
            show_whatif=False,
        )

    # Case 2: healthy crop -> no disease treatment, no RAG call
    if verdict["status"] == "normal":
        return AnalysisResponse(
            status="normal",
            analysis=verdict["message"],
            sources=[],
            show_whatif=False,
        )

    # Case 3: disease detected with good confidence -> RAG + Gemini
    try:
        advice = get_disease_advice(
            crop=data.crop,
            disease=data.disease,
            confidence=data.confidence,
            weather_context=data.weather_context,
        )
        return AnalysisResponse(
            status="disease_detected",
            crop=data.crop,
            disease=data.disease,
            confidence=data.confidence,
            why_this_happening=advice["why_this_happening"],
            what_to_do_now=advice["what_to_do_now"],
            treatment=advice["treatment"],
            weather_warning=advice["weather_warning"],
            sources=advice["sources"],
            show_whatif=True,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"RAG pipeline failed: {str(e)}")
    

@app.post("/api/detect-crop")
async def detect_crop(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be an image.")
    image_bytes = await file.read()
    result = detect_crop_from_image(image_bytes)
    return result