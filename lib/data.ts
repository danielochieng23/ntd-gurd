// NTD GURD — Synthetic Dataset
// DEMONSTRATION DATA — Not real measurements. For prototype/fellowship pitch purposes only.
// Requires epidemiological validation before any real-world use.

export interface Community {
  id: string;
  name: string;
  country: string;
  region: string;
  lat: number;
  lng: number;
  population: number;
  vulnerability: number; // 0-100
}

export interface WaterQuality {
  turbidity: number;    // NTU — normal <4, alarm >10
  ph: number;           // normal 6.5-8.5
  ecoli: number;        // CFU/100mL — normal 0, alarm >100
  chlorine: number;     // mg/L — normal >0.2
  conductivity: number; // µS/cm
  temperature: number;  // °C
  risk: number;         // 0-100 composite
}

export interface Symptoms {
  diarrhea: number;
  vomiting: number;
  fever: number;
  suspectedCholera: number;
  signal: number; // 0-100 composite
}

export interface DayRecord {
  date: string;
  day: number;
  rainfall: number;
  rainfallAnomaly: number;
  floodRisk: number;
  waterQuality: WaterQuality;
  symptoms: Symptoms;
  sanitationRisk: number;
  historicalRisk: number;
  populationVulnerability: number;
  riskScore: number;
  isCrisisPhase: boolean;
  components: {
    waterQualityRisk: number;
    floodRisk: number;
    symptomSignal: number;
    sanitationRisk: number;
    historicalRisk: number;
    populationVulnerability: number;
  };
}

export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export interface CommunityState extends Community {
  current: DayRecord;
  trend: number;
  riskLevel: RiskLevel;
  riskScore: number;
}

export interface Alert {
  id: string;
  communityId: string;
  communityName: string;
  country: string;
  timestamp: string;
  riskBefore: number;
  riskCurrent: number;
  riskLevel: RiskLevel;
  status: 'Active' | 'Investigating' | 'Response Assigned' | 'Resolved';
  primaryDrivers: string[];
  recommendations: string[];
  components: Record<string, number>;
}

export interface Intervention {
  id: string;
  alertId: string;
  action: string;
  assignedTo: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'Pending' | 'In Progress' | 'Completed';
  due: string;
  notes: string;
}

export interface WaterSensor {
  id: string;
  community: string;
  name: string;
  lat: number;
  lng: number;
  status: 'Normal' | 'Warning' | 'Alarm';
  turbidity: number;
  ph: number;
  ecoli: number;
  chlorine: number;
  conductivity: number;
  temperature: number;
  lastReading: string;
}

export interface Projection {
  communityId: string;
  name: string;
  currentRisk: number;
  projectedRisk: number;
  confidence: number;
  trend: string;
  drivers: string[];
}

// ─── Seeded RNG ──────────────────────────────────────────────────────────────
function seededRand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// ─── Communities ─────────────────────────────────────────────────────────────
export const MODEL_DISTRICT = {
  name: 'Busia District',
  country: 'Uganda',
  region: 'Eastern Region',
  center: { lat: 0.445, lng: 34.055 },
  zoom: 11,
  bounds: {
    north: 0.59,
    south: 0.23,
    west: 33.92,
    east: 34.18,
  },
};

