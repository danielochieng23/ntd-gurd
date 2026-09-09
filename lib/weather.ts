/**
 * Live weather + hydrology via Open-Meteo.
 *
 * Open-Meteo is free for non-commercial use, requires no API key and sends
 * permissive CORS headers, so the browser can call it directly.
 *   Forecast : https://open-meteo.com/en/docs
 *   Flood    : https://open-meteo.com/en/docs/flood-api
 *   Archive  : https://open-meteo.com/en/docs/historical-weather-api
 *
 * This is the only part of the prototype backed by real observations. The
 * seasonal baseline used for the rainfall anomaly is computed from five years
 * of ERA5 reanalysis for the same calendar window, so the anomaly figure is a
 * genuine comparison rather than a hard-coded number.
 */

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const FLOOD_URL = 'https://flood-api.open-meteo.com/v1/flood';
const ARCHIVE_URL = 'https://archive-api.open-meteo.com/v1/archive';
const TIMEZONE = 'Africa/Kampala';

export interface WeatherDay {
  date: string;
  precipitation: number;      // mm
  precipitationHours: number; // h
  precipProbability: number;  // %
  tempMax: number;            // °C
  tempMin: number;            // °C
  isForecast: boolean;
}

export interface FloodDay {
  date: string;
  discharge: number;          // m³/s
  isForecast: boolean;
}

export interface WeatherBundle {
  fetchedAt: string;
  latitude: number;
  longitude: number;
  days: WeatherDay[];
  flood: FloodDay[];
  /** mm of rain over the 7 complete days before today */
  rain7d: number;
  /** mm of rain forecast for today plus the next 6 days */
  rainNext7d: number;
  /** mean daily mm for this calendar window, from 5 years of ERA5 */
  seasonalNormal: number;
  /** % deviation of the trailing 7-day mean from the seasonal normal */
  rainfallAnomaly: number;
  /** 0-100, derived from rainfall load, forecast and river discharge */
  floodRisk: number;
  /** null when the flood endpoint has no river reach near the point */
  dischargeNow: number | null;
  dischargeBaseline: number | null;
  degraded: string[];
}

const CACHE_TTL_MS = 15 * 60 * 1000;
const cache = new Map<string, { at: number; data: WeatherBundle }>();

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

/** Open-Meteo returns parallel arrays keyed by the `daily` fields requested. */
interface DailyResponse {
  daily?: Record<string, (number | null)[] | string[] | undefined>;
}

