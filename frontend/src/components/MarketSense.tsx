import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  MapPin,
  IndianRupee,
  AlertCircle,
  HelpCircle,
  Loader2,
  Navigation,
  Compass
} from 'lucide-react';
import { fetchMarketAnalysis, MarketAnalysisResponse, MarketRecord } from '../services/marketApi';
import TransportEstimator from './TransportEstimator';

export interface UserLocation {
  latitude: number;
  longitude: number;
  district?: string;
  state?: string;
}

interface MarketSenseProps {
  darkMode?: boolean;
  /** External location provided by teammate's Live Location module/context */
  userLocation?: UserLocation;
  /** Optional callback when farmer requests location refresh */
  onRefreshLocation?: () => void;
}

export default function MarketSense({
  userLocation,
  onRefreshLocation
}: MarketSenseProps) {
  // Mode State (Live Location ON by default)
  const [useLiveLocation, setUseLiveLocation] = useState<boolean>(true);

  // Manual Mode coordinates entered in the TransportEstimator manual coordinate inputs
  const [manualCoordinates, setManualCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);

  // Effective location coordinates — consumed strictly from teammate props when Live Location is ON, or manual coordinates input when OFF
  const effectiveLat = useLiveLocation ? userLocation?.latitude : (manualCoordinates?.latitude ?? undefined);
  const effectiveLng = useLiveLocation ? userLocation?.longitude : (manualCoordinates?.longitude ?? undefined);

  // Form State
  const [commodity, setCommodity] = useState<string>('Cotton');
  const [stateName, setStateName] = useState<string>('Gujarat');
  const [district, setDistrict] = useState<string>('Amreli');
  const [market, setMarket] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('1000');

  // UI Flow State
  const [loading, setLoading] = useState<boolean>(false);
  const [showResults, setShowResults] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Analysis Result States
  // State-wide results across major markets
  const [analysisResult, setAnalysisResult] = useState<MarketAnalysisResponse | null>(null);
  // District-level results for nearby mandis
  const [districtResult, setDistrictResult] = useState<MarketAnalysisResponse | null>(null);

  // Farmer's selected target market for transportation calculation (defaults to best market)
  const [selectedMarketOverride, setSelectedMarketOverride] = useState<MarketRecord | null>(null);

  // Location Refresh Handler (Delegates to teammate's location handler or callback)
  const handleLocationRefresh = () => {
    if (onRefreshLocation) {
      onRefreshLocation();
    }
  };

  // LIVE ANALYSIS ENGINE
  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();

    // Determine target location strictly from userLocation when Live Location mode is active.
    // When Live Location is ON, ONLY the teammate-provided state/district/coordinates are used.
    // If Live Location is ON and userLocation is missing or incomplete, show "Waiting for Live Location..."
    if (useLiveLocation) {
      if (!userLocation || !userLocation.latitude || !userLocation.longitude || !userLocation.state) {
        setError('Waiting for Live Location...');
        return;
      }
    }

    const activeState = useLiveLocation ? userLocation?.state : stateName;
    const activeDistrict = useLiveLocation ? (userLocation?.district ?? '') : district;

    if (!commodity || !activeState) {
      setError(
        useLiveLocation
          ? 'Waiting for Live Location...'
          : 'State is required.'
      );
      return;
    }

    setLoading(true);
    setError(null);
    setAnalysisResult(null);
    setDistrictResult(null);
    setSelectedMarketOverride(null);

    try {
      if (useLiveLocation && activeDistrict.trim()) {
        // Dual-Level Location Query:
        // 1. Fetch District-level / Nearby markets
        // 2. Fetch State-level markets across all major mandis
        const [distData, stateData] = await Promise.all([
          fetchMarketAnalysis(commodity, activeState, activeDistrict.trim(), undefined, Number(quantity), effectiveLat, effectiveLng),
          fetchMarketAnalysis(commodity, activeState, undefined, undefined, Number(quantity), effectiveLat, effectiveLng)
        ]);

        setDistrictResult(distData);
        setAnalysisResult(stateData);
      } else {
        // Single Query
        const data = await fetchMarketAnalysis(commodity, activeState, activeDistrict, market, Number(quantity), effectiveLat, effectiveLng);
        setAnalysisResult(data);
      }
      setShowResults(true);
    } catch (err: any) {
      console.error('Error fetching market analysis:', err);
      setError(err.message || 'Failed to fetch market data.');
    } finally {
      setLoading(false);
    }
  };

  // targetMarketAnalysis holds the specific analysis of the selected targetMarket (including its coordinates, distance, and net value)
  const [targetMarketAnalysis, setTargetMarketAnalysis] = useState<MarketAnalysisResponse | null>(null);

  // Resolve best/selected target market for transportation calculation
  const targetMarket = selectedMarketOverride || analysisResult?.best_market || districtResult?.best_market;

  React.useEffect(() => {
    if (!targetMarket) {
      setTargetMarketAnalysis(null);
      return;
    }

    const fetchTargetAnalysis = async () => {
      try {
        const data = await fetchMarketAnalysis(
          commodity,
          targetMarket.state,
          targetMarket.district,
          targetMarket.market,
          Number(quantity),
          effectiveLat,
          effectiveLng
        );
        setTargetMarketAnalysis(data);
      } catch (err) {
        console.error('Error fetching target market analysis:', err);
      }
    };

    fetchTargetAnalysis();
  }, [targetMarket, commodity, quantity, effectiveLat, effectiveLng]);

  const activeState = useLiveLocation ? userLocation?.state : stateName;
  const activeDistrict = useLiveLocation ? (userLocation?.district ?? '') : district;

  const isRecent = analysisResult?.data_status === 'recent' || districtResult?.data_status === 'recent';
  const lastUpdated = districtResult?.last_updated || analysisResult?.last_updated;
  const districtUnavailable = !!(analysisResult?.district_unavailable || districtResult?.district_unavailable);

  return (
    <div className="space-y-6">

      {/* Introduction Banner */}
      <div className="p-6 bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800/80 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">MarketSense</h2>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed max-w-3xl">
            Make smarter selling decisions with mandi market intelligence. Analyze historical and current mandi price information from across the country to estimate farm value and choose optimal wholesale markets.
          </p>
        </div>

        {/* Live Location Mode Toggle */}
        <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-900 p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 shrink-0 self-start md:self-center">
          <button
            type="button"
            onClick={() => setUseLiveLocation(true)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
              useLiveLocation
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            Live Location ON
          </button>
          <button
            type="button"
            onClick={() => setUseLiveLocation(false)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
              !useLiveLocation
                ? 'bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-950 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            Manual Mode
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* Input Parameters Panel */}
        <form onSubmit={handleAnalyze} className="lg:col-span-1 p-5 bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800/80 rounded-xl shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm uppercase tracking-wider">Analysis Options</h3>
            <span className="text-[11px] font-medium text-emerald-600 dark:text-brand-500 bg-emerald-500/10 px-2 py-0.5 rounded-md">
              {useLiveLocation ? '📍 Location-Based' : '⚙️ Manual'}
            </span>
          </div>

          {/* Location Badge when Live Location is ON */}
          {useLiveLocation && (
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-emerald-700 dark:text-brand-500 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  Farmer Location Input
                </span>
                {onRefreshLocation && (
                  <button
                    type="button"
                    onClick={handleLocationRefresh}
                    className="text-[10px] text-emerald-600 dark:text-brand-500 hover:underline flex items-center gap-1 font-medium"
                  >
                    <Navigation className="w-3 h-3" />
                    Refresh Location
                  </button>
                )}
              </div>
              <p className="text-zinc-600 dark:text-zinc-300 font-medium">
                {userLocation && userLocation.state ? (
                  `${userLocation.state}${userLocation.district ? ` • ${userLocation.district} District` : ''}`
                ) : (
                  <span className="italic text-zinc-400">Waiting for Live Location...</span>
                )}
              </p>
              <div className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
                {effectiveLat !== undefined && effectiveLng !== undefined
                  ? `Coordinates: ${effectiveLat.toFixed(4)}°N, ${effectiveLng.toFixed(4)}°E`
                  : 'Coordinates: Waiting for Live Location...'}
              </div>
            </div>
          )}

          {/* Commodity Selector */}
          <div className="flex flex-col">
            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Select Crop / Commodity *</label>
            <select
              value={commodity}
              onChange={(e) => setCommodity(e.target.value)}
              className="w-full bg-[#ffffff] dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-[12px] py-[8px] text-sm text-zinc-950 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
              required
            >
              <option value="Cotton">Cotton</option>
              <option value="Paddy">Paddy</option>
              <option value="Groundnut">Groundnut</option>
            </select>
          </div>

          {/* State Input */}
          <div className="flex flex-col">
            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">State Name *</label>
            <input
              type="text"
              value={stateName}
              onChange={(e) => setStateName(e.target.value)}
              placeholder="e.g. Gujarat, Punjab"
              className="w-full bg-[#ffffff] dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-[12px] py-[8px] text-sm text-zinc-950 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
              required
            />
          </div>

          {/* District Input */}
          <div className="flex flex-col">
            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
              District {useLiveLocation ? '(Detected)' : '(Optional)'}
            </label>
            <input
              type="text"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              placeholder="e.g. Amreli, Amritsar"
              className="w-full bg-[#ffffff] dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-[12px] py-[8px] text-sm text-zinc-950 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
            />
          </div>

          {/* Mandi/Market Input (only in manual mode) */}
          {!useLiveLocation && (
            <div className="flex flex-col">
              <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Mandi / Market (Optional)</label>
              <input
                type="text"
                value={market}
                onChange={(e) => setMarket(e.target.value)}
                placeholder="e.g. Bhavnagar, Tarn Taran"
                className="w-full bg-[#ffffff] dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-[12px] py-[8px] text-sm text-zinc-950 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
              />
            </div>
          )}

          {/* Quantity Input */}
          <div className="flex flex-col">
            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Quantity (kg)</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="e.g. 1000"
              min="0"
              className="w-full bg-[#ffffff] dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-[12px] py-[8px] text-sm text-zinc-950 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-500 hover:bg-brand-600 disabled:bg-brand-500/50 text-white dark:text-zinc-950 rounded-lg py-2.5 text-sm font-medium transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Querying Live Mandis...
              </>
            ) : (
              <>
                <TrendingUp className="w-4 h-4" />
                {useLiveLocation ? 'Analyze Location Markets' : 'Analyze Market'}
              </>
            )}
          </button>
        </form>

        {/* Results Panel */}
        <div className="lg:col-span-2 space-y-6">
          {!showResults && !loading && !error && (
            <div className="p-12 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-xl flex flex-col items-center text-center space-y-3 bg-white/40 dark:bg-transparent">
              <div className="p-3 bg-zinc-100 dark:bg-zinc-900 text-zinc-400 dark:text-zinc-600 rounded-full">
                <HelpCircle className="w-8 h-8" />
              </div>
              <h4 className="font-semibold text-lg text-zinc-950 dark:text-zinc-50">No Active Analysis</h4>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm max-w-md">
                Select your crop and click "{useLiveLocation ? 'Analyze Location Markets' : 'Analyze Market'}" to discover district-level and state-wide mandi rates.
              </p>
            </div>
          )}

          {error && (
            <div className="p-5 bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-900/30 text-rose-800 dark:text-rose-400 rounded-xl flex gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
              <div className="text-sm">
                <span className="font-semibold block mb-1">Analysis Failed</span>
                {error}
              </div>
            </div>
          )}

          {showResults && !loading && (analysisResult?.valid_records_analyzed === 0) && (districtResult?.valid_records_analyzed === 0 || !districtResult) && (
            <div className="p-5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 text-amber-800 dark:text-amber-400 rounded-xl flex gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-amber-500" />
              <div className="text-sm">
                <span className="font-semibold block mb-1">No Mandi Records Found</span>
                No daily price records are currently available for <strong>{commodity}</strong> in <strong>{stateName}</strong>{district ? ` (${district} district)` : ''}. Please verify the spelling or check a different region/crop combination.
              </div>
            </div>
          )}

          {loading && (
            <div className="p-12 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0c0c0f] rounded-xl flex flex-col items-center justify-center space-y-4 my-12 min-h-[300px]">
              <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
              <p className="text-sm text-zinc-500 dark:text-zinc-400 animate-pulse">Fetching live data.gov.in mandi rates & running market analytics...</p>
            </div>
          )}

          {showResults && !loading && ((analysisResult && analysisResult.valid_records_analyzed > 0) || (districtResult && districtResult.valid_records_analyzed > 0)) && (
            <div className="space-y-6 animate-fade-in">

              {isRecent && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 rounded-xl flex items-center gap-2 text-sm font-semibold">
                  <span>🟠 Recent government market price. Last updated: {lastUpdated || 'N/A'}</span>
                </div>
              )}

              {districtUnavailable && (
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 text-yellow-800 dark:text-yellow-400 rounded-xl flex items-center gap-2 text-sm">
                  <span>No recent <strong>{commodity}</strong> price available for <strong>{activeDistrict}</strong>. Recent <strong>{activeState}</strong> market alternatives:</span>
                </div>
              )}

              {/* Data Source Transparency Badge */}
              <div className="flex items-center justify-between px-1 text-xs">
                <span className="text-zinc-500 dark:text-zinc-400 font-medium">Data Source:</span>
                {(analysisResult?.data_source === 'local_fallback' || districtResult?.data_source === 'local_fallback') ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium border border-amber-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                    🟡 Backup market data
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-brand-500 font-medium border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    🟢 Live data.gov.in
                  </span>
                )}
              </div>

              {/* KPI Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                {/* Best Market */}
                <div className="p-4 bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800/80 rounded-xl shadow-sm space-y-2">
                  <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Best Overall Market</span>
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-brand-500">
                    <MapPin className="w-4 h-4 shrink-0" />
                    <span className="font-bold text-sm truncate">{targetMarket?.market || analysisResult?.best_market?.market || 'N/A'}</span>
                  </div>
                  <div className="text-xl font-bold flex items-baseline gap-1">
                    <span className="text-xs text-zinc-400">Rs.</span>
                    {targetMarket?.modal_price || analysisResult?.best_market?.modal_price || 0}
                    <span className="text-xs text-zinc-400 font-normal">/ Qtl</span>
                  </div>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
                    {targetMarket?.district} District • Variety: {targetMarket?.variety || 'N/A'}
                  </p>
                </div>

                {/* Price extremes */}
                <div className="p-4 bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800/80 rounded-xl shadow-sm space-y-2">
                  <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Price Extremes</span>
                  <div className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
                    High: Rs. {analysisResult?.price_summary.highest_modal_price ?? districtResult?.price_summary.highest_modal_price ?? 0}
                  </div>
                  <div className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
                    Low: Rs. {analysisResult?.price_summary.lowest_modal_price ?? districtResult?.price_summary.lowest_modal_price ?? 0}
                  </div>
                  <div className="text-[10px] text-zinc-400 dark:text-zinc-500">
                    Avg modal: Rs. {analysisResult?.price_summary.average_modal_price ?? districtResult?.price_summary.average_modal_price ?? 0} / Qtl
                  </div>
                </div>

                {/* Price Trend */}
                <div className="p-4 bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800/80 rounded-xl shadow-sm space-y-2">
                  <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Price Trend</span>
                  <div className="flex items-center gap-1.5">
                    {(analysisResult?.price_trend?.trend_direction || districtResult?.price_trend?.trend_direction) === 'increasing' ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-brand-500 text-xs font-semibold flex items-center gap-0.5">
                        <TrendingUp className="w-3.5 h-3.5" />
                        +{(analysisResult?.price_trend?.percentage_change ?? districtResult?.price_trend?.percentage_change ?? 0)}%
                      </span>
                    ) : (analysisResult?.price_trend?.trend_direction || districtResult?.price_trend?.trend_direction) === 'decreasing' ? (
                      <span className="px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-0.5">
                        <TrendingDown className="w-3.5 h-3.5" />
                        {(analysisResult?.price_trend?.percentage_change ?? districtResult?.price_trend?.percentage_change ?? 0)}%
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-xs font-semibold flex items-center gap-0.5">
                        Stable
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-zinc-400 dark:text-zinc-500 leading-normal">
                    Market intelligence report for {commodity} ({stateName})
                  </div>
                </div>

              </div>

              {/* Farmer Estimated Gross Value */}
              {(analysisResult?.estimated_gross_value || districtResult?.estimated_gross_value) && (
                <div className="p-5 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-4">
                  <div className="p-3 bg-emerald-500/20 text-emerald-600 dark:text-brand-500 rounded-lg">
                    <IndianRupee className="w-6 h-6" />
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <h4 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">Estimated Gross Revenue</h4>
                    <div className="text-2xl font-bold flex items-baseline gap-1 text-emerald-600 dark:text-brand-500">
                      <span>Rs.</span>
                      {((quantity ? parseFloat(quantity) : 1000) * ((targetMarket?.modal_price || 0) / 100.0)).toLocaleString()}
                    </div>
                    <div className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
                      Based on quantity of {quantity || 1000} kg @ selected market price ({targetMarket?.market} - Rs. {((targetMarket?.modal_price ?? 0) / 100).toFixed(2)}/kg)
                    </div>
                  </div>
                </div>
              )}

              {/* Financial Flow Section (Net Value and Transport Details) */}
              {(targetMarketAnalysis?.estimated_net_value && targetMarketAnalysis.estimated_net_value.net_value_rs !== null) ? (() => {
                  const netVal = targetMarketAnalysis.estimated_net_value;
                  const tEst = targetMarketAnalysis.transport_estimate;

                  if (!netVal || !tEst) return null;

                  return (
                    <div className="p-5 bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm space-y-4">
                      <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/80 pb-2">
                        <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 uppercase tracking-wider flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-emerald-500" />
                          Net Revenue Flow ({tEst.market_name})
                        </h4>
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 italic">
                          Demo rates mapping
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Gross value */}
                        <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 rounded-lg">
                          <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                            Gross Crop Value
                          </span>
                          <div className="text-lg font-bold text-zinc-800 dark:text-zinc-200 mt-1">
                            Rs. {netVal.gross_value_rs?.toLocaleString()}
                          </div>
                          <div className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">
                            Quantity: {netVal.quantity_kg} kg
                          </div>
                        </div>

                        {/* Transport deductions */}
                        <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 rounded-lg">
                          <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                            Transport ({tEst.transport_type_display || tEst.transport_type})
                          </span>
                          <div className="text-lg font-bold text-red-600 dark:text-red-400 mt-1">
                            - Rs. {netVal.transport_cost_rs?.toLocaleString()}
                          </div>
                          <div className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1 leading-normal">
                            Distance: {tEst.estimated_road_distance_km} km ({tEst.distance_source === 'openrouteservice' ? 'Live route' : 'Fallback'})
                            {tEst.estimated_travel_duration && ` • ${tEst.estimated_travel_duration}`}
                          </div>
                        </div>

                        {/* Net Value */}
                        <div className="p-4 bg-emerald-500/10 dark:bg-emerald-950/20 border border-emerald-500/20 rounded-lg">
                          <span className="text-[10px] font-semibold text-emerald-600 dark:text-brand-500 uppercase tracking-wider">
                            Estimated Net Value
                          </span>
                          <div className="text-lg font-bold text-emerald-600 dark:text-brand-500 mt-1">
                            Rs. {netVal.net_value_rs?.toLocaleString()}
                          </div>
                          <div className="text-[10px] text-emerald-500/80 dark:text-brand-400 mt-1 font-medium">
                            Expected pocket revenue after freight
                          </div>
                        </div>
                      </div>

                      <div className="text-[10px] text-zinc-400 dark:text-zinc-500 border-t border-zinc-100 dark:border-zinc-800/80 pt-2">
                        <strong>Calculation Basis:</strong> {netVal.calculation_basis}
                      </div>
                    </div>
                  );
                })() : (
                  <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-500 dark:text-zinc-400 space-y-1">
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">Net Revenue Estimation:</span>
                    <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                      {targetMarketAnalysis?.estimated_net_value?.calculation_basis || "Location coordinates are required to calculate transportation freight and estimate net value."}
                    </p>
                  </div>
                )}

              {/* SECTION 1: DISTRICT-LEVEL / NEARBY MARKETS */}
              {districtResult && districtResult.valid_records_analyzed > 0 && (
                <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
                  <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-zinc-950 dark:text-zinc-50 uppercase tracking-wider flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-emerald-500" />
                        1. Nearby / District Markets ({district} District)
                      </h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                        Wholesale mandis operating within your local district area
                      </p>
                    </div>
                    <span className="text-xs text-emerald-600 dark:text-brand-500 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-full">
                      {districtResult.valid_records_analyzed} Mandis
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-medium">
                          <th className="px-5 py-3">Market</th>
                          <th className="px-5 py-3">District</th>
                          <th className="px-5 py-3">Variety</th>
                          <th className="px-5 py-3 text-right">Modal Price</th>
                          <th className="px-5 py-3 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                        {districtResult.market_comparison.map((item: any, index: number) => {
                          const isSelected = targetMarket?.market === item.market;
                          const isBestDist = item.market === districtResult.best_market?.market;
                          return (
                            <tr
                              key={index}
                              onClick={() => setSelectedMarketOverride(item)}
                              className={`cursor-pointer transition-colors ${
                                isSelected
                                  ? 'bg-emerald-500/10 dark:bg-emerald-950/20 font-medium'
                                  : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/40'
                              }`}
                            >
                              <td className="px-5 py-3 flex items-center gap-1.5 font-medium">
                                {item.market}
                                {isBestDist && (
                                  <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-brand-500 rounded px-1.5 py-0.5 font-semibold">
                                    Best District
                                  </span>
                                )}
                              </td>
                              <td className="px-5 py-3 text-zinc-500 dark:text-zinc-400">{item.district}</td>
                              <td className="px-5 py-3 text-zinc-500 dark:text-zinc-400">{item.variety}</td>
                              <td className="px-5 py-3 text-right font-semibold text-zinc-900 dark:text-zinc-100">
                                Rs. {item.modal_price}
                              </td>
                              <td className="px-5 py-3 text-center">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedMarketOverride(item);
                                  }}
                                  className={`text-xs px-2 py-1 rounded transition-colors ${
                                    isSelected
                                      ? 'bg-emerald-500 text-white font-medium'
                                      : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300'
                                  }`}
                                >
                                  {isSelected ? 'Selected' : 'Select'}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* SECTION 2: STATE-LEVEL MARKETS */}
              {analysisResult && analysisResult.valid_records_analyzed > 0 && (
                <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
                  <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-zinc-950 dark:text-zinc-50 uppercase tracking-wider flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-blue-500" />
                        {useLiveLocation ? '2. State-Level Markets' : 'Mandi Price Comparison'} ({stateName})
                      </h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                        Compare district prices against major wholesale mandis across the state
                      </p>
                    </div>
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold bg-blue-500/10 px-2.5 py-1 rounded-full">
                      {analysisResult.valid_records_analyzed} State Mandis
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-medium">
                          <th className="px-5 py-3">Market</th>
                          <th className="px-5 py-3">District</th>
                          <th className="px-5 py-3">Variety</th>
                          <th className="px-5 py-3 text-right">Modal Price</th>
                          <th className="px-5 py-3 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                        {analysisResult.market_comparison.map((item: any, index: number) => {
                          const isSelected = targetMarket?.market === item.market;
                          const isBestState = item.market === analysisResult.best_market?.market;
                          return (
                            <tr
                              key={index}
                              onClick={() => setSelectedMarketOverride(item)}
                              className={`cursor-pointer transition-colors ${
                                isSelected
                                  ? 'bg-emerald-500/10 dark:bg-emerald-950/20 font-medium'
                                  : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/40'
                              }`}
                            >
                              <td className="px-5 py-3 flex items-center gap-1.5 font-medium">
                                {item.market}
                                {isBestState && (
                                  <span className="text-[10px] bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded px-1.5 py-0.5 font-semibold">
                                    Best State
                                  </span>
                                )}
                              </td>
                              <td className="px-5 py-3 text-zinc-500 dark:text-zinc-400">{item.district}</td>
                              <td className="px-5 py-3 text-zinc-500 dark:text-zinc-400">{item.variety}</td>
                              <td className="px-5 py-3 text-right font-semibold text-zinc-900 dark:text-zinc-100">
                                Rs. {item.modal_price}
                              </td>
                              <td className="px-5 py-3 text-center">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedMarketOverride(item);
                                  }}
                                  className={`text-xs px-2 py-1 rounded transition-colors ${
                                    isSelected
                                      ? 'bg-emerald-500 text-white font-medium'
                                      : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300'
                                  }`}
                                >
                                  {isSelected ? 'Selected' : 'Select'}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Transportation Estimate Section */}
              <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800/80 rounded-xl shadow-sm p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="font-bold text-xs text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                    Transport Freight Calculator
                  </h4>
                  {targetMarket && (
                    <span className="text-xs text-emerald-600 dark:text-brand-500 font-medium">
                      Target: <strong>{targetMarket.market}</strong> ({targetMarket.district})
                    </span>
                  )}
                </div>
                <TransportEstimator
                  key={`${targetMarket?.market}-${targetMarket?.district}-${quantity}`}
                  marketName={targetMarket?.market}
                  district={targetMarket?.district}
                  state={targetMarket?.state}
                  quantityKg={quantity ? parseFloat(quantity) : undefined}
                  userLat={useLiveLocation ? effectiveLat : undefined}
                  userLng={useLiveLocation ? effectiveLng : undefined}
                  onCoordinatesChange={(lat, lng) => {
                    if (lat !== undefined && lng !== undefined) {
                      setManualCoordinates({ latitude: lat, longitude: lng });
                    } else {
                      setManualCoordinates(null);
                    }
                  }}
                />
              </div>

            </div>
          )}
        </div>

      </div>

    </div>
  );
}
