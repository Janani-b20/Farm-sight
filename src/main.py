from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from src.services.weather_service import get_weather_data as get_weather
from src.services.rag_service import get_rag_response

app = FastAPI(title="Farm-Sight API")

# Request Models
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