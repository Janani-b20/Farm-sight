import React, {
  createContext,
  useContext,
  useState,
} from 'react';

import {
  Language,
  CropId,
  ActiveTab,
  AppScreen,
  AnalysisResponse,
} from '../types';

import { reverseGeocode } from '../services/geocodingService';

export type LocationStatus = 'loading' | 'live' | 'fallback' | 'denied' | 'error';

export interface AppLocation {
  latitude: number;
  longitude: number;
  district: string;
  city: string;
  state: string;
  locationName: string;
  locationStatus: LocationStatus;
}

import { getTTSProvider } from '../services/voiceService';

import {
  predictDisease,
  analyzeDisease,
  DiseasePredictionResponse,
} from '../services/diseaseApi';

import { getWeather, WeatherResponse } from '../services/weatherApi';
import { getMarketAnalysis, MarketAnalysisResponse, GetMarketAnalysisParams } from '../services/marketApi';

// =======================================================
// TYPES
// =======================================================

interface DiagnosisState {
  step:
    | 'select_crop'
    | 'upload_photo'
    | 'analyzing'
    | 'result';

  imageUri: string | null;

  resultType:
    | 'disease'
    | 'healthy'
    | 'uncertain';

  result: AnalysisResponse | null;
}

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;

  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;

  currentScreen: AppScreen;
  setCurrentScreen: (screen: AppScreen) => void;

  selectedCrop: CropId;
  setSelectedCrop: (crop: CropId) => void;

  diagnosisState: DiagnosisState;

  setDiagnosisState: React.Dispatch<
    React.SetStateAction<DiagnosisState>
  >;

  triggerDiagnosis: (
    crop: CropId,
    imageFile: File,
    imagePreview: string
  ) => Promise<void>;

  whatIfOption: string;
  setWhatIfOption: (opt: string) => void;

  marketQuantityKg: number;
  setMarketQuantityKg: (kg: number) => void;

  selectedMandiIndex: number;
  setSelectedMandiIndex: (idx: number) => void;

  userLocation: string;
  setUserLocation: (loc: string) => void;

  location: AppLocation;
  requestLocation: () => void;

  getWeatherCached: (lat: number, lon: number) => Promise<WeatherResponse>;
  getMarketAnalysisCached: (params: GetMarketAnalysisParams) => Promise<MarketAnalysisResponse>;

  voiceSpeed: number;
  setVoiceSpeed: (speed: number) => void;

  isSpeaking: boolean;
  activeSpeakingText: string | null;

  voiceNotice: string | null;

  speakText: (text: string) => void;
  stopSpeech: () => void;

  resetDiagnosis: () => void;
  resetDemoState: () => void;
}

// =======================================================
// CONTEXT
// =======================================================

const AppContext =
  createContext<AppContextType | undefined>(
    undefined
  );

// =======================================================
// PROVIDER
// =======================================================

