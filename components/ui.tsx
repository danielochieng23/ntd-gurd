'use client';
import React from 'react';

/**
 * Shared layout primitives.
 * Every screen composes these so padding, card headers and numeric baselines
 * line up across the whole product.
 */

export const T = {
  deep: '#063B46',
  teal: '#087F8C',
  gold: '#F2B84B',
  coral: '#EB5D5D',
  green: '#4CAF50',
  ink: '#102A2E',
  muted: '#4a6670',
  border: '#d0e0e3',
  hair: '#f0f4f5',
  surface: '#f8fafb',
  heading: 'var(--font-heading), sans-serif',
  body: 'var(--font-body), sans-serif',
  mono: 'var(--font-data), monospace',
  // layout rhythm
  pageX: 28,
  pageY: 24,
  gap: 16,
  cardPad: 20,
  headerH: 38,     // reserved header height so card bodies start on one line
  statLabelH: 26,  // reserved label height so stat values share a baseline
  axisW: 34,       // shared chart Y-axis width so plot areas align
};

export function Page({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ flex: 1, overflowY: 'auto', minWidth: 0 }}>
      <div style={{ padding: `${T.pageY}px ${T.pageX}px`, display: 'flex', flexDirection: 'column', gap: T.gap }}>
        {children}
      </div>
    </div>
  );
}

export function Notice({ tone = 'gold', children }: { tone?: 'gold' | 'deep'; children: React.ReactNode }) {
  const s = tone === 'gold'
    ? { bg: 'rgba(242,184,75,0.10)', bd: 'rgba(242,184,75,0.30)', fg: '#8a5c00' }
    : { bg: 'rgba(6,59,70,0.06)', bd: 'rgba(6,59,70,0.14)', fg: T.deep };
  return (
    <div style={{
      background: s.bg, border: `1px solid ${s.bd}`, borderRadius: 6,
      padding: '10px 14px', fontSize: 11, color: s.fg, fontFamily: T.mono, lineHeight: 1.5,
    }}>
      {children}
    </div>
  );
}

export function Grid({
  cols,
  gap = T.gap,
  children,
}: {
  cols: number | string;
  gap?: number;
  children: React.ReactNode;
}) {
  const templateColumns = typeof cols === 'number' ? `repeat(${cols}, minmax(0, 1fr))` : cols;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: templateColumns, gap, alignItems: 'stretch' }}>
      {children}
    </div>
  );
}

export function Card({
  title,
  subtitle,
  right,
  children,
  pad = T.cardPad,
  tone = 'light',
  style,
}: {
  title?: string;
  subtitle?: string;
  right?: React.ReactNode;
  children?: React.ReactNode;
  pad?: number;
  tone?: 'light' | 'deep';
  style?: React.CSSProperties;
}) {
  const dark = tone === 'deep';
  return (
    <section
      style={{
        background: dark ? T.deep : 'white',
        border: dark ? '1px solid transparent' : `1px solid ${T.border}`,
        borderRadius: 8,
        padding: pad,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minWidth: 0,
        color: dark ? 'white' : T.ink,
        ...style,
      }}
    >
      {(title || right) && (
        <header
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 12,
            minHeight: T.headerH,
            marginBottom: 14,
          }}
        >
          <div style={{ minWidth: 0 }}>
            {title && (
              <h3 style={{
                fontFamily: T.heading, fontSize: 12, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.5px',
                color: dark ? 'white' : T.ink, lineHeight: 1.35, margin: 0,
              }}>
                {title}
              </h3>
            )}
            {subtitle && (
              <p style={{
                fontSize: 11, color: dark ? 'rgba(255,255,255,0.6)' : T.muted,
                marginTop: 3, lineHeight: 1.4, margin: '3px 0 0',
              }}>
                {subtitle}
              </p>
            )}
          </div>
          {right && <div style={{ flexShrink: 0 }}>{right}</div>}
        </header>
      )}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>{children}</div>
    </section>
  );
}

/** KPI tile — label, value and footnote share a baseline across the whole row. */
export function StatCard({
  label,
  value,
  sub,
  color,
  tone = 'light',
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  color?: string;
  tone?: 'light' | 'deep';
}) {
  const dark = tone === 'deep';
  return (
    <div
      style={{
        background: dark ? T.deep : 'white',
        border: dark ? '1px solid transparent' : `1px solid ${T.border}`,
        borderRadius: 8,
        padding: '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        height: '100%',
      }}
    >
      <div style={{
        fontSize: 10, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase',
        color: dark ? 'rgba(255,255,255,0.6)' : T.muted,
        minHeight: T.statLabelH, lineHeight: 1.3,
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: T.mono, fontSize: 32, fontWeight: 500, lineHeight: 1,
        color: dark ? T.gold : (color ?? T.ink), marginTop: 6,
      }}>
        {value}
      </div>
      <div style={{
        fontSize: 11, lineHeight: 1.4, marginTop: 'auto', paddingTop: 10,
        color: dark ? 'rgba(255,255,255,0.55)' : T.muted,
      }}>
        {sub ?? '\u00A0'}
      </div>
    </div>
  );
}

