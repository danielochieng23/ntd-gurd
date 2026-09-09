'use client';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Alert, Intervention, CommunityState, WaterSensor, RISK_WEIGHTS, MODEL_DISTRICT, IMPACT_METRICS,
} from './data';
import { WeatherBundle } from './weather';

const DEEP: [number, number, number] = [6, 59, 70];
const TEAL: [number, number, number] = [8, 127, 140];
const TEAL_DEEP: [number, number, number] = [10, 107, 118];
const GOLD: [number, number, number] = [242, 184, 75];
const CORAL: [number, number, number] = [235, 93, 93];
const GREEN: [number, number, number] = [76, 175, 80];
const MUTED: [number, number, number] = [74, 102, 112];
const INK: [number, number, number] = [16, 42, 46];
const HAIR: [number, number, number] = [208, 224, 227];

const M = 15;            // page margin
const DISCLAIMER =
  'PROTOTYPE OUTPUT — NTD GURD uses a transparent weighted risk model that has not been ' +
  'epidemiologically validated. Community, water-quality and symptom figures in this report are ' +
  'synthetic demonstration data. Weather and hydrology figures, where marked LIVE, are real ' +
  'observations from Open-Meteo. Do not use for clinical or public-health decision making.';

export type ReportKind = 'situation' | 'alert' | 'water' | 'response';

interface ReportContext {
  communities: CommunityState[];
  alerts: Alert[];
  interventions: Intervention[];
  sensors: WaterSensor[];
  weather?: WeatherBundle | null;
  author?: string;
}

function riskColor(score: number): [number, number, number] {
  if (score >= 75) return CORAL;
  if (score >= 55) return GOLD;
  if (score >= 35) return TEAL;
  return GREEN;
}

function levelOf(score: number) {
  return score >= 75 ? 'CRITICAL' : score >= 55 ? 'HIGH' : score >= 35 ? 'MODERATE' : 'LOW';
}

function fmtDate(d: Date | string) {
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

/**
 * The NTD GURD mark, redrawn as vectors from components/Logo.tsx so the
 * letterhead matches the app exactly: a gold pulse line with a peak marker
 * over three teal water waves. Source viewBox is 80 x 64.
 *
 * `w` is the drawn width; height follows at w * 0.8. `y` is the top edge.
 */
function drawMark(doc: jsPDF, x: number, y: number, w: number) {
  const s = w / 80;
  const px = (vx: number) => x + vx * s;
  const py = (vy: number) => y + vy * s;

  doc.setLineCap('round');
  doc.setLineJoin('round');

  // Gold pulse / ECG line, as deltas along M4 32 L14 32 L20 14 ... L76 32
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(3.4 * s);
  doc.lines(
    [[10, 0], [6, -18], [6, 26], [10, -32], [10, 26], [6, -14], [6, 12], [18, 0]],
    px(4), py(32), [s, s], 'S', false,
  );

  // Signal peak marker
  doc.setFillColor(...GOLD);
  doc.circle(px(36), py(8), 5 * s, 'F');

  // Three waves. The SVG uses quadratic curves; jsPDF takes cubics, so each
  // control point is lifted by the standard 2/3 conversion.
  const wave = [
    [6.667, -4, 13.333, -4, 20, 0],
    [6.667, 4, 13.333, 4, 20, 0],
    [6.667, -4, 14.667, -4, 24, 0],
  ];
  const waves: [number, number, [number, number, number]][] = [
    [42, 2.6, TEAL],
    [49, 2.4, TEAL],
    [56, 2.2, TEAL_DEEP],
  ];
  waves.forEach(([top, lw, colour]) => {
    doc.setDrawColor(...colour);
    doc.setLineWidth(lw * s);
    doc.lines(wave, px(8), py(top), [s, s], 'S', false);
  });

  doc.setLineCap('butt');
  doc.setLineJoin('miter');
}

/** Set once per report so continuation pages can redraw a matching masthead. */
let currentTitle = '';
let currentSubtitle = '';

/** Slim masthead for pages a table has spilled onto. */
function continuationHeader(doc: jsPDF) {
  const w = doc.internal.pageSize.getWidth();

  doc.setFillColor(...DEEP);
  doc.rect(0, 0, w, 16, 'F');
  doc.setFillColor(...GOLD);
  doc.rect(0, 16, w, 0.8, 'F');

  drawMark(doc, M, 4.4, 9);

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('NTD GURD', M + 12, 10.8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(190, 210, 214);
  doc.text(`${currentTitle} · ${currentSubtitle}`, w - M, 10.8, { align: 'right' });
}

/** Deep-lake masthead. Returns the y position where body content may start. */
function header(doc: jsPDF, title: string, subtitle: string): number {
  currentTitle = title;
  currentSubtitle = subtitle;
  const w = doc.internal.pageSize.getWidth();

  doc.setFillColor(...DEEP);
  doc.rect(0, 0, w, 30, 'F');
  doc.setFillColor(...GOLD);
  doc.rect(0, 30, w, 1.2, 'F');

  drawMark(doc, M, 9, 15);

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('NTD GURD', M + 19, 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(242, 184, 75);
  doc.text('DETECT. PREVENT. DELIVER.', M + 19, 19);

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(title, w - M, 14, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(190, 210, 214);
  doc.text(subtitle, w - M, 19, { align: 'right' });

  return 40;
}

function footer(doc: jsPDF, generatedAt: Date, author: string) {
  const pages = doc.getNumberOfPages();
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();

  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);

    doc.setDrawColor(...HAIR);
    doc.setLineWidth(0.2);
    doc.line(M, h - 20, w - M, h - 20);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.4);
    doc.setTextColor(...MUTED);
    doc.text(doc.splitTextToSize(DISCLAIMER, w - M * 2), M, h - 16.5);

    doc.setFontSize(7);
    doc.text(`Generated ${fmtDate(generatedAt)} · ${author}`, M, h - 6);
    doc.text(`Page ${p} of ${pages}`, w - M, h - 6, { align: 'right' });
  }
}

function sectionTitle(doc: jsPDF, text: string, y: number): number {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...DEEP);
  doc.text(text.toUpperCase(), M, y);
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.6);
  doc.line(M, y + 1.6, M + 16, y + 1.6);
  return y + 8;
}

