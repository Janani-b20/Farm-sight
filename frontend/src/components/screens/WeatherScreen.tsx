import React, {
  useEffect,
  useState,
} from 'react';

import {
  CloudSun,
  Thermometer,
  Droplets,
  CloudRain,
  Wind,
  AlertCircle,
  RefreshCcw,
} from 'lucide-react';

import { useApp } from '../../context/AppContext';

import {
  translations,
  getWeatherRiskLabel,
} from '../../i18n/translations';

import { VoiceButton } from '../VoiceButton';

import {
  WeatherResponse,
} from '../../services/weatherApi';


type WeatherRisk =
  | 'low'
  | 'medium'
  | 'high'
  | 'very_high';


const getWeatherRisk = (
  weather: WeatherResponse
): WeatherRisk => {
  const humidity = weather.humidity ?? 0;
  const rain = weather.rain_prob ?? 0;
  const wind = weather.wind ?? 0;

  if (
    humidity >= 90 ||
    rain >= 85 ||
    wind >= 35
  ) {
    return 'very_high';
  }

  if (
    humidity >= 80 ||
    rain >= 65 ||
    wind >= 25
  ) {
    return 'high';
  }

  if (
    humidity >= 70 ||
    rain >= 40 ||
    wind >= 15
  ) {
    return 'medium';
  }

  return 'low';
};


const getCondition = (
  weather: WeatherResponse,
  language: 'en' | 'ta' | 'hi'
): string => {
  const rain = weather.rain_prob ?? 0;
  const humidity = weather.humidity ?? 0;

  if (rain >= 70) {
    if (language === 'ta') {
      return 'மழைக்கு அதிக வாய்ப்பு';
    }

    if (language === 'hi') {
      return 'बारिश की अधिक संभावना';
    }

    return 'High chance of rain';
  }

  if (rain >= 40) {
    if (language === 'ta') {
      return 'மழைக்கு வாய்ப்பு';
    }

    if (language === 'hi') {
      return 'बारिश की संभावना';
    }

    return 'Possible rain';
  }

  if (humidity >= 80) {
    if (language === 'ta') {
      return 'அதிக ஈரப்பதம்';
    }

    if (language === 'hi') {
      return 'अधिक नमी';
    }

    return 'High humidity';
  }

  if (language === 'ta') {
    return 'சாதாரண வானிலை';
  }

  if (language === 'hi') {
    return 'सामान्य मौसम';
  }

  return 'Normal weather conditions';
};


const getFarmingImpact = (
  weather: WeatherResponse,
  language: 'en' | 'ta' | 'hi'
): string => {
  const humidity = weather.humidity;
  const rain = weather.rain_prob;
  const wind = weather.wind;

  if (
    humidity === null &&
    rain === null &&
    wind === null
  ) {
    if (language === 'ta') {
      return 'தற்போது நேரடி வானிலை தகவல் கிடைக்கவில்லை. மருந்து தெளிப்பதற்கு முன் உள்ளூர் வானிலையை சரிபார்க்கவும்.';
    }

    if (language === 'hi') {
      return 'अभी लाइव मौसम डेटा उपलब्ध नहीं है। दवा छिड़कने से पहले स्थानीय मौसम की जांच करें।';
    }

    return 'Live weather data is currently unavailable. Check local conditions before spraying or applying treatment.';
  }

  if (
    rain !== null &&
    rain >= 70
  ) {
    if (language === 'ta') {
      return `மழை வாய்ப்பு ${rain}% உள்ளது. இப்போது மருந்து தெளிப்பதை தவிர்த்து, மழை குறைந்த பிறகு தெளிப்பது நல்லது.`;
    }

    if (language === 'hi') {
      return `बारिश की संभावना ${rain}% है। अभी छिड़काव न करें और मौसम बेहतर होने का इंतजार करें।`;
    }

    return `Rain probability is ${rain}%. Avoid spraying now and wait for a drier weather window.`;
  }

  if (
    wind !== null &&
    wind >= 25
  ) {
    if (language === 'ta') {
      return `காற்றின் வேகம் ${wind} km/h உள்ளது. அதிக காற்றில் மருந்து தெளித்தால் மருந்து வீணாகும் வாய்ப்பு உள்ளது.`;
    }

    if (language === 'hi') {
      return `हवा की गति ${wind} km/h है। तेज हवा में छिड़काव करने से दवा बह सकती है।`;
    }

    return `Wind speed is ${wind} km/h. Avoid spraying in strong wind because spray drift may reduce treatment effectiveness.`;
  }

  if (
    humidity !== null &&
    humidity >= 80
  ) {
    if (language === 'ta') {
      return `ஈரப்பதம் ${humidity}% உள்ளது. அதிக ஈரப்பதம் சில பயிர் நோய்கள் பரவுவதற்கு சாதகமாக இருக்கலாம். பயிரை தொடர்ந்து கண்காணிக்கவும்.`;
    }

    if (language === 'hi') {
      return `नमी ${humidity}% है। अधिक नमी कुछ फसल रोगों के फैलाव को बढ़ा सकती है। फसल की निगरानी करें।`;
    }

    return `Humidity is ${humidity}%. High humidity can favour some crop diseases, so monitor the field closely.`;
  }

  if (language === 'ta') {
    return 'தற்போதைய வானிலை விவசாய நடவடிக்கைகளுக்கு ஒப்பீட்டளவில் ஏற்றதாக உள்ளது. இருப்பினும் மருந்து தெளிப்பதற்கு முன் மழை மற்றும் காற்றை சரிபார்க்கவும்.';
  }

  if (language === 'hi') {
    return 'वर्तमान मौसम खेती के काम के लिए अपेक्षाकृत अनुकूल है। फिर भी छिड़काव से पहले बारिश और हवा की स्थिति जांचें।';
  }

  return 'Current weather conditions are comparatively suitable for farm activity. Still check rain and wind before spraying.';
};


