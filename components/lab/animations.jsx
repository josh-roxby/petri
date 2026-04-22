import { Fragment } from 'react';
import { AFF_COLORS } from '@/lib/tokens';
import { blobD, edgeControlPoint, evalQuadBezier, nodeSeed } from '@/lib/blobD';

/**
 * One-shot animation renderers. Each exports a function returning SVG
 * children; the caller wraps them in the overlay `<svg>`. Progress `p` is
 * in [0, 1] and is driven by the rAF loop in useAnimations.
 *
 * Every animation that clips to a node's blob must recompute the seed via
 * nodeSeed() so the clip aligns with the base renderer.
 *
 * Reference: proto-concepts/petri-anim-spec.md.
 */

const easeOut = (t) => 1 - Math.pow(1 - t, 3);

// ── S1: Stable · three staggered concentric rings ───────────────────────
export function S1({ node, p }) {
  return [0, 0.22, 0.44].map((off, i) => {
    const tp = Math.max(0, Math.min(1, (p - off) / 0.8));
    const r = node.r + easeOut(tp) * 68;
    const op = Math.max(0, 1 - tp * 1.1) * 0.9;
    return (
      <circle
        key={i}
        cx={node.x}
        cy={node.y}
        r={r}
        fill="none"
        stroke="white"
        strokeWidth={2 - tp * 1.5}
        opacity={op}
      />
    );
  });
}

// ── S2: Stable · diamond-grid crystal overlay ───────────────────────────
export function S2({ node, p, animId }) {
  const build = easeOut(Math.min(1, p * 1.4));
  const fade = Math.max(0, (p - 0.6) / 0.4);
  const op = build * (1 - fade);
  const R = node.r + 6;
  // IDs must be unique across concurrent animations — include anim id.
  const gridId = `s2Grid-${animId}-${node.id}`;
  const clipId = `s2Clip-${animId}-${node.id}`;
  const c = AFF_COLORS[node.aff];
  const dSz = 4.5;
  return (
    <Fragment>
      <defs>
        <clipPath id={clipId}>
          <circle cx={node.x} cy={node.y} r={R} />
        </clipPath>
        <pattern
          id={gridId}
          x="0"
          y="0"
          width={dSz}
          height={dSz}
          patternUnits="userSpaceOnUse"
          patternTransform={`rotate(45 ${node.x} ${node.y})`}
        >
          <rect width={dSz} height={dSz} fill="none" stroke="white" strokeWidth="0.35" />
        </pattern>
      </defs>
      <circle
        cx={node.x}
        cy={node.y}
        r={R}
        fill={`url(#${gridId})`}
        opacity={op * 0.55}
        clipPath={`url(#${clipId})`}
      />
      <circle
        cx={node.x}
        cy={node.y}
        r={R}
        fill={c}
        opacity={op * 0.07}
        clipPath={`url(#${clipId})`}
      />
      <circle
        cx={node.x}
        cy={node.y}
        r={R}
        fill="none"
        stroke="white"
        strokeWidth="1.2"
        opacity={op * 0.55}
      />
      <circle
        cx={node.x}
        cy={node.y}
        r={R - 3}
        fill="none"
        stroke="white"
        strokeWidth="0.4"
        opacity={op * 0.3}
      />
    </Fragment>
  );
}

// ── S3: Stable · glowing dots travel along existing mycelium edges ──────
export function S3({ node, p, nodes }) {
  const children = nodes.filter((n) => n.parent === node.id);
  const parent = node.parent != null ? nodes.find((n) => n.id === node.parent) : null;
  const edges = children.map((c) => ({ target: c, isChild: true }));
  if (parent) edges.push({ target: parent, isChild: false });

  return edges.map((e, i) => {
    const delay = i * 0.18;
    const tp = Math.max(0, Math.min(1, (p - delay) / 0.8));
    const et = easeOut(tp);
    // Recreate the exact control point the edge was drawn with.
    const childN = e.isChild ? e.target : node;
    const parentE = e.isChild ? node : e.target;
    const cp = edgeControlPoint(parentE, childN);
    // Forward (parent→child) when target is child; reverse otherwise.
    const bt = e.isChild ? et : 1 - et;
    const pos = evalQuadBezier(parentE, childN, cp, bt);
    const op = tp < 0.85 ? 0.9 : (1 - tp) * 6;
    return (
      <g key={i}>
        <circle cx={pos.x} cy={pos.y} r={3.5} fill="white" opacity={op} />
        <circle cx={pos.x} cy={pos.y} r={6} fill="white" opacity={op * 0.3} />
      </g>
    );
  });
}

