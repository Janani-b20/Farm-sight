import os
from datetime import datetime

import requests


def get_weather_data(lat: float = 10.7905, lon: float = 78.7047):
    """
    Fetch live weather data.

    Primary:
        Open-Meteo

    Fallback:
        OpenWeatherMap

    Rain probability is kept between 0 and 100.
    No fabricated weather values are returned if both services fail.
    """

    # ---------------------------------------------------------
    # 1. Open-Meteo - Primary
    # ---------------------------------------------------------

    open_meteo_url = (
        "https://api.open-meteo.com/v1/forecast"
        f"?latitude={lat}"
        f"&longitude={lon}"
        "&current=temperature_2m,relative_humidity_2m,wind_speed_10m"
        "&hourly=precipitation_probability"
        "&forecast_days=1"
        "&timezone=auto"
    )

    try:
        response = requests.get(open_meteo_url, timeout=5)
        response.raise_for_status()

        payload = response.json()

        current = payload.get("current", {})
        hourly = payload.get("hourly", {})

        current_time = current.get("time")

        hourly_times = hourly.get("time", [])
        hourly_rain_probability = hourly.get(
            "precipitation_probability",
            [],
        )

        rain_prob = None

        if current_time and hourly_times and hourly_rain_probability:
            try:
                # Open-Meteo hourly timestamps are normally on the hour.
                current_dt = datetime.fromisoformat(current_time)

                closest_index = min(
                    range(len(hourly_times)),
                    key=lambda i: abs(
                        datetime.fromisoformat(hourly_times[i]) - current_dt
                    ),
                )

                rain_prob = hourly_rain_probability[closest_index]

            except Exception:
                rain_prob = hourly_rain_probability[0]

        if rain_prob is not None:
            rain_prob = max(0, min(100, round(float(rain_prob))))

        return {
            "temp": round(current.get("temperature_2m", 0)),
            "humidity": round(
                current.get("relative_humidity_2m", 0)
            ),
            "rain_prob": rain_prob,
            "wind": round(
                current.get("wind_speed_10m", 0),
                1,
            ),
            "weather_source": "open_meteo",
            "weather_status": "live",
        }

    except Exception as e:
        print(
            f"Open-Meteo API Error: {e}. "
            "Trying OpenWeatherMap fallback..."
        )

    # ---------------------------------------------------------
    # 2. OpenWeatherMap - Fallback
    # ---------------------------------------------------------

    api_key = os.getenv("OPENWEATHER_API_KEY")

    if api_key:
        owm_url = (
            "https://api.openweathermap.org/data/2.5/weather"
            f"?lat={lat}"
            f"&lon={lon}"
            f"&appid={api_key}"
            "&units=metric"
        )

        try:
            response = requests.get(owm_url, timeout=5)
            response.raise_for_status()

            data = response.json()

            # Current Weather API provides rain amount,
            # not precipitation probability.
            # Therefore we must NOT convert rainfall mm
            # into a fake percentage.
            return {
                "temp": round(data["main"]["temp"]),
                "humidity": round(data["main"]["humidity"]),
                "rain_prob": None,
                "wind": round(data["wind"]["speed"], 1),
                "weather_source": "openweathermap",
                "weather_status": "live_probability_unavailable",
            }

        except Exception as e:
            print(f"OpenWeatherMap Fallback Error: {e}")

    # ---------------------------------------------------------
    # 3. No fake weather fallback
    # ---------------------------------------------------------

    return {
        "temp": None,
        "humidity": None,
        "rain_prob": None,
        "wind": None,
        "weather_source": "unavailable",
        "weather_status": "unavailable",
    }


def apply_weather_rules(
    crop: str,
    disease: str,
    weather: dict,
) -> str:
    """
    Weather-aware treatment guidance for
    Paddy, Groundnut and Cotton.
    """

    humidity = weather.get("humidity")
    rain_prob = weather.get("rain_prob")

    if humidity is None:
        return (
            "Weather data is currently unavailable. "
            "Check local weather conditions before applying treatment."
        )

    if rain_prob is None:
        if humidity > 85:
            return (
                f"Warning: High humidity ({humidity}%) detected for "
                f"{crop}. Monitor {disease} development closely. "
                "Rain probability is currently unavailable."
            )

        return (
            f"Humidity is {humidity}% for {crop}. "
            "Rain probability is currently unavailable, so verify "
            "local rainfall conditions before applying treatment."
        )

    if humidity > 80 and rain_prob > 70:
        return (
            f"High weather-related risk for {crop} ({disease}): "
            f"humidity is {humidity}% and rain probability is "
            f"{rain_prob}%. Consider delaying spraying and monitor "
            "field drainage."
        )

    if humidity > 85:
        return (
            f"Warning: High humidity ({humidity}%) detected for "
            f"{crop}. Monitor for {disease} development closely."
        )

    return (
        f"Current weather conditions show comparatively lower "
        f"weather-related treatment risk for {crop}. "
        f"Follow the recommended {disease} treatment instructions."
    )