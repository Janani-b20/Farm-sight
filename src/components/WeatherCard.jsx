import { useEffect, useState } from "react";

const defaultLocation = { latitude: 40.7128, longitude: -74.006 };

export default function WeatherCard({ latitude, longitude }) {
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const location = {
      latitude: latitude ?? defaultLocation.latitude,
      longitude: longitude ?? defaultLocation.longitude,
    };
    const params = new URLSearchParams(location);

    fetch(`/api/weather?${params}`)
      .then((response) => {
        if (!response.ok) throw new Error("Weather data is unavailable");
        return response.json();
      })
      .then(setWeather)
      .catch((requestError) => setError(requestError.message));
  }, [latitude, longitude]);

  if (error) return <section role="alert">{error}</section>;
  if (!weather) return <section aria-busy="true">Loading weather...</section>;

  return (
    <section aria-labelledby="weather-heading">
      <h2 id="weather-heading">Field weather</h2>
      <p>{weather.temperature_c}°C · {weather.weather_description}</p>
      <p>Humidity {weather.humidity_percent}% · Rain {weather.precipitation_mm} mm</p>
      <strong>{weather.risk.label}</strong>
      <p>{weather.risk.advice}</p>
    </section>
  );
}import React from "react";

export default function WeatherCard({ weather }) {
  if (!weather) return null;

  return (
    <article className="weather-card" aria-labelledby="weather-card-title">
      <div className="card-heading">
        <div>
          <p className="eyebrow">Field conditions</p>
          <h2 id="weather-card-title">{weather.location || "Weather"}</h2>
        </div>
        <span aria-label="Current temperature">
          {weather.temperature_c ?? "--"}°C
        </span>
      </div>
      <p>{weather.condition || "Conditions unavailable"}</p>
      <dl className="weather-metrics">
        <div><dt>Humidity</dt><dd>{weather.humidity_pct ?? "--"}%</dd></div>
        <div><dt>Rain</dt><dd>{weather.rain_probability_pct ?? "--"}%</dd></div>
        <div><dt>Wind</dt><dd>{weather.wind_kph ?? "--"} km/h</dd></div>
      </dl>
      {weather.observed_at && <small>Updated {new Date(weather.observed_at).toLocaleString()}</small>}
    </article>
  );
}