// ── C1: Collapse · flash → shockwave ring → scar ────────────────────────
export function C1({ node, p, nodes }) {
  const phase1 = p < 0.2;
  const phase2 = p >= 0.2 && p < 0.7;
  const phase3 = p >= 0.7;
  const siblings = nodes.filter((n) => n.parent === node.parent && n.id !== node.id);
  const swP = phase2 ? (p - 0.2) / 0.5 : 1;
  const swR = node.r + easeOut(swP) * 90;
  const swOp = phase2 ? Math.max(0, 1 - swP * 1.2) * 0.8 : 0;
  const flashOp = phase1 ? (1 - p / 0.2) * 0.9 : 0;
  const scarOp = phase3 ? easeOut((p - 0.7) / 0.3) : 0;
  return (
    <Fragment>
      <circle cx={node.x} cy={node.y} r={node.r * 2} fill="white" opacity={flashOp} />
      <circle
        cx={node.x}
        cy={node.y}
        r={swR}
        fill="none"
        stroke="#ff8844"
        strokeWidth={3 - swP * 2}
        opacity={swOp}
      />
      <circle
        cx={node.x}
        cy={node.y}
        r={swR * 0.7}
        fill="none"
        stroke="white"
        strokeWidth="0.7"
        opacity={swOp * 0.5}
      />
      {siblings.map((s) => (
        <circle
          key={s.id}
          cx={s.x}
          cy={s.y}
          r={s.r + 6}
          fill="#ff5533"
          opacity={phase2 ? (swP < 0.4 ? swP * 0.6 : Math.max(0, (0.4 - swP) * 2)) : 0}
        />
      ))}
      <path
        d={blobD(node.x, node.y, node.r, node.id * 13)}
        fill="rgba(20,20,20,0.9)"
        opacity={scarOp}
      />
      <text
        x={node.x}
        y={node.y + 4}
        textAnchor="middle"
        fill="rgba(255,255,255,0.4)"
        fontSize="10"
        opacity={scarOp}
      >
        ×
      </text>
    </Fragment>
  );
}

// ── H1: Harvest · particle burst in affinity colour ─────────────────────
export function H1({ node, p }) {
  const c = AFF_COLORS[node.aff];
  const NUM = 14;
  const particles = Array.from({ length: NUM }, (_, i) => {
    const angle = (i / NUM) * Math.PI * 2 + i * 0.4;
    const speed = 0.6 + (i % 3) * 0.25;
    const tp = Math.min(1, p * speed * 1.2);
    const dist = easeOut(tp) * (36 + (i % 4) * 14);
    const px = node.x + dist * Math.cos(angle);
    const py = node.y + dist * Math.sin(angle);
    const size = (3.5 - tp * 2.5) * (1 + (i % 3) * 0.3);
    const op = Math.max(0, 1 - tp * 1.1);
    return (
      <g key={i}>
        <circle cx={px} cy={py} r={Math.max(0.3, size)} fill={c} opacity={op} />
        <circle cx={px} cy={py} r={Math.max(0.2, size * 1.6)} fill={c} opacity={op * 0.25} />
      </g>
    );
  });
  return (
    <Fragment>
      {particles}
      <circle
        cx={node.x}
        cy={node.y}
        r={node.r * 1.5}
        fill={c}
        opacity={Math.max(0, 0.6 - p * 2.5)}
      />
    </Fragment>
  );
}

