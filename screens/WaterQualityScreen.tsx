'use client';
import { useState } from 'react';
import { WATER_SENSORS, COMMUNITY_DATA } from '@/lib/data';
import { Page, Grid, Card, StatCard, Notice, ReadoutTile, SectionLabel, T } from '@/components/ui';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const STATUS_COLOR: Record<string, string> = { Normal: T.green, Warning: T.gold, Alarm: T.coral };
const STATUS_BG: Record<string, string> = {
  Normal: 'rgba(76,175,80,0.10)', Warning: 'rgba(242,184,75,0.10)', Alarm: 'rgba(235,93,93,0.10)',
};

export default function WaterQualityScreen() {
  const [selectedSensor, setSelectedSensor] = useState(WATER_SENSORS[0]);

  const trendData = COMMUNITY_DATA[selectedSensor.community].slice(60).map((d, i) => ({
    day: `D${60 + i}`, turbidity: d.waterQuality.turbidity, ecoli: d.waterQuality.ecoli,
    ph: d.waterQuality.ph, chlorine: d.waterQuality.chlorine,
  }));

  const alarms = WATER_SENSORS.filter(s => s.status === 'Alarm').length;
  const warnings = WATER_SENSORS.filter(s => s.status === 'Warning').length;

  const params = [
    { label: 'Turbidity', val: selectedSensor.turbidity, unit: 'NTU', normal: '< 4', alarm: selectedSensor.turbidity > 10, warn: selectedSensor.turbidity > 4 && selectedSensor.turbidity <= 10 },
    { label: 'pH', val: selectedSensor.ph, unit: '', normal: '6.5–8.5', alarm: selectedSensor.ph < 6.0 || selectedSensor.ph > 8.5, warn: false },
    { label: 'E. coli', val: selectedSensor.ecoli, unit: 'CFU', normal: '0', alarm: selectedSensor.ecoli > 100, warn: selectedSensor.ecoli > 0 && selectedSensor.ecoli <= 100 },
    { label: 'Chlorine', val: selectedSensor.chlorine, unit: 'mg/L', normal: '> 0.2', alarm: selectedSensor.chlorine < 0.1, warn: selectedSensor.chlorine >= 0.1 && selectedSensor.chlorine < 0.2 },
    { label: 'Conductivity', val: selectedSensor.conductivity, unit: 'µS/cm', normal: '< 400', alarm: selectedSensor.conductivity > 500, warn: selectedSensor.conductivity > 400 },
    { label: 'Temperature', val: selectedSensor.temperature, unit: '°C', normal: '< 28', alarm: selectedSensor.temperature > 30, warn: selectedSensor.temperature > 27 },
  ];

  return (
    <Page>
      <Notice>DEMONSTRATION DATA — Synthetic sensor readings for prototype purposes. Not real measurements.</Notice>

      <Grid cols={4} gap={14}>
        <StatCard label="Sensors Online" value={WATER_SENSORS.length} sub="Reporting in last 6h" color={T.teal} />
        <StatCard label="Alarm Status" value={alarms} sub="Threshold breached" color={T.coral} />
        <StatCard label="Warning Status" value={warnings} sub="Approaching threshold" color={T.gold} />
        <StatCard label="Normal Status" value={WATER_SENSORS.length - alarms - warnings} sub="Within safe range" color={T.green} />
      </Grid>

      <Grid cols="340px minmax(0,1fr)">
        {/* Sensor list */}
        <Card pad={0}>
          <div style={{
            padding: '14px 18px', borderBottom: `1px solid ${T.hair}`,
            fontFamily: T.heading, fontSize: 12, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.5px', minHeight: T.headerH,
            display: 'flex', alignItems: 'center',
          }}>
            Water Monitoring Points
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {WATER_SENSORS.map(sensor => (
              <div
                key={sensor.id}
                onClick={() => setSelectedSensor(sensor)}
                style={{
                  padding: '12px 18px', borderBottom: '1px solid #f8fafb', cursor: 'pointer',
                  background: selectedSensor.id === sensor.id ? '#f0f7f8' : 'white',
                  borderLeft: `3px solid ${selectedSensor.id === sensor.id ? T.teal : 'transparent'}`,
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', alignItems: 'start', columnGap: 10 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sensor.name}</div>
                    <div style={{ fontSize: 10, color: T.muted, marginTop: 2, fontFamily: T.mono }}>{sensor.id}</div>
                  </div>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 700, color: STATUS_COLOR[sensor.status], whiteSpace: 'nowrap' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: STATUS_COLOR[sensor.status] }} />
                    {sensor.status}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
                  <span style={{ fontSize: 10, color: T.muted }}>
                    Turbidity <strong style={{ fontFamily: T.mono, color: sensor.turbidity > 10 ? T.coral : T.ink }}>{sensor.turbidity}</strong>
                  </span>
                  <span style={{ fontSize: 10, color: T.muted }}>
                    E.coli <strong style={{ fontFamily: T.mono, color: sensor.ecoli > 100 ? T.coral : T.ink }}>{sensor.ecoli}</strong>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Detail column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: T.gap, minWidth: 0 }}>
          <Card
            title={selectedSensor.name}
            subtitle={`${selectedSensor.id} · Last reading ${new Date(selectedSensor.lastReading).toLocaleString()}`}
            right={
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 800,
                color: STATUS_COLOR[selectedSensor.status], background: STATUS_BG[selectedSensor.status],
                padding: '6px 12px', borderRadius: 6, letterSpacing: '0.5px',
              }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: STATUS_COLOR[selectedSensor.status] }} />
                {selectedSensor.status.toUpperCase()}
              </span>
            }
          >
            <Grid cols={6} gap={10}>
              {params.map(m => {
                const color = m.alarm ? T.coral : m.warn ? T.gold : T.green;
                return (
                  <ReadoutTile
                    key={m.label}
                    label={m.label}
                    value={m.val}
                    unit={m.unit}
                    color={color}
                    note={`Normal ${m.normal}`}
                    flag={m.alarm ? '⚠' : m.warn ? '△' : undefined}
                    emphasis={m.alarm}
                  />
                );
              })}
            </Grid>
          </Card>

          <Card
            title="Historical Trend — Last 30 Days"
            subtitle={`Community: ${selectedSensor.community} · Synthetic demonstration data`}
          >
            <Grid cols={2} gap={20}>
              <div style={{ minWidth: 0 }}>
                <SectionLabel style={{ marginBottom: 8, fontSize: 10, letterSpacing: '0.5px' }}>Turbidity (NTU)</SectionLabel>
                <ResponsiveContainer width="100%" height={130}>
                  <LineChart data={trendData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                    <XAxis dataKey="day" tick={{ fontSize: 8 }} tickLine={false} axisLine={false} interval={7} tickMargin={6} />
                    <YAxis tick={{ fontSize: 8 }} tickLine={false} axisLine={false} width={T.axisW} />
                    <Tooltip contentStyle={{ fontSize: 10 }} />
                    <ReferenceLine y={4} stroke={T.gold} strokeDasharray="3 2" strokeWidth={1} />
                    <ReferenceLine y={10} stroke={T.coral} strokeDasharray="3 2" strokeWidth={1} />
                    <Line type="monotone" dataKey="turbidity" stroke={T.teal} strokeWidth={1.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div style={{ minWidth: 0 }}>
                <SectionLabel style={{ marginBottom: 8, fontSize: 10, letterSpacing: '0.5px' }}>E. coli (CFU/100mL)</SectionLabel>
                <ResponsiveContainer width="100%" height={130}>
                  <LineChart data={trendData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                    <XAxis dataKey="day" tick={{ fontSize: 8 }} tickLine={false} axisLine={false} interval={7} tickMargin={6} />
                    <YAxis tick={{ fontSize: 8 }} tickLine={false} axisLine={false} width={T.axisW} />
                    <Tooltip contentStyle={{ fontSize: 10 }} />
                    <ReferenceLine y={100} stroke={T.coral} strokeDasharray="3 2" strokeWidth={1} />
                    <Line type="monotone" dataKey="ecoli" stroke={T.coral} strokeWidth={1.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Grid>
          </Card>
        </div>
      </Grid>
    </Page>
  );
}
