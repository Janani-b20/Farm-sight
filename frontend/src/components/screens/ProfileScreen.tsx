import React from 'react';
import { Globe, MapPin, Sprout, Volume2, Info, RotateCcw, Check } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { translations, getLocalizedDisplay } from '../../i18n/translations';
import { Language, CropId } from '../../types';
import { CROP_OPTIONS } from '../../data/mockData';

export const ProfileScreen: React.FC = () => {
  const {
    language,
    setLanguage,
    selectedCrop,
    setSelectedCrop,
    userLocation,
    setUserLocation,
    voiceSpeed,
    setVoiceSpeed,
    resetDemoState,
  } = useApp();

  const t = translations[language];

  const languages: { id: Language; label: string; native: string }[] = [
    { id: 'en', label: 'English', native: 'English' },
    { id: 'ta', label: 'Tamil', native: 'தமிழ்' },
    { id: 'hi', label: 'Hindi', native: 'हिन्दी' },
  ];

  const rawLocations = [
    'Madurai, Tamil Nadu',
    'Thanjavur, Tamil Nadu',
    'Coimbatore, Tamil Nadu',
    'Dindigul, Tamil Nadu',
  ];

  return (
    <div className="space-y-6 pb-24 pt-2 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-[#1D2A20] tracking-tight">{t.profileTitle}</h2>
        <p className="text-sm text-[#3F4A42] font-medium">{t.profileSubtitle}</p>
      </div>

      {/* Main Grid - Responsive 2 Column on Desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Language & Crop Preference */}
        <div className="space-y-4">
          {/* App Language Preference */}
          <div className="bg-white rounded-3xl p-5 border border-sage-200 shadow-card space-y-4">
            <div className="flex items-center gap-2 text-[#1D2A20] font-bold text-xs uppercase tracking-wider">
              <Globe className="w-4 h-4 text-[#2F5436]" />
              <span>{t.languageSettings}</span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {languages.map((lang) => {
                const isSelected = language === lang.id;
                return (
                  <button
                    key={lang.id}
                    onClick={() => setLanguage(lang.id)}
                    type="button"
                    className={`py-3 px-3 rounded-2xl text-xs font-bold border transition-all text-center ${
                      isSelected
                        ? 'border-[#2F5436] bg-[#2F5436] text-white shadow-xs'
                        : 'border-sage-200 bg-white text-[#1D2A20] hover:border-sage-300'
                    }`}
                  >
                    {lang.native}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Crop Preference */}
          <div className="bg-white rounded-3xl p-5 border border-sage-200 shadow-card space-y-4">
            <div className="flex items-center gap-2 text-[#1D2A20] font-bold text-xs uppercase tracking-wider">
              <Sprout className="w-4 h-4 text-[#2F5436]" />
              <span>{t.preferredCropSetting}</span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {CROP_OPTIONS.map((crop) => {
                const isSelected = selectedCrop === crop.id;
                return (
                  <button
                    key={crop.id}
                    onClick={() => setSelectedCrop(crop.id as CropId)}
                    type="button"
                    className={`py-3 px-2 rounded-2xl text-xs font-bold border transition-all text-center flex flex-col items-center gap-1 ${
                      isSelected
                        ? 'border-[#2F5436] bg-[#E7EFE3] text-[#1D2A20] font-bold ring-2 ring-sage-300'
                        : 'border-sage-200 bg-white text-[#3F4A42] hover:border-sage-300'
                    }`}
                  >
                    {isSelected && <Check className="w-4 h-4 text-[#2F5436]" />}
                    <span>{t[crop.nameKey]}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Location, Voice & About */}
        <div className="space-y-4">
          {/* Location Preference */}
          <div className="bg-white rounded-3xl p-5 border border-sage-200 shadow-card space-y-3">
            <div className="flex items-center gap-2 text-[#1D2A20] font-bold text-xs uppercase tracking-wider">
              <MapPin className="w-4 h-4 text-[#2F5436]" />
              <span>{t.locationPreference}</span>
            </div>

            <select
              value={userLocation}
              onChange={(e) => setUserLocation(e.target.value)}
              className="w-full p-3.5 rounded-2xl border border-sage-200 bg-[#E7EFE3]/50 text-xs font-bold text-[#1D2A20] focus:outline-none focus:border-[#2F5436]"
            >
              {rawLocations.map((loc, i) => (
                <option key={i} value={loc}>
                  {getLocalizedDisplay(loc, language)}
                </option>
              ))}
            </select>
          </div>

          {/* Voice Speed Controls */}
          <div className="bg-white rounded-3xl p-5 border border-sage-200 shadow-card space-y-3">
            <div className="flex items-center gap-2 text-[#1D2A20] font-bold text-xs uppercase tracking-wider">
              <Volume2 className="w-4 h-4 text-[#2F5436]" />
              <span>{t.voiceSettings}</span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {[
                { speed: 0.8, label: t.voiceSpeedSlow },
                { speed: 1.0, label: t.voiceSpeedNormal },
                { speed: 1.2, label: t.voiceSpeedFast },
              ].map((item) => {
                const isSelected = voiceSpeed === item.speed;
                return (
                  <button
                    key={item.speed}
                    onClick={() => setVoiceSpeed(item.speed)}
                    type="button"
                    className={`py-2.5 px-2 rounded-2xl text-xs font-bold border transition-all text-center ${
                      isSelected
                        ? 'border-[#2F5436] bg-[#E7EFE3] text-[#1D2A20] ring-2 ring-sage-300'
                        : 'border-sage-200 bg-white text-[#3F4A42] hover:border-sage-300'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* About FarmSight */}
          <div className="bg-[#E7EFE3] rounded-3xl p-5 border border-sage-300 space-y-2">
            <div className="flex items-center gap-2 text-[#1D2A20] font-bold text-xs uppercase tracking-wider">
              <Info className="w-4 h-4 text-[#2F5436]" />
              <span>{t.aboutFarmSight}</span>
            </div>
            <p className="text-xs text-[#3F4A42] leading-relaxed font-medium">
              {t.aboutText}
            </p>
            <p className="text-[11px] text-[#6F786F] font-bold pt-1">
              {t.appVersionText}
            </p>
          </div>

          {/* Reset Demo State Button */}
          <button
            onClick={resetDemoState}
            type="button"
            className="w-full py-3.5 px-4 rounded-2xl bg-white border border-sage-200 text-[#3F4A42] hover:text-[#C85B57] hover:border-rose-200 text-xs font-bold flex items-center justify-center gap-2 active:scale-98 transition-all shadow-xs"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{t.resetDemoState}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