// ── SH1: Harvested stub transition — gentle shake → empty → stub ────────
// Fires on stable-harvest (node becomes harvested stub). Complements H1.
export function SH1({ node, p, nodes }) {
  const nodeIndex = nodes.findIndex((n) => n.id === node.id);
  const seed = nodeSeed(node, Math.max(0, nodeIndex));
  const c = AFF_COLORS[node.aff];
  const tickApprox = Math.floor(p * 60); // faux fastTick for jitter variety
  const shakePhase = p < 0.35 ? p / 0.35 : 0;
  const jitterAmp = shakePhase > 0 ? Math.sin(shakePhase * Math.PI) * 1.6 : 0;
  const jx = jitterAmp * (tickApprox % 3 === 0 ? 1 : tickApprox % 3 === 1 ? -0.7 : 0.4);
  const jy =
    jitterAmp *
    (tickApprox % 4 === 0 ? -0.5 : tickApprox % 4 === 1 ? 0.6 : tickApprox % 4 === 2 ? -0.3 : 0.7);
  const nodeOp = p < 0.35 ? 1 - p / 0.35 : 0;
  const stubOp = p > 0.72 ? Math.min(1, (p - 0.72) / 0.28) : 0;
  return (
    <Fragment>
      <g transform={`translate(${jx},${jy})`} opacity={nodeOp}>
        <path d={blobD(node.x, node.y, node.r + 9, seed + 6)} fill={c + '09'} stroke="none" />
        <path
          d={blobD(node.x, node.y, node.r, seed)}
          fill={c + '25'}
          stroke={c}
          strokeWidth="1.5"
        />
        <circle cx={node.x} cy={node.y} r={node.r * 0.4} fill={c} opacity={0.55} />
        <circle cx={node.x} cy={node.y} r={node.r * 0.13} fill="white" opacity={0.2} />
      </g>
      <g opacity={stubOp}>
        <path
          d={blobD(node.x, node.y, node.r, seed)}
          fill="transparent"
          stroke={c + '44'}
          strokeWidth="0.8"
          strokeDasharray="4,3"
        />
      </g>
    </Fragment>
  );
}

// ── T1: Stabilise micro · single settle ring ────────────────────────────
export function T1({ node, p }) {
  const r = node.r + easeOut(p) * 22;
  const op = Math.max(0, 1 - p * 1.1) * 0.85;
  return (
    <circle
      cx={node.x}
      cy={node.y}
      r={r}
      fill="none"
      stroke="white"
      strokeWidth={1.5 - p}
      opacity={op}
    />
  );
}

// ── T2: Catalyse · yellow spark burst (no preview child — real spawn handles that)
export function T2({ node, p }) {
  const NUM = 8;
  return (
    <Fragment>
      {Array.from({ length: NUM }, (_, i) => {
        const a = (i / NUM) * Math.PI * 2;
        const tp = Math.min(1, p * 2.5);
        const dist = easeOut(tp) * (14 + (i % 3) * 8);
        const px = node.x + dist * Math.cos(a);
        const py = node.y + dist * Math.sin(a);
        const op = Math.max(0, 1 - tp * 1.2) * 0.9;
        return (
          <circle
            key={i}
            cx={px}
            cy={py}
            r={Math.max(0.3, 2 - tp * 2)}
            fill="#f5c842"
            opacity={op}
          />
        );
      })}
      <circle
        cx={node.x}
        cy={node.y}
        r={node.r * 1.3}
        fill="#f5c842"
        opacity={Math.max(0, 0.5 - p * 3.5)}
      />
    </Fragment>
  );
}

