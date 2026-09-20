import { CropId } from '../types';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'http://127.0.0.1:8000';


// ============================================================
// DISEASE ML PREDICTION
// ============================================================

export interface DiseasePredictionResponse {
  crop: string;
  disease: string;
  confidence: number;
  message: string;
}

export const predictDisease = async (
  crop: CropId,
  image: File
): Promise<DiseasePredictionResponse> => {
  const formData = new FormData();

  formData.append('crop', crop);
  formData.append('image', image);

  const response = await fetch(
    `${API_BASE_URL}/api/disease/predict`,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error(
      `Disease prediction failed (${response.status})`
    );
  }

  return response.json();
};


// ============================================================
// DISEASE INTELLIGENCE / RAG
// ============================================================

export interface AnalysisSource {
  title: string;
  url: string;
}

export interface DiseaseAnalysisResponse {
  status: string;

  analysis?: string;

  crop?: string;
  disease?: string;
  confidence?: number;

  why_this_happening?: string[];
  what_to_do_now?: string[];
  treatment?: string[];

  weather_warning?: string | null;

  sources?: AnalysisSource[];

  show_whatif?: boolean;
}


// ============================================================
// ANALYZE DISEASE
// ============================================================

export const analyzeDisease = async (
  prediction: DiseasePredictionResponse,
  weatherContext: string = '',
  language: string = 'en'
): Promise<DiseaseAnalysisResponse> => {
  const response = await fetch(
    `${API_BASE_URL}/api/analyze`,
    {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json',
      },

      body: JSON.stringify({
        crop: prediction.crop,
        disease: prediction.disease,
        confidence: prediction.confidence,
        message: prediction.message || '',
        weather_context: weatherContext,
        language: language,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Disease intelligence failed (${response.status})`
    );
  }

  return response.json();
};

export type PredictionResult = DiseasePredictionResponse;
export type AnalysisResponse = DiseaseAnalysisResponse;
export const analyzePrediction = analyzeDisease;