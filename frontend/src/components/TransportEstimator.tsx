import React, { useState } from 'react';
import { MapPin, Truck, AlertCircle, Loader2, Navigation, IndianRupee } from 'lucide-react';
import {
  fetchTransportEstimate,
  TransportEstimateResponse,
  TransportRequestParams,
} from '../services/transportApi';

// ---------------------------------------------------------------------------
// Props interface
//
// Live-location integration note
// --------------------------------
// `userLat` and `userLng` are optional props.  When the teammate's
// live-location feature is merged, App.tsx (or a location context) will
// supply these values automatically.  Until then, the component renders a
// manual coordinate input form so it works as a standalone module.
// ---------------------------------------------------------------------------
interface TransportEstimatorProps {
  /** Target mandi name — typically from MarketSense best_market.market */
  marketName?: string;
  /** Target district — from MarketSense best_market.district */
  district?: string;
  /** Target state — from MarketSense best_market.state */
  state?: string;
  /** Quantity in kg — forwarded from MarketSense quantity input */
  quantityKg?: number;
  /**
   * Farmer's latitude, degrees.
   * Wired from live-location when that feature is merged.
   */
  userLat?: number;
  /**
   * Farmer's longitude, degrees.
   * Wired from live-location when that feature is merged.
   */
  userLng?: number;
}

