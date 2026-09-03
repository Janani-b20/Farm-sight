from pydantic import BaseModel, Field
from typing import Optional


class MLPredictionInput(BaseModel):
    crop: str
    disease: str
    confidence: float
    message: str = ""
    weather_context: str = ""
    language: str = "en"


class SourceItem(BaseModel):
    title: str
    url: str


class AnalysisResponse(BaseModel):
    """
    Standardized response shape sent back to the frontend for ALL three paths
    (uncertain / normal / disease_detected).
    For "uncertain" and "normal", only `analysis` is populated (simple message).
    For "disease_detected", the structured fields are populated instead so the
    frontend can render a clean farmer-facing card instead of one big paragraph.
    """
    status: str           # "uncertain" | "normal" | "disease_detected"
    analysis: str = ""   # used for uncertain/normal simple messages
    crop: Optional[str] = None
    disease: Optional[str] = None
    confidence: Optional[float] = None
    why_this_happening: list[str] = []
    what_to_do_now: list[str] = []
    treatment: list[str] = []
    weather_warning: Optional[str] = None
    sources: list[SourceItem] = []
    show_whatif: bool = False