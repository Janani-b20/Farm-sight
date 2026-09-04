const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'http://127.0.0.1:8000';


export interface WeatherResponse {
  status: 'success' | 'unavailable';

  latitude: number;
  longitude: number;

  temp: number | null;
  humidity: number | null;
  rain_prob: number | null;
  wind: number | null;

  weather_source:
    | 'open_meteo'
    | 'openweathermap'
    | 'unavailable'
    | string;

  weather_status: string;
}


export const getWeather = async (
  latitude: number = 9.9252,
  longitude: number = 78.1198
): Promise<WeatherResponse> => {
  const params = new URLSearchParams({
    lat: latitude.toString(),
    lon: longitude.toString(),
  });

  const response = await fetch(
    `${API_BASE_URL}/api/weather?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error(
      `Weather request failed (${response.status})`
    );
  }

  return response.json();
};