import React from 'react';
import { ClipboardList, Stethoscope, Zap, Sparkles, CloudSun, TrendingUp, Landmark } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { translations, getLocalizedDisplay } from '../i18n/translations';
import { getDiseaseName } from '../i18n/diseaseNames';
import { getSchemeTranslation } from '../i18n/schemeTranslations';
import { SchemeItem } from '../services/schemeApi';
import { MarketAnalysisResponse } from '../services/marketApi';
import { VoiceButton } from './VoiceButton';

interface ActionPlanCardProps {
  bestOptionLabel?: string | null;
  weatherData?: any;
  marketData?: MarketAnalysisResponse | null;
  topScheme?: SchemeItem | null;
}

export const ActionPlanCard: React.FC<ActionPlanCardProps> = ({
  bestOptionLabel,
  weatherData,
  marketData,
  topScheme,
}) => {
  const { language, selectedCrop, diagnosisState } = useApp();
  const t = translations[language];

  const result = diagnosisState.result;

  // 1. Disease Status
  let diseaseSection: { statusText: string; isHealthy: boolean } | null = null;
  if (result) {
    if (result.status === 'disease_detected') {
      const dName = getDiseaseName(result.disease, language);
      diseaseSection = {
        statusText: `${selectedCrop.toUpperCase()} — ${dName}`,
        isHealthy: false,
      };
    } else if (result.status === 'normal') {
      diseaseSection = {
        statusText: `${selectedCrop.toUpperCase()} — ${t.healthyStateTitle}`,
        isHealthy: true,
      };
    }
  }

  // 2. Immediate Action
  let immediateActionText: string | null = null;
  if (result && result.status === 'disease_detected') {
    if (result.treatment && result.treatment.length > 0) {
      immediateActionText = result.treatment[0];
    } else if (result.what_to_do_now && result.what_to_do_now.length > 0) {
      immediateActionText = result.what_to_do_now[0];
    }
  }

  // 3. Best Decision (What-If)
  const bestDecisionText = bestOptionLabel || null;

  // 4. Weather Check
  let weatherText: string | null = null;
  if (result && result.weather_warning) {
    weatherText = result.weather_warning;
  } else if (weatherData) {
    const rain = weatherData.rain_prob ?? weatherData.rain_probability ?? null;
    const wind = weatherData.wind ?? weatherData.wind_speed ?? null;
    const humidity = weatherData.humidity ?? null;

    if (rain !== null && rain >= 60) {
      weatherText = t.insightHighRain;
    } else if (wind !== null && wind >= 20) {
      weatherText = t.insightHighWind;
    } else if (humidity !== null && humidity >= 80) {
      weatherText = t.insightHighHumidity;
    } else {
      weatherText = t.insightSuitable;
    }
  }

  // 5. Market Decision
  let marketText: string | null = null;
  if (marketData && marketData.records && marketData.records.length > 0) {
    const topMandi = marketData.best_market || marketData.records[0];
    const mandiName = getLocalizedDisplay(topMandi.market, language);
    const modalPriceVal = topMandi.modal_price ?? (topMandi as any).price ?? 0;
    const priceStr = `₹${Number(modalPriceVal).toLocaleString('en-IN')}/qtl`;
    const netReturnVal = (topMandi as any).estimated_net_return ?? (topMandi as any).net_return;

    if (netReturnVal != null && netReturnVal > 0) {
      const netStr = `₹${Math.round(netReturnVal).toLocaleString('en-IN')}`;
      marketText = `${mandiName}: ${priceStr} (${t.estimatedNetReturn}: ${netStr})`;
    } else {
      marketText = `${mandiName}: ${priceStr}`;
    }
  }

  // 6. Government Support
  let schemeText: string | null = null;
  if (topScheme) {
    const loc = getSchemeTranslation(topScheme.scheme_id, language, topScheme);
    const benefitText = loc.benefit || topScheme.benefit;
    schemeText = `${topScheme.scheme_name}${benefitText ? ` — ${benefitText}` : ''}`;
  }

  // Check if at least 1 valid section exists
  const hasData =
    diseaseSection !== null ||
    immediateActionText !== null ||
    bestDecisionText !== null ||
    weatherText !== null ||
    marketText !== null ||
    schemeText !== null;

  if (!hasData) {
    return (
      <div className="bg-gradient-to-br from-[#1D2A20] via-[#2F5436] to-[#1D2A20] text-white rounded-3xl p-5 md:p-6 shadow-card border border-sage-500/30 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md text-white flex items-center justify-center font-bold">
              <ClipboardList className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white tracking-tight">{t.yourActionPlanTitle}</h3>
              <p className="text-xs text-sage-200 font-medium">{selectedCrop.toUpperCase()} • FarmSight Summary</p>
            </div>
          </div>
        </div>
        <p className="text-xs md:text-sm text-sage-100 font-medium leading-relaxed bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
          {t.actionPlanFallbackCTA}
        </p>
      </div>
    );
  }

  // Construct TTS Speech String
  const speechParts: string[] = [`${t.yourActionPlanTitle}.`];
  if (diseaseSection) speechParts.push(`${t.diseaseStatus}: ${diseaseSection.statusText}.`);
  if (immediateActionText) speechParts.push(`${t.immediateAction}: ${immediateActionText}.`);
  if (bestDecisionText) speechParts.push(`${t.bestDecision}: ${bestDecisionText}.`);
  if (weatherText) speechParts.push(`${t.weatherCheck}: ${weatherText}.`);
  if (marketText) speechParts.push(`${t.marketDecision}: ${marketText}.`);
  if (schemeText) speechParts.push(`${t.governmentSupport}: ${schemeText}.`);
  const actionPlanSpeechText = speechParts.join(' ');

  return (
    <div className="bg-gradient-to-br from-[#1D2A20] via-[#2F5436] to-[#1D2A20] text-white rounded-3xl p-5 md:p-6 shadow-card border border-sage-500/30 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/15 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md text-white flex items-center justify-center font-bold">
            <ClipboardList className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white tracking-tight">
              {t.yourActionPlanTitle}
            </h3>
            <p className="text-xs text-sage-200 font-medium">
              {selectedCrop.toUpperCase()} • FarmSight Summary
            </p>
          </div>
        </div>

        {/* Action Plan Voice Button */}
        <VoiceButton
          textToSpeak={actionPlanSpeechText}
          className="shrink-0 text-white"
        />
      </div>

      {/* Sections Grid */}
      <div className="space-y-2.5 text-xs md:text-sm">
        {/* 1. Disease */}
        {diseaseSection && (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 flex items-start gap-3 border border-white/10">
            <Stethoscope className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-[11px] font-bold text-sage-300 uppercase tracking-wider block">
                {t.diseaseStatus}
              </span>
              <span className="font-bold text-white">{diseaseSection.statusText}</span>
            </div>
          </div>
        )}

        {/* 2. Immediate Action */}
        {immediateActionText && (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 flex items-start gap-3 border border-white/10">
            <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-[11px] font-bold text-sage-300 uppercase tracking-wider block">
                {t.immediateAction}
              </span>
              <span className="font-medium text-white">{immediateActionText}</span>
            </div>
          </div>
        )}

        {/* 3. Best Decision */}
        {bestDecisionText && (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 flex items-start gap-3 border border-white/10">
            <Sparkles className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
            <div>
              <span className="text-[11px] font-bold text-sage-300 uppercase tracking-wider block">
                {t.bestDecision}
              </span>
              <span className="font-bold text-emerald-200">{bestDecisionText}</span>
            </div>
          </div>
        )}

        {/* 4. Weather Check */}
        {weatherText && (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 flex items-start gap-3 border border-white/10">
            <CloudSun className="w-4 h-4 text-sky-300 shrink-0 mt-0.5" />
            <div>
              <span className="text-[11px] font-bold text-sage-300 uppercase tracking-wider block">
                {t.weatherCheck}
              </span>
              <span className="font-medium text-white">{weatherText}</span>
            </div>
          </div>
        )}

        {/* 5. Market Decision */}
        {marketText && (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 flex items-start gap-3 border border-white/10">
            <TrendingUp className="w-4 h-4 text-lime-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-[11px] font-bold text-sage-300 uppercase tracking-wider block">
                {t.marketDecision}
              </span>
              <span className="font-medium text-white">{marketText}</span>
            </div>
          </div>
        )}

        {/* 6. Government Support */}
        {schemeText && (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 flex items-start gap-3 border border-white/10">
            <Landmark className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
            <div>
              <span className="text-[11px] font-bold text-sage-300 uppercase tracking-wider block">
                {t.governmentSupport}
              </span>
              <span className="font-medium text-white">{schemeText}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
