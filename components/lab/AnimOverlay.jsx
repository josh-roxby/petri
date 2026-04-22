import { ANIM_DURATION_MS } from '@/lib/useAnimations';
import { ANIM_RENDERERS } from './animations';

/**
 * Sits above PetriDish inside the Porthole's circular clip. Renders every
 * active animation with its current progress. `pointerEvents:none` so it
 * never intercepts node taps.
 *
 * Uses the same viewBox (280×210) as PetriDish so node coordinates line up.
 *
 * Reference: proto-concepts/petri-anim-spec.md (implementation notes).
 */
export function AnimOverlay({ animations, nodes }) {
  if (animations.length === 0) return null;
  const now = performance.now();

  return (
    <svg
      viewBox="0 0 280 210"
      width="100%"
      height="100%"
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 15,
      }}
    >
      {animations.map((anim) => {
        const renderer = ANIM_RENDERERS[anim.type];
        if (!renderer) return null;
        const duration = ANIM_DURATION_MS[anim.type];
        const p = Math.max(0, Math.min(1, (now - anim.startMs) / duration));
        const node = anim.nodeId != null ? nodes.find((n) => n.id === anim.nodeId) : null;
        // Node-anchored animations bail if the target has been removed; the
        // dish-centred ones (T5) don't need a node.
        if (anim.nodeId != null && !node) return null;
        return <g key={anim.id}>{renderer({ anim, node, p, nodes, animId: anim.id })}</g>;
      })}
    </svg>
  );
}
