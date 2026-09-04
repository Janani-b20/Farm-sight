const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'http://127.0.0.1:8000';


export interface WhatIfRequest {
  crop: string;
  disease: string;
  confidence: number;

  state?: string;
  district?: string;

  latitude?: number | null;
  longitude?: number | null;

  farmer_action?: string;
  language?: string;
}


export interface WeatherData {
  temp: number | null;
  humidity: number | null;
  rain_prob: number | null;
  wind: number | null;

  weather_source?: string;
  weather_status?: string;
}


export interface SimulationResult {
  status: string;

  crop: string;
  disease: string;
  confidence: number;

  action: string;

  weather_conditions: WeatherData;

  simulation_outcome: string;

  risk_level: string;

  recommendation: string;

  estimate_notice: string;

  show_whatif: boolean;
}


export interface WhatIfResult {
  status: string;

  simulation: SimulationResult;

  advisory_text?: string;

  audio_file?: string | null;

  show_whatif: boolean;
}


export interface WhatIfResponse {
  status: string;

  crop?: string;
  disease?: string;
  confidence?: number;

  message?: string;

  weather?: WeatherData;

  weather_warning?: string | null;

  disease_rag?: unknown;

  market?: unknown;

  whatif?: WhatIfResult;

  show_whatif: boolean;
}


export async function runWhatIf(
  request: WhatIfRequest
): Promise<WhatIfResponse> {

  const response = await fetch(
    `${API_BASE_URL}/api/whatif`,
    {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json',
      },

      body: JSON.stringify({
        crop: request.crop,

        disease: request.disease,

        confidence:
          request.confidence,

        state:
          request.state ||
          'Tamil Nadu',

        district:
          request.district ||
          'Madurai',

        latitude:
          request.latitude ??
          9.9252,

        longitude:
          request.longitude ??
          78.1198,

        farmer_action:
          request.farmer_action ||
          'spray_immediately',

        language:
          request.language ||
          'en',
      }),
    }
  );


  if (!response.ok) {
    let message =
      'What-If simulation failed.';

    try {
      const data =
        await response.json();

      message =
        data.detail ||
        message;
    } catch {
      message =
        `HTTP ${response.status}`;
    }

    throw new Error(message);
  }


  return response.json();
}
