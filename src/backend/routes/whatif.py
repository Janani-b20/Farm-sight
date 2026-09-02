from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from whatif_module.unified_pipeline import FarmSightUnifiedPipeline

router = APIRouter(prefix="/api/whatif", tags=["What-If"])

pipeline = FarmSightUnifiedPipeline()


class WhatIfRequest(BaseModel):
    crop: str
    disease: str
    confidence: float

    state: str = "Tamil Nadu"
    district: str = "Thanjavur"

    latitude: Optional[float] = None
    longitude: Optional[float] = None

    farmer_action: str = "spray_immediately"
    language: str = "en"


@router.post("")
def run_whatif(request: WhatIfRequest):
    try:
        return pipeline.run_live_pipeline(
            crop=request.crop,
            disease=request.disease,
            confidence=request.confidence,
            state=request.state,
            district=request.district,
            lat=request.latitude,
            lon=request.longitude,
            farmer_action=request.farmer_action,
            language=request.language,
        )

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"What-If pipeline failed: {str(exc)}",
        )