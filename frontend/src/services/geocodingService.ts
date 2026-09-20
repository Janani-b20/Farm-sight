/**
 * Reverse Geocoding Service for FarmSight
 * Uses OpenStreetMap Nominatim API to convert lat/lng into district/city/state names.
 */

export interface ReverseGeocodeResult {
  district: string;
  city: string;
  state: string;
  displayName: string;
}

export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<ReverseGeocodeResult | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`,
      {
        headers: {
          'Accept-Language': 'en',
          'User-Agent': 'FarmSight-Farmer-App/1.0',
        },
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const address = data.address || {};

    const city =
      address.city ||
      address.town ||
      address.village ||
      address.suburb ||
      address.municipality ||
      '';

    const district =
      address.county ||
      address.state_district ||
      address.district ||
      city ||
      '';

    const state = address.state || '';

    let displayName = '';
    if (city && state) {
      displayName = `${city}, ${state}`;
    } else if (district && state) {
      displayName = `${district}, ${state}`;
    } else if (state) {
      displayName = state;
    }

    return {
      district: district || city,
      city: city || district,
      state: state,
      displayName,
    };
  } catch (error) {
    console.warn('Reverse geocoding request failed or timed out:', error);
    return null;
  }
}