// Real parish / sub-county locations inside Busia District, Uganda
export const COMMUNITIES: Community[] = [
  { id: 'C001', name: 'Busia Central',     country: 'Uganda', region: 'Municipality',  lat: 0.4669, lng: 34.0901, population: 11200, vulnerability: 64 },
  { id: 'C002', name: 'Busia Zone 4',      country: 'Uganda', region: 'Municipality',  lat: 0.4578, lng: 34.0836, population:  8400, vulnerability: 88 },
  { id: 'C003', name: 'Custom Border',     country: 'Uganda', region: 'Municipality',  lat: 0.4642, lng: 34.1094, population:  6100, vulnerability: 81 },
  { id: 'C004', name: 'Sofia Ward',        country: 'Uganda', region: 'Municipality',  lat: 0.4518, lng: 34.0788, population:  5200, vulnerability: 73 },
  { id: 'C005', name: 'Western Division',  country: 'Uganda', region: 'Municipality',  lat: 0.4724, lng: 34.0742, population:  7800, vulnerability: 61 },
  { id: 'C006', name: 'Eastern Division',  country: 'Uganda', region: 'Municipality',  lat: 0.4596, lng: 34.1018, population:  6900, vulnerability: 70 },
  { id: 'C007', name: 'Dabani',            country: 'Uganda', region: 'Dabani',        lat: 0.4885, lng: 34.0688, population:  9100, vulnerability: 68 },
  { id: 'C008', name: 'Majanji',           country: 'Uganda', region: 'Majanji',       lat: 0.2482, lng: 33.9914, population:  4700, vulnerability: 91 },
  { id: 'C009', name: 'Lumino',            country: 'Uganda', region: 'Lumino',        lat: 0.3788, lng: 34.0486, population:  8600, vulnerability: 84 },
  { id: 'C010', name: 'Masafu',            country: 'Uganda', region: 'Masafu',        lat: 0.4184, lng: 34.0992, population:  7400, vulnerability: 72 },
  { id: 'C011', name: 'Buhehe',            country: 'Uganda', region: 'Buhehe',        lat: 0.3962, lng: 34.1328, population:  5800, vulnerability: 76 },
  { id: 'C012', name: 'Busime',            country: 'Uganda', region: 'Busime',        lat: 0.3164, lng: 34.0148, population:  4300, vulnerability: 87 },
  { id: 'C013', name: 'Lunyo',             country: 'Uganda', region: 'Lunyo',         lat: 0.3496, lng: 33.9842, population:  5100, vulnerability: 80 },
  { id: 'C014', name: 'Masaba',            country: 'Uganda', region: 'Masaba',        lat: 0.5148, lng: 34.1186, population:  6200, vulnerability: 69 },
  { id: 'C015', name: 'Sikuda',            country: 'Uganda', region: 'Sikuda',        lat: 0.5462, lng: 34.0814, population:  5600, vulnerability: 71 },
  { id: 'C016', name: 'Buteba',            country: 'Uganda', region: 'Buteba',        lat: 0.5588, lng: 34.1462, population:  4900, vulnerability: 75 },
  { id: 'C017', name: 'Bulumbi',           country: 'Uganda', region: 'Bulumbi',       lat: 0.5016, lng: 34.0448, population:  6700, vulnerability: 66 },
  { id: 'C018', name: 'Busitema',          country: 'Uganda', region: 'Busitema',      lat: 0.5448, lng: 34.0206, population:  7200, vulnerability: 63 },
];

// ─── Temporal data generation ────────────────────────────────────────────────
const CRISIS_IDS = new Set(['C002', 'C003', 'C008', 'C009', 'C012']);

