'use client';
import { useCallback, useEffect, useState } from 'react';
import { fetchWeatherBundle, clearWeatherCache, WeatherBundle } from './weather';

type Status = 'loading' | 'ready' | 'error';

export function useWeather(lat: number, lng: number) {
  const [data, setData] = useState<WeatherBundle | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState('');
  // Bumping this re-runs the effect, which is how refresh() forces a refetch
  // without setting state synchronously inside the effect body.
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    // Guards against a slow response resolving after the coordinates changed
    // or the component unmounted, which would otherwise clobber newer data.
    let cancelled = false;

    (async () => {
      try {
        const bundle = await fetchWeatherBundle(lat, lng);
        if (cancelled) return;
        setData(bundle);
        setStatus('ready');
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Weather request failed');
        setStatus('error');
      }
    })();

    return () => { cancelled = true; };
  }, [lat, lng, reloadToken]);

  const refresh = useCallback(() => {
    clearWeatherCache();
    setStatus('loading');
    setError('');
    setReloadToken(t => t + 1);
  }, []);

  return { data, status, error, refresh };
}
