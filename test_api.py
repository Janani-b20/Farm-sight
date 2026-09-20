import requests

url = "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070"

params = {
    "api-key": "YOUR_API_KEY",
    "format": "json",
    "limit": 10
}

headers = {
    "User-Agent": "Mozilla/5.0"
}

try:
    response = requests.get(
        url,
        params=params,
        headers=headers,
        timeout=120
    )

    print("Status:", response.status_code)
    print(response.text[:2000])

except requests.exceptions.RequestException as e:
    print("API connection error:", e)