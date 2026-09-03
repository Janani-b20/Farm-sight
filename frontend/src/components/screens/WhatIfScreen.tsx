import React from 'react';
import { CloudSun, CheckCircle2, AlertTriangle, DollarSign } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  translations,
  getRiskLabel,
} from '../../i18n/translations';
import { MOCK_WHATIF_SCENARIOS } from '../../data/mockData';
import { VoiceButton } from '../VoiceButton';

export const WhatIfScreen: React.FC = () => {
  const { language, whatIfOption, setWhatIfOption, selectedCrop } = useApp();
  const t = translations[language];

  const scenario = MOCK_WHATIF_SCENARIOS[whatIfOption]?.[language] || MOCK_WHATIF_SCENARIOS.wait_weather[language];
  const sim = scenario.simulation;

  const options = [
    { id: 'wait_weather', label: t.optionWait, rec: true },
    { id: 'treat_now', label: t.optionTreatNow, rec: false },
    { id: 'bio_control', label: t.optionBioControl, rec: false },
    { id: 'monitor_first', label: t.optionMonitor, rec: false },
  ];

  return (
    <div className="space-y-6 pb-24 pt-2 max-w-7xl mx-auto">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-black text-[#1D2A20] tracking-tight">{t.whatIfTitle}</h2>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#E7EFE3] text-[#2F5436] border border-sage-300">
            {t[selectedCrop]}
          </span>
        </div>
        <p className="text-sm text-[#3F4A42] font-medium mt-0.5">{t.whatIfSubtitle}</p>
      </div>

      {/* Options Tab Selector - Responsive 4-Column Grid on Desktop */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-[#E7EFE3] p-2 rounded-3xl border border-sage-200">
        {options.map((opt) => {
          const isActive = whatIfOption === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => setWhatIfOption(opt.id)}
              type="button"
              className={`p-3.5 rounded-2xl text-xs md:text-sm font-bold transition-all text-center flex flex-col items-center justify-center min-h-[56px] relative ${
                isActive
                  ? 'bg-[#2F5436] text-white shadow-md'
                  : 'bg-white text-[#1D2A20] hover:bg-sage-50 border border-sage-100'
              }`}
            >
              {opt.rec && (
                <span className="absolute -top-2.5 bg-[#D99A45] text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-xs">
                  {t.bestOptionTag}
                </span>
              )}
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main What-If Decision Card */}
      {sim && (
        <div className="bg-white rounded-3xl border border-sage-200 shadow-card p-6 md:p-8 space-y-5 max-w-4xl mx-auto">
          {/* Recommendation Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-sage-100 pb-4 gap-3">
            <div>
              <span className="text-xs font-bold text-[#6F786F] uppercase tracking-wider">
                {t.decisionRecommendation}
              </span>
              <h3 className="text-xl font-black text-[#1D2A20] mt-0.5">
                {sim.recommended_action}
              </h3>
            </div>
            {/* Risk Badge */}
            <div
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shrink-0 self-start sm:self-center ${
                sim.decision_risk === 'High'
                  ? 'bg-rose-100 text-[#C85B57] border border-rose-200'
                  : sim.decision_risk === 'Low'
                  ? 'bg-emerald-100 text-[#416A47] border border-emerald-200'
                  : 'bg-amber-100 text-[#D99A45] border border-amber-200'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              <span>
               {getRiskLabel(sim.decision_risk, language)}
              </span>
            </div>
          </div>

          {/* Voice Listen Button */}
          <VoiceButton
            className="w-full"
            textToSpeak={`${sim.recommended_action}. ${scenario.advisory_text || ''}`}
          />

          {/* Detailed Context Grid */}
          <div className="space-y-4 text-sm text-[#1D2A20]">
            {scenario.advisory_text && (
              <div className="bg-[#E7EFE3] p-4 rounded-2xl border border-sage-200 font-semibold text-[#1D2A20] leading-relaxed">
                {scenario.advisory_text}
              </div>
            )}

            {sim.weather_context && (
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-blue-50/70 border border-blue-100 text-blue-950">
                <CloudSun className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-xs font-bold text-blue-900 uppercase mb-0.5">
                    {t.weatherWarning}
                  </strong>
                  <p className="text-xs md:text-sm font-medium">{sim.weather_context}</p>
                </div>
              </div>
            )}

            {/* Yield protection & cost impact */}
            {(sim.estimated_yield_loss_reduction || sim.cost_impact) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                {sim.estimated_yield_loss_reduction && (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                    <div className="flex items-center gap-2 text-[#416A47] font-bold mb-1">
                      <CheckCircle2 className="w-5 h-5 text-[#416A47]" />
                      <span>{t.yieldProtection}</span>
                    </div>
                    <p className="text-sm font-bold text-[#1D2A20]">
                      {sim.estimated_yield_loss_reduction}
                    </p>
                  </div>
                )}

                {sim.cost_impact && (
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
                    <div className="flex items-center gap-2 text-[#D99A45] font-bold mb-1">
                      <DollarSign className="w-5 h-5 text-[#D99A45]" />
                      <span>{t.costImpact}</span>
                    </div>
                    <p className="text-sm font-bold text-[#1D2A20]">
                      {sim.cost_impact}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-sage-100 text-xs text-[#6F786F] italic">
            {t.yieldImpactNotice}: {t.calculationNote}
          </div>
        </div>
      )}
    </div>
  );
};
