import { AFF_COLORS } from '@/lib/tokens';
import { blobD, edgeControlPoint, nodeSeed } from '@/lib/blobD';

/**
 * The SVG node graph. Renders mycelium edges, then a stack of per-node layers
 * (8 layers for live nodes; reduced for scar/harvested).
 *
 * Coordinate space: 280×210 viewBox. Porthole wrapper clips to a circle.
 * Node x/y are authored in this viewBox — don't rescale here.
 *
 * Reference: proto-concepts/petri-ui-codebasis.md §9–10, petri-design.md §4.
 */
export function PetriDish({ tick, nodes, onNodeTap }) {
  const pulse = 0.3 + Math.sin(tick * 0.09) * 0.12;

  return (
    <svg viewBox="0 0 280 210" width="100%" height="100%" style={{ cursor: 'default' }}>
      {/* ── MYCELIUM EDGES (curved quad bezier, seeded) ── */}
      {nodes
        .filter((n) => n.parent != null)
        .map((n) => {
          const p = nodes.find((x) => x.id === n.parent);
          if (!p) return null;
          const scar = n.state === 'scar';
          const { mx, my } = edgeControlPoint(p, n);
          return (
            <path
              key={`e${n.id}`}
              d={`M ${p.x},${p.y} Q ${mx},${my} ${n.x},${n.y}`}
              fill="none"
              stroke={scar ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.13)'}
              strokeWidth={scar ? 0.5 : 1.1}
              strokeLinecap="round"
            />
          );
        })}

      {/* ── NODES (8-layer stack, jitter for volatile) ── */}
      {nodes.map((n, ni) => {
        const c = AFF_COLORS[n.aff];
        const vol = n.state === 'volatile';
        const scar = n.state === 'scar';
        const harv = n.state === 'harvested';
        const stable = n.state === 'stable';

        // Volatile nodes jitter — irregular pattern (tick%2, tick%3) for feel.
        const jx = vol ? (tick % 2 === 0 ? 1.7 : -1.7) : 0;
        const jy = vol ? (tick % 3 === 0 ? 1.1 : -1) : 0;

        const seed = nodeSeed(n, ni);
        const p1 = 0.12 + Math.sin(tick * 0.08 + ni) * 0.07;

        return (
          <g
            key={n.id}
            transform={`translate(${jx},${jy})`}
            onClick={() => onNodeTap?.(n)}
            style={{ cursor: 'pointer' }}
          >
            {!scar && !harv && (
              <>
                {/* L1 outer ambient glow */}
                <path d={blobD(n.x, n.y, n.r + 16, seed + 8)} fill={c + '06'} stroke="none" />
                {/* L2 mid glow */}
                <path d={blobD(n.x, n.y, n.r + 9, seed + 6)} fill={c + '09'} stroke="none" />
                {/* L3 ring outline */}
                <path
                  d={blobD(n.x, n.y, n.r + 4, seed + 4)}
                  fill="none"
                  stroke={c}
                  strokeWidth="0.3"
                  opacity={stable ? p1 * 1.5 : p1}
                />
              </>
            )}

            {/* L4a stable chrome ring */}
            {stable && (
              <path
                d={blobD(n.x, n.y, n.r + 11, seed + 2)}
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="0.5"
                opacity={pulse * 1.2}
              />
            )}
            {/* L4b volatile warning ring */}
            {vol && (
              <path
                d={blobD(n.x, n.y, n.r + 6, seed + 5)}
                fill="none"
                stroke="rgba(255,255,255,0.28)"
                strokeWidth="1"
                opacity={0.4 + Math.sin(tick * 0.45) * 0.35}
              />
            )}

            {!scar && !harv && (
              <>
                {/* L5 inner fill layer */}
                <path d={blobD(n.x, n.y, n.r + 1, seed + 1)} fill={c + '10'} stroke="none" />
              </>
            )}

            {/* L6 main blob — drawn for every state with state-specific styling */}
            <path
              d={blobD(n.x, n.y, n.r, seed)}
              fill={scar ? 'rgba(20,20,20,0.85)' : harv ? 'transparent' : c + '25'}
              stroke={scar ? 'rgba(255,255,255,0.07)' : harv ? c + '44' : c}
              strokeWidth={scar ? 0.5 : harv ? 0.8 : 1.5}
              strokeDasharray={harv ? '4,3' : undefined}
              opacity={scar ? 0.35 : 1}
            />

            {!scar && !harv && (
              <>
                {/* L7 inner core circle */}
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={n.r * 0.4}
                  fill={c}
                  opacity={vol ? 0.35 + Math.sin(tick * 0.4) * 0.38 : stable ? 0.72 : 0.55}
                />
                {/* L8 white hot centre */}
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={n.r * 0.13}
                  fill="white"
                  opacity={stable ? 0.5 : 0.2}
                />
              </>
            )}

            {/* scar × glyph */}
            {scar && (
              <text
                x={n.x}
                y={n.y + 4}
                textAnchor="middle"
                fill="rgba(255,255,255,0.15)"
                fontSize="9"
              >
                ×
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