function generateTemporalData(community: Community, days = 90): DayRecord[] {
  const r = seededRand(parseInt(community.id.replace('C', '')) * 1000);
  const data: DayRecord[] = [];
  const baseDate = new Date('2026-06-05');
  const hasCrisis = CRISIS_IDS.has(community.id);
  const crisisDay = hasCrisis ? 75 + Math.floor(r() * 8) : -1;

  for (let d = 0; d < days; d++) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() + d);
    const dateStr = date.toISOString().split('T')[0];

    const seasonalFactor = Math.sin((d / 90) * Math.PI * 1.5 + 0.5) * 0.4 + 0.6;
    const isCrisisPhase = hasCrisis && d >= crisisDay;
    const crisisIntensity = isCrisisPhase ? Math.min((d - crisisDay) / 10, 1) : 0;

    const rainfall = Math.max(0, (20 + r() * 40) * seasonalFactor + crisisIntensity * 65);
    const rainfallAnomaly = (rainfall - 35) / 35 * 100;
    const floodRisk = Math.min(100, Math.max(0, rainfall * 1.2 + crisisIntensity * 30 + r() * 8));

    const turbidity = Math.max(0, 1.5 + r() * 2.5 + crisisIntensity * 18);
    const ph = 6.9 + r() * 0.8 - crisisIntensity * 0.6;
    const ecoli = Math.max(0, 5 + r() * 30 + crisisIntensity * 250);
    const chlorine = Math.max(0, 0.9 - crisisIntensity * 0.75 + r() * 0.3);
    const conductivity = 175 + r() * 70 + crisisIntensity * 120;
    const temperature = 24 + r() * 4 + crisisIntensity * 1.2;

    const waterQualityRisk = Math.min(100, Math.max(0,
      (turbidity / 20 * 40) + (Math.max(0, 7.0 - ph) * 18) + (ecoli / 280 * 40) + crisisIntensity * 15
    ));

    const diarrhea = Math.floor(r() * 5 + crisisIntensity * 28);
    const vomiting = Math.floor(r() * 3 + crisisIntensity * 14);
    const fever = Math.floor(r() * 4 + crisisIntensity * 16);
    const suspectedCholera = Math.floor(r() * 1 + crisisIntensity * 9);
    const symptomSignal = Math.min(100, Math.max(0,
      (diarrhea / 35 * 40) + (suspectedCholera / 12 * 60) * (crisisIntensity + 0.05)
    ));

    const sanitationRisk = Math.min(100, Math.max(0, 18 + r() * 18 + crisisIntensity * 32 + community.vulnerability * 0.28));
    const historicalRisk = Math.min(100, Math.max(0, community.vulnerability * 0.45 + r() * 18 + (d > 60 ? 8 : 0)));
    const populationVulnerability = community.vulnerability;

    const riskScore = Math.min(100, Math.max(0, Math.round(
      0.25 * waterQualityRisk +
      0.20 * floodRisk +
      0.20 * symptomSignal +
      0.15 * sanitationRisk +
      0.10 * historicalRisk +
      0.10 * populationVulnerability
    )));

    data.push({
      date: dateStr, day: d, rainfall: Math.round(rainfall * 10) / 10,
      rainfallAnomaly: Math.round(rainfallAnomaly * 10) / 10,
      floodRisk: Math.round(floodRisk),
      waterQuality: {
        turbidity: Math.round(turbidity * 10) / 10, ph: Math.round(ph * 100) / 100,
        ecoli: Math.round(ecoli), chlorine: Math.round(chlorine * 100) / 100,
        conductivity: Math.round(conductivity), temperature: Math.round(temperature * 10) / 10,
        risk: Math.round(waterQualityRisk),
      },
      symptoms: { diarrhea, vomiting, fever, suspectedCholera, signal: Math.round(symptomSignal) },
      sanitationRisk: Math.round(sanitationRisk),
      historicalRisk: Math.round(historicalRisk),
      populationVulnerability,
      riskScore,
      isCrisisPhase,
      components: {
        waterQualityRisk: Math.round(waterQualityRisk),
        floodRisk: Math.round(floodRisk),
        symptomSignal: Math.round(symptomSignal),
        sanitationRisk: Math.round(sanitationRisk),
        historicalRisk: Math.round(historicalRisk),
        populationVulnerability,
      },
    });
  }
  return data;
}

// Pre-generate all data
export const COMMUNITY_DATA: Record<string, DayRecord[]> = {};
COMMUNITIES.forEach(c => { COMMUNITY_DATA[c.id] = generateTemporalData(c); });

export function riskLevel(score: number): RiskLevel {
  if (score >= 75) return 'CRITICAL';
  if (score >= 55) return 'HIGH';
  if (score >= 35) return 'MODERATE';
  return 'LOW';
}

export function getCurrentState(): CommunityState[] {
  return COMMUNITIES.map(c => {
    const latest = COMMUNITY_DATA[c.id][89];
    const prev7 = COMMUNITY_DATA[c.id][82];
    return {
      ...c,
      current: latest,
      trend: latest.riskScore - prev7.riskScore,
      riskLevel: riskLevel(latest.riskScore),
      riskScore: latest.riskScore,
    };
  });
}

