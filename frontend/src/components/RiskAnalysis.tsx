import { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  AlertTriangle, 
  CloudSun, 
  TrendingUp, 
  Stethoscope, 
  Loader2 
} from 'lucide-react';
import { runWhatIf, WhatIfResponse } from '../services/whatifApi';
import { fetchMarketAnalysis, MarketAnalysisResponse } from '../services/marketApi';

interface RiskAnalysisProps {
  lastCrop?: string;
  lastDisease?: string;
  lastConfidence?: number;
}

export default function RiskAnalysis({
  lastCrop = 'paddy',
  lastDisease = 'bacterial_leaf_blight',
  lastConfidence = 95.0,
}: RiskAnalysisProps) {
  const [whatIfResult, setWhatIfResult] = useState<WhatIfResponse | null>(null);
  const [marketResult, setMarketResult] = useState<MarketAnalysisResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRiskSummary = async () => {
      setLoading(true);
      setError(null);
      try {
        const [wRes, mRes] = await Promise.all([
          runWhatIf({
            crop: lastCrop,
            disease: lastDisease,
            confidence: lastConfidence,
            state: 'Tamil Nadu',
            district: 'Thanjavur',
            farmer_action: 'spray_immediately',
          }),
          fetchMarketAnalysis('Paddy', 'Tamil Nadu', 'Thanjavur').catch(() => null),
        ]);

        setWhatIfResult(wRes);
        setMarketResult(mRes);
      } catch (err: any) {
        setError(err.message || 'Failed to load risk analysis parameters.');
      } finally {
        setLoading(false);
      }
    };

    fetchRiskSummary();
  }, [lastCrop, lastDisease, lastConfidence]);

  const weather = whatIfResult?.weather;
  const simulation = whatIfResult?.whatif?.simulation;

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="p-6 bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800/80 rounded-xl shadow-sm">
        <h2 className="text-xl font-bold tracking-tight">Risk Analysis Dashboard</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Unified multi-hazard risk assessment aggregating crop disease threat, weather wash-off risk, and mandi price volatility.
        </p>
      </div>

      {loading && (
        <div className="p-12 bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800/80 rounded-xl shadow-sm text-center max-w-lg mx-auto space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-500" />
          <h3 className="font-semibold text-base text-zinc-800 dark:text-zinc-200">
            Synthesizing Risk Parameters
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Evaluating disease, weather forecast, and market volatility data...
          </p>
        </div>
      )}

      {error && !loading && (
        <div className="p-6 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 rounded-xl text-xs text-rose-600 dark:text-rose-400 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <div>
            <span className="font-semibold block text-sm mb-0.5">Risk Analysis Synchronization Error</span>
            <p>{error}</p>
          </div>
        </div>
      )}

      {!loading && whatIfResult && (
        <div className="space-y-6">
          {/* Risk Overview Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 1. Disease Threat Risk */}
            <div className="p-5 bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800/80 rounded-xl shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">1. Disease Pathogen Risk</span>
                <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/30 text-rose-500">
                  <Stethoscope className="w-4 h-4" />
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100 capitalize">
                  {lastDisease.replace(/_/g, ' ')}
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-semibold border border-rose-200 dark:border-rose-900/40">
                    Confidence: {lastConfidence.toFixed(1)}%
                  </span>
                </div>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed pt-1">
                Active disease pathogen requiring treatment intervention before spreading across fields.
              </p>
            </div>

            {/* 2. Weather Treatment Risk */}
            <div className="p-5 bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800/80 rounded-xl shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">2. Weather Wash-off Risk</span>
                <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-500">
                  <CloudSun className="w-4 h-4" />
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  {simulation?.risk_level || 'Evaluated via What-If'}
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                    Rain Prob: {weather?.rain_prob ?? 'N/A'}% | Hum: {weather?.humidity ?? 'N/A'}%
                  </span>
                </div>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed pt-1">
                {simulation?.simulation_outcome || 'Live micro-climate weather risk for chemical application.'}
              </p>
            </div>

            {/* 3. Market Volatility Risk */}
            <div className="p-5 bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800/80 rounded-xl shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">3. Market Volatility Risk</span>
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-500">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100 capitalize">
                  {marketResult?.price_trend?.trend_direction || 'Stable Market'}
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                    {marketResult?.best_market?.market ? `Best Mandi: ${marketResult.best_market.market}` : 'Live Mandi Sync'}
                  </span>
                </div>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed pt-1">
                Prices tracked live from national OGD market dataset endpoints.
              </p>
            </div>
          </div>

          {/* Unified Risk Mitigation Advice */}
          <div className="p-6 bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800/80 rounded-xl shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-semibold text-sm border-b border-zinc-100 dark:border-zinc-800/80 pb-3">
              <ShieldAlert className="w-5 h-5 text-emerald-500" />
              <span>Integrated Risk Mitigation Strategy</span>
            </div>
            <div className="space-y-3 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
              <p>
                <strong>Disease Action:</strong> Follow the prescribed treatment for <span className="capitalize">{lastDisease.replace(/_/g, ' ')}</span> specified in Crop Doctor.
              </p>
              <p>
                <strong>Weather Timing:</strong> {simulation?.recommendation || 'Check live rain forecasts before applying spray treatments to ensure product retention.'}
              </p>
              <p>
                <strong>Market Strategy:</strong> Cross-check mandi prices in MarketSense before shipping crop produce to maximize net realization after transport costs.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
