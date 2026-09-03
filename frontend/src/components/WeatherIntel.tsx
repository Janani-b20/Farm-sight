import { useState, useEffect } from 'react';
import { 
  CloudSun, 
  Wind, 
  Droplets, 
  Thermometer, 
  AlertCircle, 
  Loader2, 
  RefreshCw, 
  MapPin, 
  ShieldAlert 
} from 'lucide-react';
import { runWhatIf, WeatherData } from '../services/whatifApi';

export default function WeatherIntel() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherWarning, setWeatherWarning] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBackendWeather = async () => {
    setLoading(true);
    setError(null);
    try {
      // Call whatif endpoint with standard coordinates to retrieve live backend weather
      const res = await runWhatIf({
        crop: 'paddy',
        disease: 'bacterial_leaf_blight',
        confidence: 90.0,
        state: 'Tamil Nadu',
        district: 'Thanjavur',
        latitude: 10.7905,
        longitude: 78.7047,
        farmer_action: 'spray_immediately',
      });

      if (res.weather) {
        setWeather(res.weather);
      }
      if (res.weather_warning) {
        setWeatherWarning(res.weather_warning);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load weather data from backend service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackendWeather();
  }, []);

  return (
    <div className="space-y-6">
      {/* Title & Location Header */}
      <div className="p-6 bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800/80 rounded-xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Weather Intel - Hyper-Local Micro-Climate</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Real-time weather parameters retrieved via FarmSight live Open-Meteo integration backend.
          </p>
        </div>
        <button
          onClick={fetchBackendWeather}
          disabled={loading}
          className="px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition-colors flex items-center gap-2 self-start sm:self-auto shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Weather Data</span>
        </button>
      </div>

      {loading && (
        <div className="p-12 bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800/80 rounded-xl shadow-sm text-center max-w-lg mx-auto space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-500" />
          <h3 className="font-semibold text-base text-zinc-800 dark:text-zinc-200">
            Fetching Live Weather Forecast
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Connecting to backend weather services...
          </p>
        </div>
      )}

      {error && !loading && (
        <div className="p-6 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 rounded-xl text-xs text-rose-600 dark:text-rose-400 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div>
            <span className="font-semibold block text-sm mb-0.5">Weather Synchronization Error</span>
            <p>{error}</p>
          </div>
        </div>
      )}

      {weather && !loading && (
        <div className="space-y-6">
          {/* Status Badge Banner */}
          <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-brand-500 font-semibold">
              <MapPin className="w-4 h-4" />
              <span>Location: Thanjavur, Tamil Nadu (10.79° N, 78.70° E)</span>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-medium">
              Source: {weather.weather_source || 'Open-Meteo Live'}
            </span>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800/80 rounded-xl shadow-sm space-y-3">
              <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-medium">
                <span>Temperature</span>
                <Thermometer className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                {weather.temp != null ? `${weather.temp}°C` : 'N/A'}
              </div>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">Live ambient air temperature</p>
            </div>

            <div className="p-5 bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800/80 rounded-xl shadow-sm space-y-3">
              <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-medium">
                <span>Relative Humidity</span>
                <Droplets className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                {weather.humidity != null ? `${weather.humidity}%` : 'N/A'}
              </div>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">Current atmospheric moisture level</p>
            </div>

            <div className="p-5 bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800/80 rounded-xl shadow-sm space-y-3">
              <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-medium">
                <span>Rainfall Probability</span>
                <CloudSun className="w-4 h-4 text-brand-500" />
              </div>
              <div className={`text-3xl font-bold ${
                (weather.rain_prob ?? 0) > 60 ? 'text-rose-500' : 'text-emerald-500'
              }`}>
                {weather.rain_prob != null ? `${weather.rain_prob}%` : 'N/A'}
              </div>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">Next 24h precipitation estimate</p>
            </div>

            <div className="p-5 bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800/80 rounded-xl shadow-sm space-y-3">
              <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-medium">
                <span>Wind Velocity</span>
                <Wind className="w-4 h-4 text-teal-500" />
              </div>
              <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                {weather.wind != null ? `${weather.wind} km/h` : 'N/A'}
              </div>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">Surface wind speed at 10m</p>
            </div>
          </div>

          {/* Micro-Climate Agricultural Warning */}
          {weatherWarning && (
            <div className="p-6 bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800/80 rounded-xl shadow-sm space-y-3">
              <div className="flex items-center gap-2 font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                <ShieldAlert className="w-5 h-5 text-amber-500" />
                <span>Agricultural Weather Advisory</span>
              </div>
              <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                {weatherWarning}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
