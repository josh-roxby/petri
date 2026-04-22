/*
 * Seeded quadratic-bezier blob path generator.
 * Every compound node is drawn as an irregular blob. Same seed → same shape.
 *
 * Reference: proto-concepts/petri-ui-codebasis.md §8.
 *
 * Seed convention (used by all renderers and animations):
 *   seed = node.id * 13 + nodeIndex * 7      // base shape
 *   seed + N (2, 4, 6, 8)                     // glow halo rings
 *
 * Any animation that clips to a cell's blob shape (e.g. T3 contain frost,
 * S2 stable diamond grid) MUST recompute the same seed — otherwise the clip
 * sits on a different shape than the cell.
 */

export function blobD(cx, cy, r, seed) {
  const n = 8;
  const pts = Array.from({ length: n }, (_, i) => {
    const a = (2 * Math.PI * i) / n - Math.PI / 2;
    const noise = ((seed * 17 * (i + 1) + 13) % 100) / 100;
    const rad = r * (0.7 + noise * 0.6); // ±30% radius variance
    return [cx + rad * Math.cos(a), cy + rad * Math.sin(a)];
  });

  let d = `M ${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const t = 0.38; // tension
    const cp1x = p1[0] + ((p2[0] - p0[0]) * t) / 2;
    const cp1y = p1[1] + ((p2[1] - p0[1]) * t) / 2;
    const cp2x = p2[0] - ((p3[0] - p1[0]) * t) / 2;
    const cp2y = p2[1] - ((p3[1] - p1[1]) * t) / 2;
    d +=
      ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)}` +
      ` ${cp2x.toFixed(1)},${cp2y.toFixed(1)}` +
      ` ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d + ' Z';
}

/**
 * Canonical seed for a node's base blob.
 * Must match everywhere — PetriDish renderer, T3 clip, S2 clip, etc.
 */
export function nodeSeed(node, nodeIndex) {
  return node.id * 13 + nodeIndex * 7;
}

/**
 * Mycelium edge control point. Deterministic per (parent, child) pair.
 * Reference: proto-concepts/petri-ui-codebasis.md §10, petri-anim-spec.md S3.
 */
export function edgeControlPoint(parent, child) {
  const mx = (child.x + parent.x) / 2 + (((child.id * 9 + parent.id * 7) % 24) - 12) * 0.7;
  const my = (child.y + parent.y) / 2 + (((child.id * 11 + parent.id * 5) % 20) - 10) * 0.7;
  return { mx, my };
}

/**
 * Evaluate a quadratic bezier at parameter t ∈ [0,1].
 * Used by animations that travel along an existing mycelium edge (S3).
 */
export function evalQuadBezier(parent, child, cp, t) {
  const mt = 1 - t;
  const x = mt * mt * parent.x + 2 * mt * t * cp.mx + t * t * child.x;
  const y = mt * mt * parent.y + 2 * mt * t * cp.my + t * t * child.y;
  return { x, y };
}
