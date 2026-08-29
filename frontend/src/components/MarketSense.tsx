import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  MapPin,
  IndianRupee,
  AlertCircle,
  HelpCircle,
  Loader2
} from 'lucide-react';
import { fetchMarketAnalysis, MarketAnalysisResponse, MarketRecord } from '../services/marketApi';
import TransportEstimator from './TransportEstimator';

interface MarketSenseProps {
  darkMode?: boolean;
}

export default function MarketSense({}: MarketSenseProps) {
  // Form State
  const [commodity, setCommodity] = useState<string>('Cotton');
  const [stateName, setStateName] = useState<string>('Gujarat');
  const [district, setDistrict] = useState<string>('');
  const [market, setMarket] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('1000');

  // UI Flow State
  const [loading, setLoading] = useState<boolean>(false);
  const [showResults, setShowResults] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Result State
  const [analysisResult, setAnalysisResult] = useState<MarketAnalysisResponse | null>(null);

  // LIVE ANALYSIS ENGINE
  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commodity || !stateName) return;

    setLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const data = await fetchMarketAnalysis(commodity, stateName, district, market, quantity);
      setAnalysisResult(data);
      setShowResults(true);
    } catch (err: any) {
      console.error('Error fetching market analysis:', err);
      setError(err.message || 'Failed to fetch market data.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* Introduction Banner */}
      <div className="p-6 bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800/80 rounded-xl shadow-sm">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">MarketSense</h2>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed max-w-3xl">
          Make smarter selling decisions with mandi market intelligence. Analyze historical and current mandi price information from across the country to estimate farm value and choose optimal wholesale markets.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* Input Parameters Panel */}
        <form onSubmit={handleAnalyze} className="lg:col-span-1 p-5 bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800/80 rounded-xl shadow-sm space-y-4">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm uppercase tracking-wider">Analysis Options</h3>

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
            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">District (Optional)</label>
            <input
              type="text"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              placeholder="e.g. Amreli, Amritsar"
              className="w-full bg-[#ffffff] dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-[12px] py-[8px] text-sm text-zinc-950 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
            />
          </div>

          {/* Mandi/Market Input */}
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
                Analyzing Mandis...
              </>
            ) : (
              <>
                <TrendingUp className="w-4 h-4" />
                Analyze Market
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
                Select your crop and location filters on the left panel, and click "Analyze Market" to view mandi rates.
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

          {showResults && !loading && analysisResult && analysisResult.valid_records_analyzed === 0 && (
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
              <p className="text-sm text-zinc-500 dark:text-zinc-400 animate-pulse">Running data aggregation algorithms...</p>
            </div>
          )}

          {showResults && !loading && analysisResult && analysisResult.valid_records_analyzed > 0 && (
            <div className="space-y-6 animate-fade-in">

              {/* Data Source Transparency Badge */}
              <div className="flex items-center justify-between px-1 text-xs">
                <span className="text-zinc-500 dark:text-zinc-400">Data Source:</span>
                {analysisResult.data_source === 'local_fallback' || analysisResult.data_source === 'farmer.in' ? (
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
                  <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Best Market</span>
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-brand-500">
                    <MapPin className="w-4 h-4" />
                    <span className="font-bold text-sm">{analysisResult.best_market?.market || 'N/A'}</span>
                  </div>
                  <div className="text-xl font-bold flex items-baseline gap-1">
                    <span className="text-xs text-zinc-400">Rs.</span>
                    {analysisResult.best_market?.modal_price || 0}
                    <span className="text-xs text-zinc-400 font-normal">/ Qtl</span>
                  </div>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500">Variety: {analysisResult.best_market?.variety || 'N/A'}</p>
                </div>

                {/* Price extremes */}
                <div className="p-4 bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800/80 rounded-xl shadow-sm space-y-2">
                  <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Price extremes</span>
                  <div className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
                    High: Rs. {analysisResult.price_summary.highest_modal_price}
                  </div>
                  <div className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
                    Low: Rs. {analysisResult.price_summary.lowest_modal_price}
                  </div>
                  <div className="text-[10px] text-zinc-400 dark:text-zinc-500">Avg modal: Rs. {analysisResult.price_summary.average_modal_price} / Qtl</div>
                </div>

                {/* Price Trend */}
                <div className="p-4 bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800/80 rounded-xl shadow-sm space-y-2">
                  <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Price Trend</span>
                  <div className="flex items-center gap-1.5">
                    {analysisResult.price_trend.trend_direction === 'increasing' ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-brand-500 text-xs font-semibold flex items-center gap-0.5">
                        <TrendingUp className="w-3.5 h-3.5" />
                        +{analysisResult.price_trend.percentage_change}%
                      </span>
                    ) : analysisResult.price_trend.trend_direction === 'decreasing' ? (
                      <span className="px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-0.5">
                        <TrendingDown className="w-3.5 h-3.5" />
                        {analysisResult.price_trend.percentage_change}%
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-xs font-semibold flex items-center gap-0.5">
                        Stable
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-zinc-400 dark:text-zinc-500 leading-normal">
                    Trend from {analysisResult.price_trend.oldest_date} to {analysisResult.price_trend.newest_date}
                  </div>
                </div>

              </div>

              {/* Farmer Estimated Gross Value */}
              {analysisResult.estimated_gross_value && (
                <div className="p-5 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-4">
                  <div className="p-3 bg-emerald-500/20 text-emerald-600 dark:text-brand-500 rounded-lg">
                    <IndianRupee className="w-6 h-6" />
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <h4 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">Estimated Gross Revenue</h4>
                    <div className="text-2xl font-bold flex items-baseline gap-1 text-emerald-600 dark:text-brand-500">
                      <span>Rs.</span>
                      {analysisResult.estimated_gross_value.gross_value_rs.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
                      Based on quantity of {analysisResult.estimated_gross_value.quantity_kg} kg @ best market price (Rs. {((analysisResult.best_market?.modal_price ?? 0) / 100).toFixed(2)}/kg)
                    </div>
                  </div>
                </div>
              )}

              {/* Market Comparison Table */}
              <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800/80">
                  <h4 className="font-bold text-sm text-zinc-950 dark:text-zinc-50 uppercase tracking-wider">Mandi Price Comparison</h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-medium">
                        <th className="px-5 py-3">Market</th>
                        <th className="px-5 py-3">District</th>
                        <th className="px-5 py-3">State</th>
                        <th className="px-5 py-3">Variety</th>
                        <th className="px-5 py-3 text-right">Modal Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                      {analysisResult.market_comparison.map((item: MarketRecord, index: number) => (
                        <tr
                          key={index}
                          className={`hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors ${
                            item.market === (analysisResult.best_market ? analysisResult.best_market.market : '')

                              ? 'bg-emerald-500/5 dark:bg-emerald-950/10 font-medium'
                              : ''
                          }`}
                        >
                          <td className="px-5 py-3 flex items-center gap-1.5">
                            {item.market}
                            {item.market === analysisResult.best_market?.market && (
                              <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-brand-500 rounded px-1.5 py-0.5 font-semibold">Best</span>
                            )}
                          </td>
                          <td className="px-5 py-3 text-zinc-500 dark:text-zinc-400">{item.district}</td>
                          <td className="px-5 py-3 text-zinc-500 dark:text-zinc-400">{item.state}</td>
                          <td className="px-5 py-3 text-zinc-500 dark:text-zinc-400">{item.variety}</td>
                          <td className="px-5 py-3 text-right font-semibold text-zinc-900 dark:text-zinc-100">
                            Rs. {item.modal_price}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Transportation Estimate */}
              {/* userLat / userLng are omitted intentionally — wire from live-location context when merged */}
              <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800/80 rounded-xl shadow-sm p-5">
                <TransportEstimator
                  marketName={analysisResult.best_market?.market}
                  district={analysisResult.best_market?.district}
                  state={analysisResult.best_market?.state}
                  quantityKg={quantity ? parseFloat(quantity) : undefined}
                />
              </div>

            </div>
          )}
        </div>

      </div>

    </div>
  );
}
