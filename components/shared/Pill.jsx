import { MONO } from '@/lib/tokens';

/**
 * Tab / filter pill button. White chrome — no affinity colour here.
 * Active state is indicated by brighter border + background, not colour.
 *
 * Reference: proto-concepts/petri-design.md §11 (chrome is white/grey/black).
 */
export function Pill({ children, active, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      style={{
        padding: '6px 14px',
        borderRadius: 20,
        border: `1px solid ${active ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.09)'}`,
        background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
        color: active ? '#fff' : 'rgba(255,255,255,0.35)',
        fontSize: 9,
        fontFamily: MONO,
        letterSpacing: 0.5,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  );
}
