'use client';
import { Page, Grid, Card, T } from '@/components/ui';

export default function RoadmapScreen() {
  const phases = [
    {
      phase: 'Phase 1',
      label: 'Waterborne Disease Early Warning',
      status: 'current',
      timeline: 'Now — 2026',
      diseases: ['Cholera', 'Acute Diarrheal Disease'],
      milestones: ['Prototype risk model', 'Synthetic data generation', 'Interactive dashboard', 'CHW reporting interface', 'Investor demo ready'],
    },
    {
      phase: 'Phase 2',
      label: 'Retrospective Validation',
      status: 'next',
      timeline: '2026 — 2027',
      diseases: [],
      milestones: ['Partner with public health institutions', 'Access historical outbreak datasets', 'Retrospective model validation', 'Refine risk weights', 'IRB ethics review'],
    },
    {
      phase: 'Phase 3',
      label: 'Prospective Pilot',
      status: 'upcoming',
      timeline: '2027',
      diseases: ['Cholera', 'Typhoid'],
      milestones: ['3–5 pilot communities', 'Real-time sensor data integration', 'CHW field validation', 'Sensitivity / specificity analysis', 'Community feedback'],
    },
    {
      phase: 'Phase 4',
      label: 'Environmental NTD Intelligence',
      status: 'future',
      timeline: '2027 — 2028',
      diseases: ['Schistosomiasis', 'Trachoma', 'Soil-transmitted helminths'],
      milestones: ['Disease-specific risk models', 'Environmental condition mapping', 'Multi-disease integration', 'Expanded sensor network'],
    },
    {
      phase: 'Phase 5',
      label: 'Controlled Deployment & Scale',
      status: 'future',
      timeline: '2028+',
      diseases: ['Multi-disease platform'],
      milestones: ['Ministry of Health partnerships', 'NGO / INGO integration', 'Multi-country deployment', 'Advanced ML model training', 'Validated early-warning lead time'],
    },
    {
      phase: 'Phase 6',
      label: 'Environmental Disease Intelligence OS',
      status: 'vision',
      timeline: 'Long-term',
      diseases: ['Comprehensive NTD coverage'],
      milestones: ['Operating system for environmental disease prevention', 'Real-time multi-country surveillance', 'AI-driven predictive epidemiology', 'Global climate-health integration'],
    },
  ];

  const statusStyle: Record<string, { dot: string; badge: string; badgeColor: string }> = {
    current: { dot: T.teal, badge: 'rgba(8,127,140,0.1)', badgeColor: T.teal },
    next: { dot: T.gold, badge: 'rgba(242,184,75,0.15)', badgeColor: '#8a5c00' },
    upcoming: { dot: T.border, badge: T.hair, badgeColor: T.muted },
    future: { dot: T.border, badge: T.hair, badgeColor: T.muted },
    vision: { dot: T.deep, badge: 'rgba(6,59,70,0.08)', badgeColor: T.deep },
  };

  const statusLabel = (s: string) =>
    s === 'current' ? 'Active' : s === 'next' ? 'Up Next' : s === 'vision' ? 'Long-Term Vision' : 'Future';

  const ask = [
    { label: 'Technical Mentorship', desc: 'Public health surveillance & epidemiological modelling expertise' },
    { label: 'Research Partners', desc: 'Academic & institutional public health collaborators' },
    { label: 'Pilot Communities', desc: 'Partner communities for prospective evaluation' },
    { label: 'Data Partnerships', desc: 'Access to historical epidemiological & environmental datasets' },
    { label: 'Validation Support', desc: 'IRB, ethics review and prospective study design guidance' },
    { label: 'Seed Funding', desc: 'Early-stage investment for prototype-to-pilot transition' },
  ];

  const metrics = [
    'Early-warning lead time',
    'Sensitivity (outbreak detection rate)',
    'Specificity (false-alert rate)',
    'Model calibration',
    'Response time to first alert',
    'Intervention completion rate',
    'Cost per community monitored',
    'CHW usability score',
  ];

  return (
    <Page>
      <Grid cols="minmax(0,2fr) minmax(0,1fr)" gap={24}>
        {/* Roadmap timeline */}
        <div style={{ minWidth: 0 }}>
          <h2 style={{ fontFamily: T.heading, fontSize: 14, fontWeight: 800, color: T.deep, margin: 0 }}>
            Development & Validation Roadmap
          </h2>
          <p style={{ fontSize: 12, color: T.muted, margin: '4px 0 20px' }}>
            From prototype to validated environmental disease intelligence platform
          </p>

          {phases.map((p, i) => {
            const s = statusStyle[p.status];
            const isLast = i === phases.length - 1;
            return (
              <div key={p.phase} style={{ display: 'grid', gridTemplateColumns: '14px minmax(0,1fr)', columnGap: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{
                    width: 14, height: 14, borderRadius: '50%', background: s.dot, marginTop: 6,
                    border: '2px solid white', outline: `2px solid ${s.dot}`, flexShrink: 0,
                  }} />
                  {!isLast && <div style={{ width: 2, flex: 1, background: T.hair, marginTop: 8 }} />}
                </div>

                <div style={{
                  background: 'white', border: `1px solid ${p.status === 'current' ? T.teal : T.border}`,
                  borderRadius: 8, padding: '16px 20px', marginBottom: isLast ? 0 : 20, minWidth: 0,
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', columnGap: 12, alignItems: 'center' }}>
                    <span style={{
                      justifySelf: 'start', fontSize: 9, fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase',
                      padding: '3px 8px', borderRadius: 4, background: s.badge, color: s.badgeColor,
                    }}>
                      {p.phase} · {statusLabel(p.status)}
                    </span>
                    <span style={{ fontSize: 11, color: T.muted, fontFamily: T.mono, whiteSpace: 'nowrap' }}>{p.timeline}</span>
                  </div>

                  <h3 style={{ fontFamily: T.heading, fontSize: 15, fontWeight: 800, color: T.deep, margin: '10px 0 0', lineHeight: 1.3 }}>
                    {p.label}
                  </h3>

                  {p.diseases.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 10 }}>
                      {p.diseases.map(d => (
                        <span key={d} style={{
                          display: 'inline-flex', alignItems: 'center', height: 20, padding: '0 8px',
                          background: 'rgba(8,127,140,0.08)', border: '1px solid rgba(8,127,140,0.15)',
                          borderRadius: 4, fontSize: 10, color: T.teal, fontWeight: 600,
                        }}>
                          {d}
                        </span>
                      ))}
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 16, rowGap: 5, marginTop: 12 }}>
                    {p.milestones.map(m => (
                      <div key={m} style={{
                        display: 'grid', gridTemplateColumns: '12px minmax(0,1fr)', columnGap: 6,
                        fontSize: 11, color: T.muted, lineHeight: 1.45,
                      }}>
                        <span style={{ color: p.status === 'current' ? T.teal : T.border, fontWeight: 700 }}>◆</span>
                        <span>{m}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: T.gap, minWidth: 0 }}>
          <div style={{ background: T.deep, color: 'white', borderRadius: 10, padding: 22 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: T.gold }}>
              Long-Term Vision
            </div>
            <h3 style={{ fontFamily: T.heading, fontSize: 16, fontWeight: 800, margin: '12px 0 10px', lineHeight: 1.35 }}>
              An operating system for environmental disease prevention
            </h3>
            <p style={{ fontSize: 12, opacity: 0.65, lineHeight: 1.65, margin: 0 }}>
              NTD GURD aims to build an intelligence layer between environment and public health action — detecting
              early signals that precede outbreaks, enabling preventive response before disease becomes a crisis.
            </p>
          </div>

          <Card title="Fellowship Ask" subtitle="What we need from the program">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {ask.map(a => (
                <div key={a.label} style={{ padding: '10px 12px', background: T.surface, borderRadius: 6, border: `1px solid ${T.hair}` }}>
                  <div style={{ fontFamily: T.heading, fontWeight: 700, fontSize: 12, color: T.teal }}>{a.label}</div>
                  <div style={{ fontSize: 11, color: T.muted, marginTop: 3, lineHeight: 1.45 }}>{a.desc}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Future Evaluation Metrics">
            {metrics.map((m, i, arr) => (
              <div key={m} style={{
                display: 'grid', gridTemplateColumns: '14px minmax(0,1fr)', columnGap: 7,
                fontSize: 11, color: T.ink, padding: '6px 0',
                borderBottom: i < arr.length - 1 ? '1px solid #f8fafb' : 'none',
              }}>
                <span style={{ color: T.teal }}>→</span>
                <span>{m}</span>
              </div>
            ))}
          </Card>
        </div>
      </Grid>
    </Page>
  );
}
