from fastapi import APIRouter, HTTPException

from src.schemas import MLPredictionInput, AnalysisResponse
from src.services.guardrail_service import evaluate_prediction
from src.services.rag_service import get_disease_advice

router = APIRouter(prefix="/api", tags=["Disease Intelligence"])


@router.post("/analyze", response_model=AnalysisResponse)
def analyze_prediction(data: MLPredictionInput):
    """
    Takes the standardized disease-ML result and decides what happens next.

    uncertain -> stop and ask for clearer image
    normal -> healthy-crop response
    disease -> RAG + Gemini advisory
    """

    verdict = evaluate_prediction(data)

    # Low-confidence prediction
    if verdict["status"] == "uncertain":
        return AnalysisResponse(
            status="uncertain",
            analysis=verdict["message"],
            sources=[],
            show_whatif=False,
        )

    # Healthy crop
    if verdict["status"] == "normal":
        return AnalysisResponse(
            status="normal",
            analysis=verdict["message"],
            sources=[],
            show_whatif=False,
        )

    # Confident disease prediction
    try:
        advice = get_disease_advice(
            crop=data.crop,
            disease=data.disease,
            confidence=data.confidence,
            weather_context=data.weather_context,
            language=data.language,
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
        raise HTTPException(
            status_code=500,
            detail=f"Disease intelligence pipeline failed: {str(e)}",
        )