function paragraph(doc: jsPDF, text: string, y: number, size = 8.6): number {
  const w = doc.internal.pageSize.getWidth() - M * 2;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(size);
  doc.setTextColor(...INK);
  const lines = doc.splitTextToSize(text, w);
  doc.text(lines, M, y);
  return y + lines.length * (size * 0.45) + 4;
}

/** Row of KPI tiles. */
function kpiRow(doc: jsPDF, items: { label: string; value: string; color?: [number, number, number] }[], y: number): number {
  const w = doc.internal.pageSize.getWidth() - M * 2;
  const gap = 4;
  const tile = (w - gap * (items.length - 1)) / items.length;

  items.forEach((it, i) => {
    const x = M + i * (tile + gap);
    doc.setFillColor(248, 250, 251);
    doc.setDrawColor(...HAIR);
    doc.setLineWidth(0.2);
    doc.roundedRect(x, y, tile, 18, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.2);
    doc.setTextColor(...MUTED);
    doc.text(doc.splitTextToSize(it.label.toUpperCase(), tile - 5), x + 2.5, y + 5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...(it.color ?? INK));
    doc.text(it.value, x + 2.5, y + 14);
  });

  return y + 24;
}

function tableTheme(head: string[][], body: (string | number)[][], startY: number) {
  return {
    head,
    body,
    startY,
    // top clears the slim continuation masthead, bottom clears the footer block
    margin: { left: M, right: M, top: 24, bottom: 24 },
    styles: { fontSize: 7.6, cellPadding: 2, textColor: INK, lineColor: HAIR, lineWidth: 0.1 },
    headStyles: { fillColor: DEEP, textColor: [255, 255, 255] as [number, number, number], fontSize: 7, fontStyle: 'bold' as const },
    alternateRowStyles: { fillColor: [248, 250, 251] as [number, number, number] },
    didDrawPage: (data: { pageNumber: number }) => {
      if (data.pageNumber > 1) continuationHeader(doc0!);
    },
  };
}

/** autoTable's didDrawPage has no handle on the document, so we stash it. */
let doc0: jsPDF | null = null;

