'use client';
import { IMPACT_METRICS } from '@/lib/data';
import { Page, Grid, Card, StatCard, Notice, MeterRow, SectionLabel, T } from '@/components/ui';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function ImpactScreen() {
  const responseData = [
    { name: 'Busia Zone 4', before: 82, after: 58, reduction: 24 },
    { name: 'Majanji', before: 74, after: 51, reduction: 23 },
    { name: 'Lumino', before: 68, after: 44, reduction: 24 },
  ];

  const alertTimeline = [
    { week: 'Week 1', alerts: 2, resolved: 1 },
    { week: 'Week 2', alerts: 3, resolved: 2 },
    { week: 'Week 3', alerts: 5, resolved: 4 },
    { week: 'Week 4', alerts: 4, resolved: 3 },
    { week: 'Week 5', alerts: 6, resolved: 5 },
    { week: 'Week 6', alerts: 3, resolved: 3 },
  ];

  const kpis = [
    { label: 'Alert Verification Rate', val: `${IMPACT_METRICS.alertsVerified}/${IMPACT_METRICS.alertsGenerated}`, pct: Math.round(IMPACT_METRICS.alertsVerified / IMPACT_METRICS.alertsGenerated * 100), color: T.green },
    { label: 'Average Response Time', val: `${IMPACT_METRICS.avgResponseTimeHours}h`, pct: 74, color: T.teal },
    { label: 'Risk Reduction (post-intervention)', val: `${IMPACT_METRICS.riskReductionPct}%`, pct: IMPACT_METRICS.riskReductionPct, color: T.green },
    { label: 'CHW Reports Integrated', val: String(IMPACT_METRICS.chwReports), pct: 82, color: T.teal },
    { label: 'Water Points Investigated', val: String(IMPACT_METRICS.waterPointsInvestigated), pct: 68, color: T.gold },
  ];

  return (
    <Page>
      <Notice tone="deep">
        DEMONSTRATION METRICS — Simulated data for prototype purposes. Does not represent real-world outcomes.
      </Notice>

      <Grid cols={5} gap={14}>
        <StatCard label="Communities Monitored" value={IMPACT_METRICS.communitiesMonitored} sub="Busia District" color={T.teal} />
        <StatCard label="High-Risk Areas Detected" value={IMPACT_METRICS.highRiskDetected} sub="Across 90-day window" color={T.coral} />
        <StatCard label="Alerts Generated" value={IMPACT_METRICS.alertsGenerated} sub="Model-triggered" color={T.gold} />
        <StatCard label="Interventions Deployed" value={IMPACT_METRICS.interventionsDeployed} sub="Field actions logged" color={T.teal} />
        <StatCard label="Households Reached" value={`${(IMPACT_METRICS.householdsReached / 1000).toFixed(1)}K`} sub="Cumulative coverage" color={T.deep} />
      </Grid>

      <Grid cols={2}>
        <Card title="Key Performance Indicators" subtitle="Prototype demonstration metrics">
          {kpis.map(m => (
            <MeterRow key={m.label} label={m.label} value={m.pct} note={m.val} color={m.color} suffix="%" />
          ))}
        </Card>

        <Card title="Alert Volume — 6-Week Trend" subtitle="Alerts generated vs resolved">
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={alertTimeline} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <XAxis dataKey="week" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false} width={T.axisW} allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize: 11 }} cursor={{ fill: 'rgba(8,127,140,0.05)' }} />
              <Legend iconSize={8} verticalAlign="bottom" wrapperStyle={{ fontSize: 11, paddingTop: 4 }} />
              <Bar dataKey="alerts" fill={T.coral} radius={[3, 3, 0, 0]} name="Generated" />
              <Bar dataKey="resolved" fill={T.green} radius={[3, 3, 0, 0]} name="Resolved" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </Grid>

      <Grid cols={2}>
        <Card title="Risk Reduction After Intervention" subtitle="Before vs after preventive deployment">
          {responseData.map((r, idx) => (
            <div key={r.name} style={{ marginBottom: idx < responseData.length - 1 ? 18 : 0 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600 }}>{r.name}</span>
                <span style={{ fontFamily: T.mono, fontSize: 12, fontWeight: 700, color: T.green }}>−{r.reduction} pts</span>
              </div>
              {[
                { tag: 'Before', v: r.before, c: T.coral },
                { tag: 'After', v: r.after, c: T.green },
              ].map(row => (
                <div key={row.tag} style={{
                  display: 'grid', gridTemplateColumns: '46px minmax(0,1fr) 28px',
                  alignItems: 'center', columnGap: 8, marginTop: 5,
                }}>
                  <span style={{ fontSize: 10, color: T.muted }}>{row.tag}</span>
                  <div style={{ height: 8, background: '#e8f0f1', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${row.v}%`, background: row.c, borderRadius: 4 }} />
                  </div>
                  <span style={{ fontFamily: T.mono, fontSize: 11, color: row.c, textAlign: 'right' }}>{row.v}</span>
                </div>
              ))}
            </div>
          ))}
        </Card>

        <Card title="Business Model" subtitle="B2B / B2G health-tech platform">
          <SectionLabel>Target Customers</SectionLabel>
          <div style={{ marginBottom: 18 }}>
            {['Ministries of Health', 'NGOs & Humanitarian Orgs', 'Public Health Agencies', 'Water Utilities', 'Municipal Governments', 'Research Institutions', 'Development Organizations'].map((c, i, arr) => (
              <div key={c} style={{
                display: 'grid', gridTemplateColumns: '16px minmax(0,1fr)', columnGap: 8, alignItems: 'center',
                fontSize: 12, color: T.ink, padding: '6px 0',
                borderBottom: i < arr.length - 1 ? '1px solid #f8fafb' : 'none',
              }}>
                <span style={{ color: T.teal, fontWeight: 700 }}>→</span>
                <span>{c}</span>
              </div>
            ))}
          </div>

          <SectionLabel>Revenue Streams</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { label: 'SaaS Subscription', desc: 'Dashboard access & alerts' },
              { label: 'Monitoring Services', desc: 'Water/environmental sensor management' },
              { label: 'Analytics', desc: 'Advanced epidemiological intelligence' },
              { label: 'Implementation', desc: 'Deployment & integration support' },
            ].map(r => (
              <div key={r.label} style={{ padding: '8px 11px', background: T.surface, borderRadius: 5 }}>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{r.label}</div>
                <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{r.desc}</div>
              </div>
            ))}
          </div>
        </Card>
      </Grid>
    </Page>
  );
}
