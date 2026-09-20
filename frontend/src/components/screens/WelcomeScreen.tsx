import React from 'react';
import { Sprout, ArrowRight, ShieldCheck, CloudSun, TrendingUp, Check } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { translations } from '../../i18n/translations';
import { Language } from '../../types';

export const WelcomeScreen: React.FC = () => {
  const { language, setLanguage, setCurrentScreen, setActiveTab } = useApp();
  const t = translations[language];

  const languages: { id: Language; label: string; native: string; desc: string }[] = [
    { id: 'en', label: 'English', native: 'English', desc: 'Default Interface' },
    { id: 'ta', label: 'Tamil', native: 'தமிழ்', desc: 'தமிழ் வழிகாட்டி' },
    { id: 'hi', label: 'Hindi', native: 'हिन्दी', desc: 'हिंदी इंटरफेस' },
  ];

  const handleStart = () => {
    setActiveTab('home');
    setCurrentScreen('home');
  };

  return (
    <div className="min-h-screen bg-[#F7F7F0] px-4 md:px-8 py-8 flex flex-col justify-between max-w-2xl mx-auto text-[#1D2A20]">
      {/* Top Banner Hero */}
      <div className="text-center mt-6">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-[#2F5436] flex items-center justify-center text-white shadow-md mb-6 animate-organic-pulse">
          <Sprout className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-[#1D2A20] tracking-tight">
          {t.welcomeHeading}
        </h1>
        <p className="text-sm md:text-base text-[#3F4A42] font-medium mt-3 max-w-md mx-auto leading-relaxed">
          {t.welcomeTagline}
        </p>
      </div>

      {/* Language Selector Card */}
      <div className="my-8 bg-white rounded-3xl p-6 border border-sage-200 shadow-card max-w-md mx-auto w-full">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#6F786F] mb-4 text-center">
          {t.selectLanguage}
        </h2>
        <div className="grid grid-cols-1 gap-3">
          {languages.map((lang) => {
            const isSelected = language === lang.id;
            return (
              <button
                key={lang.id}
                onClick={() => setLanguage(lang.id)}
                type="button"
                className={`w-full flex items-center justify-between p-4 rounded-2xl border text-left transition-all ${
                  isSelected
                    ? 'border-[#2F5436] bg-[#E7EFE3] text-[#1D2A20] font-bold shadow-xs'
                    : 'border-sage-200 bg-white text-[#3F4A42] hover:border-sage-300 font-medium'
                }`}
              >
                <div>
                  <div className="text-base font-bold text-[#1D2A20]">{lang.native}</div>
                  <div className="text-xs text-[#6F786F] font-normal">{lang.desc}</div>
                </div>
                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-[#2F5436] text-white flex items-center justify-center">
                    <Check className="w-4 h-4" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Highlights List */}
      <div className="grid grid-cols-3 gap-3 mb-8 max-w-md mx-auto w-full text-center">
        <div className="bg-[#E7EFE3] p-3.5 rounded-2xl border border-sage-200">
          <ShieldCheck className="w-6 h-6 mx-auto text-[#2F5436] mb-1" />
          <p className="text-xs font-bold text-[#1D2A20]">{t.navDiagnose}</p>
        </div>
        <div className="bg-[#E7EFE3] p-3.5 rounded-2xl border border-sage-200">
          <CloudSun className="w-6 h-6 mx-auto text-[#2F5436] mb-1" />
          <p className="text-xs font-bold text-[#1D2A20]">{t.navWeather}</p>
        </div>
        <div className="bg-[#E7EFE3] p-3.5 rounded-2xl border border-sage-200">
          <TrendingUp className="w-6 h-6 mx-auto text-[#2F5436] mb-1" />
          <p className="text-xs font-bold text-[#1D2A20]">{t.navMarket}</p>
        </div>
      </div>

      {/* Start Button */}
      <div className="max-w-md mx-auto w-full">
        <button
          onClick={handleStart}
          type="button"
          className="w-full bg-[#2F5436] hover:bg-[#234029] active:scale-98 text-white font-bold text-base py-4 px-6 rounded-2xl shadow-md flex items-center justify-center gap-2 min-h-[54px] transition-all"
        >
          <span>{t.getStarted}</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
