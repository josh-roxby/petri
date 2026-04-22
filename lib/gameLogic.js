/*
 * Game logic — pure functions only. No React, no store, no side effects.
 *
 * These helpers are composed by the store mutations in stores/gameStore.js.
 * Keeping them pure makes them trivial to unit-test in a later slice.
 *
 * Constants are Pass 1 placeholders and will be tuned during Pass 2 (see
 * "Open design decisions" in TODO.md). Reference: proto-concepts/petri-spec.md
 * §2 (property math), §3 (actions), §5 (harvest formula).
 */

// ── CONSTANTS (Pass 1 placeholders) ────────────────────────────────────
export const STABILISE_REDUCTION = 3;
export const HARVEST_VOL_INCREASE = 8;
export const VOLATILE_THRESHOLD = 60;
export const BIRTH_VOLATILITY = { min: 60, max: 90 };
export const HARVEST_SUCCESS_BASE = 0.9;
export const CHILD_OFFSET = { min: 32, max: 48 };

// Dish viewBox is 280×210; keep child nodes inside a padded inner rect.
export const DISH_BOUNDS = { xMin: 18, xMax: 262, yMin: 16, yMax: 194 };

// ── NUMERIC HELPERS ────────────────────────────────────────────────────
export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

export function randBetween(lo, hi, rng = Math.random) {
  return lo + rng() * (hi - lo);
}

/**
 * Map volatility → node `state`. Never overrides terminal or manual states
 * (scar / harvested / contained).
 */
export function stateFromVolatility(volatility, currentState) {
  if (currentState === 'scar' || currentState === 'harvested' || currentState === 'contained') {
    return currentState;
  }
  if (volatility <= 0) return 'stable';
  if (volatility >= VOLATILE_THRESHOLD) return 'volatile';
  return 'alive';
}

// ── MUTATION / INHERITANCE ─────────────────────────────────────────────
/**
 * Inherit from a single parent. Used when an ingredient is dropped on a node.
 * Child properties = 70% parent + 30% ingredient baseline + chaos/volatility noise.
 */
export function mutateFromParent(parent, rng = Math.random) {
  // Noise amplitude scales with parent volatility AND chaos.
  const noiseAmp = (parent.volatility * 0.4 + parent.chaos * 0.3) / 100; // 0..~0.6
  const noise = () => (rng() - 0.5) * 2 * noiseAmp * 40; // ±0..~24 points
  const blend = (parentV, seedV) => clamp(parentV * 0.7 + seedV * 0.3 + noise(), 0, 100);

  return {
    potency: Math.round(blend(parent.potency, 50)),
    purity: Math.round(blend(parent.purity, 50)),
    toxicity: Math.round(blend(parent.toxicity, 10)),
    volatility: Math.round(randBetween(BIRTH_VOLATILITY.min, BIRTH_VOLATILITY.max, rng)),
    chaos: Math.round(clamp(parent.chaos + (rng() - 0.5) * 20, 0, 100)),
    aff: parent.aff,
  };
}

// ── HARVEST ────────────────────────────────────────────────────────────
/**
 * Roll a harvest outcome. Stable nodes are high-success one-shots; unstable
 * nodes are lower-success repeatables that raise volatility.
 *
 * Returns the compound payload on success, plus follow-up info the store
 * uses to update the node (`consumed`, `newVolatility`).
 */
export function harvestOutcome(node, rng = Math.random) {
  const isStable = node.volatility === 0;
  const successRate = isStable ? 1 : HARVEST_SUCCESS_BASE - node.volatility / 200;
  const success = rng() < successRate;

  const yieldQty = isStable
    ? Math.max(1, Math.round(1 + node.potency / 20))
    : Math.max(1, Math.round(1 + node.potency / 40));

  const quality = node.purity * (1 - node.toxicity / 200);
  const grade = quality >= 70 ? 'A' : quality >= 45 ? 'B' : quality >= 25 ? 'C' : 'D';

  return {
    success,
    // Stable harvests consume the node into a harvested stub; unstable leave
    // it behind with raised volatility.
    consumed: isStable,
    newVolatility: isStable ? 0 : clamp(node.volatility + HARVEST_VOL_INCREASE, 0, 100),
    compound: success
      ? {
          id: `c-${node.id}-${Date.now()}`,
          name: node.name,
          aff: node.aff,
          tier: 1,
          qty: yieldQty,
          potency: node.potency,
          purity: node.purity,
          toxicity: node.toxicity,
          grade,
          seed: node.id * 13,
        }
      : null,
  };
}

// ── CHILD SPAWN ────────────────────────────────────────────────────────
/**
 * Pick a position for a new child node: offset at a random angle from the
 * parent, clamped to the dish bounds, and (best-effort) not overlapping an
 * existing node.
 */
export function pickChildPosition(parent, existingNodes, rng = Math.random) {
  const attempts = 8;
  for (let i = 0; i < attempts; i++) {
    const angle = rng() * Math.PI * 2;
    const dist = randBetween(CHILD_OFFSET.min, CHILD_OFFSET.max, rng);
    const x = clamp(parent.x + Math.cos(angle) * dist, DISH_BOUNDS.xMin, DISH_BOUNDS.xMax);
    const y = clamp(parent.y + Math.sin(angle) * dist, DISH_BOUNDS.yMin, DISH_BOUNDS.yMax);
    const tooClose = existingNodes.some((n) => (n.x - x) ** 2 + (n.y - y) ** 2 < (n.r + 14) ** 2);
    if (!tooClose) return { x, y };
  }
  // fallback — accept overlap rather than fail the action
  const angle = rng() * Math.PI * 2;
  const dist = CHILD_OFFSET.max;
  return {
    x: clamp(parent.x + Math.cos(angle) * dist, DISH_BOUNDS.xMin, DISH_BOUNDS.xMax),
    y: clamp(parent.y + Math.sin(angle) * dist, DISH_BOUNDS.yMin, DISH_BOUNDS.yMax),
  };
}

export function nextNodeId(dish) {
  return dish.nodes.length === 0 ? 1 : Math.max(...dish.nodes.map((n) => n.id)) + 1;
}

const GREEK = ['α', 'β', 'γ', 'δ', 'ε', 'ζ', 'η', 'θ', 'ι', 'κ', 'λ', 'μ'];

/**
 * Derive a child name from the parent (e.g. "Viridis-α" → "Viridis-β"),
 * picking the next unused Greek suffix in the parent's family.
 */
export function childName(parent, allNodes) {
  const base = parent.name.includes('-') ? parent.name.split('-')[0] : parent.name;
  const used = new Set(
    allNodes.filter((n) => n.name.startsWith(base + '-')).map((n) => n.name.slice(base.length + 1))
  );
  const suffix = GREEK.find((s) => !used.has(s)) ?? '?';
  return `${base}-${suffix}`;
}

/**
 * Build a child node from a parent. Caller supplies a fresh id and position.
 */
export function buildChildNode({ parent, id, position, nodes, rng = Math.random }) {
  const inherited = mutateFromParent(parent, rng);
  // Child radius — a little smaller than parent, tune freely.
  const r = clamp(parent.r - 2 + Math.round((rng() - 0.5) * 4), 7, 18);
  return {
    id,
    x: position.x,
    y: position.y,
    r,
    ...inherited,
    state: stateFromVolatility(inherited.volatility, 'alive'),
    parent: parent.id,
    name: childName(parent, nodes),
  };
}