// ─── Static data ─────────────────────────────────────────────────────────────
export const ALERTS: Alert[] = [
  {
    id: 'A001', communityId: 'C002', communityName: 'Busia Zone 4', country: 'Uganda',
    timestamp: '2026-09-02T14:32:00Z', riskBefore: 47, riskCurrent: 82, riskLevel: 'CRITICAL',
    status: 'Active',
    primaryDrivers: ['Water-quality deterioration', 'Heavy rainfall (+68%)', 'Diarrhea reports increased (+340%)', 'Flood exposure'],
    recommendations: [
      'Prioritize water source testing in Zone 4',
      'Dispatch community health workers to Zone 4 and Sofia Ward',
      'Inspect 3 vulnerable water points (WP-B4-01, WP-B4-03, WP-B4-07)',
      'Issue targeted cholera prevention messaging',
      'Escalate to Busia District Health Office',
    ],
    components: { waterQuality: 78, rainfall: 82, symptoms: 71, sanitation: 65, historical: 55, vulnerability: 88 },
  },
  {
    id: 'A002', communityId: 'C008', communityName: 'Majanji', country: 'Uganda',
    timestamp: '2026-09-01T09:15:00Z', riskBefore: 52, riskCurrent: 74, riskLevel: 'HIGH',
    status: 'Investigating',
    primaryDrivers: ['Lake Victoria shoreline flooding', 'E. coli spike at landing site', 'CHW symptom increase'],
    recommendations: [
      'Deploy water quality testing at Majanji landing site',
      'Coordinate with Busia District Health Office',
      'Monitor shoreline households for 48 hours',
    ],
    components: { waterQuality: 72, rainfall: 75, symptoms: 61, sanitation: 58, historical: 62, vulnerability: 91 },
  },
  {
    id: 'A003', communityId: 'C009', communityName: 'Lumino', country: 'Uganda',
    timestamp: '2026-09-02T18:44:00Z', riskBefore: 38, riskCurrent: 68, riskLevel: 'HIGH',
    status: 'Active',
    primaryDrivers: ['Rainfall anomaly (+52%)', 'Sanitation facility damage reported', 'Turbidity increase in surface sources'],
    recommendations: [
      'Assess sanitation infrastructure in Lumino flood zones',
      'Deploy ORS kits and hygiene supplies',
      'Verify turbidity readings at WP-LM-02',
    ],
    components: { waterQuality: 61, rainfall: 71, symptoms: 45, sanitation: 74, historical: 55, vulnerability: 84 },
  },
  {
    id: 'A004', communityId: 'C012', communityName: 'Busime', country: 'Uganda',
    timestamp: '2026-09-02T07:20:00Z', riskBefore: 61, riskCurrent: 79, riskLevel: 'HIGH',
    status: 'Response Assigned',
    primaryDrivers: ['Lakeshore contamination signal', 'CHW report: 8 cholera suspects', 'Broken sanitation near wetland'],
    recommendations: [
      'Immediate water source investigation in Busime',
      'Activate district rapid response protocol',
      'Cholera sample collection and lab submission',
    ],
    components: { waterQuality: 75, rainfall: 58, symptoms: 82, sanitation: 71, historical: 68, vulnerability: 87 },
  },
  {
    id: 'A005', communityId: 'C003', communityName: 'Custom Border', country: 'Uganda',
    timestamp: '2026-09-01T16:05:00Z', riskBefore: 44, riskCurrent: 71, riskLevel: 'HIGH',
    status: 'Resolved',
    primaryDrivers: ['Cross-border crowding', 'Latrine overflow reported', 'Symptom increase'],
    recommendations: ['Latrine rehabilitation completed', 'Water treatment deployed', 'Follow-up monitoring in progress'],
    components: { waterQuality: 65, rainfall: 78, symptoms: 52, sanitation: 81, historical: 61, vulnerability: 81 },
  },
];

export const INTERVENTIONS: Intervention[] = [
  { id: 'INT001', alertId: 'A001', action: 'Inspect water source WP-B4-01', assignedTo: 'Field Team 03', priority: 'Critical', status: 'In Progress', due: '2026-09-03', notes: 'Team dispatched 14:45. Sampling underway.' },
  { id: 'INT002', alertId: 'A001', action: 'Deploy ORS and hygiene kits (180 households)', assignedTo: 'CHW Network Busia', priority: 'High', status: 'Completed', due: '2026-09-02', notes: 'Kits distributed to 180 households.' },
  { id: 'INT003', alertId: 'A001', action: 'Issue community health messaging via SMS', assignedTo: 'Communication Team', priority: 'High', status: 'Completed', due: '2026-09-02', notes: 'SMS alerts sent to 2,400 registered contacts.' },
  { id: 'INT004', alertId: 'A002', action: 'Water quality testing — Majanji landing site', assignedTo: 'Field Team 07', priority: 'High', status: 'In Progress', due: '2026-09-03', notes: 'Awaiting lab results.' },
  { id: 'INT005', alertId: 'A003', action: 'Sanitation infrastructure assessment — Lumino', assignedTo: 'WASH Engineer Team', priority: 'High', status: 'Pending', due: '2026-09-04', notes: '' },
  { id: 'INT006', alertId: 'A004', action: 'Cholera sample collection — Busime', assignedTo: 'Rapid Response Unit', priority: 'Critical', status: 'In Progress', due: '2026-09-03', notes: 'Samples collected. Awaiting Mbale lab.' },
];

