import { useState, useEffect } from 'react';
import { 
  Sliders, 
  CloudSun, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Loader2, 
  Sparkles,
  Info
} from 'lucide-react';
import { runWhatIf, WhatIfResponse } from '../services/whatifApi';

interface WhatIfSimulatorProps {
  initialCrop?: string;
  initialDisease?: string;
  initialConfidence?: number;
}

const FARMER_ACTIONS = [
  { id: 'spray_immediately', label: 'Spray Chemical Treatment Immediately' },
  { id: 'delay_spraying', label: 'Delay Spraying Until Weather Clears' },
  { id: 'apply_organic_fungicide', label: 'Apply Organic / Bio-control Measure' },
  { id: 'monitor_field', label: 'Monitor Field & Hold Chemical Application' },
];

export default function WhatIfSimulator({
  initialCrop = 'paddy',
  initialDisease = 'bacterial_leaf_blight',
  initialConfidence = 95.0,
}: WhatIfSimulatorProps) {
  const [crop, setCrop] = useState<string>(initialCrop);
  const [disease, setDisease] = useState<string>(initialDisease);
  const [confidence, setConfidence] = useState<number>(initialConfidence);

  const [state, setState] = useState<string>('Tamil Nadu');
  const [district, setDistrict] = useState<string>('Thanjavur');
  const [lat] = useState<number | undefined>(10.7905);
  const [lng] = useState<number | undefined>(78.7047);

  const [farmerAction, setFarmerAction] = useState<string>('spray_immediately');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [result, setResult] = useState<WhatIfResponse | null>(null);

  // Update internal state when props change
  useEffect(() => {
    if (initialCrop) setCrop(initialCrop);
    if (initialDisease) setDisease(initialDisease);
    if (initialConfidence) setConfidence(initialConfidence);
  }, [initialCrop, initialDisease, initialConfidence]);

  const handleSimulate = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await runWhatIf({
        crop,
        disease,
        confidence,
        state,
        district,
        latitude: lat ?? null,
        longitude: lng ?? null,
        farmer_action: farmerAction,
        language: 'en',
      });

      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Failed to execute What-If simulation.');
    } finally {
      setLoading(false);
    }
  };

  // Auto-run initial simulation on mount if disease is provided
  useEffect(() => {
    if (initialDisease && initialDisease !== 'normal' && initialDisease !== 'uncertain') {
      handleSimulate();
    }
  }, []);

  const formatName = (str: string) => {
    if (!str) return '';
    return str.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const getRiskBadgeColor = (riskLevel?: string) => {
    if (!riskLevel) return 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300';
    const lower = riskLevel.toLowerCase();
    if (lower.includes('high')) {
      return 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40';
    }
    if (lower.includes('lower') || lower.includes('low')) {
      return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-brand-500 border border-emerald-200 dark:border-emerald-900/40';
    }
    return 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40';
  };

  const simulationData = result?.whatif?.simulation;

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="p-6 bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800/80 rounded-xl shadow-sm">
        <h2 className="text-xl font-bold tracking-tight">What-If Treatment & Weather Risk Simulator</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Evaluate proposed treatment options against live weather forecasts to avoid wash-off losses and optimize agronomic decision-making.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Input Form */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800/80 rounded-xl shadow-sm space-y-5">
            <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800/80 pb-3">
              <Sliders className="w-5 h-5 text-emerald-500" />
              <h3 className="font-semibold text-base text-zinc-900 dark:text-zinc-50">Simulation Parameters</h3>
            </div>

            {/* Target Crop & Disease */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                  Crop Type
                </label>
                <select
                  value={crop}
                  onChange={(e) => setCrop(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="paddy">Paddy (Rice)</option>
                  <option value="cotton">Cotton</option>
                  <option value="groundnut">Groundnut</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                  Detected Condition
                </label>
                <input
                  type="text"
                  value={formatName(disease)}
                  onChange={(e) => setDisease(e.target.value.toLowerCase().replace(/ /g, '_'))}
                  className="w-full p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Location settings */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                  State
                </label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                  District
                </label>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Proposed Farmer Action */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                Farmer Proposed Action
              </label>
              <div className="space-y-2">
                {FARMER_ACTIONS.map((act) => (
                  <label
                    key={act.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer text-xs transition-all ${
                      farmerAction === act.id
                        ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/30 text-emerald-600 dark:text-brand-500 font-semibold'
                        : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="farmer_action"
                      value={act.id}
                      checked={farmerAction === act.id}
                      onChange={(e) => setFarmerAction(e.target.value)}
                      className="accent-emerald-500"
                    />
                    <span>{act.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 rounded-lg text-xs text-rose-600 dark:text-rose-400 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="button"
              disabled={loading}
              onClick={handleSimulate}
              className="w-full py-3 px-4 rounded-lg bg-brand-500 hover:bg-brand-600 text-white dark:text-zinc-950 font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Calculating Simulation Outcome...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Run What-If Simulation</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Required Output Display Cards */}
        <div className="lg:col-span-7 space-y-6">
          {!result && !loading && (
            <div className="p-12 bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800/80 rounded-xl shadow-sm text-center max-w-lg mx-auto space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-400 flex items-center justify-center">
                <Sliders className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-base text-zinc-800 dark:text-zinc-200">
                Ready for What-If Analysis
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Set your parameters on the left and click "Run What-If Simulation" to evaluate outcome predictions.
              </p>
            </div>
          )}

          {loading && (
            <div className="p-12 bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800/80 rounded-xl shadow-sm text-center max-w-lg mx-auto space-y-4">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-500" />
              <h3 className="font-semibold text-base text-zinc-800 dark:text-zinc-200">
                Running Agro-Climatic Simulation
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Gathering live weather data and assessing wash-off risk...
              </p>
            </div>
          )}

          {result && !loading && (
            <div className="space-y-6">
              {/* 1. CURRENT WEATHER CARD */}
              <div className="p-5 bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800/80 rounded-xl shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/80 pb-3">
                  <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-semibold text-sm">
                    <CloudSun className="w-5 h-5 text-amber-500" />
                    <span>Current Micro-Climate Weather</span>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-brand-500 font-medium border border-emerald-100 dark:border-emerald-900/30">
                    Source: {result.weather?.weather_source || 'Live Forecast'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                  <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800/60">
                    <span className="text-xs text-zinc-400 dark:text-zinc-500 block font-medium">Temperature</span>
                    <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-1 block">
                      {result.weather?.temp != null ? `${result.weather.temp}°C` : 'N/A'}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800/60">
                    <span className="text-xs text-zinc-400 dark:text-zinc-500 block font-medium">Relative Humidity</span>
                    <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-1 block">
                      {result.weather?.humidity != null ? `${result.weather.humidity}%` : 'N/A'}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800/60">
                    <span className="text-xs text-zinc-400 dark:text-zinc-500 block font-medium">Rain Probability</span>
                    <span className={`text-xl font-bold mt-1 block ${
                      (result.weather?.rain_prob ?? 0) > 60 ? 'text-rose-500' : 'text-emerald-500'
                    }`}>
                      {result.weather?.rain_prob != null ? `${result.weather.rain_prob}%` : 'N/A'}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800/60">
                    <span className="text-xs text-zinc-400 dark:text-zinc-500 block font-medium">Wind Speed</span>
                    <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-1 block">
                      {result.weather?.wind != null ? `${result.weather.wind} km/h` : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. SIMULATION OUTCOME & RISK LEVEL */}
              <div className="p-6 bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800/80 rounded-xl shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/80 pb-3">
                  <div className="flex items-center gap-2 font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                    <ShieldAlert className="w-5 h-5 text-brand-500" />
                    <span>Simulation Outcome</span>
                  </div>
                  {simulationData?.risk_level && (
                    <span className={`text-xs px-3 py-1 rounded-full font-semibold ${getRiskBadgeColor(simulationData.risk_level)}`}>
                      {simulationData.risk_level}
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="text-sm text-zinc-800 dark:text-zinc-200 font-medium leading-relaxed">
                    {simulationData?.simulation_outcome || result.whatif?.advisory_text || 'Simulation successfully computed for the specified crop and weather context.'}
                  </div>

                  {result.whatif?.advisory_text && (
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-900/40 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200 block mb-1">Farmer Advisory Summary</span>
                      {result.whatif.advisory_text}
                    </div>
                  )}
                </div>
              </div>

              {/* 3. RECOMMENDATION CARD */}
              {simulationData?.recommendation && (
                <div className="p-5 bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800/80 rounded-xl shadow-sm space-y-3">
                  <div className="flex items-center gap-2 font-semibold text-sm text-emerald-600 dark:text-brand-500">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Action Recommendation</span>
                  </div>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                    {simulationData.recommendation}
                  </p>
                </div>
              )}

              {/* 4. ESTIMATE NOTICE (DISCLAIMER) */}
              {simulationData?.estimate_notice && (
                <div className="p-4 bg-zinc-100/60 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/80 rounded-xl text-xs text-zinc-500 dark:text-zinc-400 flex items-start gap-2">
                  <Info className="w-4 h-4 shrink-0 text-zinc-400 mt-0.5" />
                  <span><strong>Estimate Notice:</strong> {simulationData.estimate_notice}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