export default function TransportEstimator({
  marketName = '',
  district = '',
  state = '',
  quantityKg,
  userLat,
  userLng,
}: TransportEstimatorProps) {
  // ---------------------------------------------------------------------------
  // Local form state (used when live-location props are absent)
  // ---------------------------------------------------------------------------
  const [formMarket, setFormMarket] = useState<string>(marketName);
  const [formDistrict, setFormDistrict] = useState<string>(district);
  const [formState, setFormState] = useState<string>(state);
  const [formLat, setFormLat] = useState<string>(
    userLat !== undefined ? String(userLat) : ''
  );
  const [formLng, setFormLng] = useState<string>(
    userLng !== undefined ? String(userLng) : ''
  );
  const [formQty, setFormQty] = useState<string>(
    quantityKg !== undefined ? String(quantityKg) : ''
  );

  // ---------------------------------------------------------------------------
  // UI state
  // ---------------------------------------------------------------------------
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<(TransportEstimateResponse & {
    distance_source?: string;
    estimated_travel_duration?: string;
    ors_road_distance_km?: number | null;
  }) | null>(null);

  // Flags whether live-location coordinates were passed as props
  const locationComingFromProps = userLat !== undefined && userLng !== undefined;

  // Sync state if live location props change to defined values
  React.useEffect(() => {
    if (userLat !== undefined) {
      setFormLat(String(userLat));
    }
  }, [userLat]);

  React.useEffect(() => {
    if (userLng !== undefined) {
      setFormLng(String(userLng));
    }
  }, [userLng]);

  // ---------------------------------------------------------------------------
  // Handler
  // ---------------------------------------------------------------------------
  const handleEstimate = async (e: React.FormEvent) => {
    e.preventDefault();

    const resolvedLat = locationComingFromProps ? userLat : parseFloat(formLat);
    const resolvedLng = locationComingFromProps ? userLng : parseFloat(formLng);

    if (isNaN(resolvedLat) || isNaN(resolvedLng)) {
      setError('Please enter valid latitude and longitude values.');
      return;
    }

    const target = formMarket || marketName;
    const targetDistrict = formDistrict || district;
    const targetState = formState || state;

    if (!target || !targetState) {
      setError('Please enter a market name and state.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const params: TransportRequestParams = {
      market_name: target,
      district: targetDistrict,
      state: targetState,
      user_lat: resolvedLat,
      user_lng: resolvedLng,
    };

    const qty = formQty.trim() ? parseFloat(formQty) : (quantityKg ?? undefined);
    if (qty !== undefined && qty > 0) {
      params.quantity_kg = qty;
    }

    try {
      const data = await fetchTransportEstimate(params);
      setResult(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to estimate transport cost.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30">
          <Truck className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-semibold text-base text-zinc-950 dark:text-zinc-50">
            Transport Estimator
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Distance &amp; cost from your farm to the mandi
          </p>
        </div>
      </div>

      {/* Live-location notice */}
      {locationComingFromProps && (
        <div className="px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400">
          <Navigation className="w-3.5 h-3.5 shrink-0" />
          <span>Using live location ({userLat?.toFixed(4)}, {userLng?.toFixed(4)})</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleEstimate} className="space-y-3">
        {/* Market / District / State inputs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="flex flex-col">
            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
              Mandi / Market *
            </label>
            <input
              type="text"
              value={formMarket}
              onChange={(e) => setFormMarket(e.target.value)}
              placeholder="e.g. Gondal"
              required
              className="w-full bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-950 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
              District
            </label>
            <input
              type="text"
              value={formDistrict}
              onChange={(e) => setFormDistrict(e.target.value)}
              placeholder="e.g. Rajkot"
              className="w-full bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-950 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
              State *
            </label>
            <input
              type="text"
              value={formState}
              onChange={(e) => setFormState(e.target.value)}
              placeholder="e.g. Gujarat"
              required
              className="w-full bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-950 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Coordinates — hidden when live-location props supplied */}
        {!locationComingFromProps && (
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col">
              <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                Your Latitude *
                <span className="ml-1 text-zinc-400 dark:text-zinc-500 font-normal">(Live location will fill this)</span>
              </label>
              <input
                type="number"
                step="any"
                value={formLat}
                onChange={(e) => setFormLat(e.target.value)}
                placeholder="e.g. 22.1234"
                required
                className="w-full bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-950 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                Your Longitude *
                <span className="ml-1 text-zinc-400 dark:text-zinc-500 font-normal">(Live location will fill this)</span>
              </label>
              <input
                type="number"
                step="any"
                value={formLng}
                onChange={(e) => setFormLng(e.target.value)}
                placeholder="e.g. 70.5678"
                required
                className="w-full bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-950 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
              />
            </div>
          </div>
        )}

        {/* Quantity */}
        <div className="flex flex-col">
          <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
            Quantity (kg) — for total transport cost
          </label>
          <input
            type="number"
            value={formQty}
            onChange={(e) => setFormQty(e.target.value)}
            placeholder="e.g. 1000"
            min="0"
            className="w-full bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-950 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded-lg py-2.5 text-sm font-medium transition-colors shadow-sm flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Calculating...
            </>
          ) : (
            <>
              <Truck className="w-4 h-4" />
              Estimate Transport Cost
            </>
          )}
        </button>
      </form>

      {/* Error */}
      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-900/30 text-rose-800 dark:text-rose-400 rounded-xl flex gap-3 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
          <div>
            <span className="font-semibold block mb-0.5">Estimation Failed</span>
            {error}
          </div>
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        result.status === 'coordinate_unavailable' ? (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 text-amber-700 dark:text-amber-400 rounded-xl flex gap-3 text-sm">
            <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5 text-amber-500" />
            <div>
              <span className="font-semibold block mb-0.5">Transport Estimate Unavailable</span>
              {result.message || 'Transport estimate is unavailable for this market.'}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Distance + Cost cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Distance */}
              <div className="p-4 bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800/80 rounded-xl shadow-sm space-y-1.5">
                <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                  Road Distance
                </span>
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <MapPin className="w-4 h-4" />
                  <span className="text-xl font-bold">
                    {result.estimated_road_distance_km} <span className="text-xs font-normal text-zinc-400">km</span>
                  </span>
                </div>
                {result.distance_source === 'openrouteservice' ? (
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
                    Live road route • {result.estimated_travel_duration}
                  </p>
                ) : (
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
                    Fallback: aerial {result.aerial_distance_km} km &times; 1.3 road factor
                  </p>
                )}
              </div>

              {/* Base transport cost */}
              <div className="p-4 bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800/80 rounded-xl shadow-sm space-y-1.5">
                <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                  Base Transport Cost
                </span>
                <div className="flex items-center gap-1 text-zinc-900 dark:text-zinc-100">
                  <span className="text-xs text-zinc-400">Rs.</span>
                  <span className="text-xl font-bold">
                    {result.base_transport_cost_rs?.toLocaleString()}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
                  Rate: Rs.{result.cost_per_quintal_per_km}/qtl/km
                </p>
              </div>

              {/* Quantity-based cost */}
              <div className="p-4 bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800/80 rounded-xl shadow-sm space-y-1.5">
                <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                  {result.quantity_kg ? `Cost for ${result.quantity_kg} kg` : 'Quantity Cost'}
                </span>
                {result.estimated_quantity_transport_cost_rs !== null ? (
                  <>
                    <div className="flex items-center gap-1 text-emerald-600 dark:text-brand-500">
                      <IndianRupee className="w-4 h-4" />
                      <span className="text-xl font-bold">
                        {result.estimated_quantity_transport_cost_rs?.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
                      Total for {result.quantity_kg} kg to {result.market_name}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-zinc-400 dark:text-zinc-500">
                    Enter quantity above for total estimate
                  </p>
                )}
              </div>
            </div>

            {/* Mandi info + disclaimer */}
            <div className="p-3 bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-lg space-y-1">
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                <span className="font-medium">Mandi:</span> {result.market_name},&nbsp;
                {result.district}, {result.state}&nbsp;
                <span className="text-zinc-400">
                  ({result.mandi_lat !== null ? result.mandi_lat.toFixed(4) : ''}, {result.mandi_lng !== null ? result.mandi_lng.toFixed(4) : ''})
                </span>
              </p>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 italic leading-relaxed">
                {result.note}
              </p>
            </div>
          </div>
        )
      )}
    </div>
  );
}
