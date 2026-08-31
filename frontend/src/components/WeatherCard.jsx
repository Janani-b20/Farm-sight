import React from "react";

export default function WeatherCard({ weather }) {
  if (!weather) return null;

  return (
    <article className="weather-card" aria-labelledby="weather-card-title" style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '30px', border: '1px solid #e5e7eb' }}>
      <div className="card-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <p className="eyebrow" style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 5px 0' }}>Field conditions</p>
          <h2 id="weather-card-title" style={{ fontSize: '20px', margin: 0, color: '#1f2937' }}>📍 {weather.location || "Live Location"}</h2>
        </div>
        <span aria-label="Current temperature" style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '6px 14px', borderRadius: '20px', fontSize: '16px', fontWeight: 'bold' }}>
          {weather.temperature_c ?? "--"}°C
        </span>
      </div>
      
      <p style={{ fontSize: '15px', fontWeight: '600', color: '#374151', marginBottom: '15px' }}>{weather.condition || "Conditions unavailable"}</p>
      
      <dl className="weather-metrics" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '20px' }}>
        <div style={{ backgroundColor: '#f9fafb', padding: '15px', borderRadius: '8px', textAlign: 'center', border: '1px solid #f3f4f6' }}>
          <dt style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Humidity</dt>
          <dd style={{ fontSize: '18px', fontWeight: 'bold', color: '#374151', margin: 0 }}>{weather.humidity_pct ?? "--"}%</dd>
        </div>
        <div style={{ backgroundColor: '#f9fafb', padding: '15px', borderRadius: '8px', textAlign: 'center', border: '1px solid #f3f4f6' }}>
          <dt style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Rain Probability</dt>
          <dd style={{ fontSize: '18px', fontWeight: 'bold', color: '#374151', margin: 0 }}>{weather.rain_probability_pct ?? "--"}%</dd>
        </div>
        <div style={{ backgroundColor: '#f9fafb', padding: '15px', borderRadius: '8px', textAlign: 'center', border: '1px solid #f3f4f6' }}>
          <dt style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Wind</dt>
          <dd style={{ fontSize: '18px', fontWeight: 'bold', color: '#374151', margin: 0 }}>{weather.wind_kph ?? "--"} km/h</dd>
        </div>
      </dl>

      {weather.observed_at && <small style={{ color: '#9ca3af', fontSize: '12px' }}>Updated {new Date(weather.observed_at).toLocaleString()}</small>}
    </article>
  );
}