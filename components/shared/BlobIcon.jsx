import { AFF_COLORS } from '@/lib/tokens';
import { blobD } from '@/lib/blobD';

/**
 * Compound blob preview — a simplified version of the Lab node render.
 * Three layers: outer glow, main blob, inner core. No jitter, no pulse.
 * Same blob-path math as the dish so a compound looks identical in
 * Inventory as it does in the dish.
 *
 * Reference: proto-concepts/petri-ui-codebasis.md §9 (node layers).
 */
export function BlobIcon({ aff, r = 16, seed = 7, opacity = 1 }) {
  const colour = aff >= 0 ? AFF_COLORS[aff] : 'rgba(255,255,255,0.15)';
  const s = r + 10;
  return (
    <svg
      width={s * 2}
      height={s * 2}
      viewBox={`0 0 ${s * 2} ${s * 2}`}
      style={{ display: 'block', flexShrink: 0, opacity }}
    >
      {/* outer glow */}
      <path d={blobD(s, s, r + 4, seed + 2)} fill={colour + '0a'} stroke="none" />
      {/* main blob */}
      <path d={blobD(s, s, r, seed)} fill={colour + '22'} stroke={colour} strokeWidth="1.2" />
      {/* inner core */}
      <circle cx={s} cy={s} r={r * 0.36} fill={colour} opacity="0.65" />
      {/* white hot centre */}
      <circle cx={s} cy={s} r={r * 0.12} fill="white" opacity="0.45" />
    </svg>
  );
}
