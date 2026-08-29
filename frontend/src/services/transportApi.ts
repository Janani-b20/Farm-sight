// ---------------------------------------------------------------------------
// Transport API service for FarmSight
//
// Calls GET /api/transport via the existing Vite proxy (no hardcoded URLs).
//
// Integration note for live-location
// ------------------------------------
// `userLat` and `userLng` are explicit parameters here.  When the teammate's
// live-location feature is merged, the calling component simply forwards the
// coordinates from the location context — nothing in this file needs to change.
// ---------------------------------------------------------------------------

export interface TransportEstimateResponse {
  market_name: string;
  district: string;
  state: string;
  mandi_lat: number;
  mandi_lng: number;
  user_lat: number;
  user_lng: number;
  aerial_distance_km: number;
  estimated_road_distance_km: number;
  cost_per_quintal_per_km: number;
  base_transport_cost_rs: number;
  quantity_kg: number | null;
  estimated_quantity_transport_cost_rs: number | null;
  note: string;
}

export interface TransportRequestParams {
  market_name: string;
  district: string;
  state: string;
  user_lat: number;
  user_lng: number;
  quantity_kg?: number;
}

export async function fetchTransportEstimate(
  params: TransportRequestParams
): Promise<TransportEstimateResponse> {
  const query = new URLSearchParams({
    market_name: params.market_name,
    district: params.district,
    state: params.state,
    user_lat: String(params.user_lat),
    user_lng: String(params.user_lng),
  });

  if (params.quantity_kg !== undefined && params.quantity_kg > 0) {
    query.append('quantity_kg', String(params.quantity_kg));
  }

  const response = await fetch(`/api/transport?${query.toString()}`);

  if (!response.ok) {
    let errorMessage = 'Transport estimate failed.';
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
