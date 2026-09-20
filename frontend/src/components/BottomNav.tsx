import React from 'react';
import { Home, Stethoscope, CloudSun, TrendingUp, HelpCircle, User } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { translations } from '../i18n/translations';
import { ActiveTab } from '../types';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, language } = useApp();
  const t = translations[language];

  const navItems: { id: ActiveTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'home', label: t.navHome, icon: Home },
    { id: 'diagnose', label: t.navDiagnose, icon: Stethoscope },
    { id: 'weather', label: t.navWeather, icon: CloudSun },
    { id: 'market', label: t.navMarket, icon: TrendingUp },
    { id: 'whatif', label: t.navWhatIf, icon: HelpCircle },
    { id: 'profile', label: t.navProfile, icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/98 backdrop-blur-md border-t border-sage-200 shadow-lg px-2 py-1.5">
      <div className="max-w-md mx-auto flex items-center justify-between gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              type="button"
              className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all duration-200 min-h-[52px] ${
                isActive
                  ? 'text-[#2F5436] font-bold bg-[#E7EFE3] scale-102'
                  : 'text-[#3F4A42] hover:text-[#2F5436] font-medium'
              }`}
            >
              <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 text-[#2F5436]' : 'text-[#416A47]'}`} />
              <span className="text-[11px] font-semibold mt-1 tracking-tight leading-none text-center">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
