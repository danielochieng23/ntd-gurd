'use client';
import { useAppStore } from '@/lib/store';
import Logo from '@/components/Logo';

const NAV = [
  { id: 'landing',        label: 'Overview',               icon: '◈', section: 'Platform' },
  { id: 'dashboard',      label: 'Early Warning Dashboard', icon: '⬡', section: 'Platform' },
  { id: 'map',            label: 'Risk Map',                icon: '⊕', section: 'Platform' },
  { id: 'alerts',         label: 'Alerts',                  icon: '⚑', section: 'Surveillance', badge: true },
  { id: 'water',          label: 'Water Quality',           icon: '◎', section: 'Intelligence' },
  { id: 'environmental',  label: 'Environmental',           icon: '⟁', section: 'Intelligence' },
  { id: 'predictive',     label: 'Predictive Intelligence', icon: '⧖', section: 'Intelligence' },
  { id: 'community',      label: 'Community Reports',       icon: '⊶', section: 'Field' },
  { id: 'response',       label: 'Response Coordination',   icon: '⊸', section: 'Field' },
  { id: 'dispatch',       label: 'Early Warning Dispatch',  icon: '▲', section: 'Field' },
  { id: 'reports',        label: 'Reports & Export',        icon: '▤', section: 'Analytics' },
  { id: 'impact',         label: 'Impact Dashboard',        icon: '◉', section: 'Analytics' },
  { id: 'architecture',   label: 'System Architecture',     icon: '⊞', section: 'Platform Info' },
  { id: 'privacy',        label: 'Privacy & Security',      icon: '⊘', section: 'Platform Info' },
  { id: 'roadmap',        label: 'Future Roadmap',          icon: '⊳', section: 'Platform Info' },
];

// NAV is static, so the grouping is too — deriving it at module scope keeps the
// nav present on the very first render instead of appearing after an effect.
const GROUPED = [...new Set(NAV.map(n => n.section))].map(section => ({
  section,
  items: NAV.filter(n => n.section === section),
}));

export default function Sidebar() {
  const { currentScreen, setScreen, alerts } = useAppStore();
  const activeAlerts = alerts.filter(a => a.status === 'Active').length;

  const grouped = GROUPED;

  return (
    <aside style={{ width: 232, background: '#063B46', color: 'white', display: 'flex', flexDirection: 'column', flexShrink: 0, overflowY: 'auto', height: '100vh' }}>
      {/* Logo */}
      <div style={{ padding: '18px 16px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <Logo size={38} variant="lockup" inverted />
      </div>

      {/* Nav */}
      <nav style={{ padding: '12px 0', flex: 1 }}>
        {grouped.map(({ section, items }) => (
          <div key={section}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', opacity: 0.35, padding: '12px 20px 4px 23px' }}>
              {section}
            </div>
            {items.map(item => (
              <button
                key={item.id}
                onClick={() => setScreen(item.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                  height: 34, padding: '0 20px', fontSize: 12.5, fontWeight: 500, cursor: 'pointer',
                  background: currentScreen === item.id ? 'rgba(255,255,255,0.09)' : 'transparent',
                  border: 'none', borderLeft: `3px solid ${currentScreen === item.id ? '#F2B84B' : 'transparent'}`,
                  color: currentScreen === item.id ? 'white' : 'rgba(255,255,255,0.58)',
                  textAlign: 'left', transition: 'all 0.12s',
                }}
              >
                <span style={{ width: 16, flexShrink: 0, textAlign: 'center', opacity: 0.8, fontSize: 13 }}>{item.icon}</span>
                <span style={{ flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>
                {item.badge && activeAlerts > 0 && (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    minWidth: 17, height: 17, padding: '0 5px', flexShrink: 0,
                    background: '#EB5D5D', color: 'white', fontSize: 9, fontWeight: 800, borderRadius: 9,
                  }}>
                    {activeAlerts}
                  </span>
                )}
              </button>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ padding: '14px 20px', borderTop: '1px solid rgba(255,255,255,0.07)', fontSize: 10, opacity: 0.35 }}>
        <div>Demo v0.1 — Prototype</div>
        <div style={{ marginTop: 2 }}>Not for clinical use</div>
      </div>
    </aside>
  );
}
