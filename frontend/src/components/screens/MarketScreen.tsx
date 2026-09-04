import React, { useState, useEffect } from 'react';
import { TrendingUp, Truck, MapPin, DollarSign, Calculator, Info, Calendar, Database, RefreshCw, Award } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { translations, getLocalizedDisplay } from '../../i18n/translations';
import { VoiceButton } from '../VoiceButton';
import { MarketAnalysisResponse, MarketRecord } from '../../services/marketApi';

export const MarketScreen: React.FC = () => {
  const {
    language,
    selectedCrop,
    marketQuantityKg,
    setMarketQuantityKg,
    selectedMandiIndex,
    setSelectedMandiIndex,
    location,
    getMarketAnalysisCached,
  } = useApp();

  const t = translations[language] as any;

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<MarketAnalysisResponse | null>(null);

  const fetchMarketData = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await getMarketAnalysisCached({
        commodity: selectedCrop,
        state: location.state || 'Tamil Nadu',
        district: location.district || 'Madurai',
        quantity_kg: marketQuantityKg || 1000,
        user_lat: location.latitude,
        user_lng: location.longitude,
      });

      setData(res);
    } catch (err: any) {
      console.error('Error fetching market data:', err);
      setError(err?.message || 'Failed to fetch market data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketData();
  }, [selectedCrop, location.state, location.district, location.latitude, location.longitude, marketQuantityKg]);

  if (loading) {
    return (
      <div className="space-y-6 pb-24 pt-2 max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-center p-16 bg-white rounded-3xl border border-sage-200 shadow-card space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2F5436]"></div>
          <span className="text-base font-bold text-[#1D2A20]">
            {t.loadingMarketData || 'Fetching market data...'}
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 pb-24 pt-2 max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-3xl p-8 shadow-card text-center space-y-4">
          <p className="text-red-700 font-bold text-base">
            {t.errorMarketData || 'Unable to load market data.'} ({error})
          </p>
          <button
            onClick={fetchMarketData}
            type="button"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2F5436] text-white rounded-2xl font-bold shadow-xs hover:bg-[#1D2A20] transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>{t.retryButton || 'Retry'}</span>
          </button>
        </div>
      </div>
    );
  }

  const records: MarketRecord[] = data?.records || [];

  if (!data || records.length === 0) {
    return (
      <div className="space-y-6 pb-24 pt-2 max-w-7xl mx-auto">
        <div className="bg-white border border-sage-200 rounded-3xl p-8 shadow-card text-center space-y-4">
          <p className="text-[#3F4A42] font-bold text-lg">
            {t.emptyMarketData || 'No market records found for this crop & location.'}
          </p>
          <button
            onClick={fetchMarketData}
            type="button"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2F5436] text-white rounded-2xl font-bold shadow-xs hover:bg-[#1D2A20] transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>{t.retryButton || 'Retry'}</span>
          </button>
        </div>
      </div>
    );
  }

  const safeIndex = selectedMandiIndex < records.length ? selectedMandiIndex : 0;
  const currentRecord = records[safeIndex] || records[0];

  // Find index of record with highest modal_price
  const bestPriceIndex = records.reduce((maxIdx, rec, idx, arr) => {
    const currentPrice = rec.modal_price ?? -1;
    const maxPrice = arr[maxIdx]?.modal_price ?? -1;
    return currentPrice > maxPrice ? idx : maxIdx;
  }, 0);

  const isCurrentBestPrice = safeIndex === bestPriceIndex && (currentRecord.modal_price ?? 0) > 0;

  const dataSource = currentRecord.data_source || data.data_source || 'unavailable';
  const isFallback = dataSource === 'local_fallback';

  const modalPrice = currentRecord.modal_price;
  const minPrice = currentRecord.minimum_price;
  const maxPrice = currentRecord.maximum_price;
  const variety = currentRecord.variety;
  const arrivalDate = currentRecord.arrival_date;

  const localizedMandiName = getLocalizedDisplay(currentRecord.market || '', language);
  const localizedDistrictName = getLocalizedDisplay(currentRecord.district || '', language);
  const fullMandiLocation = localizedDistrictName ? `${localizedMandiName} (${localizedDistrictName})` : localizedMandiName;

  // Gross Revenue (Modal Price per Kg * Quantity)
  const grossRevenue = (modalPrice !== null && modalPrice !== undefined && marketQuantityKg)
    ? (marketQuantityKg * (modalPrice / 100.0))
    : null;

  // Transport Intelligence & Net Value
  const transportEst = (data as any)?.transport_estimate;
  const netValEst = (data as any)?.estimated_net_value;

  const hasTransportInfo = Boolean(
    (transportEst && transportEst.has_coordinates !== false && (transportEst.estimated_road_distance_km || transportEst.aerial_distance_km)) ||
    (netValEst && netValEst.transport_cost_rs !== null && netValEst.transport_cost_rs !== undefined && netValEst.transport_cost_rs > 0) ||
    ((data as any)?.estimated_transport_cost_rs && (data as any)?.estimated_transport_cost_rs > 0)
  );

  const transportCost: number | null = hasTransportInfo
    ? (netValEst?.transport_cost_rs ??
       (data as any)?.estimated_transport_cost_rs ??
       transportEst?.estimated_quantity_transport_cost_rs ??
       null)
    : null;

  const distanceKm: number | null = hasTransportInfo
    ? (transportEst?.estimated_road_distance_km ?? transportEst?.aerial_distance_km ?? null)
    : null;

  const netValue: number | null = (hasTransportInfo && grossRevenue !== null && transportCost !== null)
    ? (grossRevenue - transportCost)
    : null;

  const voiceNarrative = `${t.marketTitle}. ${t.currentModalPrice} ₹${modalPrice ?? 'N/A'} ${t.perQuintal}. ${t.bestNearbyMandi} ${localizedMandiName}. ${variety ? variety + '.' : ''} ${grossRevenue !== null ? t.grossRevenue + ' ₹' + Math.round(grossRevenue) + '.' : ''}`;

  return (
    <div className="space-y-6 pb-24 pt-2 max-w-7xl mx-auto">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-[#1D2A20] tracking-tight">{t.marketTitle}</h2>
          <p className="text-sm text-[#3F4A42] font-medium">
            {t[selectedCrop] || selectedCrop} {t.marketRatesTitle || 'Market Rates & Transport Return'}
          </p>
        </div>
        <VoiceButton variant="compact" textToSpeak={voiceNarrative} />
      </div>

      {/* Main Grid Container */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Price Header Card & Mandi Selector */}
        <div className="space-y-4">
          {/* Main Modal Price Card */}
          <div className="bg-gradient-to-br from-[#2F5436] via-[#2F5436] to-[#1D2A20] text-white rounded-3xl p-6 shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-sage-200 uppercase tracking-wider">
                    {t.currentModalPrice}
                  </span>
                  {isCurrentBestPrice && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-amber-950 border border-amber-300 shadow-xs flex items-center gap-1">
                      <Award className="w-3 h-3" />
                      <span>{t.bestPriceMarket || 'Best Price Market'}</span>
                    </span>
                  )}
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isFallback
                        ? 'bg-amber-500/30 text-amber-200 border border-amber-400/40'
                        : 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/40'
                    }`}
                  >
                    {isFallback
                      ? (t.recentSampleDataBadge || 'Recent Sample Data')
                      : (t.liveMarketData || t.liveRateTag || 'Live Market Data')}
                  </span>
                </div>

                <div className="text-4xl font-black tracking-tight">
                  ₹{modalPrice !== null ? modalPrice : 'N/A'}
                  <span className="text-sm font-semibold text-sage-200"> / {t.perQuintal}</span>
                </div>
              </div>

              <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white shrink-0">
                <TrendingUp className="w-8 h-8" />
              </div>
            </div>

            {/* Detailed Market Fields */}
            <div className="pt-3 border-t border-white/15 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-sage-200 block font-semibold">{t.bestNearbyMandi}</span>
                <span className="font-bold text-white text-sm">{fullMandiLocation}</span>
              </div>
              {variety && (
                <div>
                  <span className="text-sage-200 block font-semibold">{t.variety || 'Variety'}</span>
                  <span className="font-bold text-white text-sm">{variety}</span>
                </div>
              )}
              {minPrice !== null && minPrice !== undefined && (
                <div>
                  <span className="text-sage-200 block font-semibold">{t.minPrice || 'Min Price'}</span>
                  <span className="font-bold text-white">₹{minPrice} / qtl</span>
                </div>
              )}
              {maxPrice !== null && maxPrice !== undefined && (
                <div>
                  <span className="text-sage-200 block font-semibold">{t.maxPrice || 'Max Price'}</span>
                  <span className="font-bold text-white">₹{maxPrice} / qtl</span>
                </div>
              )}
              {arrivalDate && (
                <div>
                  <span className="text-sage-200 block font-semibold flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-sage-300" />
                    <span>{t.arrivalDate || 'Arrival Date'}</span>
                  </span>
                  <span className="font-bold text-white">{arrivalDate}</span>
                </div>
              )}
              <div>
                <span className="text-sage-200 block font-semibold flex items-center gap-1">
                  <Database className="w-3 h-3 text-sage-300" />
                  <span>{t.dataSource || 'Data Source'}</span>
                </span>
                <span className="font-bold text-white uppercase text-[11px]">{dataSource}</span>
              </div>
            </div>
          </div>

          {/* Mandi Selector List */}
          <div className="bg-white rounded-3xl p-5 border border-sage-200 shadow-card space-y-3">
            <label className="text-xs font-bold text-[#1D2A20] uppercase tracking-wider block">
              {t.availableMarkets || 'Available Markets'} ({records.length})
            </label>
            <div className="grid grid-cols-1 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
              {records.map((rec, idx) => {
                const isSelected = safeIndex === idx;
                const isBestPrice = idx === bestPriceIndex && (rec.modal_price ?? 0) > 0;
                const recMandiName = getLocalizedDisplay(rec.market, language);
                const recDistrictName = getLocalizedDisplay(rec.district, language);

                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedMandiIndex(idx)}
                    type="button"
                    className={`flex items-center justify-between p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#2F5436] bg-[#E7EFE3] text-[#1D2A20] font-bold shadow-xs'
                        : 'border-sage-200 bg-white text-[#3F4A42] hover:border-sage-300'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="text-sm font-bold text-[#1D2A20] flex items-center gap-2 flex-wrap">
                        <span>{recMandiName}</span>
                        {isBestPrice && (
                          <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-md font-bold flex items-center gap-0.5">
                            <Award className="w-3 h-3" />
                            {t.bestPriceMarket || 'Best Price Market'}
                          </span>
                        )}
                        {rec.variety && (
                          <span className="text-[10px] bg-sage-200/60 px-2 py-0.5 rounded-md font-medium text-[#2F5436]">
                            {rec.variety}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[#6F786F] font-medium flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#2F5436]" />
                        <span>{recDistrictName || rec.state}</span>
                      </div>
                      {rec.arrival_date && (
                        <div className="text-[11px] text-[#6F786F]">
                          {t.arrivalDate || 'Arrival'}: {rec.arrival_date}
                        </div>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-base font-black text-[#1D2A20]">
                        ₹{rec.modal_price !== null ? rec.modal_price : 'N/A'}
                      </div>
                      <div className="text-[11px] text-[#6F786F] font-semibold">{t.perQuintal}</div>
                      {(rec.minimum_price !== null || rec.maximum_price !== null) && (
                        <div className="text-[10px] text-[#6F786F] mt-0.5">
                          Min: ₹{rec.minimum_price ?? '-'} | Max: ₹{rec.maximum_price ?? '-'}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Harvest Quantity & Financial Breakdown */}
        <div className="space-y-4">
          {/* Harvest Quantity Numeric Input */}
          <div className="bg-white rounded-3xl p-5 border border-sage-200 shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <label htmlFor="harvest-quantity-input" className="text-xs font-bold text-[#1D2A20] uppercase tracking-wider flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-[#2F5436]" />
                <span>{t.harvestQuantityLabel || t.estimatedQuantity || 'Harvest Quantity'}</span>
              </label>
              <span className="text-sm font-bold text-[#2F5436] bg-[#E7EFE3] px-3 py-1 rounded-xl border border-sage-300">
                {(marketQuantityKg / 100).toFixed(1)} qtl
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <input
                  id="harvest-quantity-input"
                  type="number"
                  min="1"
                  max="50000"
                  value={marketQuantityKg || ''}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (isNaN(val)) {
                      setMarketQuantityKg(0);
                    } else {
                      setMarketQuantityKg(Math.max(1, Math.min(50000, val)));
                    }
                  }}
                  className="w-full px-4 py-3 bg-[#F9FBF8] border border-sage-300 rounded-2xl text-base font-bold text-[#1D2A20] focus:outline-none focus:ring-2 focus:ring-[#2F5436]"
                  placeholder="Enter quantity in kg"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[#6F786F]">
                  kg
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {[500, 1000, 2000, 5000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setMarketQuantityKg(preset)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    marketQuantityKg === preset
                      ? 'bg-[#2F5436] text-white shadow-xs'
                      : 'bg-sage-100 text-[#3F4A42] hover:bg-sage-200'
                  }`}
                >
                  {preset.toLocaleString()} kg
                </button>
              ))}
            </div>
          </div>

          {/* Financial Breakdown Card */}
          <div className="bg-white rounded-3xl p-6 border border-sage-200 shadow-card space-y-4">
            <h3 className="text-xs font-bold text-[#1D2A20] uppercase tracking-wider border-b border-sage-100 pb-3">
              {t.financialBreakdown}
            </h3>

            <div className="space-y-3 text-sm">
              {/* Gross Revenue */}
              {grossRevenue !== null ? (
                <div className="flex items-center justify-between">
                  <span className="text-[#3F4A42] flex items-center gap-2 font-medium">
                    <DollarSign className="w-4 h-4 text-[#416A47]" />
                    <span>{t.estimatedGrossValue || t.grossRevenue}</span>
                  </span>
                  <span className="font-bold text-[#1D2A20] text-base">
                    ₹{Math.round(grossRevenue).toLocaleString()}
                  </span>
                </div>
              ) : null}

              {/* Transport Cost & Distance */}
              {hasTransportInfo && transportCost !== null && transportCost > 0 ? (
                <div className="flex items-center justify-between">
                  <span className="text-[#3F4A42] flex items-center gap-2 font-medium">
                    <Truck className="w-4 h-4 text-[#C85B57]" />
                    <span>
                      {t.estimatedTransportCost || t.transportCost}
                      {distanceKm ? ` (${t.approxDistance || 'Approx.'}: ${distanceKm} km)` : ''}
                    </span>
                  </span>
                  <span className="font-bold text-[#C85B57] text-base">
                    - ₹{Math.round(transportCost).toLocaleString()}
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-between py-2 px-3.5 bg-amber-50/80 rounded-2xl border border-amber-200/70 text-xs">
                  <span className="text-[#3F4A42] flex items-center gap-2 font-medium">
                    <Truck className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>{t.estimatedTransportCost || t.transportCost}</span>
                  </span>
                  <span className="font-bold text-amber-700 text-right">
                    {t.transportUnavailable || 'Transport estimate unavailable'}
                  </span>
                </div>
              )}

              {/* Net Estimated Value Card */}
              {hasTransportInfo && netValue !== null && transportCost !== null && transportCost > 0 ? (
                <div className="p-5 rounded-2xl bg-[#2F5436] text-[#FFFFFF] flex items-center justify-between shadow-md mt-3">
                  <div>
                    <span className="text-xs text-sage-200 font-semibold block">
                      {t.estimatedNetReturn || t.estimatedNetValue}
                    </span>
                    <span className="text-3xl font-black tracking-tight">
                      ₹{Math.round(netValue).toLocaleString()}
                    </span>
                  </div>
                  <div className="px-3.5 py-1.5 bg-white/20 rounded-full text-xs font-bold text-white backdrop-blur-md">
                    {t.netProfitTag}
                  </div>
                </div>
              ) : (
                <div className="p-5 rounded-2xl bg-[#F9FBF8] border border-sage-200 flex flex-col gap-1 mt-3">
                  <span className="text-xs text-[#6F786F] font-bold uppercase tracking-wider block">
                    {t.estimatedNetReturn || t.estimatedNetValue}
                  </span>
                  <span className="text-sm font-bold text-amber-800">
                    {t.netReturnUnavailable || 'Unavailable until transport distance is known'}
                  </span>
                </div>
              )}
            </div>

            <div className="text-xs text-[#6F786F] flex items-start gap-1.5 pt-2 border-t border-sage-100">
              <Info className="w-4 h-4 text-[#2F5436] shrink-0 mt-0.5" />
              <span className="leading-relaxed">{t.netProfitNotice}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

