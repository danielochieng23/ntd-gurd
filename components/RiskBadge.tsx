import { RiskLevel } from '@/lib/data';

const STYLES: Record<RiskLevel, { bg: string; color: string }> = {
  CRITICAL: { bg: 'rgba(235,93,93,0.12)',  color: '#EB5D5D' },
  HIGH:     { bg: 'rgba(242,184,75,0.15)', color: '#c47d00' },
  MODERATE: { bg: 'rgba(8,127,140,0.12)',  color: '#087F8C' },
  LOW:      { bg: 'rgba(76,175,80,0.12)',  color: '#2e7d32' },
};

const FALLBACK = { bg: '#f0f4f5', color: '#4a6670' };

function styleFor(level: RiskLevel | string) {
  return STYLES[level as RiskLevel] ?? FALLBACK;
}

export function riskColor(level: RiskLevel | string) {
  return styleFor(level).color;
}

export default function RiskBadge({ level, size = 'sm' }: { level: RiskLevel | string; size?: 'sm' | 'md' }) {
  const s = styleFor(level);
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      background: s.bg, color: s.color,
      fontFamily: 'var(--font-heading), sans-serif',
      fontSize: size === 'md' ? 11 : 9.5,
      fontWeight: 700, padding: size === 'md' ? '4px 10px' : '2px 7px',
      borderRadius: 4, letterSpacing: '0.8px', textTransform: 'uppercase',
    }}>
      {level}
    </span>
  );
}

export function RiskBar({ value, color }: { value: number; color?: string }) {
  const fill = color ?? (value >= 75 ? '#EB5D5D' : value >= 55 ? '#F2B84B' : value >= 35 ? '#087F8C' : '#4CAF50');
  return (
    <div style={{ height: 5, background: '#e8f0f1', borderRadius: 3, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${value}%`, background: fill, borderRadius: 3, transition: 'width 0.5s' }} />
    </div>
  );
}
