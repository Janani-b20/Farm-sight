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
  temp?: number | null;
  humidity?: number | null;
  rain_prob?: number | null;
  wind?: number | null;
  weather_source?: string;
  weather_status?: string;
  message?: string;
}

export interface SimulationResult {
  status: string;
  crop?: string;
  disease?: string;
  confidence?: number;
  action?: string;
  weather_conditions?: WeatherData;
  simulation_outcome?: string;
  risk_level?: string;
  recommendation?: string;
  estimate_notice?: string;
  show_whatif?: boolean;
}

export interface WhatIfSubResult {
  status: string;
  simulation: SimulationResult;
  advisory_text?: string;
  show_whatif?: boolean;
}

export interface WhatIfResponse {
  status: string;
  crop?: string;
  disease?: string;
  confidence?: number;
  message?: string;
  weather?: WeatherData;
  weather_warning?: string | null;
  disease_rag?: any;
  market?: any;
  whatif?: WhatIfSubResult;
  show_whatif: boolean;
}

/**
 * Execute What-If scenario simulation for treatment decisions.
 * POST /api/whatif
 */
export async function runWhatIf(request: WhatIfRequest): Promise<WhatIfResponse> {
  const response = await fetch('/api/whatif', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      crop: request.crop,
      disease: request.disease,
      confidence: request.confidence,
      state: request.state || 'Tamil Nadu',
      district: request.district || 'Thanjavur',
      latitude: request.latitude ?? null,
      longitude: request.longitude ?? null,
      farmer_action: request.farmer_action || 'spray_immediately',
      language: request.language || 'en',
    }),
  });

  if (!response.ok) {
    let errorMessage = 'What-If simulation failed.';
    try {
      const errData = await response.json();
      errorMessage = errData.detail || errorMessage;
    } catch {
      errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
    }
    throw new Error(errorMessage);
  }

  return response.json();
}
