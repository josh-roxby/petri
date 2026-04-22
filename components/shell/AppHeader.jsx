import { CHROME, HEADER_H, MONO, Z } from '@/lib/tokens';

/**
 * Fixed app header. Never scrolls. Logo left, currency + store + settings right.
 * Wave divider at the bottom breathes via sin(tick).
 *
 * Reference: proto-concepts/petri-spec.md §17, petri-design.md §3.5.
 */
export function AppHeader({ tick, credits = 0, onStore, onSettings }) {
  const wave = Math.sin(tick * 0.05) * 2;
  return (
    <div
      style={{
        height: HEADER_H,
        position: 'relative',
        zIndex: Z.header,
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}
    >
      {/* animated wave divider */}
      <svg
        aria-hidden
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}
        viewBox="0 0 400 8"
        preserveAspectRatio="none"
      >
        <path
          d={`M0,${4 + wave} Q100,${1 + wave} 200,${4 + wave} Q300,${7 + wave} 400,${4 + wave}`}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="1"
        />
      </svg>

      {/* logo + LAB label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span
          style={{
            color: CHROME.textPrimary,
            fontFamily: MONO,
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: 3,
          }}
        >
          PETRI
        </span>
        <div style={{ width: 1, height: 14, background: CHROME.borderMid }} />
        <span
          style={{
            color: 'rgba(255,255,255,0.28)',
            fontFamily: MONO,
            fontSize: 7,
            letterSpacing: 1,
          }}
        >
          LAB
        </span>
      </div>

      {/* currency + store + settings */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div
            style={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.6)',
              boxShadow: '0 0 6px rgba(255,255,255,0.25)',
            }}
          />
          <span style={{ color: 'rgba(255,255,255,0.5)', fontFamily: MONO, fontSize: 9 }}>
            {credits.toLocaleString()}
          </span>
        </div>
        <button
          onClick={onStore}
          style={{
            padding: '4px 10px',
            borderRadius: 12,
            border: `1px solid ${CHROME.borderMid}`,
            background: 'rgba(255,255,255,0.05)',
            color: CHROME.textBody,
            fontSize: 8,
            fontFamily: MONO,
            letterSpacing: 0.5,
          }}
        >
          STORE
        </button>
        <button
          onClick={onSettings}
          aria-label="Settings"
          style={{
            color: 'rgba(255,255,255,0.22)',
            fontSize: 13,
            padding: 0,
            lineHeight: 1,
          }}
        >
          ⚙
        </button>
      </div>
    </div>
  );
}