function afterTable(doc: jsPDF): number {
  return (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 9;
}

function weatherBlock(doc: jsPDF, weather: WeatherBundle | null | undefined, y: number): number {
  y = sectionTitle(doc, 'Environmental conditions', y);

  if (!weather) {
    return paragraph(doc, 'Live weather was unavailable when this report was generated.', y);
  }

  y = kpiRow(doc, [
    { label: 'Rain last 7d (LIVE)', value: `${weather.rain7d} mm`, color: TEAL },
    { label: 'Rain next 7d (LIVE)', value: `${weather.rainNext7d} mm`, color: TEAL },
    {
      label: 'Rainfall anomaly',
      value: `${weather.rainfallAnomaly > 0 ? '+' : ''}${weather.rainfallAnomaly}%`,
      color: weather.rainfallAnomaly > 40 ? CORAL : INK,
    },
    { label: 'Flood risk', value: `${weather.floodRisk}/100`, color: riskColor(weather.floodRisk) },
  ], y);

  const baseline = `Seasonal normal for this window is ${weather.seasonalNormal} mm/day, derived from five years of ERA5 reanalysis.`;
  const discharge = weather.dischargeNow !== null
    ? ` River discharge is ${weather.dischargeNow} m3/s against a 7-day observed mean of ${weather.dischargeBaseline} m3/s.`
    : '';
  y = paragraph(doc, `Source: Open-Meteo, retrieved ${fmtDate(weather.fetchedAt)}. ${baseline}${discharge}`, y, 7.6);

  if (weather.degraded.length) {
    doc.setTextColor(...MUTED);
    doc.setFontSize(7);
    weather.degraded.forEach(d => {
      doc.text(`- ${d}`, M, y);
      y += 4;
    });
    y += 2;
  }
  return y;
}

// ── Report builders ────────────────────────────────────────────────────────

function buildSituationReport(doc: jsPDF, ctx: ReportContext) {
  const { communities, alerts, interventions, sensors, weather } = ctx;

  let y = header(
    doc,
    'District Situation Report',
    `${MODEL_DISTRICT.name}, ${MODEL_DISTRICT.country}`,
  );

  const sorted = [...communities].sort((a, b) => b.riskScore - a.riskScore);
  const overall = Math.round(communities.reduce((s, c) => s + c.riskScore, 0) / communities.length);
  const critical = communities.filter(c => c.riskLevel === 'CRITICAL');
  const high = communities.filter(c => c.riskLevel === 'HIGH');
  const active = alerts.filter(a => a.status === 'Active' || a.status === 'Investigating');
  const openActions = interventions.filter(i => i.status !== 'Completed');

  y = sectionTitle(doc, 'Executive summary', y);

  const lead = critical.length
    ? `${critical.length} ${critical.length === 1 ? 'community is' : 'communities are'} at CRITICAL risk, led by ${sorted[0].name} at ${sorted[0].riskScore}/100.`
    : `No community is currently at CRITICAL risk. The highest score is ${sorted[0].name} at ${sorted[0].riskScore}/100.`;

  y = paragraph(doc,
    `${lead} District mean risk is ${overall}/100 across ${communities.length} monitored communities. ` +
    `${active.length} alert${active.length === 1 ? '' : 's'} require attention and ${openActions.length} response ` +
    `action${openActions.length === 1 ? ' remains' : 's remain'} open.`,
    y);

  y = kpiRow(doc, [
    { label: 'District mean risk', value: `${overall}`, color: riskColor(overall) },
    { label: 'Critical', value: `${critical.length}`, color: CORAL },
    { label: 'High', value: `${high.length}`, color: GOLD },
    { label: 'Open alerts', value: `${active.length}`, color: CORAL },
    { label: 'Open actions', value: `${openActions.length}`, color: TEAL },
  ], y);

  y = weatherBlock(doc, weather, y);

  y = sectionTitle(doc, 'Communities by risk', y);
  autoTable(doc, tableTheme(
    [['#', 'Community', 'Ward / Sub-county', 'Population', 'Risk', 'Level', '7-day change']],
    sorted.map((c, i) => [
      i + 1,
      c.name,
      c.region,
      c.population.toLocaleString(),
      c.riskScore,
      c.riskLevel,
      `${c.trend > 0 ? '+' : ''}${Math.round(c.trend)}`,
    ]),
    y,
  ));
  y = afterTable(doc);

  if (y > 210) { doc.addPage(); y = header(doc, 'District Situation Report', `${MODEL_DISTRICT.name}, ${MODEL_DISTRICT.country}`); }

  y = sectionTitle(doc, 'Active alerts', y);
  autoTable(doc, tableTheme(
    [['ID', 'Community', 'Raised', 'Before', 'Now', 'Level', 'Status', 'Lead driver']],
    alerts.map(a => [
      a.id, a.communityName, fmtDate(a.timestamp), a.riskBefore, a.riskCurrent,
      a.riskLevel, a.status, a.primaryDrivers[0] ?? '—',
    ]),
    y,
  ));
  y = afterTable(doc);

  y = sectionTitle(doc, 'Water monitoring points', y);
  autoTable(doc, tableTheme(
    [['Point', 'Name', 'Status', 'Turbidity NTU', 'pH', 'E. coli CFU', 'Chlorine mg/L']],
    sensors.map(s => [s.id, s.name, s.status, s.turbidity, s.ph, s.ecoli, s.chlorine]),
    y,
  ));
  y = afterTable(doc);

  if (y > 200) { doc.addPage(); y = header(doc, 'District Situation Report', `${MODEL_DISTRICT.name}, ${MODEL_DISTRICT.country}`); }

  y = sectionTitle(doc, 'Response actions', y);
  autoTable(doc, tableTheme(
    [['ID', 'Action', 'Assigned to', 'Priority', 'Status', 'Due']],
    interventions.map(i => [i.id, i.action, i.assignedTo, i.priority, i.status, i.due]),
    y,
  ));
  y = afterTable(doc);

  // Keep the six-row weights table whole rather than orphaning a row
  if (y > 215) { doc.addPage(); y = header(doc, 'District Situation Report', `${MODEL_DISTRICT.name}, ${MODEL_DISTRICT.country}`); }

  y = sectionTitle(doc, 'Risk model configuration', y);
  autoTable(doc, tableTheme(
    [['Component', 'Weight']],
    Object.entries(RISK_WEIGHTS).map(([k, v]) => [
      k.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase()).trim(),
      `${Math.round(v * 100)}%`,
    ]),
    y,
  ));
}

