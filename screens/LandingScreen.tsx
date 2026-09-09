'use client';
import { useAppStore } from '@/lib/store';
import Logo from '@/components/Logo';
import { T } from '@/components/ui';
import { asset } from '@/lib/asset';

const PAGE_X = 64;

const sectionLabel: React.CSSProperties = {
  fontFamily: T.heading, fontSize: 10, fontWeight: 700, letterSpacing: '1.5px',
  textTransform: 'uppercase', opacity: 0.4,
};

const panel: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', height: '100%', minWidth: 0,
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 8, padding: '18px 20px',
};

const heroBtn: React.CSSProperties = {
  height: 46, padding: '0 26px', borderRadius: 6, cursor: 'pointer',
  fontFamily: T.heading, fontSize: 14, fontWeight: 700,
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
};

export default function LandingScreen() {
  const { setScreen, activateDemoMode } = useAppStore();

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: T.deep, color: 'white' }}>
      {/* Hero */}
      <section style={{ position: 'relative', overflow: 'hidden' }}>
        {/* Lake Victoria backdrop — dissolves into the deep-lake background */}
        <div
          aria-hidden
          style={{
            position: 'absolute', top: 0, right: 0, bottom: 0, width: '52%',
            pointerEvents: 'none', userSelect: 'none',
          }}
        >
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url(${asset('/lake-victoria.png')})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center center',
            opacity: 0.92,
            maskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.3) 22%, rgba(0,0,0,0.8) 55%, #000 100%)',
            WebkitMaskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.3) 22%, rgba(0,0,0,0.8) 55%, #000 100%)',
          }} />
          {/* teal wash only on the text side — the gold sun path stays untouched */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to right, #063B46 0%, rgba(6,59,70,0.62) 28%, rgba(6,59,70,0.14) 62%, transparent 100%)',
          }} />
          {/* soften the seam into the section below */}
          <div style={{
            position: 'absolute', left: 0, right: 0, bottom: 0, height: 160,
            background: 'linear-gradient(to bottom, transparent, #063B46)',
          }} />
        </div>

        <div style={{ position: 'relative', zIndex: 1, padding: `56px ${PAGE_X}px 48px`, maxWidth: 920 }}>
          <div style={{ marginBottom: 36 }}>
            <Logo size={72} variant="hero" inverted />
          </div>
          <h1 style={{ fontFamily: T.heading, fontSize: 48, fontWeight: 800, lineHeight: 1.1, letterSpacing: '-1px', margin: '0 0 22px' }}>
            Detect risk before<br />
            <span style={{ color: T.gold }}>disease becomes</span><br />
            an outbreak.
          </h1>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.68)', lineHeight: 1.65, maxWidth: 580, margin: '0 0 20px' }}>
            NTD GURD combines environmental, water-quality and community health signals to help public-health teams
            identify emerging disease risk and act earlier.
          </p>

          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10, height: 34, padding: '0 12px',
            background: 'rgba(242,184,75,0.12)', border: '1px solid rgba(242,184,75,0.35)',
            borderRadius: 6, marginBottom: 28,
          }}>
            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '1px', color: T.gold, textTransform: 'uppercase' }}>
              Model District
            </span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Busia, Uganda · Lake Victoria shoreline</span>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button onClick={() => setScreen('dashboard')} style={{ ...heroBtn, background: T.teal, color: 'white', border: 'none' }}>
              Explore Early Warning System →
            </button>
            <button
              onClick={() => { setScreen('dashboard'); activateDemoMode(); }}
              style={{ ...heroBtn, background: 'transparent', color: T.gold, border: '1.5px solid rgba(242,184,75,0.5)' }}
            >
              ▶ Run Outbreak Simulation
            </button>
          </div>

          <div style={{ marginTop: 16, fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: T.mono }}>
            PROTOTYPE · DEMONSTRATION DATA · Not for clinical or public-health decision making
          </div>
        </div>
      </section>

      {/* Three core questions */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 20, padding: `0 ${PAGE_X}px 44px`, alignItems: 'stretch' }}>
        {[
          { q: 'WHERE?', desc: 'Which communities are experiencing rising disease risk right now?', icon: '⊕', color: T.gold },
          { q: 'WHY?', desc: 'What environmental and community signals are driving the risk increase?', icon: '⧖', color: T.teal },
          { q: 'WHAT?', desc: 'What specific interventions should be deployed, and where?', icon: '⊸', color: T.coral },
        ].map(p => (
          <div key={p.q} style={{
            display: 'flex', flexDirection: 'column', height: '100%', minWidth: 0,
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)',
            borderRadius: 10, padding: 28,
          }}>
            <div style={{ fontSize: 26, lineHeight: 1, color: p.color, height: 30 }}>{p.icon}</div>
            <div style={{ fontFamily: T.heading, fontSize: 20, fontWeight: 800, color: p.color, marginTop: 10 }}>{p.q}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, marginTop: 8 }}>{p.desc}</div>
          </div>
        ))}
      </section>

      {/* How it works */}
      <section style={{ background: 'rgba(0,0,0,0.15)', borderTop: '1px solid rgba(255,255,255,0.07)', padding: `36px ${PAGE_X}px` }}>
        <div style={{ ...sectionLabel, marginBottom: 20 }}>How It Works</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 20, alignItems: 'stretch' }}>
          {[
            { step: '01', label: 'Sense', desc: 'Collect water quality, weather, environmental and community health data.', icon: '◎' },
            { step: '02', label: 'Predict', desc: 'Weighted risk engine combines signals into a transparent, explainable risk score.', icon: '⧖' },
            { step: '03', label: 'Alert', desc: 'Early warnings generated with RISK → EXPLANATION → ACTION.', icon: '⚑' },
            { step: '04', label: 'Act', desc: 'Response coordination ensures prediction leads to preventive action.', icon: '⊸' },
          ].map(s => (
            <div key={s.step} style={panel}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                fontSize: 10, fontWeight: 800, color: T.gold, letterSpacing: '1px',
              }}>
                <span>STEP {s.step}</span>
                <span style={{ fontSize: 15, opacity: 0.9 }}>{s.icon}</span>
              </div>
              <div style={{ fontFamily: T.heading, fontWeight: 700, fontSize: 14, marginTop: 10 }}>{s.label}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.55, marginTop: 6 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Platform features */}
      <section style={{ padding: `36px ${PAGE_X}px`, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 16, alignItems: 'stretch' }}>
        {[
          { title: 'Predictive, not reactive', desc: 'Risk signals detected before conventional surveillance recognises a growing threat.', icon: '⧖' },
          { title: 'Explainable risk', desc: 'Every alert shows WHY: contributing factors, weights and causal chain.', icon: '◉' },
          { title: 'Environmental intelligence', desc: 'Rainfall, flooding, water quality and sanitation signals combined.', icon: '⟁' },
          { title: 'Community signals', desc: 'Community health worker reports integrated in real time.', icon: '⊶' },
          { title: 'From prediction to action', desc: 'Response coordination built-in. Surveillance leads directly to intervention.', icon: '⊸' },
          { title: 'Resource-constrained design', desc: 'Low-cost sensors, intermittent connectivity, offline-first CHW interface.', icon: '⊞' },
        ].map(f => (
          <div key={f.title} style={panel}>
            <div style={{ fontSize: 18, lineHeight: 1, color: T.teal, height: 22 }}>{f.icon}</div>
            <div style={{ fontFamily: T.heading, fontWeight: 700, fontSize: 13, marginTop: 8, minHeight: 34, lineHeight: 1.35 }}>{f.title}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.55 }}>{f.desc}</div>
          </div>
        ))}
      </section>

      {/* Initial disease focus */}
      <section style={{ padding: `28px ${PAGE_X}px 56px`, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ ...sectionLabel, marginBottom: 16 }}>Initial Beachhead</div>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, margin: '0 0 16px', maxWidth: 760 }}>
          Cholera and acute diarrheal disease early warning in flood-prone communities of{' '}
          <strong style={{ color: T.gold }}>Busia District, Uganda</strong> — a Lake Victoria shoreline district on the Kenya border.
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {['Cholera', 'Acute Diarrheal Disease', 'Typhoid (Phase 2)', 'Schistosomiasis (Phase 2)', 'Trachoma (Phase 2)', 'Soil-transmitted helminths (Phase 2)'].map(d => (
            <span key={d} style={{
              display: 'inline-flex', alignItems: 'center', height: 28, padding: '0 12px',
              background: 'rgba(8,127,140,0.15)', border: '1px solid rgba(8,127,140,0.3)',
              borderRadius: 4, fontSize: 12, color: 'rgba(255,255,255,0.7)',
            }}>
              {d}
            </span>
          ))}
        </div>
        <div style={{ marginTop: 18, fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: T.mono, lineHeight: 1.6, maxWidth: 760 }}>
          NTD GURD does not diagnose individuals. The platform predicts where disease risk is increasing and where
          preventive resources should be deployed.
        </div>
      </section>
    </div>
  );
}
