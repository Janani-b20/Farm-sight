import React from 'react';
import { Camera, CloudSun, TrendingUp, HelpCircle, Lightbulb, ChevronRight, Sprout } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { translations, getLocalizedDisplay } from '../../i18n/translations';
import { MOCK_WEATHER_DATA, MANDI_OPTIONS } from '../../data/mockData';

export const HomeScreen: React.FC = () => {
  const { language, setActiveTab, selectedCrop, triggerDiagnosis } = useApp();
  const t = translations[language];

  const weather = MOCK_WEATHER_DATA[language];
  const market = MANDI_OPTIONS[selectedCrop][0];
  const localizedMandiName = getLocalizedDisplay(market.name, language);

  const handleStartScan = () => {
    setActiveTab('diagnose');
    triggerDiagnosis(selectedCrop, 'disease');
  };

  return (
    <div className="space-y-6 pb-24 pt-2 max-w-7xl mx-auto">
      {/* Primary "Check My Crop" Hero Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#2F5436] via-[#2F5436] to-[#1D2A20] text-white rounded-3xl p-6 md:p-8 shadow-card border border-sage-500/20">
        <div className="max-w-2xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white shrink-0">
              <Camera className="w-6 h-6" />
            </div>
            <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full backdrop-blur-md">
              {t.aiCropDiagnosisTag}
            </span>
          </div>

          <h2 className="text-2xl md:text-3xl font-black tracking-tight leading-snug">
            {t.checkCropHeroTitle}
          </h2>
          <p className="text-sm md:text-base text-sage-100 mt-2 leading-relaxed font-normal">
            {t.checkCropHeroSubtitle}
          </p>

          <div className="mt-6 flex flex-col sm:flex-row gap-3 max-w-md">
            <button
              onClick={handleStartScan}
              type="button"
              className="w-full sm:w-auto bg-white hover:bg-sage-50 text-[#2F5436] font-bold text-base py-3.5 px-6 rounded-2xl shadow-md flex items-center justify-center gap-3 active:scale-98 transition-all min-h-[48px]"
            >
              <Camera className="w-5 h-5 text-[#2F5436]" />
              <span>{t.startScanButton}</span>
              <ChevronRight className="w-5 h-5 ml-auto text-[#416A47]" />
            </button>
          </div>
        </div>
      </div>

      {/* Responsive Grid for Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Weather Today Summary Card */}
        <div
          onClick={() => setActiveTab('weather')}
          className="bg-white rounded-3xl p-5 border border-sage-200 shadow-card hover:border-[#416A47] transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-2xl bg-[#E7EFE3] flex items-center justify-center text-[#2F5436]">
                <CloudSun className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-[#416A47] group-hover:translate-x-1 transition-transform flex items-center gap-1">
                <span>{t.viewDetails}</span>
                <ChevronRight className="w-4 h-4" />
              </span>
            </div>
            <p className="text-xs font-bold text-[#6F786F] uppercase tracking-wider">{t.weatherTodayTitle}</p>
            <div className="text-3xl font-black text-[#1D2A20] mt-1">
              {weather.temperature}°C
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-sage-100 flex items-center justify-between text-xs">
            <span className="text-[#3F4A42] font-semibold">{weather.condition}</span>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-[#1D2A20] font-bold text-xs">
              {weather.humidity}% {t.humidity}
            </span>
          </div>
        </div>

        {/* Market Summary Card */}
        <div
          onClick={() => setActiveTab('market')}
          className="bg-white rounded-3xl p-5 border border-sage-200 shadow-card hover:border-[#416A47] transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-2xl bg-[#E7EFE3] flex items-center justify-center text-[#2F5436]">
                <TrendingUp className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-[#416A47] group-hover:translate-x-1 transition-transform flex items-center gap-1">
                <span>{t.viewDetails}</span>
                <ChevronRight className="w-4 h-4" />
              </span>
            </div>
            <p className="text-xs font-bold text-[#6F786F] uppercase tracking-wider">{t.marketSummaryTitle}</p>
            <div className="text-3xl font-black text-[#1D2A20] mt-1">
              ₹{market.modalPrice}
              <span className="text-xs font-medium text-[#6F786F]"> / {t.perQuintal}</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-sage-100 flex items-center justify-between text-xs">
            <span className="text-[#3F4A42] font-semibold truncate max-w-[150px]">
              {localizedMandiName}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#E7EFE3] text-[#2F5436] font-bold text-xs">
              {t[selectedCrop]}
            </span>
          </div>
        </div>

        {/* What-If Shortcut Card */}
        <div
          onClick={() => setActiveTab('whatif')}
          className="bg-[#E7EFE3] rounded-3xl p-5 border border-sage-200 shadow-card hover:border-[#416A47] transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-2xl bg-[#2F5436] text-white flex items-center justify-center mb-3">
              <HelpCircle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#1D2A20]">{t.whatIfShortcutTitle}</h3>
            <p className="text-xs text-[#3F4A42] mt-1 leading-relaxed">
              {t.whatIfSubtitle}
            </p>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs font-bold text-[#2F5436]">
            <span>{t.viewDetails}</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* Today's Insight Banner Card */}
      <div className="bg-white rounded-3xl p-6 border border-sage-200 shadow-card">
        <div className="flex items-center gap-2 mb-2 text-[#D99A45]">
          <Lightbulb className="w-6 h-6 text-[#D99A45]" />
          <h3 className="text-base font-bold text-[#1D2A20]">{t.todayInsightTitle}</h3>
        </div>
        <p className="text-sm text-[#3F4A42] leading-relaxed font-normal">
          {weather.farmingImpact}
        </p>
        <div className="mt-4 pt-3 border-t border-sage-100 flex items-center justify-between text-xs">
          <span className="text-[#2F5436] font-bold flex items-center gap-1.5">
            <Sprout className="w-4 h-4 text-[#416A47]" />
            <span>{t[selectedCrop]}</span>
          </span>
          <span className="px-3 py-1 rounded-full bg-amber-100 text-[#1D2A20] font-bold text-xs">
            {weather.weatherRisk} {t.weatherRiskTag}
          </span>
        </div>
      </div>
    </div>
  );
};