function buildAlertReport(doc: jsPDF, ctx: ReportContext, alert: Alert) {
  const community = ctx.communities.find(c => c.id === alert.communityId);
  const actions = ctx.interventions.filter(i => i.alertId === alert.id);

  let y = header(doc, 'Alert Evidence Package', `${alert.id} · ${alert.communityName}`);

  // Risk banner
  const w = doc.internal.pageSize.getWidth();
  const c = riskColor(alert.riskCurrent);
  doc.setFillColor(c[0], c[1], c[2]);
  doc.roundedRect(M, y, w - M * 2, 22, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`${alert.riskLevel} — ${alert.communityName}`, M + 5, y + 8.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`Raised ${fmtDate(alert.timestamp)} · Status: ${alert.status}`, M + 5, y + 15);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text(String(alert.riskCurrent), w - M - 5, y + 15, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  const delta = alert.riskCurrent - alert.riskBefore;
  doc.text(
    `RISK / 100   was ${alert.riskBefore}  (${delta >= 0 ? '+' : ''}${delta})`,
    w - M - 5, y + 6, { align: 'right' },
  );
  y += 30;

  y = sectionTitle(doc, 'Why the system flagged this area', y);
  autoTable(doc, tableTheme(
    [['Component', 'Score', 'Level']],
    Object.entries(alert.components).map(([k, v]) => [
      k.replace(/([A-Z])/g, ' $1').replace(/^./, ch => ch.toUpperCase()).trim(),
      v as number,
      levelOf(v as number),
    ]),
    y,
  ));
  y = afterTable(doc);

  y = sectionTitle(doc, 'Primary drivers', y);
  alert.primaryDrivers.forEach((d, i) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.4);
    doc.setTextColor(...INK);
    const lines = doc.splitTextToSize(`${i + 1}. ${d}`, w - M * 2 - 4);
    doc.text(lines, M + 2, y);
    y += lines.length * 4.2 + 1.5;
  });
  y += 4;

  y = sectionTitle(doc, 'Recommended actions', y);
  alert.recommendations.forEach(r => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.4);
    doc.setTextColor(...INK);
    const lines = doc.splitTextToSize(`- ${r}`, w - M * 2 - 4);
    doc.text(lines, M + 2, y);
    y += lines.length * 4.2 + 1.5;
  });
  y += 4;

  if (community) {
    y = sectionTitle(doc, 'Community profile', y);
    autoTable(doc, tableTheme(
      [['Field', 'Value']],
      [
        ['Community', community.name],
        ['Ward / sub-county', community.region],
        ['Coordinates', `${community.lat.toFixed(4)} N, ${community.lng.toFixed(4)} E`],
        ['Population', community.population.toLocaleString()],
        ['Vulnerability index', `${community.vulnerability}/100`],
        ['Turbidity', `${community.current.waterQuality.turbidity} NTU`],
        ['E. coli', `${community.current.waterQuality.ecoli} CFU/100mL`],
        ['Free chlorine', `${community.current.waterQuality.chlorine} mg/L`],
        ['Diarrhea cases (24h)', String(community.current.symptoms.diarrhea)],
        ['Suspected cholera', String(community.current.symptoms.suspectedCholera)],
      ],
      y,
    ));
    y = afterTable(doc);
  }

  y = weatherBlock(doc, ctx.weather, y);

  y = sectionTitle(doc, 'Response tracking', y);
  if (!actions.length) {
    paragraph(doc, 'No response actions have been assigned against this alert.', y);
  } else {
    autoTable(doc, tableTheme(
      [['ID', 'Action', 'Assigned to', 'Priority', 'Status', 'Due', 'Notes']],
      actions.map(i => [i.id, i.action, i.assignedTo, i.priority, i.status, i.due, i.notes || '—']),
      y,
    ));
  }
}