export const WeatherScreen: React.FC = () => {
  const { language, location, getWeatherCached } = useApp();

  const t = translations[language];

  const [weather, setWeather] =
    useState<WeatherResponse | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);


  const loadWeather = async () => {
    if (!weather) {
      setLoading(true);
    }
    setError(null);

    try {
      const result = await getWeatherCached(
        location.latitude,
        location.longitude
      );

      setWeather(result);

      if (
        result.status === 'unavailable'
      ) {
        setError(
          language === 'ta'
            ? 'நேரடி வானிலை தகவல் தற்போது கிடைக்கவில்லை.'
            : language === 'hi'
            ? 'लाइव मौसम डेटा अभी उपलब्ध नहीं है।'
            : 'Live weather data is currently unavailable.'
        );
      }
    } catch (err) {
      console.error(
        'Weather API error:',
        err
      );

      setError(
        language === 'ta'
          ? 'வானிலை தகவலை பெற முடியவில்லை.'
          : language === 'hi'
          ? 'मौसम की जानकारी प्राप्त नहीं हो सकी।'
          : 'Could not load weather information.'
      );
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadWeather();
  }, [location.latitude, location.longitude, getWeatherCached]);


  if (loading) {
    return (
      <div className="max-w-7xl mx-auto pt-10 pb-24">
        <div className="bg-white rounded-3xl border border-sage-200 shadow-card p-10 text-center">
          <CloudSun className="w-12 h-12 mx-auto text-[#2F5436] animate-pulse" />

          <p className="mt-4 text-sm font-bold text-[#1D2A20]">
            {language === 'ta'
              ? 'நேரடி வானிலை தகவல் பெறப்படுகிறது...'
              : language === 'hi'
              ? 'लाइव मौसम जानकारी प्राप्त की जा रही है...'
              : 'Loading live weather...'}
          </p>
        </div>
      </div>
    );
  }


  if (!weather) {
    return (
      <div className="max-w-7xl mx-auto pt-10 pb-24">
        <div className="bg-white rounded-3xl border border-amber-200 shadow-card p-8 text-center">
          <AlertCircle className="w-10 h-10 mx-auto text-[#D99A45]" />

          <p className="mt-3 text-sm font-bold text-[#1D2A20]">
            {error}
          </p>

          <button
            type="button"
            onClick={loadWeather}
            className="mt-5 px-5 py-3 rounded-2xl bg-[#2F5436] text-white font-bold text-sm inline-flex items-center gap-2"
          >
            <RefreshCcw className="w-4 h-4" />

            {language === 'ta'
              ? 'மீண்டும் முயற்சி'
              : language === 'hi'
              ? 'फिर कोशिश करें'
              : 'Try Again'}
          </button>
        </div>
      </div>
    );
  }


  const weatherRisk =
    getWeatherRisk(weather);

  const condition =
    getCondition(
      weather,
      language
    );

  const farmingImpact =
    getFarmingImpact(
      weather,
      language
    );


  return (
    <div className="space-y-6 pb-24 pt-2 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-[#1D2A20] tracking-tight">
            {t.weatherTitle}
          </h2>

          <p className="text-sm text-[#3F4A42] font-medium">
            {condition}
          </p>
        </div>

        <span className="px-3.5 py-1 rounded-full bg-amber-100 text-[#1D2A20] text-xs font-bold border border-amber-200">
          {getWeatherRiskLabel(
            weatherRisk,
            language
          )}
        </span>
      </div>


      {/* Main Temperature */}
      <div className="bg-gradient-to-br from-[#2F5436] to-[#1D2A20] text-white rounded-3xl p-6 md:p-8 shadow-card flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-sage-200 uppercase tracking-wider">
            {t.todaysTemperature}
          </span>

          <div className="text-4xl md:text-5xl font-black mt-1 tracking-tight">
            {weather.temp !== null
              ? `${weather.temp}°C`
              : '--'}
          </div>

          <p className="text-sm text-sage-100 mt-1 font-medium">
            {condition}
          </p>
        </div>

        <div className="w-20 h-20 rounded-3xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white shrink-0">
          <CloudSun className="w-12 h-12" />
        </div>
      </div>


      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

        {/* Humidity */}
        <div className="bg-white rounded-3xl p-5 border border-sage-200 shadow-card flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
            <Droplets className="w-6 h-6" />
          </div>

          <div>
            <p className="text-xs font-bold text-[#6F786F]">
              {t.humidity}
            </p>

            <p className="text-xl font-black text-[#1D2A20]">
              {weather.humidity !== null
                ? `${weather.humidity}%`
                : '--'}
            </p>
          </div>
        </div>


        {/* Rain */}
        <div className="bg-white rounded-3xl p-5 border border-sage-200 shadow-card flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
            <CloudRain className="w-6 h-6" />
          </div>

          <div>
            <p className="text-xs font-bold text-[#6F786F]">
              {t.rainProbability}
            </p>

            <p className="text-xl font-black text-[#1D2A20]">
              {weather.rain_prob !== null
                ? `${weather.rain_prob}%`
                : '--'}
            </p>
          </div>
        </div>


        {/* Wind */}
        <div className="bg-white rounded-3xl p-5 border border-sage-200 shadow-card flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
            <Wind className="w-6 h-6" />
          </div>

          <div>
            <p className="text-xs font-bold text-[#6F786F]">
              {t.windSpeed}
            </p>

            <p className="text-xl font-black text-[#1D2A20]">
              {weather.wind !== null
                ? `${weather.wind} km/h`
                : '--'}
            </p>
          </div>
        </div>


        {/* Temperature */}
        <div className="bg-white rounded-3xl p-5 border border-sage-200 shadow-card flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-[#D99A45] flex items-center justify-center shrink-0">
            <Thermometer className="w-6 h-6" />
          </div>

          <div>
            <p className="text-xs font-bold text-[#6F786F]">
              {t.temperature}
            </p>

            <p className="text-xl font-black text-[#1D2A20]">
              {weather.temp !== null
                ? `${weather.temp}°C`
                : '--'}
            </p>
          </div>
        </div>
      </div>


      {/* Farming Advisory */}
      <div className="bg-white rounded-3xl p-6 border border-sage-200 shadow-card space-y-4">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-sage-100 pb-3 gap-2">

          <div className="flex items-center gap-2 text-[#D99A45]">
            <AlertCircle className="w-6 h-6 shrink-0 text-[#D99A45]" />

            <h3 className="text-base font-bold text-[#1D2A20]">
              {t.farmingImpactCard}
            </h3>
          </div>

          <VoiceButton
            variant="compact"
            textToSpeak={`${t.farmingImpactCard}. ${farmingImpact}`}
          />
        </div>

        <p className="text-sm text-[#3F4A42] leading-relaxed font-medium">
          {farmingImpact}
        </p>


        {/* Source */}
        <div className="pt-3 border-t border-sage-100">
          <p className="text-[11px] text-[#6F786F] font-medium">
            {language === 'ta'
              ? 'வானிலை தரவு மூலம்'
              : language === 'hi'
              ? 'मौसम डेटा स्रोत'
              : 'Weather data source'}
            :{' '}
            <span className="font-bold text-[#2F5436]">
              {weather.weather_source ===
              'open_meteo'
                ? 'Open-Meteo'
                : weather.weather_source ===
                  'openweathermap'
                ? 'OpenWeatherMap'
                : 'Unavailable'}
            </span>
          </p>
        </div>
      </div>


      {/* API warning */}
      {error && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-[#1D2A20]">
          {error}
        </div>
      )}
    </div>
  );
};