'use client';
import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { WATER_SENSORS, MODEL_DISTRICT } from '@/lib/data';
import { useWeather } from '@/lib/useWeather';
import { downloadReport, previewReport, ReportKind } from '@/lib/pdf';
import { Page, Grid, Card, Notice, SectionLabel, T } from '@/components/ui';

interface ReportDef {
  kind: ReportKind;
  label: string;
  desc: string;
  contents: string[];
  needsAlert?: boolean;
}

const REPORTS: ReportDef[] = [
  {
    kind: 'situation',
    label: 'District Situation Report',
    desc: 'Full picture of the district for a daily or weekly briefing.',
    contents: ['Executive summary', 'Live weather & flood', 'All communities ranked by risk', 'Active alerts', 'Water points', 'Response actions', 'Model weights'],
  },
  {
    kind: 'alert',
    label: 'Alert Evidence Package',
    desc: 'Everything behind a single alert, for escalation to the district health team.',
    contents: ['Risk banner & trajectory', 'Component breakdown', 'Primary drivers', 'Recommended actions', 'Community profile', 'Live weather', 'Response tracking'],
    needsAlert: true,
  },
  {
    kind: 'water',
    label: 'Water Quality Report',
    desc: 'Sensor network status and the thresholds applied to each parameter.',
    contents: ['Network status', 'Points needing attention', 'Latest readings', 'Threshold reference', 'Live weather'],
  },
  {
    kind: 'response',
    label: 'Response Coordination Report',
    desc: 'Delivery performance against each open alert.',
    contents: ['Delivery summary', 'Completion rate', 'Actions grouped by alert'],
  },
];

const AUTHORS = [
  'Busia District Health Office',
  'District Surveillance Focal Person',
  'NTD GURD Early Warning Console',
  'WASH Coordination Team',
];

