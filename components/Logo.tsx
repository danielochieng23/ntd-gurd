'use client';

/**
 * NTD GURD brand mark
 * Gold pulse/ECG line + three teal water waves, matching the brand board.
 */
export default function Logo({
  size = 36,
  variant = 'icon',
  inverted = false,
}: {
  size?: number;
  variant?: 'icon' | 'lockup' | 'hero';
  inverted?: boolean;
}) {
  const wordColor = inverted ? '#F4F8F7' : '#102A2E';
  const subColor = inverted ? 'rgba(244,248,247,0.5)' : '#4a6670';
  const iconSize = variant === 'hero' ? 72 : size;

  const mark = (
    <svg
      width={iconSize}
      height={iconSize}
      viewBox="0 0 80 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="NTD GURD"
    >
      {/* Gold pulse / mountain / ECG */}
      <path
        d="M4 32 L14 32 L20 14 L26 40 L36 8 L46 34 L52 20 L58 32 L76 32"
        stroke="#F2B84B"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Signal gold peak marker */}
      <circle cx="36" cy="8" r="5" fill="#F2B84B" />
      {/* Water waves — Maji Teal */}
      <path d="M8 42 Q18 36 28 42 Q38 48 48 42 Q58 36 72 42" stroke="#087F8C" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <path d="M8 49 Q18 43 28 49 Q38 55 48 49 Q58 43 72 49" stroke="#087F8C" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <path d="M8 56 Q18 50 28 56 Q38 62 48 56 Q58 50 72 56" stroke="#0A6B76" strokeWidth="2.2" fill="none" strokeLinecap="round" />
    </svg>
  );

  if (variant === 'icon') return mark;

  const wordSize = variant === 'hero' ? 42 : 16;
  const tagSize = variant === 'hero' ? 12 : 8.5;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: variant === 'hero' ? 18 : 10 }}>
      {mark}
      <div>
        <div
          style={{
            fontFamily: 'var(--font-heading), sans-serif',
            fontSize: wordSize,
            fontWeight: 800,
            letterSpacing: variant === 'hero' ? '1.6px' : '0.6px',
            color: wordColor,
            lineHeight: 1,
            textTransform: 'uppercase',
          }}
        >
          NTD GURD
        </div>
        <div
          style={{
            fontFamily: 'var(--font-body), sans-serif',
            fontSize: tagSize,
            fontWeight: 500,
            letterSpacing: variant === 'hero' ? '1.4px' : '0.6px',
            color: subColor,
            marginTop: variant === 'hero' ? 8 : 3,
            textTransform: 'uppercase',
          }}
        >
          {variant === 'lockup' ? 'Detect. Prevent. Deliver.' : 'Environmental Health Intelligence'}
        </div>
        {variant === 'hero' && (
          <div
            style={{
              fontFamily: 'var(--font-heading), sans-serif',
              fontSize: 15,
              fontWeight: 600,
              color: '#F2B84B',
              marginTop: 10,
              letterSpacing: '0.2px',
            }}
          >
            Detect. Prevent. Deliver.
          </div>
        )}
      </div>
    </div>
  );
}
