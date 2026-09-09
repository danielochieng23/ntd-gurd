'use client';
import { PROJECTIONS, COMMUNITY_DATA, RISK_WEIGHTS } from '@/lib/data';
import { Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, AreaChart, Area } from 'recharts';
import { riskColor } from '@/components/RiskBadge';
import { Page, Grid, Card, Notice, SectionLabel, T } from '@/components/ui';

const level = (v: number): 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW' =>
  v >= 75 ? 'CRITICAL' : v >= 55 ? 'HIGH' : v >= 35 ? 'MODERATE' : 'LOW';

export default function PredictiveScreen() {
  const primary = PROJECTIONS[0];

  const actualData = COMMUNITY_DATA[primary.communityId].slice(75).map((d, i) => ({
    day: `D${75 + i}`, actual: d.riskScore, projected: null as number | null,
  }));
  const projData = Array.from({ length: 7 }, (_, i) => ({
    day: `P${i + 1}`, actual: null as number | null,
    projected: Math.min(100, Math.round(primary.currentRisk + (primary.projectedRisk - primary.currentRisk) * (i + 1) / 7)),
  }));
  const chartData = [...actualData, ...projData];

  const stages = [
    { stage: 'Stage 1', label: 'Prototype Risk Model', status: 'current', desc: 'Weighted scoring, synthetic data' },
    { stage: 'Stage 2', label: 'Retrospective Validation', status: 'next', desc: 'Historical outbreak datasets' },
    { stage: 'Stage 3', label: 'Prospective Pilot', status: 'future', desc: 'Real-time sensor data, limited sites' },
    { stage: 'Stage 4', label: 'CHW Field Validation', status: 'future', desc: 'Community health worker verification' },
    { stage: 'Stage 5', label: 'Controlled Deployment', status: 'future', desc: 'Monitored scale with health partners' },
    { stage: 'Stage 6', label: 'Scale', status: 'future', desc: 'Multi-country, validated ML models' },
  ];

  return (
    <Page>
      <Notice tone="deep">
        PROTOTYPE SIMULATION — Not clinically validated. Prototype risk model requires epidemiological validation before operational use.
      </Notice>

      {/* Model overview */}
      <div style={{ background: T.deep, color: 'white', borderRadius: 10, padding: '22px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', alignItems: 'start', columnGap: 24 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: T.gold }}>
              Prototype Risk Model
            </div>
            <h2 style={{ fontFamily: T.heading, fontSize: 16, fontWeight: 700, margin: '10px 0 6px', lineHeight: 1.3 }}>
              NTD GURD Predictive Intelligence
            </h2>
            <p style={{ fontSize: 12, opacity: 0.6, lineHeight: 1.6, maxWidth: 520, margin: 0 }}>
              A transparent weighted risk model combining environmental, water-quality and community health signals.
              Future versions will use validated epidemiological and machine-learning models trained on longitudinal datasets.
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', opacity: 0.5 }}>Model Type</div>
            <div style={{ fontFamily: T.heading, fontWeight: 700, fontSize: 14, marginTop: 10 }}>Weighted Score Model</div>
            <div style={{ fontSize: 11, opacity: 0.5, marginTop: 4 }}>6 inputs · Configurable weights</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0,1fr))', gap: 10, marginTop: 20 }}>
          {Object.entries(RISK_WEIGHTS).map(([key, w]) => (
            <div key={key} style={{
              background: 'rgba(255,255,255,0.08)', borderRadius: 6, padding: '12px 8px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', minWidth: 0,
            }}>
              <div style={{ fontFamily: T.mono, fontSize: 20, fontWeight: 500, color: T.gold, lineHeight: 1 }}>
                {Math.round(w * 100)}%
              </div>
              <div style={{ fontSize: 9, opacity: 0.6, marginTop: 6, lineHeight: 1.3, minHeight: 24 }}>
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top projections */}
      <Grid cols={3} gap={14}>
        {PROJECTIONS.slice(0, 3).map(p => (
          <Card key={p.communityId} pad={18} title={p.name} subtitle={p.trend}>
            <Grid cols={3} gap={8}>
              {[
                { label: 'Current', val: p.currentRisk, color: riskColor(level(p.currentRisk)) },
                { label: '7-Day Proj.', val: p.projectedRisk, color: riskColor(level(p.projectedRisk)) },
                { label: 'Confidence', val: `${p.confidence}%`, color: T.teal },
              ].map(t => (
                <div key={t.label} style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start',
                  textAlign: 'center', padding: '10px 6px', background: T.surface, borderRadius: 6, minWidth: 0,
                }}>
                  <div style={{ fontSize: 9, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.5px', minHeight: 13, whiteSpace: 'nowrap' }}>
                    {t.label}
                  </div>
                  <div style={{ fontFamily: T.mono, fontSize: 22, fontWeight: 500, color: t.color, marginTop: 6, lineHeight: 1 }}>
                    {t.val}
                  </div>
                </div>
              ))}
            </Grid>

            <SectionLabel style={{ marginTop: 16, marginBottom: 8 }}>Major Drivers</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {p.drivers.map((d, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '18px minmax(0,1fr)', columnGap: 6, fontSize: 11, color: T.ink, lineHeight: 1.5 }}>
                  <span style={{ fontFamily: T.mono, color: T.teal, fontWeight: 700 }}>{i + 1}.</span>
                  <span>{d}</span>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </Grid>

      <Grid cols="minmax(0,2fr) minmax(0,1fr)">
        <Card
          title="Busia Zone 4 — Risk Projection"
          subtitle="Actual (solid) + 7-day forecast (dashed) · Prototype simulation"
          right={
            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 10, color: T.muted }}>
                <span style={{ width: 18, height: 2, background: T.coral, display: 'inline-block' }} /> Actual
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 10, color: T.muted }}>
                <span style={{ width: 18, borderTop: `2px dashed ${T.gold}`, display: 'inline-block' }} /> Projected
              </span>
            </div>
          }
        >
          <ResponsiveContainer width="100%" height={230}>
            <AreaChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={T.coral} stopOpacity={0.1} />
                  <stop offset="95%" stopColor={T.coral} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fontSize: 8 }} tickLine={false} axisLine={false} interval={3} tickMargin={6} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 8 }} tickLine={false} axisLine={false} width={T.axisW} />
              <Tooltip contentStyle={{ fontSize: 10 }} />
              <ReferenceLine y={75} stroke={T.coral} strokeDasharray="4 2" strokeWidth={1} label={{ value: 'CRITICAL', position: 'insideTopRight', fontSize: 8, fill: T.coral }} />
              <ReferenceLine y={55} stroke={T.gold} strokeDasharray="4 2" strokeWidth={1} label={{ value: 'HIGH', position: 'insideTopRight', fontSize: 8, fill: T.gold }} />
              <Area type="monotone" dataKey="actual" stroke={T.coral} strokeWidth={2} fill="url(#actGrad)" name="Actual Risk" connectNulls={false} />
              <Line type="monotone" dataKey="projected" stroke={T.gold} strokeWidth={2} dot={{ r: 3 }} strokeDasharray="5 3" name="Projected Risk" connectNulls={false} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Validation Roadmap">
          {stages.map((s, i) => {
            const dot = s.status === 'current' ? T.teal : s.status === 'next' ? T.gold : T.border;
            const tag = s.status === 'current' ? T.teal : s.status === 'next' ? '#c47d00' : T.muted;
            const isLast = i === stages.length - 1;
            return (
              <div key={s.stage} style={{ display: 'grid', gridTemplateColumns: '10px minmax(0,1fr)', columnGap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: dot, marginTop: 4, flexShrink: 0 }} />
                  {!isLast && <div style={{ width: 2, flex: 1, background: T.hair, marginTop: 4 }} />}
                </div>
                <div style={{ paddingBottom: isLast ? 0 : 14, minWidth: 0 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: tag }}>{s.stage}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.ink, marginTop: 3 }}>{s.label}</div>
                  <div style={{ fontSize: 11, color: T.muted, marginTop: 2, lineHeight: 1.4 }}>{s.desc}</div>
                </div>
              </div>
            );
          })}
        </Card>
      </Grid>
    </Page>
  );
}
