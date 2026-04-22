import { GRID_LINE, GRID_OPACITY, GRID_SIZE, Z } from '@/lib/tokens';

/**
 * Ambient background grid. Always present, subconsciously perceived.
 * Reference: proto-concepts/petri-design.md §3.1.
 */
export function Grid() {
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: Z.grid,
        backgroundImage: `linear-gradient(${GRID_LINE} 1px, transparent 1px), linear-gradient(90deg, ${GRID_LINE} 1px, transparent 1px)`,
        backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
        opacity: GRID_OPACITY,
      }}
    />
  );
}