export const AppProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [language, setLanguageState] =
    useState<Language>('en');

  const [currentScreen, setCurrentScreen] =
    useState<AppScreen>('welcome');

  const [activeTab, setActiveTabState] =
    useState<ActiveTab>('home');

  const [selectedCrop, setSelectedCrop] =
    useState<CropId>('paddy');

  const [userLocation, setUserLocationState] =
    useState<string>(
      'Madurai, Tamil Nadu'
    );

  const [location, setLocation] = useState<AppLocation>({
    latitude: 9.9252,
    longitude: 78.1198,
    district: 'Madurai',
    city: 'Madurai',
    state: 'Tamil Nadu',
    locationName: 'Madurai, Tamil Nadu',
    locationStatus: 'fallback',
  });

  const setUserLocation = (locName: string) => {
    setUserLocationState(locName);
    setLocation(prev => ({ ...prev, locationName: locName }));
  };

  const requestLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocation(prev => ({
        ...prev,
        latitude: 9.9252,
        longitude: 78.1198,
        district: 'Madurai',
        city: 'Madurai',
        state: 'Tamil Nadu',
        locationName: 'Madurai, Tamil Nadu',
        locationStatus: 'fallback',
      }));
      setUserLocationState('Madurai, Tamil Nadu');
      return;
    }

    setLocation(prev => ({ ...prev, locationStatus: 'loading' }));

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        setLocation(prev => ({
          ...prev,
          latitude: lat,
          longitude: lng,
          locationStatus: 'live',
        }));

        const geoResult = await reverseGeocode(lat, lng);

        if (geoResult && (geoResult.district || geoResult.state)) {
          const dist = geoResult.district || 'Madurai';
          const st = geoResult.state || 'Tamil Nadu';
          const name = geoResult.displayName || `${geoResult.city || dist}, ${st}`;

          setLocation({
            latitude: lat,
            longitude: lng,
            district: dist,
            city: geoResult.city || dist,
            state: st,
            locationName: name,
            locationStatus: 'live',
          });
          setUserLocationState(name);
        } else {
          // GPS succeeded, reverse geocode failed: KEEP real GPS coords!
          setLocation(prev => ({
            ...prev,
            latitude: lat,
            longitude: lng,
            locationStatus: 'live',
            locationName:
              prev.locationName && prev.locationName !== 'Madurai, Tamil Nadu'
                ? prev.locationName
                : 'Current Location',
          }));
          setUserLocationState('Current Location');
        }
      },
      (error) => {
        console.warn('Geolocation error:', error);
        const status: LocationStatus = error.code === 1 ? 'denied' : 'fallback';
        setLocation({
          latitude: 9.9252,
          longitude: 78.1198,
          district: 'Madurai',
          city: 'Madurai',
          state: 'Tamil Nadu',
          locationName: 'Madurai, Tamil Nadu',
          locationStatus: status,
        });
        setUserLocationState('Madurai, Tamil Nadu');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  };

  const weatherCacheRef = React.useRef<{ key: string; data: WeatherResponse; timestamp: number } | null>(null);
  const marketCacheRef = React.useRef<Map<string, { data: MarketAnalysisResponse; timestamp: number }>>(new Map());

  const getWeatherCached = async (lat: number, lon: number): Promise<WeatherResponse> => {
    const key = `${lat.toFixed(3)}_${lon.toFixed(3)}`;
    const now = Date.now();
    const cached = weatherCacheRef.current;

    if (cached && cached.key === key && (now - cached.timestamp < 300000)) {
      return cached.data;
    }

    const fresh = await getWeather(lat, lon);
    weatherCacheRef.current = { key, data: fresh, timestamp: Date.now() };
    return fresh;
  };

  const getMarketAnalysisCached = async (params: GetMarketAnalysisParams): Promise<MarketAnalysisResponse> => {
    const key = `${params.commodity}_${params.state}_${params.district || ''}_${params.quantity_kg || 1000}_${(params.user_lat || 0).toFixed(2)}_${(params.user_lng || 0).toFixed(2)}`;
    const now = Date.now();
    const cached = marketCacheRef.current.get(key);

    if (cached && (now - cached.timestamp < 300000)) {
      return cached.data;
    }

    const fresh = await getMarketAnalysis(params);
    marketCacheRef.current.set(key, { data: fresh, timestamp: Date.now() });
    return fresh;
  };

  React.useEffect(() => {
    requestLocation();
  }, []);

  const [voiceSpeed, setVoiceSpeed] =
    useState<number>(1.0);

  const [whatIfOption, setWhatIfOption] =
    useState<string>('wait_weather');

  const [
    marketQuantityKg,
    setMarketQuantityKg,
  ] = useState<number>(1000);

  const [
    selectedMandiIndex,
    setSelectedMandiIndex,
  ] = useState<number>(0);

  const [
    diagnosisState,
    setDiagnosisState,
  ] = useState<DiagnosisState>({
    step: 'select_crop',
    imageUri: null,
    resultType: 'disease',
    result: null,
  });

  /*
    Store the latest REAL ML prediction.

    This lets us regenerate only the
    Disease Intelligence when the farmer
    changes language.

    We DO NOT run the ML model again.
  */
  const [
    lastPrediction,
    setLastPrediction,
  ] =
    useState<DiseasePredictionResponse | null>(
      null
    );

  const [isSpeaking, setIsSpeaking] =
    useState<boolean>(false);

  const [
    activeSpeakingText,
    setActiveSpeakingText,
  ] = useState<string | null>(null);

  const [
    voiceNotice,
    setVoiceNotice,
  ] = useState<string | null>(null);

  // =====================================================
  // STOP SPEECH
  // =====================================================

  const stopSpeech = () => {
    const tts = getTTSProvider();

    tts.stop();

    setIsSpeaking(false);
    setActiveSpeakingText(null);
  };

  // =====================================================
  // LANGUAGE
  // =====================================================

  const setLanguage = async (
    lang: Language
  ) => {
    /*
      Change all normal frontend labels immediately.
    */
    setLanguageState(lang);

    stopSpeech();
    setVoiceNotice(null);

    /*
      If there is no completed disease result,
      there is nothing dynamic to regenerate.
    */
    if (!lastPrediction) {
      return;
    }

    if (
      diagnosisState.step !== 'result' ||
      diagnosisState.resultType !== 'disease'
    ) {
      return;
    }

    /*
      IMPORTANT:

      Do NOT run predictDisease again.

      We already know:
      - crop
      - disease
      - confidence

      We only ask Disease Intelligence
      to regenerate the explanation in
      the newly selected language.
    */
    try {
      const intelligence =
        await analyzeDisease(
          lastPrediction,
          '',
          lang
        );

      setDiagnosisState(
        previousState => {
          if (!previousState.result) {
            return previousState;
          }

          return {
            ...previousState,

            result: {
              ...previousState.result,

              status:
                intelligence.status ||
                previousState.result.status,

              disease:
                intelligence.disease ||
                previousState.result.disease,

              confidence:
                intelligence.confidence ??
                previousState.result.confidence,

              analysis:
                intelligence.analysis ||
                '',

              why_this_happening:
                intelligence.why_this_happening ||
                [],

              what_to_do_now:
                intelligence.what_to_do_now ||
                [],

              treatment:
                intelligence.treatment ||
                [],

              weather_warning:
                intelligence.weather_warning ||
                '',

              sources:
                intelligence.sources ||
                [],
            },
          };
        }
      );
    } catch (error) {
      console.error(
        'Failed to refresh Disease Intelligence language:',
        error
      );

      /*
        Do not delete the previous result
        if translation/regeneration fails.

        Farmer can still see the previous
        valid Disease Intelligence.
      */
    }
  };

  // =====================================================
  // NAVIGATION
  // =====================================================

  const setActiveTab = (
    tab: ActiveTab
  ) => {
    setActiveTabState(tab);

    setCurrentScreen(tab);

    stopSpeech();
  };

  // =====================================================
  // DISEASE DIAGNOSIS
  // =====================================================

  const triggerDiagnosis = async (
    crop: CropId,
    imageFile: File,
    imagePreview: string
  ) => {
    setSelectedCrop(crop);

    /*
      New diagnosis starts here.

      Remove the previous stored prediction.
    */
    setLastPrediction(null);

    setDiagnosisState({
      step: 'analyzing',
      imageUri: imagePreview,
      resultType: 'disease',
      result: null,
    });

    try {
      // =================================================
      // STEP 1: REAL ML PREDICTION
      // =================================================

      const prediction =
        await predictDisease(
          crop,
          imageFile
        );

      /*
        Save the prediction so language switching
        can reuse it later.
      */
      setLastPrediction(prediction);

      const diseaseName =
        prediction.disease?.trim() ||
        'uncertain';

      const normalizedDisease =
        diseaseName
          .trim()
          .toLowerCase()
          .replace(/\s+/g, '_');

      // =================================================
      // PATH 1: UNCERTAIN
      // =================================================

      if (
        normalizedDisease ===
        'uncertain'
      ) {
        const result: AnalysisResponse = {
          status: 'uncertain',

          disease: 'uncertain',

          confidence:
            prediction.confidence,

          analysis:
            prediction.message ||
            'FarmSight could not confidently identify this condition. Please upload a clearer image.',

          why_this_happening: [],

          what_to_do_now: [],

          treatment: [],

          weather_warning: '',

          sources: [],
        };

        setDiagnosisState({
          step: 'result',

          imageUri: imagePreview,

          resultType: 'uncertain',

          result,
        });

        return;
      }

      // =================================================
      // PATH 2: HEALTHY
      // =================================================

      if (
        normalizedDisease ===
          'normal' ||
        normalizedDisease ===
          'healthy' ||
        normalizedDisease ===
          'healthy_leaf'
      ) {
        const result: AnalysisResponse = {
          status: 'normal',

          disease:
            normalizedDisease,

          confidence:
            prediction.confidence,

          analysis:
            'The uploaded leaf appears healthy based on the current FarmSight disease model.',

          why_this_happening: [],

          what_to_do_now: [],

          treatment: [],

          weather_warning: '',

          sources: [],
        };

        setDiagnosisState({
          step: 'result',

          imageUri: imagePreview,

          resultType: 'healthy',

          result,
        });

        return;
      }

      // =================================================
      // PATH 3: DISEASE DETECTED
      // =================================================

      try {
        /*
          ML has already completed.

          Now generate Disease Intelligence
          using the CURRENT selected language.
        */
        const intelligence =
          await analyzeDisease(
            prediction,
            '',
            language
          );

        const result: AnalysisResponse = {
          status:
            'disease_detected',

          disease:
            intelligence.disease ||
            diseaseName,

          confidence:
            intelligence.confidence ??
            prediction.confidence,

          analysis:
            intelligence.analysis ||
            '',

          why_this_happening:
            intelligence.why_this_happening ||
            [],

          what_to_do_now:
            intelligence.what_to_do_now ||
            [],

          treatment:
            intelligence.treatment ||
            [],

          weather_warning:
            intelligence.weather_warning ||
            '',

          sources:
            intelligence.sources ||
            [],
        };

        setDiagnosisState({
          step: 'result',

          imageUri:
            imagePreview,

          resultType:
            'disease',

          result,
        });

        return;
      } catch (
        intelligenceError
      ) {
        console.error(
          'Disease intelligence error:',
          intelligenceError
        );

        /*
          ML succeeded but Disease Intelligence failed.

          Keep the valid ML prediction.
        */
        const result: AnalysisResponse = {
          status:
            'disease_detected',

          disease:
            diseaseName,

          confidence:
            prediction.confidence,

          analysis: '',

          why_this_happening: [],

          what_to_do_now: [],

          treatment: [],

          weather_warning: '',

          sources: [],
        };

        setDiagnosisState({
          step: 'result',

          imageUri:
            imagePreview,

          resultType:
            'disease',

          result,
        });

        return;
      }
    } catch (error) {
      // =================================================
      // ML / NETWORK FAILURE
      // =================================================

      console.error(
        'Disease prediction error:',
        error
      );

      /*
        Prediction failed completely,
        so do not keep an old prediction.
      */
      setLastPrediction(null);

      const result: AnalysisResponse = {
        status:
          'uncertain',

        disease:
          'unavailable',

        confidence: 0,

        analysis:
          'FarmSight could not analyze this photo right now. Please try again.',

        why_this_happening: [],

        what_to_do_now: [],

        treatment: [],

        weather_warning: '',

        sources: [],
      };

      setDiagnosisState({
        step: 'result',

        imageUri:
          imagePreview,

        resultType:
          'uncertain',

        result,
      });
    }
  };

  // =====================================================
  // TEXT TO SPEECH
  // =====================================================

  const speakText = (
    text: string
  ) => {
    const tts =
      getTTSProvider();

    if (
      isSpeaking &&
      activeSpeakingText ===
        text
    ) {
      stopSpeech();
      return;
    }

    stopSpeech();

    setActiveSpeakingText(
      text
    );

    setIsSpeaking(true);

    tts.speak(
      text,
      language,
      {
        rate:
          voiceSpeed,

        onEnd: () => {
          setIsSpeaking(false);

          setActiveSpeakingText(
            null
          );
        },

        onError: (
          err: any
        ) => {
          setIsSpeaking(false);

          setActiveSpeakingText(
            null
          );

          if (
            typeof err ===
            'string'
          ) {
            setVoiceNotice(
              err
            );

            setTimeout(
              () =>
                setVoiceNotice(
                  null
                ),
              4500
            );
          }
        },
      }
    );
  };

  // =====================================================
  // RESET
  // =====================================================

  const resetDiagnosis = () => {
    stopSpeech();

    setLastPrediction(null);

    setDiagnosisState({
      step: 'select_crop',
      imageUri: null,
      resultType: 'disease',
      result: null,
    });
  };

  const resetDemoState =
    () => {
      stopSpeech();

      setLanguageState(
        'en'
      );

      setCurrentScreen(
        'welcome'
      );

      setActiveTabState(
        'home'
      );

      setSelectedCrop(
        'paddy'
      );

      resetDiagnosis();

      setWhatIfOption(
        'wait_weather'
      );

      setVoiceNotice(
        null
      );
    };

  // =====================================================
  // PROVIDER
  // =====================================================

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,

        activeTab,
        setActiveTab,

        currentScreen,
        setCurrentScreen,

        selectedCrop,
        setSelectedCrop,

        diagnosisState,
        setDiagnosisState,
        triggerDiagnosis,

        whatIfOption,
        setWhatIfOption,

        marketQuantityKg,
        setMarketQuantityKg,

        selectedMandiIndex,
        setSelectedMandiIndex,

        userLocation,
        setUserLocation,

        location,
        requestLocation,

        getWeatherCached,
        getMarketAnalysisCached,

        voiceSpeed,
        setVoiceSpeed,

        isSpeaking,
        activeSpeakingText,

        voiceNotice,

        speakText,
        stopSpeech,

        resetDiagnosis,
        resetDemoState,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

// =======================================================
// CONTEXT HOOK
// =======================================================

export const useApp =
  () => {
    const context =
      useContext(
        AppContext
      );

    if (!context) {
      throw new Error(
        'useApp must be used within an AppProvider'
      );
    }

    return context;
  };