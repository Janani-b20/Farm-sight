import os
import requests

def get_weather_data(lat: float = 10.7905, lon: float = 78.7047):
    """
    Fetches weather data using Open-Meteo API (Primary) 
    with OpenWeatherMap API as Fallback.
    """
    # 1. Try Open-Meteo (Primary - Free, No API Key required)
    open_meteo_url = f"https://api.open-meteo.com/v1/forecast?lat={lat}&lon={lon}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m"
    try:
        response = requests.get(open_meteo_url, timeout=5)
        if response.status_code == 200:
            data = response.json().get("current", {})
            return {
                "temp": round(data.get("temperature_2m", 31)),
                "humidity": round(data.get("relative_humidity_2m", 89)),
                "rain_prob": round(data.get("precipitation", 0) * 10),
                "wind": round(data.get("wind_speed_10m", 12.5), 1)
            }
    except Exception as e:
        print(f"Open-Meteo API Error: {e}, switching to fallback...")

    # 2. Fallback to OpenWeatherMap
    api_key = os.getenv("OPENWEATHER_API_KEY", "5857f17cd84bac3ec2f26bb0cccfc6d4")
    if api_key:
        owm_url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={api_key}&units=metric"
        try:
            response = requests.get(owm_url, timeout=5)
            if response.status_code == 200:
                data = response.json()
                return {
                    "temp": round(data["main"]["temp"]),
                    "humidity": data["main"]["humidity"],
                    "rain_prob": round(data.get("rain", {}).get("1h", 0) * 10),
                    "wind": round(data["wind"]["speed"], 1)
                }
        except Exception as e:
            print(f"OpenWeatherMap Fallback Error: {e}")

    # 3. Final Default Fallback
    return {"temp": 31, "humidity": 89, "rain_prob": 78, "wind": 12.5}

def apply_weather_rules(crop: str, disease: str, weather: dict) -> str:
    """
    Smart Weather Rules Engine for Paddy, Groundnut, and Cotton.
    """
    humidity = weather.get("humidity", 0)
    rain_prob = weather.get("rain_prob", 0)
    
    if humidity > 80 and rain_prob > 70:
        return f"⚠ High risk for {crop} ({disease}): Humidity is {humidity}% with expected rain. Do not spray chemicals today. Clear field drainage immediately!"
    elif humidity > 85:
        return f"⚠ Warning: High humidity ({humidity}%) detected for {crop}. Monitor for {disease} spore development closely."
    else:
        return f"✅ Weather is clear for {crop}. Safe to apply recommended treatment for {disease} during early morning."