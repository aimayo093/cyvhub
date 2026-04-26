import { Platform } from 'react-native';

let mapsScriptPromise: Promise<boolean> | null = null;
let warnedMissingBrowserKey = false;

declare const process: any;

const env = () => (typeof process !== 'undefined' ? process.env || {} : {});

export type GooglePlaceSuggestion = {
  id: string;
  placeId: string;
  description: string;
  source: 'google';
};

export type BrowserGeocodeResult = {
  id: string;
  line1: string;
  townCity: string;
  county?: string;
  postcode: string;
  latitude: number;
  longitude: number;
  formatted: string;
};

export function getGoogleMapsBrowserKey(): string {
  return (
    env().NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
    env().EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
    ''
  );
}

export function validateGoogleMapsBrowserConfig() {
  const browserKey = getGoogleMapsBrowserKey();
  if (!browserKey && !warnedMissingBrowserKey && env().NODE_ENV !== 'production') {
    warnedMissingBrowserKey = true;
    console.warn('[Google Maps] NEXT_PUBLIC_GOOGLE_MAPS_API_KEY or EXPO_PUBLIC_GOOGLE_MAPS_API_KEY is missing. Browser maps/autocomplete will use fallback services.');
  }

  return Boolean(browserKey);
}

export function isGoogleMapsBrowserAvailable(): boolean {
  return Platform.OS === 'web' && validateGoogleMapsBrowserConfig();
}

export async function loadGoogleMapsBrowserApi(): Promise<boolean> {
  if (!isGoogleMapsBrowserAvailable()) return false;

  const w = globalThis as any;
  if (w.google?.maps?.places) return true;

  if (!mapsScriptPromise) {
    mapsScriptPromise = new Promise(resolve => {
      const key = getGoogleMapsBrowserKey();
      const existing = w.document?.querySelector?.('script[data-cyvhub-google-maps="true"]');
      if (existing) {
        existing.addEventListener('load', () => resolve(true), { once: true });
        existing.addEventListener('error', () => resolve(false), { once: true });
        return;
      }

      const script = w.document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.dataset.cyvhubGoogleMaps = 'true';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      w.document.head.appendChild(script);
    });
  }

  return mapsScriptPromise;
}

export async function getGooglePlacePredictions(query: string): Promise<GooglePlaceSuggestion[]> {
  const loaded = await loadGoogleMapsBrowserApi();
  if (!loaded) return [];

  const w = globalThis as any;
  const service = new w.google.maps.places.AutocompleteService();

  return new Promise(resolve => {
    service.getPlacePredictions(
      {
        input: query,
        componentRestrictions: { country: 'gb' },
        fields: ['place_id', 'description'],
      },
      (predictions: any[] | null, status: string) => {
        if (status !== w.google.maps.places.PlacesServiceStatus.OK || !predictions) {
          resolve([]);
          return;
        }

        resolve(predictions.slice(0, 6).map(prediction => ({
          id: prediction.place_id,
          placeId: prediction.place_id,
          description: prediction.description,
          source: 'google',
        })));
      }
    );
  });
}

export async function geocodeBrowserAddress(address: string): Promise<BrowserGeocodeResult | null> {
  const loaded = await loadGoogleMapsBrowserApi();
  if (!loaded) return null;

  const w = globalThis as any;
  const geocoder = new w.google.maps.Geocoder();

  return new Promise(resolve => {
    geocoder.geocode(
      {
        address,
        componentRestrictions: { country: 'GB' },
      },
      (results: any[] | null, status: string) => {
        if (status !== 'OK' || !results?.[0]) {
          resolve(null);
          return;
        }

        const result = results[0];
        const component = (type: string) =>
          result.address_components?.find((part: any) => part.types.includes(type));
        const postcode = component('postal_code')?.long_name || '';
        const townCity =
          component('postal_town')?.long_name ||
          component('locality')?.long_name ||
          component('administrative_area_level_2')?.long_name ||
          '';
        const county = component('administrative_area_level_2')?.long_name;
        const line1 = result.formatted_address?.split(',')?.[0] || address;
        const location = result.geometry.location;

        resolve({
          id: result.place_id || `google-${postcode || Date.now()}`,
          line1,
          townCity,
          county,
          postcode,
          latitude: typeof location.lat === 'function' ? location.lat() : location.lat,
          longitude: typeof location.lng === 'function' ? location.lng() : location.lng,
          formatted: result.formatted_address,
        });
      }
    );
  });
}
