'use client';
import { useAppStore } from '@/lib/store';
import { T } from '@/components/ui';

const TITLES: Record<string, { title: string; sub: string }> = {
  landing:       { title: 'NTD GURD',                  sub: 'Environmental Health Intelligence · Detect. Prevent. Deliver.' },
  dashboard:     { title: 'Early Warning Dashboard',   sub: 'Busia District, Uganda · Model district · Sep 3, 2026' },
  map:           { title: 'Risk Map',                  sub: 'Live Google Map · Busia District · 18 communities' },
  alerts:        { title: 'Alert System',              sub: 'Active surveillance alerts' },
  water:         { title: 'Water Quality',             sub: 'Sensor network & quality indicators' },
  environmental: { title: 'Environmental Intelligence', sub: 'Rainfall, flooding & environmental conditions' },
  predictive:    { title: 'Predictive Intelligence',   sub: 'Prototype Risk Model — 7-day projection' },
  community:     { title: 'Community Reporting',       sub: 'Community Health Worker Interface' },
  response:      { title: 'Response Coordination',     sub: 'Intervention tracking & field assignment' },
  dispatch:      { title: 'Early Warning Dispatch',    sub: 'Multi-channel alert messaging to affected areas' },
  reports:       { title: 'Reports & Export',          sub: 'Generate and download PDF situation reports' },
  impact:        { title: 'Impact Dashboard',          sub: 'Demonstration metrics — simulated data' },
  architecture:  { title: 'System Architecture',       sub: 'Data sources & platform design' },
  privacy:       { title: 'Privacy & Security',        sub: 'Privacy by Design — data governance' },
  roadmap:       { title: 'Future Roadmap',            sub: 'Validation pathway & expansion plan' },
};

const control: React.CSSProperties = {
  height: 30,
  padding: '0 14px',
  borderRadius: 5,
  border: 'none',
  fontFamily: T.heading,
  fontSize: 11,
  fontWeight: 700,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  whiteSpace: 'nowrap',
};

export default function Topbar() {
  const { currentScreen, demoActive, activateDemoMode, advanceDemoStep, resetDemo, demoStep, demoEvents } = useAppStore();
  const info = TITLES[currentScreen] ?? TITLES['dashboard'];

  return (
    <header style={{
      background: 'white', borderBottom: `1px solid ${T.border}`,
      padding: '0 28px', height: 56, display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0,
    }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: T.heading, fontSize: 14.5, fontWeight: 700, color: T.ink, lineHeight: 1.25 }}>
          {info.title}
        </div>
        <div style={{ fontSize: 11, color: T.muted, marginTop: 2, lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {info.sub}
        </div>
      </div>

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        {demoActive ? (
          <>
            <div style={{ fontSize: 11, color: T.muted, whiteSpace: 'nowrap' }}>
              Step {demoStep}/{demoEvents.length}: <strong style={{ color: T.ink }}>{demoEvents[demoStep - 1]?.label}</strong>
            </div>
            {demoStep < demoEvents.length ? (
              <button onClick={advanceDemoStep} style={{ ...control, background: T.gold, color: T.deep, fontWeight: 800 }}>
                ▶ Next Step
              </button>
            ) : (
              <button onClick={advanceDemoStep} style={{ ...control, background: T.green, color: 'white', fontWeight: 800 }}>
                ✓ Finish Demo
              </button>
            )}
            <button onClick={resetDemo} style={{ ...control, background: 'transparent', border: `1.5px solid ${T.border}`, color: T.muted, fontWeight: 600 }}>
              Reset
            </button>
          </>
        ) : (
          <button
            onClick={activateDemoMode}
            style={{ ...control, background: T.deep, color: T.gold, border: '1.5px solid rgba(242,184,75,0.4)', letterSpacing: '0.3px' }}
          >
            ▶ Investor Demo Mode
          </button>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: T.teal, fontWeight: 600 }}>
          <div style={{ width: 7, height: 7, background: T.teal, borderRadius: '50%', animation: 'pulse 2s infinite' }} />
          LIVE
        </div>

        <div style={{
          display: 'inline-flex', alignItems: 'center', height: 20, padding: '0 8px',
          background: T.gold, color: T.deep, fontSize: 9, fontWeight: 800,
          borderRadius: 4, letterSpacing: '0.6px', textTransform: 'uppercase',
        }}>
          Demo Data
        </div>
      </div>
    </header>
  );
}
