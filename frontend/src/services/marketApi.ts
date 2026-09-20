const API_BASE_URL =
  (import.meta as any).env?.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

export interface MarketRecord {
  commodity: string;
  state: string;
  district: string;
  market: string;
  variety: string;
  minimum_price: number | null;
  maximum_price: number | null;
  modal_price: number | null;
  arrival_date: string;
  data_source?: string;
  data_status?: string;
  last_updated?: string;
  district_unavailable?: boolean;
}

export interface BestMarket {
  market: string;
  district: string;
  state: string;
  variety: string;
  modal_price: number;
}

export interface PriceSummary {
  highest_modal_price: number | null;
  lowest_modal_price: number | null;
  average_modal_price: number | null;
}

export interface EstimatedNetValue {
  quantity_kg: number | null;
  gross_value_rs: number | null;
  transport_cost_rs: number | null;
  net_value_rs: number | null;
  calculation_basis: string;
}

export interface MarketAnalysisResponse {
  data_source: string;
  data_status: string;
  last_updated: string | null;
  district_unavailable: boolean;
  total_records_processed: number;
  valid_records_analyzed: number;
  best_market: BestMarket | null;
  price_summary: PriceSummary;
  market_comparison: Array<{
    market: string;
    district: string;
    state: string;
    variety: string;
    modal_price: number;
  }>;
  records: MarketRecord[];
  estimated_gross_value?: {
    quantity_kg: number;
    gross_value_rs: number;
    calculation_basis: string;
  } | null;
  estimated_net_value?: EstimatedNetValue | null;
  price_trend?: {
    trend_direction: string;
    percentage_change: number;
    oldest_price: number | null;
    newest_price: number | null;
    oldest_date: string | null;
    newest_date: string | null;
  } | null;
  transport_estimate?: any;
  transport_type?: string | null;
  estimated_transport_cost_rs?: number | null;
  net_value_rs?: number | null;
  net_value_calculation_basis?: string | null;
}

export interface GetMarketAnalysisParams {
  commodity: string;
  state: string;
  district?: string;
  market?: string;
  quantity_kg?: number;
  user_lat?: number;
  user_lng?: number;
}

export async function getMarketAnalysis(params: GetMarketAnalysisParams): Promise<MarketAnalysisResponse>;
export async function getMarketAnalysis(
  commodity: string,
  state?: string,
  district?: string,
  market?: string,
  quantity_kg?: number,
  user_lat?: number,
  user_lng?: number
): Promise<MarketAnalysisResponse>;
export async function getMarketAnalysis(
  commodity: string | GetMarketAnalysisParams,
  state?: string,
  district?: string,
  market?: string,
  quantity_kg?: number,
  user_lat?: number,
  user_lng?: number
): Promise<MarketAnalysisResponse> {
  let p: GetMarketAnalysisParams;
  if (typeof commodity === 'object') {
    p = commodity;
  } else {
    p = {
      commodity,
      state: state || '',
      district,
      market,
      quantity_kg,
      user_lat,
      user_lng,
    };
  }

  const query = new URLSearchParams();
  query.append('commodity', p.commodity);
  query.append('state', p.state);
  if (p.district) query.append('district', p.district);
  if (p.market) query.append('market', p.market);
  if (p.quantity_kg !== undefined && p.quantity_kg !== null) {
    query.append('quantity_kg', p.quantity_kg.toString());
  }
  if (p.user_lat !== undefined && p.user_lat !== null) {
    query.append('user_lat', p.user_lat.toString());
  }
  if (p.user_lng !== undefined && p.user_lng !== null) {
    query.append('user_lng', p.user_lng.toString());
  }

  const response = await fetch(`${API_BASE_URL}/api/market?${query.toString()}`);

  if (!response.ok) {
    throw new Error(`Market data request failed (${response.status})`);
  }

  return response.json();
}

export const fetchMarketAnalysis = getMarketAnalysis;