export default function ReportsScreen() {
  const { communityStates, alerts, interventions, addToast } = useAppStore();
  const { data: weather, status: weatherStatus } = useWeather(MODEL_DISTRICT.center.lat, MODEL_DISTRICT.center.lng);

  const [kind, setKind] = useState<ReportKind>('situation');
  const [alertId, setAlertId] = useState(alerts[0]?.id ?? '');
  const [author, setAuthor] = useState(AUTHORS[0]);
  const [includeWeather, setIncludeWeather] = useState(true);
  const [preview, setPreview] = useState<{ url: string; filename: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const urlRef = useRef<string | null>(null);

  // Blob URLs leak unless revoked when replaced or unmounted
  useEffect(() => () => { if (urlRef.current) URL.revokeObjectURL(urlRef.current); }, []);

  const def = REPORTS.find(r => r.kind === kind)!;
  const selectedAlert = alerts.find(a => a.id === alertId);

  function context() {
    return {
      communities: communityStates,
      alerts,
      interventions,
      sensors: WATER_SENSORS,
      weather: includeWeather ? weather : null,
      author,
    };
  }

  function run(action: 'preview' | 'download') {
    setError('');
    setBusy(true);
    // Let the button paint its busy state before jsPDF blocks the thread
    setTimeout(() => {
      try {
        const opts = { kind, ctx: context(), alert: selectedAlert };
        if (action === 'download') {
          const filename = downloadReport(opts);
          addToast('success', 'Report downloaded', filename);
        } else {
          // Build first — revoking up front would leave the iframe pointed at a
          // dead URL if generation then threw.
          const out = previewReport(opts);
          const stale = urlRef.current;
          urlRef.current = out.url;
          setPreview(out);
          if (stale) URL.revokeObjectURL(stale);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Report generation failed.');
      } finally {
        setBusy(false);
      }
    }, 30);
  }

  const btn = (bg: string, fg: string, border = 'none'): React.CSSProperties => ({
    height: 38, padding: '0 18px', background: bg, color: fg, border, borderRadius: 6,
    fontFamily: T.heading, fontSize: 12.5, fontWeight: 700,
    cursor: busy ? 'wait' : 'pointer', opacity: busy ? 0.65 : 1,
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  });

  return (
    <Page>
      <Notice>
        Reports are generated in your browser and never leave this device. Community, water-quality and symptom
        figures are synthetic; weather and flood figures are live observations from Open-Meteo.
      </Notice>

      <Grid cols="minmax(0,360px) minmax(0,1fr)">
        {/* Builder */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: T.gap, minWidth: 0 }}>
          <Card title="Report type">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {REPORTS.map(r => {
                const active = r.kind === kind;
                return (
                  <button
                    key={r.kind}
                    onClick={() => setKind(r.kind)}
                    style={{
                      textAlign: 'left', cursor: 'pointer', padding: '11px 13px', borderRadius: 7,
                      background: active ? 'rgba(8,127,140,0.06)' : T.surface,
                      border: `1.5px solid ${active ? T.teal : T.hair}`,
                    }}
                  >
                    <div style={{ fontFamily: T.heading, fontSize: 12.5, fontWeight: 700, color: active ? T.teal : T.ink }}>
                      {r.label}
                    </div>
                    <div style={{ fontSize: 11, color: T.muted, marginTop: 3, lineHeight: 1.45, fontFamily: T.body }}>
                      {r.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          <Card title="Options">
            {def.needsAlert && (
              <div style={{ marginBottom: 14 }}>
                <SectionLabel style={{ marginBottom: 6 }}>Alert</SectionLabel>
                <select
                  value={alertId}
                  onChange={e => setAlertId(e.target.value)}
                  style={{ width: '100%', height: 36, padding: '0 10px', border: `1.5px solid ${T.border}`, borderRadius: 5, fontSize: 13, background: 'white' }}
                >
                  {alerts.map(a => (
                    <option key={a.id} value={a.id}>{a.id} — {a.communityName} ({a.riskLevel})</option>
                  ))}
                </select>
              </div>
            )}

            <div style={{ marginBottom: 14 }}>
              <SectionLabel style={{ marginBottom: 6 }}>Prepared by</SectionLabel>
              <select
                value={author}
                onChange={e => setAuthor(e.target.value)}
                style={{ width: '100%', height: 36, padding: '0 10px', border: `1.5px solid ${T.border}`, borderRadius: 5, fontSize: 13, background: 'white' }}
              >
                {AUTHORS.map(a => <option key={a}>{a}</option>)}
              </select>
            </div>

            <label style={{ display: 'grid', gridTemplateColumns: '18px minmax(0,1fr)', columnGap: 10, alignItems: 'start', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={includeWeather}
                onChange={e => setIncludeWeather(e.target.checked)}
                style={{ width: 18, height: 18, margin: 0, marginTop: 1, accentColor: T.teal }}
              />
              <span>
                <span style={{ fontSize: 12.5, color: T.ink }}>Include live weather section</span>
                <span style={{ display: 'block', fontSize: 11, color: T.muted, marginTop: 2, lineHeight: 1.45 }}>
                  {weatherStatus === 'ready' && weather
                    ? `Ready — ${weather.rain7d} mm over the last 7 days, anomaly ${weather.rainfallAnomaly > 0 ? '+' : ''}${weather.rainfallAnomaly}%`
                    : weatherStatus === 'loading' ? 'Fetching from Open-Meteo…' : 'Open-Meteo unavailable — section will be skipped'}
                </span>
              </span>
            </label>

            <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
              <button disabled={busy} onClick={() => run('download')} style={{ ...btn(T.teal, 'white'), flex: 1 }}>
                {busy ? 'Generating…' : '↓ Download PDF'}
              </button>
              <button disabled={busy} onClick={() => run('preview')} style={btn('transparent', T.teal, `1.5px solid ${T.teal}`)}>
                Preview
              </button>
            </div>

            {error && (
              <div style={{ marginTop: 12, fontSize: 11.5, color: T.coral, lineHeight: 1.5 }}>{error}</div>
            )}
          </Card>

          <Card title="Sections included">
            {def.contents.map((c, i, arr) => (
              <div key={c} style={{
                display: 'grid', gridTemplateColumns: '14px minmax(0,1fr)', columnGap: 8,
                fontSize: 11.5, color: T.ink, padding: '6px 0',
                borderBottom: i < arr.length - 1 ? '1px solid #f8fafb' : 'none',
              }}>
                <span style={{ color: T.teal }}>✓</span>
                <span>{c}</span>
              </div>
            ))}
          </Card>
        </div>

        {/* Preview */}
        <Card
          title="Preview"
          subtitle={preview ? preview.filename : 'Generate a preview to see the document here'}
          right={preview && (
            <button
              onClick={() => run('download')}
              style={{ height: 30, padding: '0 14px', background: T.teal, color: 'white', border: 'none', borderRadius: 5, fontFamily: T.heading, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
            >
              ↓ Download
            </button>
          )}
        >
          {preview ? (
            <iframe
              src={preview.url}
              title="Report preview"
              style={{ width: '100%', height: 620, border: `1px solid ${T.border}`, borderRadius: 6, background: T.surface }}
            />
          ) : (
            <div style={{
              height: 620, border: `1px dashed ${T.border}`, borderRadius: 6, background: T.surface,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, textAlign: 'center', padding: 24,
            }}>
              <div style={{ fontSize: 32, color: T.border }}>▤</div>
              <div style={{ fontFamily: T.heading, fontSize: 13, fontWeight: 700, color: T.ink }}>{def.label}</div>
              <div style={{ fontSize: 12, color: T.muted, maxWidth: 380, lineHeight: 1.55 }}>
                {def.desc} Choose your options on the left, then preview here or download the PDF directly.
              </div>
            </div>
          )}
        </Card>
      </Grid>
    </Page>
  );
}
