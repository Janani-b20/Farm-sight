from fastapi import APIRouter, Query

from src.services.weather_service import get_weather_data

router = APIRouter(
    prefix="/api/weather",
    tags=["Weather"],
)


@router.get("")
def get_weather(
    lat: float = Query(
        9.9252,
        ge=-90,
        le=90,
        description="Latitude",
    ),
    lon: float = Query(
        78.1198,
        ge=-180,
        le=180,
        description="Longitude",
    ),
):
    """
    Return live weather for the supplied coordinates.

    Default coordinates:
    Madurai, Tamil Nadu.
    """

    weather = get_weather_data(
        lat=lat,
        lon=lon,
    )

    if weather.get("weather_status") == "unavailable":
        return {
            "status": "unavailable",
            "latitude": lat,
            "longitude": lon,
            **weather,
        }

    return {
        "status": "success",
        "latitude": lat,
        "longitude": lon,
        **weather,
    }