async function getJson<T>(url: string, params: Record<string, string>): Promise<T> {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${url}?${qs}`);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

function numbers(daily: DailyResponse['daily'], key: string): (number | null)[] {
  const v = daily?.[key];
  return Array.isArray(v) ? (v as (number | null)[]) : [];
}

function at(daily: DailyResponse['daily'], key: string, i: number): number {
  return numbers(daily, key)[i] ?? 0;
}

/**
 * Mean daily precipitation for the ±10 day window around today, averaged over
 * the five most recent complete years. ERA5 lags ~5 days, so we stop at last year.
 */
async function fetchSeasonalNormal(lat: number, lng: number): Promise<number> {
  const now = new Date();
  const endYear = now.getUTCFullYear() - 1;
  const startYear = endYear - 4;

  const data = await getJson<DailyResponse>(ARCHIVE_URL, {
    latitude: String(lat),
    longitude: String(lng),
    start_date: `${startYear}-01-01`,
    end_date: `${endYear}-12-31`,
    daily: 'precipitation_sum',
    timezone: TIMEZONE,
  });

  const dates = (data.daily?.time ?? []) as string[];
  const values = numbers(data.daily, 'precipitation_sum');
  if (!dates.length) throw new Error('archive returned no days');

  const targetDoy = dayOfYear(now);
  const window: number[] = [];
  dates.forEach((d, i) => {
    const v = values[i];
    if (v === null || v === undefined) return;
    const diff = Math.abs(dayOfYear(new Date(`${d}T00:00:00Z`)) - targetDoy);
    // wrap around the new year
    if (Math.min(diff, 365 - diff) <= 10) window.push(v);
  });

  if (!window.length) throw new Error('no days in seasonal window');
  return window.reduce((s, v) => s + v, 0) / window.length;
}

function dayOfYear(d: Date) {
  const start = Date.UTC(d.getUTCFullYear(), 0, 0);
  return Math.floor((d.getTime() - start) / 86_400_000);
}

/** Blend rainfall load, forward outlook and river discharge into a 0-100 score. */
function deriveFloodRisk(
  rain7d: number,
  rainNext7d: number,
  anomaly: number,
  discharge: number | null,
  dischargeBaseline: number | null,
): number {
  // 120 mm over a week is treated as a saturating wet spell
  const load = Math.min(1, rain7d / 120);
  const outlook = Math.min(1, rainNext7d / 120);
  const anomalyFactor = Math.min(1, Math.max(0, anomaly) / 150);

  let score = load * 42 + outlook * 28 + anomalyFactor * 18;

  if (discharge !== null && dischargeBaseline && dischargeBaseline > 0) {
    const ratio = discharge / dischargeBaseline;
    score += Math.min(1, Math.max(0, (ratio - 1) / 1.5)) * 12;
  }

  return Math.round(Math.min(100, Math.max(0, score)));
}

export async function fetchWeatherBundle(lat: number, lng: number): Promise<WeatherBundle> {
  const key = `${lat.toFixed(3)},${lng.toFixed(3)}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.data;

  const degraded: string[] = [];

  const forecast = await getJson<DailyResponse>(FORECAST_URL, {
    latitude: String(lat),
    longitude: String(lng),
    daily: 'precipitation_sum,precipitation_hours,precipitation_probability_max,temperature_2m_max,temperature_2m_min',
    past_days: '7',
    forecast_days: '7',
    timezone: TIMEZONE,
  });

  // Today is only partly observed, so it belongs on the forward side. That keeps
  // the trailing window at exactly 7 complete days and the outlook at today + 6.
  const today = iso(new Date());
  const times = (forecast.daily?.time ?? []) as string[];
  const days: WeatherDay[] = times.map((date, i) => ({
    date,
    precipitation: at(forecast.daily, 'precipitation_sum', i),
    precipitationHours: at(forecast.daily, 'precipitation_hours', i),
    precipProbability: at(forecast.daily, 'precipitation_probability_max', i),
    tempMax: at(forecast.daily, 'temperature_2m_max', i),
    tempMin: at(forecast.daily, 'temperature_2m_min', i),
    isForecast: date >= today,
  }));

  if (!days.length) throw new Error('Open-Meteo returned no forecast days');

  const past = days.filter(d => !d.isForecast);
  const future = days.filter(d => d.isForecast);
  const rain7d = past.reduce((s, d) => s + d.precipitation, 0);
  const rainNext7d = future.reduce((s, d) => s + d.precipitation, 0);

  // Seasonal baseline — non-fatal, we fall back to the observed window mean
  let seasonalNormal: number;
  try {
    seasonalNormal = await fetchSeasonalNormal(lat, lng);
  } catch {
    seasonalNormal = days.reduce((s, d) => s + d.precipitation, 0) / days.length;
    degraded.push('Seasonal baseline unavailable — anomaly compares against the observed window instead of the 5-year ERA5 normal.');
  }

  const recentMean = past.length ? rain7d / past.length : 0;
  const rainfallAnomaly = seasonalNormal > 0.05
    ? ((recentMean - seasonalNormal) / seasonalNormal) * 100
    : 0;

  // River discharge — many points have no mapped river reach, so this is optional
  let flood: FloodDay[] = [];
  let dischargeNow: number | null = null;
  let dischargeBaseline: number | null = null;
  try {
    const fl = await getJson<DailyResponse>(FLOOD_URL, {
      latitude: String(lat),
      longitude: String(lng),
      daily: 'river_discharge',
      past_days: '7',
      forecast_days: '7',
    });
    const ftimes = (fl.daily?.time ?? []) as string[];
    const series: FloodDay[] = ftimes.map((date, i) => ({
      date,
      discharge: at(fl.daily, 'river_discharge', i),
      isForecast: date >= today,
    }));

    // GloFAS only resolves reaches above roughly this flow; anything smaller is
    // model noise and must not be presented as a river signal.
    const MIN_REACH_M3S = 0.5;
    if (series.some(d => d.discharge >= MIN_REACH_M3S)) {
      flood = series;
      // "Now" must come from observed days — the last element of the series is a
      // week-ahead forecast, not the current state of the river.
      const observedFlow = series.filter(d => !d.isForecast);
      const basis = observedFlow.length ? observedFlow : series;
      dischargeNow = basis[basis.length - 1].discharge;
      dischargeBaseline = basis.reduce((s, d) => s + d.discharge, 0) / basis.length;
    } else {
      degraded.push('No significant river reach at this point in the GloFAS grid — flood risk is rainfall-driven only.');
    }
  } catch {
    degraded.push('Flood API unreachable — flood risk uses rainfall only.');
  }

  const bundle: WeatherBundle = {
    fetchedAt: new Date().toISOString(),
    latitude: lat,
    longitude: lng,
    days,
    flood,
    rain7d: Math.round(rain7d * 10) / 10,
    rainNext7d: Math.round(rainNext7d * 10) / 10,
    seasonalNormal: Math.round(seasonalNormal * 100) / 100,
    rainfallAnomaly: Math.round(rainfallAnomaly),
    floodRisk: deriveFloodRisk(rain7d, rainNext7d, rainfallAnomaly, dischargeNow, dischargeBaseline),
    dischargeNow: dischargeNow === null ? null : Math.round(dischargeNow * 100) / 100,
    dischargeBaseline: dischargeBaseline === null ? null : Math.round(dischargeBaseline * 100) / 100,
    degraded,
  };

  cache.set(key, { at: Date.now(), data: bundle });
  return bundle;
}

export function clearWeatherCache() {
  cache.clear();
}