export function SectionLabel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      fontFamily: T.heading, fontSize: 10, fontWeight: 700, letterSpacing: '1px',
      textTransform: 'uppercase', color: T.muted, marginBottom: 10, ...style,
    }}>
      {children}
    </div>
  );
}

/** Label left, value right, progress bar beneath — used by every "why" breakdown. */
export function MeterRow({
  label,
  value,
  note,
  color,
  suffix,
}: {
  label: string;
  value: number;
  note?: string;
  color: string;
  suffix?: string;
}) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, marginBottom: 4 }}>
        <span style={{ fontSize: 11.5, color: T.ink, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {label}
        </span>
        <span style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexShrink: 0 }}>
          {note && <span style={{ fontSize: 10, color: T.muted }}>{note}</span>}
          <span style={{ fontFamily: T.mono, fontSize: 12, fontWeight: 600, color, minWidth: 26, textAlign: 'right' }}>
            {value}{suffix}
          </span>
        </span>
      </div>
      <div style={{ height: 6, background: '#e8f0f1', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.min(100, Math.max(0, value))}%`, background: color, borderRadius: 3, transition: 'width .4s' }} />
      </div>
    </div>
  );
}

/** Small readout tile used in the map panel and sensor grids. */
export function ReadoutTile({
  label,
  value,
  unit,
  color = T.ink,
  note,
  flag,
  emphasis,
}: {
  label: string;
  value: React.ReactNode;
  unit?: string;
  color?: string;
  note?: string;
  flag?: string;
  emphasis?: boolean;
}) {
  return (
    <div style={{
      background: emphasis ? 'rgba(235,93,93,0.04)' : T.surface,
      border: `1px solid ${emphasis ? 'rgba(235,93,93,0.22)' : '#e8f0f1'}`,
      borderRadius: 7,
      padding: '10px 12px',
      display: 'flex',
      flexDirection: 'column',
      minWidth: 0,
      height: '100%',
    }}>
      <div style={{
        fontSize: 9, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.5px',
        minHeight: 22, lineHeight: 1.25,
      }}>
        {label}
      </div>
      <div style={{ fontFamily: T.mono, fontSize: 17, fontWeight: 500, color, lineHeight: 1.1 }}>
        {value}{unit && <span style={{ fontSize: 9, marginLeft: 2 }}>{unit}</span>}
      </div>
      <div style={{ marginTop: 'auto', paddingTop: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, minHeight: 16 }}>
        <span style={{ fontSize: 9, color: T.muted }}>{note ?? '\u00A0'}</span>
        {flag && <span style={{ fontSize: 9, fontWeight: 800, color }}>{flag}</span>}
      </div>
    </div>
  );
}

export function Divider({ space = 14 }: { space?: number }) {
  return <div style={{ height: 1, background: T.hair, margin: `${space}px 0` }} />;
}

/* ── Table primitives: text left, numbers right, one padding scale ────────── */

export function Table({ children }: { children: React.ReactNode }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'auto' }}>{children}</table>
  );
}

export function Th({
  children,
  align = 'left',
  width,
}: {
  children: React.ReactNode;
  align?: 'left' | 'right' | 'center';
  width?: number | string;
}) {
  return (
    <th style={{
      fontFamily: T.heading, fontSize: 9, fontWeight: 700, letterSpacing: '0.8px',
      textTransform: 'uppercase', color: T.muted, padding: '8px 12px',
      borderBottom: `1px solid ${T.hair}`, textAlign: align, width, whiteSpace: 'nowrap',
    }}>
      {children}
    </th>
  );
}

export function Td({
  children,
  align = 'left',
  mono,
  muted,
  style,
}: {
  children: React.ReactNode;
  align?: 'left' | 'right' | 'center';
  mono?: boolean;
  muted?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <td style={{
      padding: '10px 12px', fontSize: 12, textAlign: align, verticalAlign: 'middle',
      borderBottom: '1px solid #f8fafb',
      fontFamily: mono ? T.mono : undefined,
      color: muted ? T.muted : T.ink,
      ...style,
    }}>
      {children}
    </td>
  );
}
