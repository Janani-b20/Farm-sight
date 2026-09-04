from typing import List, Optional

from fastapi import APIRouter
from pydantic import BaseModel

from schemes.scheme_service import get_scheme_recommendations


router = APIRouter(
    prefix="/api/schemes",
    tags=["Scheme Intelligence"],
)


class SchemeRecommendationRequest(BaseModel):
    state: str
    crop: str
    farmer_type: str = "farmer"
    has_land: Optional[bool] = None
    age: Optional[int] = None
    income: Optional[float] = None
    risk_tags: Optional[List[str]] = None
    scheme_scope: str = "both"
    top_n: int = 5


@router.post("/recommend")
def recommend_schemes(payload: SchemeRecommendationRequest):
    return get_scheme_recommendations(
        state=payload.state,
        crop=payload.crop,
        farmer_type=payload.farmer_type,
        has_land=payload.has_land,
        age=payload.age,
        income=payload.income,
        risk_tags=payload.risk_tags,
        scheme_scope=payload.scheme_scope,
        top_n=payload.top_n,
    )