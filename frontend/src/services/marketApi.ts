export interface MarketRecord {
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

export interface PriceTrend {
  trend_direction: 'increasing' | 'decreasing' | 'stable' | 'insufficient_data';
  percentage_change: number;
  oldest_price: number | null;
  newest_price: number | null;
  oldest_date: string | null;
  newest_date: string | null;
}

export interface EstimatedGrossValue {
  quantity_kg: number;
  gross_value_rs: number;
  calculation_basis: string;
}

export interface MarketAnalysisResponse {
  data_source?: string;
  data_status?: 'current' | 'recent';
  last_updated?: string | null;
  district_unavailable?: boolean;
  total_records_processed: number;
  valid_records_analyzed: number;
  best_market: MarketRecord | null;
  price_summary: PriceSummary;
  market_comparison: MarketRecord[];
  price_trend: PriceTrend;
  estimated_gross_value: EstimatedGrossValue | null;
}

export async function fetchMarketAnalysis(
  commodity: string,
  state: string,
  district?: string,
  market?: string,
  quantityKg?: string
): Promise<MarketAnalysisResponse> {
  const params = new URLSearchParams({
    commodity: commodity,
    state: state
  });

  if (district && district.trim()) {
    params.append('district', district.trim());
  }
  if (market && market.trim()) {
    params.append('market', market.trim());
  }
  if (quantityKg && quantityKg.trim()) {
    params.append('quantity_kg', quantityKg.trim());
  }

  const response = await fetch(`/api/market?${params.toString()}`);
  
  if (!response.ok) {
    let errorMessage = 'An unexpected error occurred.';
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
