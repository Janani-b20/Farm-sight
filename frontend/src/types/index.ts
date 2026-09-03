export type Language = 'en' | 'ta' | 'hi';

export type CropId = 'paddy' | 'cotton' | 'groundnut';

export type ActiveTab = 'home' | 'diagnose' | 'weather' | 'whatif' | 'market' | 'profile';

export type AppScreen = 'welcome' | ActiveTab;

export interface SourceItem {
  title: string;
  url: string;
}

/**
 * Standardized disease analysis contract matching backend `AnalysisResponse`
 * (src/schemas.py). All response fields except `status` are optional to handle
 * uncertain/healthy/diseased responses gracefully.
 */
export interface AnalysisResponse {
  status: 'uncertain' | 'normal' | 'disease_detected' | string;
  analysis?: string;
  crop?: string;
  disease?: string;
  confidence?: number;
  why_this_happening?: string[];
  what_to_do_now?: string[];
  treatment?: string[];
  weather_warning?: string;
  sources?: SourceItem[];
  show_whatif?: boolean;
}

/**
 * What-If decision simulation result matching `whatif_module/service.py`.
 */
export interface WhatIfSimulation {
  recommended_action?: string;
  decision_risk?: 'Low' | 'Medium' | 'High' | string;
  weather_context?: string;
  estimated_yield_loss_reduction?: string;
  cost_impact?: string;
  status?: string;
}

export interface WhatIfResponse {
  status: 'success' | 'halted' | 'healthy_crop' | string;
  simulation?: WhatIfSimulation;
  advisory_text?: string;
  audio_file?: string | null;
  show_whatif?: boolean;
}

/**
 * Market intelligence & transport response contracts matching backend `/api/market`
 * and `/api/transport` endpoints.
 */
export interface MarketRecord {
  state?: string;
  district?: string;
  market?: string;
  commodity?: string;
  modal_price?: number;
  arrival_date?: string;
  min_price?: number;
  max_price?: number;
}

export interface MarketAnalysisResponse {
  commodity?: string;
  state?: string;
  district?: string;
  market?: string;
  modal_price?: number;
  records_count?: number;
  best_mandi?: string;
  best_mandi_price?: number;
  distance_km?: number;
  quantity_kg?: number;
  gross_revenue?: number;
  transport_cost?: number;
  estimated_net_value?: number;
  records?: MarketRecord[];
}

export interface WeatherData {
  temperature: number;
  humidity: number;
  rainProbability: number;
  windSpeed: number;
  condition: string;
  farmingImpact: string;
  weatherRisk: 'Low' | 'Medium' | 'High';
}

export interface UserPreferences {
  language: Language;
  locationName: string;
  preferredCrop: CropId;
  voiceSpeed: number;
}
