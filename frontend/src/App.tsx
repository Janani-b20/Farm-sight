import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { WelcomeScreen } from './components/screens/WelcomeScreen';
import { HomeScreen } from './components/screens/HomeScreen';
import { DiagnoseScreen } from './components/screens/DiagnoseScreen';
import { WeatherScreen } from './components/screens/WeatherScreen';
import { WhatIfScreen } from './components/screens/WhatIfScreen';
import { MarketScreen } from './components/screens/MarketScreen';
import { ProfileScreen } from './components/screens/ProfileScreen';

const MainContent: React.FC = () => {
  const { currentScreen, activeTab, voiceNotice, language } = useApp();

  if (currentScreen === 'welcome') {
    return <WelcomeScreen />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#F7F7F0] text-[#1D2A20]">
      {/* Mobile & Desktop Header */}
      <Header />

      {/* Voice notice alert banner */}
      {voiceNotice && (
        <div className="bg-amber-100 border-b border-amber-300 text-amber-900 px-4 py-2.5 text-xs font-bold text-center shadow-xs animate-pulse">
          {voiceNotice === 'Tamil voice unavailable on this device'
            ? (language === 'ta' ? 'இந்த சாதனத்தில் தமிழ் குரல் கிடைக்கவில்லை.' : 'Tamil voice unavailable on this device.')
            : voiceNotice}
        </div>
      )}

      {/* Dynamic Screen View */}
      <main className="flex-1 px-4 md:px-8 py-4 md:py-6 max-w-7xl mx-auto w-full">
        {activeTab === 'home' && <HomeScreen />}
        {activeTab === 'diagnose' && <DiagnoseScreen />}
        {activeTab === 'weather' && <WeatherScreen />}
        {activeTab === 'whatif' && <WhatIfScreen />}
        {activeTab === 'market' && <MarketScreen />}
        {activeTab === 'profile' && <ProfileScreen />}
      </main>

      {/* Mobile-Only Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <div className="min-h-screen bg-[#F7F7F0] font-sans antialiased text-[#1D2A20]">
        <MainContent />
      </div>
    </AppProvider>
  );
}

export default App;