export const WATER_SENSORS: WaterSensor[] = [
  { id: 'WP-B4-01', community: 'C002', name: 'Zone 4 — Borehole 1',        lat: 0.4582, lng: 34.0844, status: 'Alarm',   turbidity: 18.4, ph: 6.2, ecoli: 340, chlorine: 0.05, conductivity: 412, temperature: 26.8, lastReading: '2026-09-03T12:30:00Z' },
  { id: 'WP-B4-03', community: 'C002', name: 'Zone 4 — Surface Point 3',   lat: 0.4566, lng: 34.0818, status: 'Warning', turbidity:  9.1, ph: 6.8, ecoli: 120, chlorine: 0.20, conductivity: 310, temperature: 27.2, lastReading: '2026-09-03T12:15:00Z' },
  { id: 'WP-MJ-01', community: 'C008', name: 'Majanji — Landing Site',     lat: 0.2474, lng: 33.9902, status: 'Warning', turbidity:  7.3, ph: 7.1, ecoli:  85, chlorine: 0.30, conductivity: 280, temperature: 25.9, lastReading: '2026-09-03T11:45:00Z' },
  { id: 'WP-BC-01', community: 'C001', name: 'Busia Central — Piped',      lat: 0.4674, lng: 34.0912, status: 'Normal',  turbidity:  1.2, ph: 7.4, ecoli:   0, chlorine: 0.60, conductivity: 195, temperature: 24.1, lastReading: '2026-09-03T13:00:00Z' },
  { id: 'WP-BT-04', community: 'C018', name: 'Busitema — Borehole A',      lat: 0.5456, lng: 34.0218, status: 'Normal',  turbidity:  0.8, ph: 7.6, ecoli:   0, chlorine: 0.70, conductivity: 210, temperature: 23.5, lastReading: '2026-09-03T12:55:00Z' },
  { id: 'WP-BS-01', community: 'C012', name: 'Busime — Wetland Point',     lat: 0.3158, lng: 34.0136, status: 'Alarm',   turbidity: 21.6, ph: 6.1, ecoli: 480, chlorine: 0.00, conductivity: 510, temperature: 28.3, lastReading: '2026-09-03T10:00:00Z' },
  { id: 'WP-LM-02', community: 'C009', name: 'Lumino — Surface River',     lat: 0.3782, lng: 34.0471, status: 'Warning', turbidity:  6.8, ph: 6.9, ecoli:  62, chlorine: 0.15, conductivity: 265, temperature: 26.1, lastReading: '2026-09-03T11:00:00Z' },
  { id: 'WP-CB-01', community: 'C003', name: 'Custom Border — Public Tap', lat: 0.4648, lng: 34.1102, status: 'Normal',  turbidity:  1.5, ph: 7.3, ecoli:   0, chlorine: 0.55, conductivity: 202, temperature: 22.8, lastReading: '2026-09-03T13:10:00Z' },
];

export const IMPACT_METRICS = {
  communitiesMonitored: 18,
  highRiskDetected: 5,
  alertsGenerated: 11,
  alertsVerified: 9,
  waterPointsInvestigated: 14,
  interventionsDeployed: 8,
  avgResponseTimeHours: 5.4,
  riskReductionPct: 38,
  chwReports: 96,
  householdsReached: 4200,
};

export const PROJECTIONS: Projection[] = [
  { communityId: 'C002', name: 'Busia Zone 4',     currentRisk: 82, projectedRisk: 91, confidence: 71, trend: 'increasing',  drivers: ['Rainfall persisting', 'Water quality degrading', 'Symptom increase'] },
  { communityId: 'C008', name: 'Majanji',          currentRisk: 74, projectedRisk: 82, confidence: 74, trend: 'increasing',  drivers: ['Lake shoreline flooding', 'Landing-site contamination'] },
  { communityId: 'C012', name: 'Busime',           currentRisk: 79, projectedRisk: 84, confidence: 68, trend: 'increasing',  drivers: ['Wetland contamination', 'CHW cholera-suspect reports'] },
  { communityId: 'C009', name: 'Lumino',           currentRisk: 68, projectedRisk: 72, confidence: 65, trend: 'stable-high', drivers: ['Sanitation damage', 'Rainfall anomaly'] },
  { communityId: 'C001', name: 'Busia Central',    currentRisk: 41, projectedRisk: 38, confidence: 72, trend: 'decreasing',  drivers: ['Piped supply stable', 'Municipal chlorination'] },
  { communityId: 'C018', name: 'Busitema',         currentRisk: 36, projectedRisk: 34, confidence: 70, trend: 'decreasing',  drivers: ['Borehole quality normal', 'Lower flood exposure'] },
];

// Risk model weights (configurable)
export const RISK_WEIGHTS = {
  waterQuality:          0.25,
  rainfallFlood:         0.20,
  symptomSignal:         0.20,
  sanitation:            0.15,
  historicalDisease:     0.10,
  populationVulnerability: 0.10,
};