function buildWaterReport(doc: jsPDF, ctx: ReportContext) {
  const { sensors, weather } = ctx;
  let y = header(doc, 'Water Quality Report', `${MODEL_DISTRICT.name} sensor network`);

  const alarms = sensors.filter(s => s.status === 'Alarm');
  const warnings = sensors.filter(s => s.status === 'Warning');

  y = sectionTitle(doc, 'Network status', y);
  y = kpiRow(doc, [
    { label: 'Points online', value: String(sensors.length), color: TEAL },
    { label: 'Alarm', value: String(alarms.length), color: CORAL },
    { label: 'Warning', value: String(warnings.length), color: GOLD },
    { label: 'Normal', value: String(sensors.length - alarms.length - warnings.length), color: GREEN },
  ], y);

  if (alarms.length) {
    y = paragraph(doc,
      `Immediate attention required at ${alarms.map(a => `${a.id} (${a.name})`).join(', ')}. ` +
      'These points exceed the alarm threshold for turbidity or faecal indicator bacteria and should be ' +
      'treated as unsafe until re-tested.', y);
  }

  y = sectionTitle(doc, 'Latest readings', y);
  autoTable(doc, tableTheme(
    [['Point', 'Name', 'Status', 'Turbidity', 'pH', 'E. coli', 'Chlorine', 'Conductivity', 'Temp', 'Last reading']],
    sensors.map(s => [
      s.id, s.name, s.status, s.turbidity, s.ph, s.ecoli, s.chlorine, s.conductivity, s.temperature,
      fmtDate(s.lastReading),
    ]),
    y,
  ));
  y = afterTable(doc);

  y = sectionTitle(doc, 'Thresholds applied', y);
  autoTable(doc, tableTheme(
    [['Parameter', 'Normal', 'Warning', 'Alarm']],
    [
      ['Turbidity (NTU)', '< 4', '4 - 10', '> 10'],
      ['pH', '6.5 - 8.5', '—', '< 6.0 or > 8.5'],
      ['E. coli (CFU/100mL)', '0', '1 - 100', '> 100'],
      ['Free chlorine (mg/L)', '> 0.2', '0.1 - 0.2', '< 0.1'],
      ['Conductivity (uS/cm)', '< 400', '400 - 500', '> 500'],
      ['Temperature (C)', '< 28', '28 - 30', '> 30'],
    ],
    y,
  ));
  y = afterTable(doc);

  weatherBlock(doc, weather, y);
}

