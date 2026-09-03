import React from 'react';
import { CloudSun, Thermometer, Droplets, CloudRain, Wind, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  translations,
  getWeatherRiskLabel,
} from '../../i18n/translations';
import { MOCK_WEATHER_DATA } from '../../data/mockData';
import { VoiceButton } from '../VoiceButton';

export const WeatherScreen: React.FC = () => {
  const { language } = useApp();
  const t = translations[language];
  const weather = MOCK_WEATHER_DATA[language];

  return (
    <div className="space-y-6 pb-24 pt-2 max-w-7xl mx-auto">
      {/* Title Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-[#1D2A20] tracking-tight">{t.weatherTitle}</h2>
          <p className="text-sm text-[#3F4A42] font-medium">{weather.condition}</p>
        </div>
        <span className="px-3.5 py-1 rounded-full bg-amber-100 text-[#1D2A20] text-xs font-bold border border-amber-200">
          {getWeatherRiskLabel(weather.weatherRisk, language)}
        </span>
      </div>

      {/* Main Temperature Card */}
      <div className="bg-gradient-to-br from-[#2F5436] to-[#1D2A20] text-white rounded-3xl p-6 md:p-8 shadow-card flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-sage-200 uppercase tracking-wider">
            {t.todaysTemperature}
          </span>
          <div className="text-4xl md:text-5xl font-black mt-1 tracking-tight">
            {weather.temperature}°C
          </div>
          <p className="text-sm text-sage-100 mt-1 font-medium">{weather.condition}</p>
        </div>
        <div className="w-20 h-20 rounded-3xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white shrink-0">
          <CloudSun className="w-12 h-12" />
        </div>
      </div>

      {/* Weather Metrics Grid - 4 Column Desktop Layout */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Humidity */}
        <div className="bg-white rounded-3xl p-5 border border-sage-200 shadow-card flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
            <Droplets className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-[#6F786F]">{t.humidity}</p>
            <p className="text-xl font-black text-[#1D2A20]">{weather.humidity}%</p>
          </div>
        </div>

        {/* Rain Probability */}
        <div className="bg-white rounded-3xl p-5 border border-sage-200 shadow-card flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
            <CloudRain className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-[#6F786F]">{t.rainProbability}</p>
            <p className="text-xl font-black text-[#1D2A20]">{weather.rainProbability}%</p>
          </div>
        </div>

        {/* Wind Speed */}
        <div className="bg-white rounded-3xl p-5 border border-sage-200 shadow-card flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
            <Wind className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-[#6F786F]">{t.windSpeed}</p>
            <p className="text-xl font-black text-[#1D2A20]">{weather.windSpeed} km/h</p>
          </div>
        </div>

        {/* Feels Like Temp */}
        <div className="bg-white rounded-3xl p-5 border border-sage-200 shadow-card flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-[#D99A45] flex items-center justify-center shrink-0">
            <Thermometer className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-[#6F786F]">{t.temperature}</p>
            <p className="text-xl font-black text-[#1D2A20]">{weather.temperature + 2}°C</p>
          </div>
        </div>
      </div>

      {/* Farming Impact & Advisory Card */}
      <div className="bg-white rounded-3xl p-6 border border-sage-200 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-sage-100 pb-3 gap-2">
          <div className="flex items-center gap-2 text-[#D99A45]">
            <AlertCircle className="w-6 h-6 shrink-0 text-[#D99A45]" />
            <h3 className="text-base font-bold text-[#1D2A20]">{t.farmingImpactCard}</h3>
          </div>
          <VoiceButton
            variant="compact"
            textToSpeak={`${t.farmingImpactCard}. ${weather.farmingImpact}`}
          />
        </div>

        <p className="text-sm text-[#3F4A42] leading-relaxed font-medium">
          {weather.farmingImpact}
        </p>
      </div>
    </div>
  );
};
