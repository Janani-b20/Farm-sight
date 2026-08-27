"""Farm-sight API entry point."""

from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel, Field

from services.rag_service import analyze_symptoms
from services.weather_service import get_weather

app = FastAPI(title="Farm-sight API", version="1.0.0")


class DiseaseRequest(BaseModel):
    crop: str = Field(min_length=1, max_length=80)
    symptoms: str = Field(min_length=3, max_length=2000)
    location: str = Field(default="", max_length=120)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/weather")
async def weather(
    latitude: float = Query(..., ge=-90, le=90),
    longitude: float = Query(..., ge=-180, le=180),
) -> dict:
    try:
        return await get_weather(latitude, longitude)
    except Exception as error:
        raise HTTPException(status_code=502, detail="Weather provider is unavailable") from error


@app.post("/api/disease/analyze")
async def disease_analysis(request: DiseaseRequest) -> dict:
    try:
        return await analyze_symptoms(request.crop, request.symptoms, request.location)
    except Exception as error:
        raise HTTPException(status_code=502, detail="Disease research provider is unavailable") from error"""Farm-sight FastAPI application."""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from disease_weather.rag_service import analyze_disease
from disease_weather.weather_service import assess_disease_risk, get_weather


app = FastAPI(title="Farm-sight API", version="1.0.0")


class WeatherRequest(BaseModel):
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)


class DiseaseRequest(BaseModel):
    crop: str = Field(min_length=1, max_length=100)
    symptoms: str = Field(min_length=1, max_length=2_000)


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}


@app.post("/api/weather")
async def weather(request: WeatherRequest) -> dict:
    try:
        conditions = await get_weather(request.latitude, request.longitude)
    except Exception as error:
        raise HTTPException(status_code=502, detail="Weather provider unavailable") from error
    conditions["disease_risk"] = assess_disease_risk(
        conditions["temperature_c"], conditions["humidity_pct"], conditions["rain_probability_pct"] or 0
    )
    return conditions


@app.post("/api/disease/analyze")
async def disease_analysis(request: DiseaseRequest) -> dict:
    try:
        return await analyze_disease(request.crop, request.symptoms)
    except Exception as error:
        raise HTTPException(status_code=502, detail="Disease research provider unavailable") from error