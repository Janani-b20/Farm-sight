import React from 'react';
import { TrendingUp, Truck, MapPin, DollarSign, Calculator, Info } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { translations, getLocalizedDisplay } from '../../i18n/translations';
import { MANDI_OPTIONS, calculateMarketMetrics } from '../../data/mockData';
import { VoiceButton } from '../VoiceButton';

export const MarketScreen: React.FC = () => {
  const {
    language,
    selectedCrop,
    marketQuantityKg,
    setMarketQuantityKg,
    selectedMandiIndex,
    setSelectedMandiIndex,
  } = useApp();

  const t = translations[language];

  const mandis = MANDI_OPTIONS[selectedCrop] || MANDI_OPTIONS.paddy;
  const metrics = calculateMarketMetrics(selectedCrop, selectedMandiIndex, marketQuantityKg);

  const localizedBestMandi = getLocalizedDisplay(metrics.market || '', language);

  const voiceNarrative = `${t.marketTitle}. ${t.currentModalPrice} ₹${metrics.modal_price} per quintal. ${t.bestNearbyMandi} ${localizedBestMandi}. ${t.grossRevenue} ₹${metrics.gross_revenue}. ${t.transportCost} ₹${metrics.transport_cost}. ${t.estimatedNetValue} ₹${metrics.estimated_net_value}.`;

  return (
    <div className="space-y-6 pb-24 pt-2 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-[#1D2A20] tracking-tight">{t.marketTitle}</h2>
          <p className="text-sm text-[#3F4A42] font-medium">
            {t[selectedCrop]} Market Rates & Transport Return
          </p>
        </div>
        <VoiceButton variant="compact" textToSpeak={voiceNarrative} />
      </div>

      {/* Main Container - Desktop 2 Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Price Header & Mandi Selector */}
        <div className="space-y-4">
          {/* Main Modal Price Card (Deep Green Header - NO dominant saturated orange) */}
          <div className="bg-gradient-to-br from-[#2F5436] via-[#2F5436] to-[#1D2A20] text-white rounded-3xl p-6 shadow-card flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-sage-200 uppercase tracking-wider">
                  {t.currentModalPrice}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/30 text-amber-200 text-[10px] font-bold">
                  {t.liveRateTag}
                </span>
              </div>

              <div className="text-4xl font-black tracking-tight">
                ₹{metrics.modal_price}
                <span className="text-sm font-semibold text-sage-200"> / {t.perQuintal}</span>
              </div>
              <p className="text-xs text-sage-100 mt-2 font-medium">
                {t.bestNearbyMandi}: <strong>{localizedBestMandi}</strong>
              </p>
            </div>

            <div className="w-16 h-16 rounded-3xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white shrink-0">
              <TrendingUp className="w-9 h-9" />
            </div>
          </div>

          {/* Mandi Selector */}
          <div className="bg-white rounded-3xl p-5 border border-sage-200 shadow-card space-y-3">
            <label className="text-xs font-bold text-[#1D2A20] uppercase tracking-wider block">
              {t.bestNearbyMandi}
            </label>
            <div className="grid grid-cols-1 gap-2.5">
              {mandis.map((mandi, idx) => {
                const isSelected = selectedMandiIndex === idx;
                const localizedMandiName = getLocalizedDisplay(mandi.name, language);
                const localizedDistrictName = getLocalizedDisplay(mandi.district, language);

                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedMandiIndex(idx)}
                    type="button"
                    className={`flex items-center justify-between p-4 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'border-[#2F5436] bg-[#E7EFE3] text-[#1D2A20] font-bold shadow-xs'
                        : 'border-sage-200 bg-white text-[#3F4A42] hover:border-sage-300'
                    }`}
                  >
                    <div>
                      <div className="text-sm font-bold text-[#1D2A20]">{localizedMandiName}</div>
                      <div className="text-xs text-[#6F786F] font-medium flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-[#2F5436]" />
                        <span>{localizedDistrictName} ({mandi.distanceKm} km {t.awayText})</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-black text-[#1D2A20]">₹{mandi.modalPrice}</div>
                      <div className="text-[11px] text-[#6F786F] font-semibold">{t.perQuintal}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Harvest Slider & Financial Breakdown */}
        <div className="space-y-4">
          {/* Harvest Quantity Slider */}
          <div className="bg-white rounded-3xl p-5 border border-sage-200 shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#1D2A20] uppercase tracking-wider flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-[#2F5436]" />
                <span>{t.estimatedQuantity}</span>
              </label>
              <span className="text-base font-black text-[#1D2A20] bg-[#E7EFE3] px-3.5 py-1 rounded-xl border border-sage-300">
                {marketQuantityKg} kg ({(marketQuantityKg / 100).toFixed(1)} qtl)
              </span>
            </div>

            <input
              type="range"
              min="100"
              max="5000"
              step="100"
              value={marketQuantityKg}
              onChange={(e) => setMarketQuantityKg(Number(e.target.value))}
              className="w-full accent-[#2F5436] cursor-pointer h-2.5 bg-sage-100 rounded-lg"
            />
            <div className="flex justify-between text-xs text-[#6F786F] font-bold">
              <span>100 kg</span>
              <span>2,500 kg</span>
              <span>5,000 kg</span>
            </div>
          </div>

          {/* Financial Breakdown Card */}
          <div className="bg-white rounded-3xl p-6 border border-sage-200 shadow-card space-y-4">
            <h3 className="text-xs font-bold text-[#1D2A20] uppercase tracking-wider border-b border-sage-100 pb-3">
              {t.financialBreakdown}
            </h3>

            <div className="space-y-3 text-sm">
              {/* Gross Revenue */}
              <div className="flex items-center justify-between">
                <span className="text-[#3F4A42] flex items-center gap-2 font-medium">
                  <DollarSign className="w-4 h-4 text-[#416A47]" />
                  <span>{t.grossRevenue}</span>
                </span>
                <span className="font-bold text-[#1D2A20] text-base">
                  ₹{metrics.gross_revenue?.toLocaleString()}
                </span>
              </div>

              {/* Transport Cost */}
              <div className="flex items-center justify-between">
                <span className="text-[#3F4A42] flex items-center gap-2 font-medium">
                  <Truck className="w-4 h-4 text-[#C85B57]" />
                  <span>{t.transportCost} ({metrics.distance_km} km)</span>
                </span>
                <span className="font-bold text-[#C85B57] text-base">
                  - ₹{metrics.transport_cost?.toLocaleString()}
                </span>
              </div>

              {/* Net Estimated Return Card */}
              <div className="p-5 rounded-2xl bg-[#2F5436] text-[#FFFFFF] flex items-center justify-between shadow-md mt-3">
                <div>
                  <span className="text-xs text-sage-200 font-semibold block">
                    {t.estimatedNetValue}
                  </span>
                  <span className="text-3xl font-black tracking-tight">
                    ₹{metrics.estimated_net_value?.toLocaleString()}
                  </span>
                </div>
                <div className="px-3.5 py-1.5 bg-white/20 rounded-full text-xs font-bold text-white backdrop-blur-md">
                  {t.netProfitTag}
                </div>
              </div>
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
