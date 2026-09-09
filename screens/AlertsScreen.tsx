'use client';
import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { WATER_SENSORS, MODEL_DISTRICT } from '@/lib/data';
import { useWeather } from '@/lib/useWeather';
import { downloadReport } from '@/lib/pdf';
import RiskBadge, { riskColor } from '@/components/RiskBadge';
import { Grid, Card, MeterRow, Divider, Table, Th, Td, T } from '@/components/ui';

const STATUS_COLOR: Record<string, string> = {
  'Active': T.coral, 'Investigating': T.gold, 'Response Assigned': T.teal, 'Resolved': T.green,
};

const COMPONENT_LABELS: Record<string, string> = {
  waterQuality: 'Water Quality', rainfall: 'Rainfall / Flood', symptoms: 'Symptom Signal',
  sanitation: 'Sanitation Risk', historical: 'Historical Pattern', vulnerability: 'Population Vulnerability',
};

const btn = (bg: string, fg: string, border = 'none'): React.CSSProperties => ({
  height: 34, padding: '0 16px', background: bg, color: fg, border,
  borderRadius: 6, fontFamily: T.heading, fontSize: 12, fontWeight: 700,
  cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
});

export default function AlertsScreen() {
  const { alerts, interventions, communityStates, setScreen, addToast } = useAppStore();
  const [selectedId, setSelectedId] = useState<string>(alerts[0]?.id ?? '');
  const [exporting, setExporting] = useState(false);
  const { data: weather } = useWeather(MODEL_DISTRICT.center.lat, MODEL_DISTRICT.center.lng);

  const selected = alerts.find(a => a.id === selectedId) ?? alerts[0];
  const relatedInterventions = interventions.filter(i => i.alertId === selectedId);

  function handleAssign() {
    addToast('success', 'Response Assigned', `Field team dispatched to ${selected?.communityName}. Coordination tracking active.`);
    setScreen('response');
  }

  function handleExport() {
    if (!selected) return;
    setExporting(true);
    setTimeout(() => {
      try {
        const filename = downloadReport({
          kind: 'alert',
          alert: selected,
          ctx: {
            communities: communityStates,
            alerts,
            interventions,
            sensors: WATER_SENSORS,
            weather,
            author: 'Busia District Health Office',
          },
        });
        addToast('success', 'Evidence package downloaded', filename);
      } catch (e) {
        addToast('error', 'Export failed', e instanceof Error ? e.message : 'Could not build the PDF.');
      } finally {
        setExporting(false);
      }
    }, 30);
  }

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minWidth: 0 }}>
      {/* Alert list */}
      <aside style={{ width: 320, background: 'white', borderRight: `1px solid ${T.border}`, overflowY: 'auto', flexShrink: 0 }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.hair}` }}>
          <div style={{ fontFamily: T.heading, fontSize: 13, fontWeight: 700 }}>Active Alerts</div>
          <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>
            {alerts.filter(a => a.status === 'Active').length} requiring action
          </div>
        </div>
        {alerts.map(alert => (
          <div
            key={alert.id}
            onClick={() => setSelectedId(alert.id)}
            style={{
              padding: '14px 20px', borderBottom: `1px solid ${T.hair}`, cursor: 'pointer',
              background: selectedId === alert.id ? T.surface : 'white',
              borderLeft: `3px solid ${selectedId === alert.id ? riskColor(alert.riskLevel) : 'transparent'}`,
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', alignItems: 'start', columnGap: 10 }}>
              <div style={{ fontWeight: 700, fontSize: 13, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {alert.communityName}
              </div>
              <RiskBadge level={alert.riskLevel} />
            </div>
            <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>{alert.country}</div>
            <div style={{ fontSize: 11, color: T.ink, marginTop: 4, lineHeight: 1.45 }}>{alert.primaryDrivers[0]}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: STATUS_COLOR[alert.status] ?? T.muted }}>● {alert.status}</span>
              <span style={{ fontFamily: T.mono, fontSize: 10.5, color: T.muted }}>
                {alert.riskBefore} → <strong style={{ color: riskColor(alert.riskLevel) }}>{alert.riskCurrent}</strong>
              </span>
            </div>
          </div>
        ))}
      </aside>

      {/* Alert detail */}
      {selected && (
        <div style={{ flex: 1, overflowY: 'auto', minWidth: 0 }}>
          <div style={{ padding: `${T.pageY}px ${T.pageX}px`, display: 'flex', flexDirection: 'column', gap: T.gap }}>
            {/* Header */}
            <div style={{
              background: selected.riskLevel === 'CRITICAL' ? 'rgba(235,93,93,0.06)' : 'rgba(242,184,75,0.05)',
              border: `1px solid ${selected.riskLevel === 'CRITICAL' ? 'rgba(235,93,93,0.25)' : 'rgba(242,184,75,0.25)'}`,
              borderRadius: 10, padding: 24,
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', alignItems: 'start', columnGap: 24 }}>
                <div style={{ minWidth: 0 }}>
                  <RiskBadge level={selected.riskLevel} size="md" />
                  <h2 style={{ fontFamily: T.heading, fontSize: 22, fontWeight: 800, margin: '10px 0 3px', lineHeight: 1.2 }}>
                    {selected.communityName}
                  </h2>
                  <div style={{ fontSize: 13, color: T.muted }}>{selected.country} · Alert ID: {selected.id}</div>
                  <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>{new Date(selected.timestamp).toLocaleString()}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', color: T.muted }}>
                    Risk Score
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'flex-end', gap: 6, marginTop: 8 }}>
                    <span style={{ fontFamily: T.mono, fontSize: 14, color: T.muted }}>{selected.riskBefore}</span>
                    <span style={{ fontSize: 13, color: T.muted }}>→</span>
                    <span style={{ fontFamily: T.mono, fontSize: 42, fontWeight: 500, color: riskColor(selected.riskLevel), lineHeight: 1 }}>
                      {selected.riskCurrent}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: T.coral, fontWeight: 700, marginTop: 6 }}>
                    +{selected.riskCurrent - selected.riskBefore} pts in 7 days
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 18, flexWrap: 'wrap' }}>
                <button onClick={handleAssign} style={btn(T.coral, 'white')}>Assign Response →</button>
                <button onClick={() => setScreen('dispatch')} style={btn(T.gold, T.deep)}>
                  ▲ Send Early Warning
                </button>
                <button
                  onClick={handleExport}
                  disabled={exporting}
                  style={{ ...btn(T.teal, 'white'), opacity: exporting ? 0.65 : 1, cursor: exporting ? 'wait' : 'pointer' }}
                >
                  {exporting ? 'Building PDF…' : '↓ Export Evidence PDF'}
                </button>
                <button onClick={() => setScreen('map')} style={btn('transparent', T.teal, `1.5px solid ${T.teal}`)}>
                  View on Map
                </button>
              </div>
            </div>

            <Grid cols={2}>
              <Card title="Why Did the System Flag This Area?" subtitle="Contributing factors to current risk score">
                {Object.entries(selected.components).map(([key, val]) => {
                  const v = val as number;
                  return (
                    <MeterRow
                      key={key}
                      label={COMPONENT_LABELS[key] ?? key}
                      value={v}
                      color={riskColor(v >= 75 ? 'CRITICAL' : v >= 55 ? 'HIGH' : v >= 35 ? 'MODERATE' : 'LOW')}
                    />
                  );
                })}
              </Card>

              <Card title="Primary Risk Drivers">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {selected.primaryDrivers.map((d, i) => (
                    <div key={i} style={{
                      display: 'grid', gridTemplateColumns: '18px minmax(0,1fr)', alignItems: 'start', columnGap: 8,
                      padding: '9px 11px', background: T.surface, borderRadius: 6, border: `1px solid ${T.hair}`,
                    }}>
                      <span style={{ fontFamily: T.mono, color: T.coral, fontWeight: 800, fontSize: 12, lineHeight: 1.5 }}>{i + 1}</span>
                      <span style={{ fontSize: 12, color: T.ink, lineHeight: 1.5 }}>{d}</span>
                    </div>
                  ))}
                </div>

                <Divider />

                <div style={{
                  fontFamily: T.heading, fontSize: 10, fontWeight: 700, letterSpacing: '1px',
                  textTransform: 'uppercase', color: T.muted, marginBottom: 10,
                }}>
                  Recommended Actions
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {selected.recommendations.map((r, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '16px minmax(0,1fr)', columnGap: 8, fontSize: 12, color: T.ink, lineHeight: 1.5 }}>
                      <span style={{ color: T.teal, fontWeight: 700 }}>→</span>
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </Grid>

            <Card title={`Response Tracking — ${relatedInterventions.length} Actions`}>
              {relatedInterventions.length === 0 ? (
                <div style={{ fontSize: 12, color: T.muted }}>
                  No interventions assigned yet. Click &quot;Assign Response&quot; to begin.
                </div>
              ) : (
                <Table>
                  <thead>
                    <tr>
                      <Th>Action</Th>
                      <Th>Assigned To</Th>
                      <Th width={110}>Priority</Th>
                      <Th width={140}>Status</Th>
                      <Th align="right" width={110}>Due</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {relatedInterventions.map(i => (
                      <tr key={i.id}>
                        <Td>{i.action}</Td>
                        <Td muted>{i.assignedTo}</Td>
                        <Td>
                          <span style={{
                            display: 'inline-block', fontSize: 10, fontWeight: 700, padding: '3px 7px', borderRadius: 4,
                            background: i.priority === 'Critical' ? 'rgba(235,93,93,0.1)' : 'rgba(242,184,75,0.1)',
                            color: i.priority === 'Critical' ? T.coral : '#c47d00',
                          }}>
                            {i.priority}
                          </span>
                        </Td>
                        <Td>
                          <span style={{
                            fontSize: 11, fontWeight: 600,
                            color: i.status === 'Completed' ? T.green : i.status === 'In Progress' ? T.teal : T.muted,
                          }}>
                            ● {i.status}
                          </span>
                        </Td>
                        <Td align="right" mono muted style={{ fontSize: 11 }}>{i.due}</Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
