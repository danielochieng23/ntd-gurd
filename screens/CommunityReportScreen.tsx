'use client';
import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { COMMUNITIES } from '@/lib/data';
import { Page, Grid, Card, SectionLabel, T } from '@/components/ui';

const INITIAL_FORM = {
  community: 'C002',
  date: '2026-09-03',
  reporterName: 'Sarah Nakato',
  reporterId: 'CHW-UG-4421',
  diarrhea: 0,
  vomiting: 0,
  fever: 0,
  suspectedCholera: 0,
  waterSourceProblem: false,
  brokenSanitation: false,
  flooding: false,
  deadAnimals: false,
  notes: '',
  waterSampleTaken: false,
};

const labelStyle: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, color: T.muted, textTransform: 'uppercase',
  letterSpacing: '0.6px', display: 'block', marginBottom: 6,
};
const fieldStyle: React.CSSProperties = {
  width: '100%', height: 38, padding: '0 10px', border: `1.5px solid ${T.border}`,
  borderRadius: 5, fontSize: 13, background: 'white', color: T.ink,
};

export default function CommunityReportScreen() {
  const { addToast } = useAppStore();
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitted, setSubmitted] = useState(false);
  const [syncing, setSyncing] = useState(false);

  function handleSubmit() {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      setSubmitted(true);
      addToast('success', 'Report Submitted', `CHW report from ${form.reporterName} received and integrated into risk engine.`);
    }, 1200);
  }

  if (submitted) {
    return (
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ maxWidth: 520, margin: '0 auto', padding: '48px 28px', textAlign: 'center' }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%', background: 'rgba(76,175,80,0.1)',
            border: `2px solid ${T.green}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, color: T.green, margin: '0 auto 20px',
          }}>
            ✓
          </div>
          <h2 style={{ fontFamily: T.heading, fontSize: 20, fontWeight: 800, margin: '0 0 10px' }}>Report Submitted</h2>
          <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.6, margin: '0 0 24px' }}>
            Your report has been received and integrated into the NTD GURD risk engine.
            The data will be processed within the next risk cycle.
          </p>

          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, textAlign: 'left', marginBottom: 24 }}>
            <SectionLabel style={{ fontSize: 11, letterSpacing: '0.5px', marginBottom: 12 }}>Report Summary</SectionLabel>
            {[
              { label: 'Reporter', val: `${form.reporterName} (${form.reporterId})` },
              { label: 'Community', val: COMMUNITIES.find(c => c.id === form.community)?.name },
              { label: 'Date', val: form.date },
              { label: 'Diarrhea cases', val: form.diarrhea },
              { label: 'Suspected cholera', val: form.suspectedCholera },
              { label: 'Water source problem', val: form.waterSourceProblem ? 'Yes' : 'No' },
              { label: 'Flooding reported', val: form.flooding ? 'Yes' : 'No' },
            ].map((r, i, arr) => (
              <div key={r.label} style={{
                display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', columnGap: 16,
                alignItems: 'baseline', padding: '7px 0', fontSize: 12,
                borderBottom: i < arr.length - 1 ? `1px solid ${T.hair}` : 'none',
              }}>
                <span style={{ color: T.muted }}>{r.label}</span>
                <span style={{ fontWeight: 600, textAlign: 'right' }}>{r.val}</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => { setForm({ ...INITIAL_FORM }); setSubmitted(false); }}
            style={{ height: 40, padding: '0 24px', background: T.teal, color: 'white', border: 'none', borderRadius: 6, fontFamily: T.heading, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
          >
            Submit Another Report
          </button>
        </div>
      </div>
    );
  }

  const signals = [
    { label: 'Diarrhea signal', val: Math.min(100, form.diarrhea * 3.5), color: T.coral },
    { label: 'Cholera signal', val: Math.min(100, form.suspectedCholera * 11), color: T.coral },
    { label: 'Env. observations', val: [form.waterSourceProblem, form.brokenSanitation, form.flooding, form.deadAnimals].filter(Boolean).length * 25, color: T.teal },
  ];

  return (
    <Page>
      <div style={{
        background: 'rgba(8,127,140,0.08)', border: '1px solid rgba(8,127,140,0.2)',
        borderRadius: 6, padding: '10px 14px', fontSize: 11.5, color: T.deep, lineHeight: 1.55,
      }}>
        <strong>Offline-first design:</strong> This form saves locally and syncs when connectivity is restored.
        Designed for use on low-cost smartphones with intermittent connectivity.
      </div>

      <div style={{ maxWidth: 760 }}>
        <Grid cols={2} gap={16}>
          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
            <Card title="Reporter Information">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Community Health Worker</label>
                  <input value={form.reporterName} onChange={e => setForm({ ...form, reporterName: e.target.value })} style={fieldStyle} />
                </div>
                <div>
                  <label style={labelStyle}>CHW ID</label>
                  <input value={form.reporterId} onChange={e => setForm({ ...form, reporterId: e.target.value })} style={{ ...fieldStyle, fontFamily: T.mono }} />
                </div>
                <div>
                  <label style={labelStyle}>Community</label>
                  <select value={form.community} onChange={e => setForm({ ...form, community: e.target.value })} style={fieldStyle}>
                    {COMMUNITIES.map(c => <option key={c.id} value={c.id}>{c.name} ({c.country})</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Report Date</label>
                  <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} style={fieldStyle} />
                </div>
              </div>
            </Card>

            <Card title="Health Symptoms Observed">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'Diarrhea (last 24h)', key: 'diarrhea' as const },
                  { label: 'Vomiting', key: 'vomiting' as const },
                  { label: 'Fever', key: 'fever' as const },
                  { label: 'Suspected Cholera', key: 'suspectedCholera' as const },
                ].map(field => (
                  <div key={field.key} style={{
                    display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto',
                    alignItems: 'center', columnGap: 12,
                  }}>
                    <label style={{ fontSize: 13, color: T.ink }}>{field.label}</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button
                        onClick={() => setForm(f => ({ ...f, [field.key]: Math.max(0, f[field.key] - 1) }))}
                        style={{ width: 30, height: 30, border: `1.5px solid ${T.border}`, borderRadius: 4, background: 'white', cursor: 'pointer', fontSize: 15, color: T.muted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={form[field.key]}
                        onChange={e => setForm(f => ({ ...f, [field.key]: parseInt(e.target.value) || 0 }))}
                        style={{ width: 58, height: 30, textAlign: 'center', padding: 0, border: `1.5px solid ${T.border}`, borderRadius: 4, fontSize: 14, fontFamily: T.mono, fontWeight: 600 }}
                      />
                      <button
                        onClick={() => setForm(f => ({ ...f, [field.key]: f[field.key] + 1 }))}
                        style={{ width: 30, height: 30, border: `1.5px solid ${T.teal}`, borderRadius: 4, background: 'rgba(8,127,140,0.08)', cursor: 'pointer', fontSize: 15, color: T.teal, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
            <Card title="Environmental Observations">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'Water source problem observed', key: 'waterSourceProblem' as const },
                  { label: 'Broken sanitation facility', key: 'brokenSanitation' as const },
                  { label: 'Flooding in area', key: 'flooding' as const },
                  { label: 'Dead animals / fish observed', key: 'deadAnimals' as const },
                  { label: 'Water sample taken', key: 'waterSampleTaken' as const },
                ].map(field => (
                  <label key={field.key} style={{
                    display: 'grid', gridTemplateColumns: '18px minmax(0,1fr)',
                    alignItems: 'center', columnGap: 10, cursor: 'pointer', minHeight: 22,
                  }}>
                    <input
                      type="checkbox"
                      checked={form[field.key]}
                      onChange={e => setForm(f => ({ ...f, [field.key]: e.target.checked }))}
                      style={{ width: 18, height: 18, margin: 0, accentColor: T.teal }}
                    />
                    <span style={{ fontSize: 13, color: T.ink }}>{field.label}</span>
                  </label>
                ))}
              </div>
            </Card>

            <Card title="Additional Observations">
              <textarea
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                placeholder="Describe any additional observations, including water source conditions, community concerns, or specific locations affected..."
                style={{
                  width: '100%', padding: '10px 12px', border: `1.5px solid ${T.border}`, borderRadius: 6,
                  fontSize: 13, fontFamily: T.body, minHeight: 104, resize: 'vertical', color: T.ink,
                }}
              />
            </Card>

            <Card title="Signal Strength Preview" style={{ background: T.surface }}>
              {signals.map(s => (
                <div key={s.label} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4, fontSize: 11 }}>
                    <span style={{ color: T.muted }}>{s.label}</span>
                    <span style={{ fontFamily: T.mono, fontWeight: 600, color: s.val > 50 ? T.coral : T.ink }}>{Math.round(s.val)}</span>
                  </div>
                  <div style={{ height: 6, background: '#e8f0f1', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${s.val}%`, background: s.val > 50 ? T.coral : s.color, borderRadius: 3, transition: 'width .3s' }} />
                  </div>
                </div>
              ))}
            </Card>

            <button
              onClick={handleSubmit}
              disabled={syncing}
              style={{
                height: 46, background: syncing ? T.muted : T.teal, color: 'white', border: 'none', borderRadius: 8,
                fontFamily: T.heading, fontSize: 14, fontWeight: 700, cursor: syncing ? 'wait' : 'pointer', transition: 'background 0.2s',
              }}
            >
              {syncing ? '⟳ Syncing…' : 'Submit Report →'}
            </button>
          </div>
        </Grid>
      </div>
    </Page>
  );
}
