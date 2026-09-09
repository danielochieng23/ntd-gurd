'use client';
import { Page, Grid, Card, SectionLabel, T } from '@/components/ui';

export default function ArchitectureScreen() {
  const layers = [
    {
      label: 'Data Sources',
      color: T.deep,
      nodes: ['Water Quality Sensors', 'Weather / Satellite Data', 'Community Health Workers', 'Health Facility Reports', 'Historical Epi Data', 'Geospatial / GIS'],
    },
    {
      label: 'Ingestion & Integration Layer',
      color: T.teal,
      nodes: ['Data Validation', 'Normalisation', 'Temporal Alignment', 'Offline Sync Buffer', 'Streaming Pipeline'],
    },
    {
      label: 'NTD GURD Data Layer',
      color: T.teal,
      nodes: ['Time-Series Store', 'Geospatial Store (PostGIS)', 'Community Profiles', 'Sensor Registry', 'Audit Log'],
      highlight: true,
    },
    {
      label: 'Intelligence Layer',
      color: T.gold,
      nodes: ['Risk Engine (Prototype Model)', 'ML / AI Layer (Future)', 'Anomaly Detection', 'Projection Engine', 'Explainability Module'],
    },
    {
      label: 'Early Warning Engine',
      color: T.coral,
      nodes: ['Alert Generator', 'Threshold Monitor', 'Causal Chain Builder', 'Response Coordinator', 'Notification System'],
    },
    {
      label: 'Public Health Action',
      color: T.green,
      nodes: ['Public Health Dashboard', 'Mobile CHW Interface', 'Alert System', 'Response Coordination', 'Reporting & Analytics'],
    },
  ];

  const stack = [
    { cat: 'Frontend', items: ['Next.js', 'React', 'Tailwind CSS', 'Recharts', 'Google Maps'] },
    { cat: 'Backend', items: ['Python FastAPI', 'Node.js (API)', 'REST + WebSocket'] },
    { cat: 'Database', items: ['PostgreSQL', 'PostGIS (Geospatial)', 'Redis (Cache)'] },
    { cat: 'AI / ML', items: ['Python', 'scikit-learn', 'pandas', 'numpy'] },
    { cat: 'Infrastructure', items: ['Docker', 'Cloud (AWS / GCP)', 'CI/CD Pipeline'] },
  ];

  const schemas = [
    'communities', 'water_sources', 'water_quality_readings', 'weather_readings',
    'environmental_conditions', 'symptom_reports', 'disease_signals',
    'risk_scores', 'alerts', 'interventions', 'users', 'audit_logs',
  ];

  return (
    <Page>
      <Grid cols="minmax(0,2fr) minmax(0,1fr)" gap={20}>
        {/* Architecture stack */}
        <div style={{ minWidth: 0 }}>
          <h2 style={{ fontFamily: T.heading, fontSize: 14, fontWeight: 800, color: T.deep, margin: 0 }}>
            Platform Architecture
          </h2>
          <p style={{ fontSize: 12, color: T.muted, margin: '4px 0 16px' }}>
            End-to-end data flow from sensors to public health action
          </p>

          {layers.map((layer, i) => (
            <div key={layer.label}>
              <div style={{
                background: layer.highlight ? 'rgba(8,127,140,0.04)' : 'white',
                border: `1px solid ${layer.highlight ? T.teal : T.border}`,
                borderRadius: 8, padding: '14px 18px',
              }}>
                <div style={{
                  fontFamily: T.heading, fontSize: 9, fontWeight: 700, letterSpacing: '1.2px',
                  textTransform: 'uppercase', color: layer.color, marginBottom: 10,
                }}>
                  {layer.label}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                  {layer.nodes.map(n => (
                    <span key={n} style={{
                      display: 'inline-flex', alignItems: 'center', height: 26, padding: '0 10px', borderRadius: 4,
                      background: layer.highlight ? 'rgba(8,127,140,0.1)' : '#f4f8f7',
                      border: `1px solid ${layer.highlight ? 'rgba(8,127,140,0.2)' : '#e8f0f1'}`,
                      fontSize: 11, fontWeight: 600, color: layer.highlight ? T.teal : T.ink,
                    }}>
                      {n}
                    </span>
                  ))}
                </div>
              </div>
              {i < layers.length - 1 && (
                <div style={{ textAlign: 'center', fontSize: 16, lineHeight: 1, color: T.border, margin: '5px 0' }}>↓</div>
              )}
            </div>
          ))}
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: T.gap, minWidth: 0 }}>
          <Card title="Technology Stack">
            {stack.map((s, i, arr) => (
              <div key={s.cat} style={{ marginBottom: i < arr.length - 1 ? 14 : 0 }}>
                <SectionLabel style={{ marginBottom: 6, letterSpacing: '0.8px' }}>{s.cat}</SectionLabel>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {s.items.map(item => (
                    <span key={item} style={{
                      display: 'inline-flex', alignItems: 'center', height: 22, padding: '0 8px',
                      background: '#f4f8f7', border: '1px solid #e8f0f1', borderRadius: 4,
                      fontSize: 11, color: T.ink,
                    }}>
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </Card>

          <Card title="Core Data Schemas">
            {schemas.map((t, i, arr) => (
              <div key={t} style={{
                padding: '6px 0', fontSize: 11, fontFamily: T.mono, color: T.teal,
                borderBottom: i < arr.length - 1 ? '1px solid #f8fafb' : 'none',
              }}>
                {t}
              </div>
            ))}
          </Card>

          <Card tone="deep" title="Design for Constraints">
            {[
              { label: 'Low-cost sensors', desc: 'Affordable water quality monitoring hardware' },
              { label: 'Offline-first CHW', desc: 'Mobile reporting without reliable internet' },
              { label: 'Low-bandwidth API', desc: 'Efficient data sync on 2G/3G networks' },
              { label: 'Local processing', desc: 'Edge risk calculation where possible' },
            ].map((p, i, arr) => (
              <div key={p.label} style={{ marginBottom: i < arr.length - 1 ? 12 : 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.gold }}>{p.label}</div>
                <div style={{ fontSize: 11, opacity: 0.6, marginTop: 2, lineHeight: 1.45 }}>{p.desc}</div>
              </div>
            ))}
          </Card>
        </div>
      </Grid>
    </Page>
  );
}
