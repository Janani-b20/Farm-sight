import React from 'react';
import { Sprout, MapPin, Globe, Home, Stethoscope, CloudSun, TrendingUp, HelpCircle, User } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { translations, getLocalizedDisplay } from '../i18n/translations';
import { Language, ActiveTab } from '../types';

export const Header: React.FC = () => {
  const { language, setLanguage, userLocation, activeTab, setActiveTab } = useApp();
  const t = translations[language];

  const languages: { id: Language; label: string; native: string }[] = [
    { id: 'en', label: 'English', native: 'English' },
    { id: 'ta', label: 'Tamil', native: 'தமிழ்' },
    { id: 'hi', label: 'Hindi', native: 'हिन्दी' },
  ];

  const desktopNavItems: { id: ActiveTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'home', label: t.navHome, icon: Home },
    { id: 'diagnose', label: t.navDiagnose, icon: Stethoscope },
    { id: 'weather', label: t.navWeather, icon: CloudSun },
    { id: 'market', label: t.navMarket, icon: TrendingUp },
    { id: 'whatif', label: t.navWhatIf, icon: HelpCircle },
    { id: 'profile', label: t.navProfile, icon: User },
  ];

  const localizedLocation = getLocalizedDisplay(userLocation, language);

  return (
    <header className="sticky top-0 z-30 bg-[#F7F7F0]/95 backdrop-blur-md border-b border-sage-200 px-4 md:px-8 py-3 shadow-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* App Brand */}
        <div
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-3 cursor-pointer group shrink-0 min-w-[140px] sm:min-w-[180px]"
        >
          <div className="w-10 h-10 rounded-2xl bg-[#2F5436] flex items-center justify-center text-white shadow-sm shadow-sage-200 group-hover:scale-105 transition-transform shrink-0">
            <Sprout className="w-5 h-5 text-white" />
          </div>
          <div className="whitespace-nowrap">
            <h1 className="text-lg font-bold text-[#1D2A20] tracking-tight leading-none whitespace-nowrap">
              {t.appTitle}
            </h1>
            <p className="text-xs text-[#3F4A42] font-medium mt-0.5 whitespace-nowrap">
              {t.appSubtitle}
            </p>
          </div>
        </div>

        {/* Desktop Navigation Links (hidden on mobile, visible on md and up) */}
        <nav className="hidden md:flex items-center gap-1.5 bg-white/80 p-1.5 rounded-full border border-sage-200 shadow-xs">
          {desktopNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                type="button"
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-[#2F5436] text-white shadow-xs'
                    : 'text-[#3F4A42] hover:bg-sage-100 hover:text-[#1D2A20]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#416A47]'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Location Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sage-100 text-[#1D2A20] text-xs font-semibold border border-sage-200">
            <MapPin className="w-3.5 h-3.5 text-[#2F5436]" />
            <span className="truncate max-w-[130px] md:max-w-[200px]">{localizedLocation}</span>
          </div>

          {/* Language Switcher Pills */}
          <div className="flex items-center bg-white rounded-full p-1 border border-sage-200 shadow-xs">
            <Globe className="w-3.5 h-3.5 text-[#416A47] ml-2 mr-1 hidden sm:inline" />
            {languages.map((lang) => (
              <button
                key={lang.id}
                onClick={() => setLanguage(lang.id)}
                type="button"
                className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
                  language === lang.id
                    ? 'bg-[#2F5436] text-white shadow-xs'
                    : 'text-[#3F4A42] hover:text-[#1D2A20]'
                }`}
              >
                {lang.native}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
};
