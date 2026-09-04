import { CropId } from '../types';

export interface SchemeItem {
  scheme_id: string;
  scheme_name: string;
  short_name?: string;
  relevance: string;
  score: number;
  why_recommended: string[];
  benefit: string;
  eligibility_note?: string;
  documents?: string[];
  official_url: string;
  url_type?: string;
  disclaimer?: string;
}

export interface SchemeRecommendationResponse {
  status: string;
  recommendation_type: string;
  total_recommendations: number;
  schemes: SchemeItem[];
  fallback_schemes?: SchemeItem[];
  disclaimer: string;
}

export interface RecommendSchemesParams {
  state: string;
  crop: CropId | string;
  risk_tags?: string[];
  top_n?: number;
}

const schemeCache = new Map<string, { data: SchemeRecommendationResponse; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function getSchemeRecommendations(
  params: RecommendSchemesParams
): Promise<SchemeRecommendationResponse> {
  const stateStr = params.state || 'Tamil Nadu';
  const cropStr = params.crop || 'paddy';
  const riskTagsStr = (params.risk_tags || []).sort().join(',');
  const cacheKey = `${stateStr.toLowerCase()}_${cropStr.toLowerCase()}_${riskTagsStr}`;
  const now = Date.now();

  const cached = schemeCache.get(cacheKey);
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const response = await fetch('/api/schemes/recommend', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        state: stateStr,
        crop: cropStr,
        farmer_type: 'farmer',
        risk_tags: params.risk_tags || [],
        top_n: params.top_n || 3,
      }),
    });

    if (!response.ok) {
      throw new Error(`Scheme API HTTP error: ${response.status}`);
    }

    const data: SchemeRecommendationResponse = await response.json();
    schemeCache.set(cacheKey, { data, timestamp: Date.now() });
    return data;
  } catch (err) {
    console.warn('Scheme API request error, returning fallback:', err);
    return {
      status: 'error',
      recommendation_type: 'fallback',
      total_recommendations: 0,
      schemes: [],
      disclaimer: 'Schemes temporarily unavailable. Check official government portal.',
    };
  }
}
