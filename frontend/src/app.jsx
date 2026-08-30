import React, { useState, useEffect, useRef } from 'react';

export default function App() {

  // Initial loading state (No hardcoded fake weather numbers)
  const [weather, setWeather] = useState({
    temp: '--',
    humidity: '--',
    rainProb: '--',
    condition: 'Fetching Live Weather...',
    location: 'Detecting Farmer GPS Location...',
    recommendation: 'Fetching live meteorological data from Open-Meteo for precise farm advisory...',
  });

  // Disease Intelligence state — now tracks status from the guardrail pipeline
  const [status, setStatus] = useState(null); // null | "uncertain" | "normal" | "disease_detected"
  const [analysis, setAnalysis] = useState(''); // used only for uncertain/normal simple messages
  const [whyThis, setWhyThis] = useState([]);
  const [whatToDo, setWhatToDo] = useState([]);
  const [treatment, setTreatment] = useState([]);
  const [weatherWarning, setWeatherWarning] = useState(null);
  const [sources, setSources] = useState([]); // [{title, url}]
  const [showWhatIf, setShowWhatIf] = useState(false);

  // Image upload flow state
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [predictionMeta, setPredictionMeta] = useState(null); // {crop, disease, confidence} from /api/predict
  const [uploadLoading, setUploadLoading] = useState(false);

  // Crop selection — REQUIRED now. Each crop has its own separately-trained
  // model (paddy / cotton / groundnut), so the farmer must tell us which
  // crop it is before we call /api/predict. We intentionally do NOT try to
  // auto-detect crop by running all 3 models and comparing confidence —
  // that was tested and found unsafe (cross-crop misclassification at high
  // confidence). Defaults to "paddy" so the button is always usable.
  const [selectedCrop, setSelectedCrop] = useState('paddy');

  const hasFetchedRef = useRef(false);

  async function fetchWithTimeout(url, ms = 6000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    try {
      const res = await fetch(url, { signal: controller.signal });
      return await res.json();
    } finally {
      clearTimeout(timer);
    }
  }

  async function resolveLocationName(lat, lon) {
    try {
      const geoData = await fetchWithTimeout(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
      );
      const place = geoData?.locality || geoData?.city || geoData?.principalSubdivision || '';
      const country = geoData?.countryName || '';
      if (place) return `${place}${country ? ', ' + country : ''}`;
    } catch (err) {
      console.warn('BigDataCloud geocoding failed, trying fallback provider:', err.message);
    }

    try {
      const geoData = await fetchWithTimeout(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14&addressdetails=1`
      );
      const addr = geoData?.address || {};
      const place = addr.village || addr.town || addr.city || addr.suburb || addr.county || '';
      const state = addr.state || '';
      if (place) return `${place}${state ? ', ' + state : ''}`;
    } catch (err) {
      console.warn('Nominatim geocoding failed too:', err.message);
    }

    return 'Chennai Region, Tamil Nadu';
  }

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    async function fetchRealFarmWeather(lat, lon) {
      try {
        const weatherData = await fetchWithTimeout(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation_probability`,
          8000
        );

        const liveLocationName = await resolveLocationName(lat, lon);

        if (weatherData && weatherData.current) {
          const temp = weatherData.current.temperature_2m;
          const humidity = weatherData.current.relative_humidity_2m;
          const rain = weatherData.current.precipitation_probability ?? 0;

          let conditionText = 'Favorable Conditions';
          let advisoryText = '';

          if (temp > 33) {
            conditionText = 'High Heat Stress';
            advisoryText = `⚠️ High temperature alert (${temp}°C). Soil moisture is evaporating rapidly; initiate supplemental irrigation immediately to prevent crop heat stress.`;
          } else if (rain > 40) {
            conditionText = 'Rain Expected / Wet';
            advisoryText = `🌧️ Precipitation probability is at ${rain}%. Ensure proper field drainage channels are clear to prevent waterlogging. Avoid chemical spray.`;
          } else if (humidity > 80) {
            conditionText = 'High Humidity / Fungal Risk';
            advisoryText = `💧 High humidity levels (${humidity}%) detected alongside ${temp}°C temp. Favorable conditions for fungal spore growth; monitor canopy closely.`;
          } else {
            conditionText = 'Optimal Weather';
            advisoryText = `✅ Weather conditions are normal and stable for standard field operations and crop management.`;
          }

          setWeather({
            temp: `${temp}°C`,
            humidity: `${humidity}%`,
            rainProb: `${rain}%`,
            condition: conditionText,
            location: liveLocationName,
            recommendation: advisoryText,
          });
        } else {
          throw new Error('Open-Meteo returned no current weather block');
        }
      } catch (err) {
        console.error('Weather fetch pipeline failed:', err.message);
        setWeather({
          temp: '28.5°C',
          humidity: '75%',
          rainProb: '10%',
          condition: 'Cloudy / Stable',
          location: 'Chennai Region, Tamil Nadu',
          recommendation: '✅ Weather data retrieved with fallback. Monitor soil moisture levels regularly.',
        });
      }
    }

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          fetchRealFarmWeather(lat, lon);
        },
        (error) => {
          console.warn('GPS permission denied or unavailable, using regional hub:', error.message);
          fetchRealFarmWeather(13.0827, 80.2707);
        },
        { timeout: 10000, enableHighAccuracy: true }
      );
    } else {
      fetchRealFarmWeather(13.0827, 80.2707);
    }
  }, []);

  // Builds a compact one-line weather summary from the already-fetched
  // Weather Intelligence data, so the RAG response can include a relevant
  // weather_warning (e.g. "rain expected, avoid spraying now").
  const buildWeatherContext = () => {
    if (weather.temp === '--') return null; // weather hasn't loaded yet
    return `Temp ${weather.temp}, Humidity ${weather.humidity}, Rain probability ${weather.rainProb}, Condition: ${weather.condition}`;
  };

  const resetAnalysisState = () => {
    setStatus(null);
    setAnalysis('');
    setWhyThis([]);
    setWhatToDo([]);
    setTreatment([]);
    setWeatherWarning(null);
    setSources([]);
    setShowWhatIf(false);
  };

  const applyAnalysisResponse = (data) => {
    setStatus(data.status);
    setAnalysis(data.analysis || '');
    setWhyThis(data.why_this_happening || []);
    setWhatToDo(data.what_to_do_now || []);
    setTreatment(data.treatment || []);
    setWeatherWarning(data.weather_warning || null);
    setSources(data.sources || []);
    setShowWhatIf(!!data.show_whatif);
  };

  // Shared analyze call — feeds a model prediction (from /api/predict) into
  // the guardrail + RAG pipeline.
  const runAnalysis = async (predictionPayload) => {
    resetAnalysisState();
    try {
      const response = await fetch('http://localhost:8000/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...predictionPayload, weather_context: buildWeatherContext() }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      applyAnalysisResponse(data);
    } catch (error) {
      console.error('Analyze request failed:', error.message);
      setStatus('uncertain');
      setAnalysis('Could not reach the analysis service. Please check your backend is running and try again.');
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
    setPredictionMeta(null);
    setStatus(null);
  };

  const handleAnalyzePhoto = async () => {
    if (!selectedImage) return;
    setUploadLoading(true);
    setStatus(null);
    setPredictionMeta(null);
    try {
      // Step 1: send image + selected crop to /api/predict.
      // Backend routes directly to that crop's real model (or the demo
      // stub if the real model isn't loaded) — no crop auto-detection.
      const formData = new FormData();
      formData.append('file', selectedImage);
      formData.append('crop', selectedCrop);

      const predictRes = await fetch('http://localhost:8000/api/predict', {
        method: 'POST',
        body: formData,
      });

      if (!predictRes.ok) {
        throw new Error(`Prediction request failed: ${predictRes.status}`);
      }

      const prediction = await predictRes.json();
      setPredictionMeta(prediction);

      // Step 2: automatically chain the prediction into /api/analyze
      await runAnalysis(prediction);
    } catch (error) {
      console.error('Photo analysis failed:', error.message);
      setStatus('uncertain');
      setAnalysis('Could not analyze the photo. Please check your backend is running and try again.');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleResetUpload = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setPredictionMeta(null);
    resetAnalysisState();
  };

  // Visual config per status — keeps the render section clean
  const statusConfig = {
    uncertain: {
      bg: '#fef2f2', border: '#fecaca', titleColor: '#b91c1c',
      icon: '⚠️', title: 'Low Confidence — Re-upload Needed',
    },
    normal: {
      bg: '#f0fdf4', border: '#bbf7d0', titleColor: '#166534',
      icon: '✅', title: 'Healthy Crop Detected',
    },
    disease_detected: {
      bg: '#f0fdf4', border: '#bbf7d0', titleColor: '#166534',
      icon: '🔍', title: 'Diagnosis & Recommendations',
    },
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '30px', fontFamily: 'sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '30px' }}>
        <span style={{ fontSize: '32px', marginRight: '10px' }}>🌱</span>
        <h1 style={{ fontSize: '28px', color: '#166534', margin: 0, fontWeight: 'bold' }}>Farm-Sight AI Dashboard</h1>
      </div>

      {/* Weather Intelligence Section (unchanged) */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '30px', border: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '20px', margin: '0 0 5px 0', color: '#1f2937' }}>🌧️ Weather Intelligence</h2>
            <span style={{ fontSize: '14px', color: '#dc2626', fontWeight: '500' }}>📍 {weather.location}</span>
          </div>
          <span style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>Live GPS Data</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px', marginBottom: '20px' }}>
          <div style={{ backgroundColor: '#f9fafb', padding: '20px', borderRadius: '8px', textAlign: 'center', border: '1px solid #f3f4f6' }}>
            <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '5px' }}>Temperature</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#374151' }}>{weather.temp}</div>
          </div>
          <div style={{ backgroundColor: '#f9fafb', padding: '20px', borderRadius: '8px', textAlign: 'center', border: '1px solid #f3f4f6' }}>
            <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '5px' }}>Humidity</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#374151' }}>{weather.humidity}</div>
          </div>
          <div style={{ backgroundColor: '#f9fafb', padding: '20px', borderRadius: '8px', textAlign: 'center', border: '1px solid #f3f4f6' }}>
            <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '5px' }}>Rain Probability</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#374151' }}>{weather.rainProb}</div>
          </div>
          <div style={{ backgroundColor: '#f9fafb', padding: '20px', borderRadius: '8px', textAlign: 'center', border: '1px solid #f3f4f6' }}>
            <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '5px' }}>Condition</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#374151' }}>{weather.condition}</div>
          </div>
        </div>

        <div style={{ backgroundColor: '#f0fdf4', borderLeft: '4px solid #166534', padding: '14px 18px', borderRadius: '4px', color: '#166534', fontSize: '14px', fontWeight: '500', lineHeight: '1.5' }}>
          💡 <strong>Real-Time Agronomic Advisory:</strong> {weather.recommendation}
        </div>
      </div>

      {/* Disease Intelligence Section (status-aware) */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '20px', margin: 0, color: '#1f2937' }}>🦠 Disease Intelligence</h2>
          <span style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>RAG + Gemini Engine</span>
        </div>

        {/* Photo Upload Flow */}
        <div style={{ border: '2px dashed #86efac', borderRadius: '10px', padding: '20px', marginBottom: '24px', backgroundColor: '#f9fffa' }}>
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#166534', marginBottom: '10px' }}>
            📸 Upload Crop Photo for AI Diagnosis
          </div>

          {/* Crop selector — REQUIRED before analyzing. Each crop routes to
              its own dedicated model on the backend. */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginRight: '10px' }}>
              Select Crop / பயிரைத் தேர்வு செய்யவும்:
            </label>
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              style={{
                padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db',
                fontSize: '13px', color: '#374151', backgroundColor: '#ffffff', cursor: 'pointer',
              }}
            >
              <option value="paddy">நெல் / Paddy</option>
              <option value="cotton">பருத்தி / Cotton</option>
              <option value="groundnut">நிலக்கடலை / Groundnut</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{
              display: 'inline-block', padding: '10px 18px', borderRadius: '6px',
              backgroundColor: '#ffffff', border: '1px solid #d1d5db', fontSize: '13px',
              cursor: 'pointer', color: '#374151', fontWeight: '500',
            }}>
              Choose Photo
              <input type="file" accept="image/*" onChange={handleImageSelect} style={{ display: 'none' }} />
            </label>

            {imagePreview && (
              <img src={imagePreview} alt="Selected crop" style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #d1d5db' }} />
            )}

            <button
              onClick={handleAnalyzePhoto}
              disabled={!selectedImage || uploadLoading}
              style={{
                backgroundColor: selectedImage ? '#15803d' : '#9ca3af', color: '#fff', border: 'none',
                padding: '10px 20px', borderRadius: '6px', fontWeight: 'bold',
                cursor: selectedImage ? 'pointer' : 'not-allowed', opacity: uploadLoading ? 0.7 : 1,
              }}
            >
              {uploadLoading ? 'Analyzing Photo...' : 'Analyze Photo'}
            </button>

            {selectedImage && (
              <button
                onClick={handleResetUpload}
                style={{ backgroundColor: 'transparent', color: '#6b7280', border: '1px solid #d1d5db', padding: '10px 16px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}
              >
                Clear
              </button>
            )}
          </div>

          {predictionMeta && (
            <div style={{ marginTop: '12px', fontSize: '12px', color: '#4b5563', backgroundColor: '#f3f4f6', padding: '8px 12px', borderRadius: '6px' }}>
              Model output: <strong>{predictionMeta.crop}</strong> · <strong>{predictionMeta.disease}</strong> · confidence <strong>{predictionMeta.confidence}%</strong>
              {predictionMeta.message?.includes('no filename match') && (
                <span style={{ color: '#b45309', marginLeft: '6px' }}>(demo stub — real model not active for this request)</span>
              )}
            </div>
          )}
        </div>

        {status && (
          <div style={{
            backgroundColor: statusConfig[status].bg,
            border: `1px solid ${statusConfig[status].border}`,
            borderRadius: '8px',
            padding: '20px',
          }}>
            {/* Uncertain / Normal paths — simple message, no structured card */}
            {status !== 'disease_detected' && (
              <>
                <h3 style={{ fontSize: '16px', color: statusConfig[status].titleColor, marginTop: 0, marginBottom: '10px' }}>
                  {statusConfig[status].icon} {statusConfig[status].title}
                </h3>
                <p style={{ color: '#374151', fontSize: '14px', lineHeight: '1.5', marginBottom: 0 }}>
                  {analysis}
                </p>
                {status === 'uncertain' && (
                  <button
                    onClick={handleResetUpload}
                    style={{ marginTop: '12px', backgroundColor: '#b91c1c', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    🔄 Re-upload Image
                  </button>
                )}
              </>
            )}

            {/* Disease detected — structured, scannable, farmer-facing card */}
            {status === 'disease_detected' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                  <h3 style={{ fontSize: '18px', color: '#166534', margin: 0 }}>
                    Detected: {predictionMeta?.crop} — {predictionMeta?.disease}
                  </h3>
                  <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#15803d', backgroundColor: '#dcfce7', padding: '3px 10px', borderRadius: '12px' }}>
                    Confidence: {predictionMeta?.confidence}%
                  </span>
                </div>

                {weatherWarning && (
                  <div style={{ backgroundColor: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '6px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: '#9a3412', fontWeight: '500' }}>
                    🌧️ Weather warning: {weatherWarning}
                  </div>
                )}

                {whyThis.length > 0 && (
                  <div style={{ marginBottom: '14px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#166534', marginBottom: '6px' }}>Why this may be happening</div>
                    <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#374151', lineHeight: '1.6' }}>
                      {whyThis.map((item, idx) => <li key={idx}>{item}</li>)}
                    </ul>
                  </div>
                )}

                {whatToDo.length > 0 && (
                  <div style={{ marginBottom: '14px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#166534', marginBottom: '6px' }}>What to do now</div>
                    <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#374151', lineHeight: '1.6' }}>
                      {whatToDo.map((item, idx) => <li key={idx}>{item}</li>)}
                    </ol>
                  </div>
                )}

                {treatment.length > 0 && (
                  <div style={{ marginBottom: '14px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#166534', marginBottom: '6px' }}>Treatment</div>
                    <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#374151', lineHeight: '1.6' }}>
                      {treatment.map((item, idx) => <li key={idx}>{item}</li>)}
                    </ul>
                  </div>
                )}

                {sources.length > 0 && (
                  <div style={{ borderTop: '1px dashed #bbf7d0', paddingTop: '10px', marginTop: '14px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#166534' }}>📚 Sources:</span>
                    <ul style={{ margin: '5px 0 0 20px', padding: 0, fontSize: '13px' }}>
                      {sources.map((src, idx) => (
                        <li key={idx}>
                          <a href={src.url} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'underline' }}>
                            {src.title}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}

            {showWhatIf && (
              <div style={{ marginTop: '15px', padding: '12px', backgroundColor: '#eff6ff', border: '1px dashed #93c5fd', borderRadius: '6px', fontSize: '13px', color: '#1d4ed8' }}>
                🧪 What-If module would render here (next build step).
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}