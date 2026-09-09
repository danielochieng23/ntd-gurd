'use client';
import { useAppStore } from '@/lib/store';
import { COMMUNITY_DATA, RISK_WEIGHTS } from '@/lib/data';
import RiskBadge, { RiskBar, riskColor } from '@/components/RiskBadge';
import { Page, Grid, Card, StatCard, T } from '@/components/ui';
import {
  Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, Legend,
} from 'recharts';

const C = { critical: T.coral, high: T.gold, moderate: T.teal, low: T.green };

export default function DashboardScreen() {
  const { communityStates, setScreen, setSelectedCommunity, alerts } = useAppStore();

  const sorted = [...communityStates].sort((a, b) => b.riskScore - a.riskScore);
  const topRisk = sorted.slice(0, 5);
  const overallRisk = Math.round(communityStates.reduce((s, c) => s + c.riskScore, 0) / communityStates.length);

  const counts = { CRITICAL: 0, HIGH: 0, MODERATE: 0, LOW: 0 };
  communityStates.forEach(c => counts[c.riskLevel]++);

  const busiaData = COMMUNITY_DATA['C002'];
  const trendData = busiaData.slice(75).map((d, i) => ({ day: `Day ${75 + i}`, risk: d.riskScore, rainfall: Math.round(d.rainfall) }));

  const pieData = [
    { name: 'Critical', value: counts.CRITICAL, color: C.critical },
    { name: 'High', value: counts.HIGH, color: C.high },
    { name: 'Moderate', value: counts.MODERATE, color: C.moderate },
    { name: 'Low', value: counts.LOW, color: C.low },
  ];

  const activeAlerts = alerts.filter(a => a.status === 'Active' || a.status === 'Investigating');

  return (
    <Page>
      {/* KPI row — labels, values and footnotes align across all five tiles */}
      <Grid cols={5} gap={14}>
        <StatCard tone="deep" label="Overall District Risk" value={overallRisk} sub={`${communityStates.length} Busia communities`} />
        <StatCard label="Critical Risk Areas" value={counts.CRITICAL} sub="Require immediate action" color={C.critical} />
        <StatCard label="High Risk Areas" value={counts.HIGH} sub="Close monitoring" color={C.high} />
        <StatCard label="Active Alerts" value={activeAlerts.length} sub="Unresolved" color={C.critical} />
        <StatCard label="Communities Monitored" value={communityStates.length} sub="Busia District, Uganda" color={T.teal} />
      </Grid>

      <Grid cols="minmax(0,2fr) minmax(0,1fr)">
        <Card
          title="Busia Zone 4 — Risk Escalation (Demo Scenario)"
          subtitle="Risk score over last 15 days · Rainfall overlay"
        >
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart data={trendData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={T.coral} stopOpacity={0.18} />
                  <stop offset="95%" stopColor={T.coral} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} tickMargin={8} minTickGap={12} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 9 }} tickLine={false} axisLine={false} width={T.axisW} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6, border: `1px solid ${T.border}` }} />
              <Area type="monotone" dataKey="risk" stroke={T.coral} strokeWidth={2} fill="url(#riskGrad)" name="Risk Score" />
              <Line type="monotone" dataKey="rainfall" stroke={T.teal} strokeWidth={1.5} dot={false} name="Rainfall (mm)" strokeDasharray="4 2" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Risk Distribution" subtitle={`Busia District · ${communityStates.length} communities`}>
          <ResponsiveContainer width="100%" height={210}>
            <PieChart margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
              <Pie data={pieData} cx="50%" cy="46%" innerRadius={48} outerRadius={72} dataKey="value" paddingAngle={2}>
                {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 11 }} />
              <Legend iconSize={8} verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: 11, paddingTop: 4 }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </Grid>

      <Grid cols={2}>
        <Card title="Highest Risk Communities">
          {topRisk.map((c, i) => (
            <div
              key={c.id}
              onClick={() => { setSelectedCommunity(c.id); setScreen('map'); }}
              style={{
                display: 'grid',
                gridTemplateColumns: '46px minmax(0,1fr) 84px',
                alignItems: 'center',
                columnGap: 12,
                padding: '10px 0',
                borderBottom: i < topRisk.length - 1 ? `1px solid ${T.hair}` : 'none',
                cursor: 'pointer',
              }}
            >
              <div style={{ fontFamily: T.mono, fontWeight: 500, fontSize: 18, color: riskColor(c.riskLevel), lineHeight: 1 }}>
                {c.riskScore}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                <div style={{ fontSize: 11, color: T.muted, marginTop: 1 }}>{c.country} · {c.region}</div>
                <RiskBar value={c.riskScore} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                <RiskBadge level={c.riskLevel} />
                <div style={{ fontFamily: T.mono, fontSize: 10, color: c.trend > 0 ? T.coral : T.green, fontWeight: 700 }}>
                  {c.trend > 0 ? '+' : ''}{Math.round(c.trend)} pts
                </div>
              </div>
            </div>
          ))}
        </Card>

        <Card title="Recent Alerts">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {alerts.slice(0, 4).map(alert => (
              <div
                key={alert.id}
                onClick={() => setScreen('alerts')}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0,1fr) auto',
                  alignItems: 'center',
                  columnGap: 12,
                  padding: '10px 12px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  border: `1px solid ${alert.riskLevel === 'CRITICAL' ? 'rgba(235,93,93,0.25)' : 'rgba(242,184,75,0.25)'}`,
                  background: alert.riskLevel === 'CRITICAL' ? 'rgba(235,93,93,0.04)' : 'rgba(242,184,75,0.04)',
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{alert.communityName}</div>
                  <div style={{ fontSize: 11, color: T.muted, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{alert.primaryDrivers[0]}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  <RiskBadge level={alert.riskLevel} />
                  <div style={{ fontFamily: T.mono, fontSize: 10.5, color: T.muted }}>{alert.riskBefore} → {alert.riskCurrent}</div>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => setScreen('alerts')}
            style={{
              width: '100%', marginTop: 'auto', paddingTop: 0, height: 34,
              background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 6,
              fontFamily: T.heading, fontSize: 12, color: T.teal, fontWeight: 600, cursor: 'pointer',
            }}
          >
            View All Alerts →
          </button>
        </Card>
      </Grid>

      <Card
        title="Prototype Risk Model — Weight Configuration"
        subtitle="Risk Score = Σ(weighted component scores) · Requires epidemiological validation"
        right={
          <span style={{
            display: 'inline-block', background: 'rgba(242,184,75,0.15)', color: '#8a5c00',
            fontSize: 9, fontWeight: 800, padding: '4px 8px', borderRadius: 4, letterSpacing: '0.8px',
          }}>
            PROTOTYPE MODEL
          </span>
        }
      >
        <Grid cols={6} gap={12}>
          {Object.entries(RISK_WEIGHTS).map(([key, w]) => (
            <div key={key} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start',
              textAlign: 'center', padding: '12px 8px', background: T.surface, borderRadius: 6, minWidth: 0,
            }}>
              <div style={{ fontFamily: T.mono, fontSize: 18, fontWeight: 500, color: T.teal, lineHeight: 1 }}>
                {Math.round(w * 100)}%
              </div>
              <div style={{ fontSize: 10, color: T.muted, marginTop: 6, lineHeight: 1.3, minHeight: 26 }}>
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </div>
            </div>
          ))}
        </Grid>
      </Card>
    </Page>
  );
}
