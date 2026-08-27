"""Weather retrieval and crop-risk rules."""

from typing import Any

import httpx


WEATHER_CODES = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Drizzle",
    55: "Heavy drizzle",
    61: "Light rain",
    63: "Rain",
    65: "Heavy rain",
    71: "Light snow",
    73: "Snow",
    75: "Heavy snow",
    80: "Rain showers",
    81: "Rain showers",
    82: "Heavy rain showers",
    95: "Thunderstorm",
}


async def get_weather(latitude: float, longitude: float) -> dict[str, Any]:
    """Fetch current conditions and translate them into field guidance."""
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "current": "temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m",
        "timezone": "auto",
    }
    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.get("https://api.open-meteo.com/v1/forecast", params=params)
        response.raise_for_status()
        payload = response.json()

    current = payload["current"]
    precipitation = float(current.get("precipitation", 0))
    weather_code = int(current.get("weather_code", -1))
    temperature = float(current["temperature_2m"])
    risk = assess_field_risk(temperature, precipitation, weather_code)
    return {
        "temperature_c": temperature,
        "humidity_percent": current["relative_humidity_2m"],
        "precipitation_mm": precipitation,
        "wind_speed_kmh": current["wind_speed_10m"],
        "weather_code": weather_code,
        "weather_description": WEATHER_CODES.get(weather_code, "Unknown conditions"),
        "risk": risk,
    }


def assess_field_risk(temperature: float, precipitation: float, weather_code: int) -> dict[str, str]:
    """Apply simple, explainable rules to current conditions."""
    if weather_code >= 95:
        return {"level": "high", "label": "High disease risk", "advice": "Avoid field work and inspect plants after the storm."}
    if precipitation >= 5 or weather_code in {51, 53, 55, 61, 63, 65, 80, 81, 82}:
        return {"level": "moderate", "label": "Moderate disease risk", "advice": "Scout leaves for fungal symptoms and avoid overhead irrigation."}
    if temperature >= 32:
        return {"level": "moderate", "label": "Heat stress risk", "advice": "Prioritize irrigation checks and provide shade for sensitive crops."}
    return {"level": "low", "label": "Low immediate risk", "advice": "Conditions are suitable for routine scouting and field work."}"""Weather retrieval and agronomic disease-risk rules."""

from datetime import datetime, timezone
import os

import httpx


WEATHER_URL = "https://api.open-meteo.com/v1/forecast"


async def get_weather(latitude: float, longitude: float) -> dict:
    """Return the current conditions needed by the dashboard."""
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "current": "temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m",
        "hourly": "precipitation_probability",
        "forecast_days": 1,
        "timezone": "UTC",
    }
    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.get(WEATHER_URL, params=params)
        response.raise_for_status()
        payload = response.json()

    current = payload["current"]
    probability = payload.get("hourly", {}).get("precipitation_probability", [None])[0]
    return {
        "location": f"{latitude:.4f}, {longitude:.4f}",
        "temperature_c": current.get("temperature_2m"),
        "humidity_pct": current.get("relative_humidity_2m"),
        "rain_probability_pct": probability,
        "wind_kph": current.get("wind_speed_10m"),
        "condition": _weather_condition(current.get("weather_code")),
        "observed_at": current.get("time") or datetime.now(timezone.utc).isoformat(),
    }


def assess_disease_risk(temperature_c: float, humidity_pct: float, rain_probability_pct: float) -> dict:
    """Apply transparent heuristics; this is an advisory signal, not a diagnosis."""
    score = 0
    if 15 <= temperature_c <= 30:
        score += 1
    if humidity_pct >= 80:
        score += 2
    elif humidity_pct >= 65:
        score += 1
    if rain_probability_pct >= 60:
        score += 1

    if score >= 4:
        risk = "high"
    elif score >= 2:
        risk = "moderate"
    else:
        risk = "low"
    return {
        "name": "Fungal disease conditions" if risk != "low" else "No elevated fungal risk",
        "risk": risk,
        "reason": f"Risk score {score}/4 based on temperature, humidity, and rain probability.",
        "recommendation": "Scout leaves and improve airflow before applying treatment." if risk != "low" else "Continue routine scouting.",
    }


def _weather_condition(code: int | None) -> str:
    if code is None:
        return "Unknown"
    if code == 0:
        return "Clear sky"
    if code in (1, 2, 3):
        return "Partly cloudy"
    if code in (51, 53, 55, 61, 63, 65, 80, 81, 82):
        return "Rain"
    if code in (95, 96, 99):
        return "Thunderstorm"
    return "Overcast"