function buildResponseReport(doc: jsPDF, ctx: ReportContext) {
  const { interventions, alerts } = ctx;
  let y = header(doc, 'Response Coordination Report', `${MODEL_DISTRICT.name}, ${MODEL_DISTRICT.country}`);

  const done = interventions.filter(i => i.status === 'Completed');
  const running = interventions.filter(i => i.status === 'In Progress');
  const pending = interventions.filter(i => i.status === 'Pending');

  y = sectionTitle(doc, 'Delivery summary', y);
  y = kpiRow(doc, [
    { label: 'Total actions', value: String(interventions.length), color: INK },
    { label: 'Completed', value: String(done.length), color: GREEN },
    { label: 'In progress', value: String(running.length), color: TEAL },
    { label: 'Pending', value: String(pending.length), color: MUTED },
    { label: 'Avg response (h)', value: String(IMPACT_METRICS.avgResponseTimeHours), color: TEAL },
  ], y);

  y = paragraph(doc,
    `${done.length} of ${interventions.length} assigned actions are complete ` +
    `(${Math.round((done.length / Math.max(1, interventions.length)) * 100)}%). ` +
    `${pending.length} action${pending.length === 1 ? ' has' : 's have'} not yet been started.`, y);

  y = sectionTitle(doc, 'Actions by alert', y);
  alerts.forEach(a => {
    const rows = interventions.filter(i => i.alertId === a.id);
    if (!rows.length) return;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.4);
    doc.setTextColor(...DEEP);
    doc.text(`${a.id} — ${a.communityName} (${a.riskLevel}, ${a.status})`, M, y);
    y += 4;

    autoTable(doc, tableTheme(
      [['Action', 'Assigned to', 'Priority', 'Status', 'Due', 'Notes']],
      rows.map(i => [i.action, i.assignedTo, i.priority, i.status, i.due, i.notes || '—']),
      y,
    ));
    y = afterTable(doc);
  });
}

// ── Public API ─────────────────────────────────────────────────────────────

export interface GenerateOptions {
  kind: ReportKind;
  ctx: ReportContext;
  alert?: Alert;
}

/** Builds the PDF and returns the jsPDF document plus a suggested filename. */
export function generateReport({ kind, ctx, alert }: GenerateOptions): { doc: jsPDF; filename: string } {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  doc0 = doc;
  const generatedAt = new Date();
  const stamp = generatedAt.toISOString().slice(0, 10);

  let filename: string;

  switch (kind) {
    case 'alert': {
      if (!alert) throw new Error('An alert must be selected for an alert evidence package.');
      buildAlertReport(doc, ctx, alert);
      filename = `NTD_GURD_Alert_${alert.id}_${stamp}.pdf`;
      break;
    }
    case 'water':
      buildWaterReport(doc, ctx);
      filename = `NTD_GURD_WaterQuality_Busia_${stamp}.pdf`;
      break;
    case 'response':
      buildResponseReport(doc, ctx);
      filename = `NTD_GURD_Response_Busia_${stamp}.pdf`;
      break;
    default:
      buildSituationReport(doc, ctx);
      filename = `NTD_GURD_SitRep_Busia_${stamp}.pdf`;
  }

  doc.setProperties({
    title: filename.replace(/\.pdf$/, ''),
    subject: `NTD GURD ${kind} report — ${MODEL_DISTRICT.name}`,
    author: ctx.author ?? 'NTD GURD Early Warning Console',
    creator: 'NTD GURD',
  });

  footer(doc, generatedAt, ctx.author ?? 'NTD GURD Early Warning Console');
  return { doc, filename };
}

export function downloadReport(opts: GenerateOptions): string {
  const { doc, filename } = generateReport(opts);
  doc.save(filename);
  return filename;
}

/** Blob URL for previewing in an iframe. Caller must revoke it. */
export function previewReport(opts: GenerateOptions): { url: string; filename: string } {
  const { doc, filename } = generateReport(opts);
  return { url: doc.output('bloburl').toString(), filename };
}
