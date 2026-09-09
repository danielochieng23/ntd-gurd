/** Smoke test: build every report kind in Node and confirm real PDF bytes come out. */
import { writeFileSync } from 'fs';
import { generateReport } from '../lib/pdf';
import { getCurrentState, ALERTS, INTERVENTIONS, WATER_SENSORS } from '../lib/data';
import type { WeatherBundle } from '../lib/weather';

const weather: WeatherBundle = {
  fetchedAt: new Date().toISOString(),
  latitude: 0.445, longitude: 34.055,
  days: [], flood: [],
  rain7d: 2.4, rainNext7d: 21.4, seasonalNormal: 3.12, rainfallAnomaly: -89,
  floodRisk: 12, dischargeNow: null, dischargeBaseline: null,
  degraded: ['No significant river reach at this point in the GloFAS grid — flood risk is rainfall-driven only.'],
};

const ctx = {
  communities: getCurrentState(),
  alerts: ALERTS,
  interventions: INTERVENTIONS,
  sensors: WATER_SENSORS,
  weather,
  author: 'Busia District Health Office',
};

const kinds = ['situation', 'alert', 'water', 'response'] as const;
let failed = 0;

for (const kind of kinds) {
  try {
    const { doc, filename } = generateReport({ kind, ctx, alert: ALERTS[0] });
    const buf = Buffer.from(doc.output('arraybuffer') as ArrayBuffer);
    const header = buf.subarray(0, 5).toString('latin1');
    const ok = header === '%PDF-' && buf.length > 5000;
    writeFileSync(`scripts/out-${kind}.pdf`, buf);
    console.log(
      `${ok ? 'PASS' : 'FAIL'}  ${kind.padEnd(10)} pages=${doc.getNumberOfPages()} ` +
      `bytes=${buf.length.toLocaleString().padStart(9)}  ${filename}`,
    );
    if (!ok) failed++;
  } catch (e) {
    console.log(`FAIL  ${kind.padEnd(10)} ${e instanceof Error ? e.message : e}`);
    failed++;
  }
}

console.log(failed ? `\n${failed} report(s) failed.` : '\nAll reports generated.');
process.exit(failed ? 1 : 0);
