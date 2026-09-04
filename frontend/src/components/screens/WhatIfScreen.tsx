import React, {
  useEffect,
  useState,
} from 'react';

import {
  CloudSun,
  AlertTriangle,
  CheckCircle2,
  RefreshCcw,
  FlaskConical,
} from 'lucide-react';

import {
  useApp,
} from '../../context/AppContext';

import {
  translations,
} from '../../i18n/translations';

import {
  runWhatIf,
  WhatIfResponse,
} from '../../services/whatifApi';

import {
  VoiceButton,
} from '../VoiceButton';


interface Option {
  id: string;
  action: string;
  label: string;
}


export const WhatIfScreen: React.FC = () => {

  const {
    language,
    whatIfOption,
    setWhatIfOption,
    selectedCrop,
    diagnosisState,
    location,
  } = useApp();


  const t =
    translations[language];


  const [
    result,
    setResult,
  ] =
    useState<WhatIfResponse | null>(
      null
    );


  const [
    loading,
    setLoading,
  ] =
    useState(false);


  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null
    );


  const options: Option[] = [
    {
      id: 'wait_weather',
      action:
        'wait_for_better_weather',
      label:
        t.optionWait,
    },

    {
      id: 'treat_now',
      action:
        'spray_immediately',
      label:
        t.optionTreatNow,
    },

    {
      id: 'bio_control',
      action:
        'bio_control',
      label:
        t.optionBioControl,
    },

    {
      id: 'monitor_first',
      action:
        'monitor_first',
      label:
        t.optionMonitor,
    },
  ];


  const diagnosis =
    diagnosisState.result;


  const selectedOption =
    options.find(
      option =>
        option.id ===
        whatIfOption
    ) || options[0];


  const loadSimulation =
    async (
      option: Option
    ) => {

      if (
        !diagnosis ||
        diagnosisState.resultType !==
          'disease'
      ) {
        return;
      }


      setLoading(true);
      setError(null);


      try {

        const response =
          await runWhatIf({
            crop:
              selectedCrop,

            disease:
              diagnosis.disease || '',

            confidence:
              diagnosis.confidence ?? 90,

            state:
              location.state || 'Tamil Nadu',

            district:
              location.district || 'Madurai',

            latitude:
              location.latitude,

            longitude:
              location.longitude,

            farmer_action:
              option.action,

            language:
              language,
          });


        setResult(response);

      } catch (err) {

        console.error(
          'What-If API error:',
          err
        );


        setError(
          language === 'ta'
            ? 'What-If முடிவை உருவாக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.'
            : language === 'hi'
            ? 'What-If परिणाम तैयार नहीं हो सका। कृपया फिर कोशिश करें।'
            : 'Could not generate the What-If result. Please try again.'
        );

      } finally {

        setLoading(false);

      }
    };


  /*
    Run simulation when:

    - page opens
    - option changes
    - language changes

    Disease ML is NOT rerun.
  */
  useEffect(() => {

    if (
      diagnosis &&
      diagnosisState.resultType ===
        'disease'
    ) {
      loadSimulation(
        selectedOption
      );
    }

  }, [
    whatIfOption,
    language,
  ]);


  const handleOption =
    (
      option: Option
    ) => {

      setWhatIfOption(
        option.id
      );

    };


  /*
    No disease diagnosis exists yet.
  */
  if (
    !diagnosis ||
    diagnosisState.resultType !==
      'disease'
  ) {

    return (
      <div className="space-y-6 pb-24 pt-2 max-w-7xl mx-auto">

        <div>
          <h2 className="text-2xl font-black text-[#1D2A20] tracking-tight">
            {t.whatIfTitle}
          </h2>

          <p className="text-sm text-[#3F4A42] mt-1">
            {t.whatIfSubtitle}
          </p>
        </div>


        <div className="bg-white rounded-3xl border border-sage-200 shadow-card p-8 text-center">

          <FlaskConical className="w-12 h-12 mx-auto text-[#416A47]" />

          <h3 className="font-black text-[#1D2A20] mt-4">
            {language === 'ta'
              ? 'முதலில் பயிரை பரிசோதிக்கவும்'
              : language === 'hi'
              ? 'पहले फसल की जांच करें'
              : 'Diagnose the crop first'}
          </h3>

          <p className="text-sm text-[#6F786F] mt-2 max-w-md mx-auto">
            {language === 'ta'
              ? 'What-If simulation பயன்படுத்துவதற்கு முன் ஒரு இலை படத்தை பரிசோதித்து நோயை கண்டறியவும்.'
              : language === 'hi'
              ? 'What-If simulation का उपयोग करने से पहले पत्ती की तस्वीर से रोग की पहचान करें।'
              : 'Run disease detection first. FarmSight will then use the detected disease, confidence and live weather for the simulation.'}
          </p>

        </div>

      </div>
    );
  }


  const simulation =
    result?.whatif?.simulation;


  const advisory =
    result?.whatif?.advisory_text;


  const weather =
    simulation?.weather_conditions ||
    result?.weather;


  const risk =
    simulation?.risk_level || '';


  const isHighRisk =
    risk
      .toLowerCase()
      .includes('high');


  const isLowerRisk =
    risk
      .toLowerCase()
      .includes('lower') ||
    risk
      .toLowerCase()
      .includes('low');


  return (

    <div className="space-y-6 pb-24 pt-2 max-w-7xl mx-auto">


      {/* HEADER */}

      <div>

        <div className="flex items-center gap-2 flex-wrap">

          <h2 className="text-2xl font-black text-[#1D2A20] tracking-tight">
            {t.whatIfTitle}
          </h2>


          <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#E7EFE3] text-[#2F5436] border border-sage-300">
            {t[selectedCrop]}
          </span>

        </div>


        <p className="text-sm text-[#3F4A42] font-medium mt-0.5">
          {t.whatIfSubtitle}
        </p>

      </div>


      {/* OPTIONS */}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-[#E7EFE3] p-2 rounded-3xl border border-sage-200">

        {options.map(
          option => {

            const isActive =
              whatIfOption ===
              option.id;


            return (

              <button
                key={option.id}

                onClick={() =>
                  handleOption(
                    option
                  )
                }

                disabled={loading}

                type="button"

                className={`p-3.5 rounded-2xl text-xs md:text-sm font-bold transition-all text-center flex items-center justify-center min-h-[56px] ${
                  isActive
                    ? 'bg-[#2F5436] text-white shadow-md'
                    : 'bg-white text-[#1D2A20] hover:bg-sage-50 border border-sage-100'
                }`}
              >

                {option.label}

              </button>

            );
          }
        )}

      </div>


      {/* LOADING */}

      {loading && (

        <div className="bg-white rounded-3xl border border-sage-200 shadow-card p-10 text-center">

          <RefreshCcw className="w-9 h-9 mx-auto text-[#416A47] animate-spin" />

          <p className="text-sm font-bold text-[#1D2A20] mt-4">

            {language === 'ta'
              ? 'நேரடி What-If simulation இயங்குகிறது...'
              : language === 'hi'
              ? 'लाइव What-If simulation चल रहा है...'
              : 'Running live What-If simulation...'}

          </p>

        </div>

      )}


      {/* ERROR */}

      {!loading && error && (

        <div className="bg-rose-50 border border-rose-200 rounded-3xl p-6 text-center">

          <AlertTriangle className="w-8 h-8 mx-auto text-[#C85B57]" />

          <p className="text-sm font-bold text-[#1D2A20] mt-3">
            {error}
          </p>


          <button
            type="button"

            onClick={() =>
              loadSimulation(
                selectedOption
              )
            }

            className="mt-4 px-5 py-2.5 rounded-2xl bg-[#2F5436] text-white font-bold text-sm"
          >
            {language === 'ta'
              ? 'மீண்டும் முயற்சி'
              : language === 'hi'
              ? 'फिर कोशिश करें'
              : 'Try Again'}
          </button>

        </div>

      )}


      {/* REAL RESULT */}

      {!loading &&
        !error &&
        simulation && (

        <div className="bg-white rounded-3xl border border-sage-200 shadow-card p-6 md:p-8 space-y-5 max-w-4xl mx-auto">


          {/* RECOMMENDATION */}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-sage-100 pb-4 gap-3">

            <div>

              <span className="text-xs font-bold text-[#6F786F] uppercase tracking-wider">
                {t.decisionRecommendation}
              </span>

              <h3 className="text-xl font-black text-[#1D2A20] mt-1">
                {simulation.recommendation}
              </h3>

            </div>


            <div
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shrink-0 ${
                isHighRisk
                  ? 'bg-rose-100 text-[#C85B57] border border-rose-200'
                  : isLowerRisk
                  ? 'bg-emerald-100 text-[#416A47] border border-emerald-200'
                  : 'bg-amber-100 text-[#D99A45] border border-amber-200'
              }`}
            >

              {isLowerRisk
                ? (
                  <CheckCircle2 className="w-4 h-4" />
                )
                : (
                  <AlertTriangle className="w-4 h-4" />
                )
              }

              {risk}

            </div>

          </div>


          {/* VOICE */}

          <VoiceButton
            className="w-full"

            textToSpeak={
              `${simulation.recommendation}. ${simulation.simulation_outcome}. ${advisory || ''}`
            }
          />


          {/* SIMULATION OUTCOME */}

          <div className="bg-[#E7EFE3] p-5 rounded-2xl border border-sage-200">

            <p className="text-xs font-black text-[#416A47] uppercase tracking-wider mb-2">

              {language === 'ta'
                ? 'இந்த தேர்வின் விளைவு'
                : language === 'hi'
                ? 'इस विकल्प का परिणाम'
                : 'If you choose this'}

            </p>


            <p className="text-sm font-semibold text-[#1D2A20] leading-relaxed">
              {simulation.simulation_outcome}
            </p>

          </div>


          {/* WEATHER CONTEXT */}

          {weather && (

            <div className="p-5 rounded-2xl bg-blue-50/70 border border-blue-100">

              <div className="flex items-center gap-2 mb-3">

                <CloudSun className="w-5 h-5 text-blue-700" />

                <strong className="text-sm font-black text-blue-950">
                  {t.weatherWarning}
                </strong>

              </div>


              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">

                <WeatherValue
                  label={
                    language === 'ta'
                      ? 'வெப்பநிலை'
                      : language === 'hi'
                      ? 'तापमान'
                      : 'Temperature'
                  }

                  value={
                    weather.temp !== null &&
                    weather.temp !== undefined
                      ? `${weather.temp}°C`
                      : '--'
                  }
                />


                <WeatherValue
                  label={t.humidity}

                  value={
                    weather.humidity !== null &&
                    weather.humidity !== undefined
                      ? `${weather.humidity}%`
                      : '--'
                  }
                />


                <WeatherValue
                  label={t.rainProbability}

                  value={
                    weather.rain_prob !== null &&
                    weather.rain_prob !== undefined
                      ? `${weather.rain_prob}%`
                      : '--'
                  }
                />


                <WeatherValue
                  label={t.windSpeed}

                  value={
                    weather.wind !== null &&
                    weather.wind !== undefined
                      ? `${weather.wind} km/h`
                      : '--'
                  }
                />

              </div>

            </div>

          )}


          {/* ADVISORY */}

          {advisory && (

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">

              <p className="text-sm font-medium text-[#1D2A20] leading-relaxed">
                {advisory}
              </p>

            </div>

          )}


          {/* ESTIMATE NOTICE */}

          <div className="pt-3 border-t border-sage-100 text-xs text-[#6F786F] italic">
            {simulation.estimate_notice}
          </div>


          {/* DATA SOURCE */}

          {weather?.weather_source && (

            <p className="text-[11px] text-[#6F786F]">

              {language === 'ta'
                ? 'வானிலை தரவு மூலம்'
                : language === 'hi'
                ? 'मौसम डेटा स्रोत'
                : 'Weather data source'}
              :{' '}

              <span className="font-bold text-[#416A47]">
                {weather.weather_source ===
                'open_meteo'
                  ? 'Open-Meteo'
                  : weather.weather_source}
              </span>

            </p>

          )}

        </div>

      )}

    </div>

  );
};


interface WeatherValueProps {
  label: string;
  value: string;
}


const WeatherValue:
React.FC<WeatherValueProps> =
({
  label,
  value,
}) => {

  return (

    <div className="bg-white/80 rounded-xl p-3">

      <p className="text-[10px] text-[#6F786F] font-bold">
        {label}
      </p>

      <p className="text-sm font-black text-[#1D2A20] mt-0.5">
        {value}
      </p>

    </div>

  );
};