// ── T3: Contain · diamond frost grid clipped to the cell's blob ─────────
export function T3({ node, p, nodes, animId }) {
  const build = easeOut(Math.min(1, p * 1.5));
  const clipId = `t3Clip-${animId}-${node.id}`;
  const patId = `t3Pat-${animId}-${node.id}`;
  const dSz = 3.8;
  // CRITICAL: same seed as base renderer so the clip aligns.
  const nodeIndex = Math.max(
    0,
    nodes.findIndex((n) => n.id === node.id)
  );
  const seed = nodeSeed(node, nodeIndex);
  return (
    <Fragment>
      <defs>
        <clipPath id={clipId}>
          <path d={blobD(node.x, node.y, node.r, seed)} />
        </clipPath>
        <pattern
          id={patId}
          x="0"
          y="0"
          width={dSz}
          height={dSz}
          patternUnits="userSpaceOnUse"
          patternTransform={`rotate(45 ${node.x} ${node.y})`}
        >
          <rect
            width={dSz}
            height={dSz}
            fill="none"
            stroke="rgba(180,210,255,0.9)"
            strokeWidth="0.3"
          />
        </pattern>
      </defs>
      <path
        d={blobD(node.x, node.y, node.r, seed)}
        fill={`url(#${patId})`}
        opacity={build * 0.65}
        clipPath={`url(#${clipId})`}
      />
      <path
        d={blobD(node.x, node.y, node.r, seed)}
        fill="rgba(120,160,255,0.10)"
        stroke="none"
        clipPath={`url(#${clipId})`}
        opacity={build}
      />
      <path
        d={blobD(node.x, node.y, node.r + 0.5, seed)}
        fill="none"
        stroke="rgba(140,180,255,0.8)"
        strokeWidth="1.4"
        opacity={build * 0.7}
      />
      <circle
        cx={node.x}
        cy={node.y}
        r={node.r * 0.22}
        fill="rgba(200,220,255,0.65)"
        opacity={build}
      />
    </Fragment>
  );
}

// ── T4: Discard · rising fire + neighbour flash ─────────────────────────
export function T4({ node, p, nodes }) {
  const burnP = Math.min(1, p * 1.4);
  const siblings = nodes.filter((n) => n.parent === node.parent && n.id !== node.id);
  const NUM = 10;
  const easeIn = (t) => t * t * t;
  return (
    <Fragment>
      {Array.from({ length: NUM }, (_, i) => {
        const angle = -Math.PI / 2 + (i / NUM - 0.5) * 1.2;
        const speed = 0.5 + (i % 4) * 0.2;
        const tp = Math.min(1, burnP * speed * 1.5);
        const dist = easeIn(tp) * (20 + (i % 3) * 10);
        const px = node.x + dist * Math.cos(angle) * 0.7;
        const py = node.y - dist * (0.9 + (i % 3) * 0.2);
        const sz = 2.5 + (1 - tp) * 2;
        const clr = i % 3 === 0 ? '#ff8844' : i % 3 === 1 ? '#ff5533' : '#ffcc44';
        return (
          <circle
            key={i}
            cx={px}
            cy={py}
            r={Math.max(0.2, sz * (1 - tp))}
            fill={clr}
            opacity={Math.max(0, 1 - tp * 1.2) * 0.9}
          />
        );
      })}
      <path
        d={blobD(node.x, node.y, node.r, node.id * 13)}
        fill={`rgba(20,20,20,${burnP * 0.85})`}
        stroke={`rgba(255,80,30,${Math.max(0, 1 - burnP * 1.4)})`}
        strokeWidth="1.5"
      />
      {siblings.map((s) => {
        const flashOp = burnP < 0.5 ? burnP * 0.4 : Math.max(0, (0.5 - burnP) * 0.8);
        return <circle key={s.id} cx={s.x} cy={s.y} r={s.r + 5} fill="#ff5533" opacity={flashOp} />;
      })}
    </Fragment>
  );
}

// ── T5: Store sale · credit counter rises at dish centre ────────────────
// Dish-centred (140, 105 in SVG space); does not target a node. Carries
// the sold amount via anim.amount.
export function T5({ anim, p }) {
  const rise = easeOut(p) * 20;
  const fadeIn = Math.min(1, p / 0.2);
  const fadeOut = Math.max(0, 1 - (p - 0.6) / 0.4);
  const op = fadeIn * fadeOut;
  return (
    <text
      x={140}
      y={112 - rise}
      textAnchor="middle"
      fill="#1fcc79"
      fontSize="15"
      fontFamily="var(--font-space-mono), monospace"
      fontWeight="700"
      opacity={op}
    >
      +{anim?.amount ?? 0} ◈
    </text>
  );
}

export const ANIM_RENDERERS = { S1, S2, S3, C1, H1, SH1, T1, T2, T3, T4, T5 };
