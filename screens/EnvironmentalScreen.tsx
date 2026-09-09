'use client';
import { COMMUNITY_DATA, MODEL_DISTRICT } from '@/lib/data';
import { useWeather } from '@/lib/useWeather';
import { Page, Grid, Card, StatCard, Notice, T } from '@/components/ui';
import { AreaChart, Area, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts';

export default function EnvironmentalScreen() {
  const { data: weather, status: weatherStatus, error: weatherError, refresh } = useWeather(
    MODEL_DISTRICT.center.lat,
    MODEL_DISTRICT.center.lng,
  );

  const busiaData = COMMUNITY_DATA['C002'];
  const last30 = busiaData.slice(60);

  const trendData = last30.map((d, i) => ({
    day: `D${60 + i}`,
    rainfall: d.rainfall,
    rainfallAnomaly: Math.round(d.rainfallAnomaly),
    floodRisk: d.floodRisk,
    riskScore: d.riskScore,
  }));

  const latestDay = busiaData[89];

  const chain = [
    { label: 'Heavy Rainfall Detected', value: `${latestDay.rainfall.toFixed(1)} mm · Anomaly ${latestDay.rainfallAnomaly.toFixed(0)}%`, triggered: latestDay.rainfall > 50, icon: '🌧' },
    { label: 'Flood Exposure Increased', value: `Flood risk ${latestDay.floodRisk}/100`, triggered: latestDay.floodRisk > 60, icon: '🌊' },
    { label: 'Water Contamination Risk', value: `Turbidity ${latestDay.waterQuality.turbidity} NTU · E.coli ${latestDay.waterQuality.ecoli} CFU`, triggered: latestDay.waterQuality.risk > 50, icon: '⚗' },
    { label: 'Community Symptom Signal', value: `Diarrhea ${latestDay.symptoms.diarrhea} cases · Suspected cholera ${latestDay.symptoms.suspectedCholera}`, triggered: latestDay.symptoms.signal > 40, icon: '⚕' },
    { label: 'Overall Risk Escalated', value: `Risk score ${latestDay.riskScore}/100`, triggered: latestDay.riskScore > 60, icon: '⚑' },
  ];

  const indicators = [
    { label: 'Rainfall (24h)', val: `${latestDay.rainfall.toFixed(1)} mm`, status: latestDay.rainfall > 50 ? 'Elevated' : 'Normal', alarm: latestDay.rainfall > 50 },
    { label: 'Rainfall Anomaly', val: `${latestDay.rainfallAnomaly.toFixed(0)}%`, status: latestDay.rainfallAnomaly > 30 ? 'Above average' : 'Normal', alarm: latestDay.rainfallAnomaly > 50 },
    { label: 'Flood Risk', val: `${latestDay.floodRisk}/100`, status: latestDay.floodRisk > 60 ? 'High' : 'Moderate', alarm: latestDay.floodRisk > 60 },
    { label: 'Temperature', val: `${latestDay.waterQuality.temperature}°C`, status: 'Normal', alarm: false },
    { label: 'Sanitation Risk', val: `${latestDay.sanitationRisk}/100`, status: latestDay.sanitationRisk > 60 ? 'Elevated' : 'Moderate', alarm: latestDay.sanitationRisk > 60 },
    { label: 'Seasonality', val: 'Rainy Season', status: 'Peak risk window', alarm: true },
  ];

  function chainStyle(i: number, triggered: boolean) {
    const isFirst = i === 0;
    const isLast = i === chain.length - 1;
    if (!triggered) return { bg: T.surface, bd: '#e8f0f1', fg: T.ink, sub: T.muted };
    if (isFirst) return { bg: T.deep, bd: T.deep, fg: 'white', sub: 'rgba(255,255,255,0.7)' };
    if (isLast) return { bg: T.coral, bd: T.coral, fg: 'white', sub: 'rgba(255,255,255,0.8)' };
    return { bg: 'rgba(235,93,93,0.05)', bd: 'rgba(235,93,93,0.2)', fg: T.ink, sub: T.muted };
  }

  const liveDays = (weather?.days ?? []).map(d => ({
    label: new Date(`${d.date}T00:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
    observed: d.isForecast ? null : d.precipitation,
    forecast: d.isForecast ? d.precipitation : null,
    probability: d.precipProbability,
  }));

  return (
    <Page>
      <Notice>
        MIXED SOURCES — Rainfall, flood and temperature panels below are LIVE observations from Open-Meteo for
        Busia District. Water quality, symptoms and the composite risk score remain synthetic demonstration data.
      </Notice>

      {/* Live weather from Open-Meteo */}
      <Card
        title="Live weather & hydrology — Open-Meteo"
        subtitle={
          weatherStatus === 'ready' && weather
            ? `${MODEL_DISTRICT.name} · ${weather.latitude.toFixed(3)}°N ${weather.longitude.toFixed(3)}°E · retrieved ${new Date(weather.fetchedAt).toLocaleString()}`
            : weatherStatus === 'loading' ? 'Contacting Open-Meteo…' : 'Open-Meteo unavailable'
        }
        right={
          <button
            onClick={refresh}
            disabled={weatherStatus === 'loading'}
            style={{
              height: 30, padding: '0 14px', borderRadius: 5, cursor: weatherStatus === 'loading' ? 'wait' : 'pointer',
              background: 'transparent', border: `1px solid ${T.border}`, color: T.teal,
              fontFamily: T.heading, fontSize: 11, fontWeight: 700,
            }}
          >
            {weatherStatus === 'loading' ? 'Refreshing…' : '↻ Refresh'}
          </button>
        }
      >
        {weatherStatus === 'error' ? (
          <div style={{ fontSize: 12, color: T.coral, lineHeight: 1.6 }}>
            Could not reach Open-Meteo: {weatherError}. The panels below fall back to synthetic data.
          </div>
        ) : weatherStatus === 'loading' || !weather ? (
          <div style={{ fontSize: 12, color: T.muted }}>Fetching live rainfall, forecast and river discharge…</div>
        ) : (
          <>
            <Grid cols={5} gap={12}>
              <StatCard label="Rain last 7 days" value={`${weather.rain7d}`} sub="mm observed" color={T.teal} />
              <StatCard label="Rain next 7 days" value={`${weather.rainNext7d}`} sub="mm forecast" color={T.teal} />
              <StatCard
                label="Rainfall anomaly"
                value={`${weather.rainfallAnomaly > 0 ? '+' : ''}${weather.rainfallAnomaly}%`}
                sub={`vs ${weather.seasonalNormal} mm/day normal`}
                color={weather.rainfallAnomaly > 40 ? T.coral : weather.rainfallAnomaly > 15 ? T.gold : T.ink}
              />
              <StatCard
                label="Flood risk (derived)"
                value={`${weather.floodRisk}`}
                sub="rainfall + discharge"
                color={weather.floodRisk >= 75 ? T.coral : weather.floodRisk >= 55 ? T.gold : T.teal}
              />
              <StatCard
                label="River discharge"
                value={weather.dischargeNow === null ? '—' : `${weather.dischargeNow}`}
                sub={weather.dischargeNow === null ? 'no mapped reach' : `m³/s · mean ${weather.dischargeBaseline}`}
                color={T.deep}
              />
            </Grid>

            <div style={{ marginTop: 16 }}>
              <ResponsiveContainer width="100%" height={190}>
                <BarChart data={liveDays} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                  <XAxis dataKey="label" tick={{ fontSize: 8 }} tickLine={false} axisLine={false} tickMargin={6} />
                  <YAxis tick={{ fontSize: 8 }} tickLine={false} axisLine={false} width={T.axisW} />
                  <Tooltip contentStyle={{ fontSize: 11 }} cursor={{ fill: 'rgba(8,127,140,0.05)' }} />
                  <Legend iconSize={8} verticalAlign="bottom" wrapperStyle={{ fontSize: 10, paddingTop: 4 }} />
                  <Bar dataKey="observed" name="Observed (mm)" fill={T.teal} radius={[2, 2, 0, 0]} />
                  <Bar dataKey="forecast" name="Forecast (mm)" fill={T.gold} radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {weather.degraded.map(d => (
              <div key={d} style={{ fontSize: 11, color: T.muted, marginTop: 8, lineHeight: 1.5 }}>· {d}</div>
            ))}
          </>
        )}
      </Card>

      <Grid cols={2}>
        <Card title="Rainfall & Flood Risk" subtitle="Busia Zone 4 · Last 30 days">
          <ResponsiveContainer width="100%" height={190}>
            <AreaChart data={trendData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="rainGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={T.teal} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={T.teal} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="floodGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={T.coral} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={T.coral} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fontSize: 8 }} tickLine={false} axisLine={false} interval={7} tickMargin={6} />
              <YAxis tick={{ fontSize: 8 }} tickLine={false} axisLine={false} width={T.axisW} />
              <Tooltip contentStyle={{ fontSize: 10 }} />
              <Legend iconSize={8} verticalAlign="bottom" wrapperStyle={{ fontSize: 10, paddingTop: 4 }} />
              <Area type="monotone" dataKey="rainfall" stroke={T.teal} strokeWidth={2} fill="url(#rainGrad)" name="Rainfall (mm)" />
              <Area type="monotone" dataKey="floodRisk" stroke={T.coral} strokeWidth={1.5} fill="url(#floodGrad)" name="Flood Risk" strokeDasharray="4 2" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Rainfall Anomaly (% vs Seasonal Average)" subtitle="Positive = above average · Negative = below average">
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={trendData.slice(-15)} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <XAxis dataKey="day" tick={{ fontSize: 8 }} tickLine={false} axisLine={false} tickMargin={6} />
              <YAxis tick={{ fontSize: 8 }} tickLine={false} axisLine={false} width={T.axisW} />
              <Tooltip contentStyle={{ fontSize: 10 }} cursor={{ fill: 'rgba(8,127,140,0.05)' }} />
              <Legend iconSize={8} verticalAlign="bottom" wrapperStyle={{ fontSize: 10, paddingTop: 4 }} />
              <ReferenceLine y={0} stroke={T.border} />
              <Bar dataKey="rainfallAnomaly" name="Anomaly %" fill={T.teal} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </Grid>

      <Grid cols={2}>
        <Card title="Environmental Causal Chain" subtitle="How environmental changes escalate disease risk">
          {chain.map((step, i) => {
            const s = chainStyle(i, step.triggered);
            return (
              <div key={i}>
                <div style={{
                  display: 'grid', gridTemplateColumns: '24px minmax(0,1fr) auto',
                  alignItems: 'center', columnGap: 12,
                  padding: '12px 14px', borderRadius: 7,
                  background: s.bg, border: `1px solid ${s.bd}`,
                }}>
                  <div style={{ fontSize: 17, lineHeight: 1, textAlign: 'center' }}>{step.icon}</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: T.heading, fontWeight: 700, fontSize: 13, color: s.fg, lineHeight: 1.3 }}>{step.label}</div>
                    <div style={{ fontSize: 10.5, marginTop: 3, fontFamily: T.mono, color: s.sub, lineHeight: 1.4 }}>{step.value}</div>
                  </div>
                  <div style={{
                    fontSize: 9, fontWeight: 800, letterSpacing: '0.8px', whiteSpace: 'nowrap',
                    color: step.triggered ? (s.fg === 'white' ? 'white' : T.coral) : 'transparent',
                  }}>
                    TRIGGERED
                  </div>
                </div>
                {i < chain.length - 1 && (
                  <div style={{
                    textAlign: 'center', fontSize: 15, lineHeight: 1, margin: '4px 0',
                    color: step.triggered ? T.coral : T.border, fontWeight: step.triggered ? 700 : 400,
                  }}>
                    ↓
                  </div>
                )}
              </div>
            );
          })}
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: T.gap, minWidth: 0 }}>
          <Card title="Current Environmental Indicators">
            <Grid cols={2} gap={10}>
              {indicators.map(m => (
                <div key={m.label} style={{
                  display: 'flex', flexDirection: 'column', minWidth: 0, height: '100%',
                  padding: '11px 12px', borderRadius: 6,
                  background: m.alarm ? 'rgba(235,93,93,0.04)' : T.surface,
                  border: `1px solid ${m.alarm ? 'rgba(235,93,93,0.2)' : '#e8f0f1'}`,
                }}>
                  <div style={{ fontSize: 9, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.5px', minHeight: 13 }}>
                    {m.label}
                  </div>
                  <div style={{ fontFamily: T.mono, fontSize: 16, fontWeight: 500, color: m.alarm ? T.coral : T.ink, marginTop: 5, lineHeight: 1.1 }}>
                    {m.val}
                  </div>
                  <div style={{
                    fontSize: 10, marginTop: 'auto', paddingTop: 5,
                    color: m.alarm ? T.coral : T.muted, fontWeight: m.alarm ? 600 : 400,
                  }}>
                    {m.status}
                  </div>
                </div>
              ))}
            </Grid>
          </Card>

          <Card title="Risk Score vs Rainfall (Last 30 Days)" subtitle="Correlation between environmental and health risk signals">
            <ResponsiveContainer width="100%" height={150}>
              <LineChart data={trendData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <XAxis dataKey="day" tick={{ fontSize: 8 }} tickLine={false} axisLine={false} interval={7} tickMargin={6} />
                <YAxis tick={{ fontSize: 8 }} tickLine={false} axisLine={false} width={T.axisW} />
                <Tooltip contentStyle={{ fontSize: 10 }} />
                <Legend iconSize={8} verticalAlign="bottom" wrapperStyle={{ fontSize: 10, paddingTop: 4 }} />
                <Line type="monotone" dataKey="riskScore" stroke={T.coral} strokeWidth={2} dot={false} name="Risk Score" />
                <Line type="monotone" dataKey="rainfall" stroke={T.teal} strokeWidth={1.5} dot={false} name="Rainfall (mm)" strokeDasharray="3 2" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </Grid>
    </Page>
  );
}
