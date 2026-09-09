/** Smoke test: exercise the full Open-Meteo pipeline including the ERA5 baseline. */
import { fetchWeatherBundle } from '../lib/weather';
import { MODEL_DISTRICT } from '../lib/data';

const { lat, lng } = MODEL_DISTRICT.center;

(async () => {
  const t = Date.now();
  const w = await fetchWeatherBundle(lat, lng);

  const observed = w.days.filter(d => !d.isForecast);
  const forecast = w.days.filter(d => d.isForecast);

  console.log(`fetched in ${Date.now() - t}ms for ${w.latitude}N ${w.longitude}E`);
  console.log(`days            ${w.days.length} (${observed.length} observed + ${forecast.length} forecast)`);
  console.log(`rain 7d         ${w.rain7d} mm`);
  console.log(`rain next 7d    ${w.rainNext7d} mm`);
  console.log(`seasonal normal ${w.seasonalNormal} mm/day  (5y ERA5, +/-10 day window)`);
  console.log(`anomaly         ${w.rainfallAnomaly > 0 ? '+' : ''}${w.rainfallAnomaly}%`);
  console.log(`flood risk      ${w.floodRisk}/100`);
  console.log(`discharge       ${w.dischargeNow ?? 'none'} (baseline ${w.dischargeBaseline ?? 'none'})`);
  w.degraded.forEach(d => console.log(`degraded        ${d}`));

  const problems: string[] = [];
  if (w.days.length !== 14) problems.push(`expected 14 days, got ${w.days.length}`);
  if (!observed.length || !forecast.length) problems.push('missing observed or forecast half');
  if (w.seasonalNormal <= 0) problems.push('seasonal normal did not resolve — ERA5 call likely failed');
  if (w.floodRisk < 0 || w.floodRisk > 100) problems.push(`flood risk out of range: ${w.floodRisk}`);
  if (!Number.isFinite(w.rainfallAnomaly)) problems.push('anomaly is not finite');

  console.log(problems.length ? `\nFAIL\n  ${problems.join('\n  ')}` : '\nPASS');
  process.exit(problems.length ? 1 : 0);
})();
