/// <reference types="google.maps" />

declare global {
  interface Window {
    google?: { maps: typeof google.maps };
  }
}

const KEY_STORAGE = 'majisense_gmaps_key';
let loadPromise: Promise<void> | null = null;
let loadedKey: string | null = null;

export function getMapsApiKey(): string {
  if (typeof window === 'undefined') return process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';
  return (
    sessionStorage.getItem(KEY_STORAGE) ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
    ''
  );
}

export function saveMapsApiKey(key: string) {
  sessionStorage.setItem(KEY_STORAGE, key.trim());
}

export function loadGoogleMaps(apiKey: string): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('window unavailable'));
  if (window.google?.maps && loadedKey === apiKey) return Promise.resolve();
  if (loadPromise && loadedKey === apiKey) return loadPromise;

  loadedKey = apiKey;
  loadPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById('majisense-gmaps');
    if (existing && window.google?.maps) {
      resolve();
      return;
    }
    if (existing) existing.remove();
    const script = document.createElement('script');
    script.id = 'majisense-gmaps';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google?.maps) resolve();
      else reject(new Error('Google Maps loaded without maps namespace'));
    };
    script.onerror = () => {
      loadPromise = null;
      loadedKey = null;
      reject(new Error('Failed to load Google Maps. Check the API key and that Maps JavaScript API is enabled.'));
    };
    document.head.appendChild(script);
  });
  return loadPromise;
}
