import { AFF_COLORS, AFF_NAMES, CHAKRA, MONO } from '@/lib/tokens';

/**
 * Affinity chip. One of the few places affinity colour is allowed outside
 * the cell itself — it appears "in the cell's data".
 *
 * Reference: proto-concepts/petri-design.md §0 (biology register).
 */
export function AffBadge({ aff }) {
  if (aff < 0 || aff == null) {
    return (
      <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 7.5, fontFamily: MONO }}>???</span>
    );
  }
  const c = AFF_COLORS[aff];
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 7px',
        borderRadius: 8,
        background: c + '18',
        border: `1px solid ${c}44`,
        color: c,
        fontSize: 7.5,
        fontFamily: CHAKRA,
        letterSpacing: 0.4,
      }}
    >
      {AFF_NAMES[aff]}
    </span>
  );
}
