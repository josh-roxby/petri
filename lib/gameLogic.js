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

// Per-action cooldown in ms. Harvest scales with volatility (see cooldownFor).
// Spec §3: stabilise/catalyse "short", contain/discard "medium", harvest scaled.
export const COOLDOWN_MS = {
  stabilise: 5_000,
  catalyse: 6_000,
  contain: 20_000,
  discard: 20_000,
  harvest: 10_000, // base; scales up by volatility
};

// Chaos-driven outcome probabilities on Catalyse. Neither may exceed 50%.
// Linear in chaos; at chaos 100 the pair sums to ~0.83, leaving at-worst 17% plain.
export const CHAOS_NO_CHILD_PROB = (chaos) => Math.min(0.5, chaos / 200);
export const CHAOS_EXTRA_CHILD_PROB = (chaos) => Math.min(0.33, chaos / 300);

// Discard collateral — per neighbour (parent + siblings). Chaos-scaled.
export const DISCARD_COLLATERAL_PROB = (chaos) => Math.min(0.6, chaos / 150);
export const DISCARD_COLLATERAL_VOL_SPIKE = { min: 15, max: 25 };

// Dish viewBox is 280×210; keep child nodes inside a padded inner rect.
export const DISH_BOUNDS = { xMin: 18, xMax: 262, yMin: 16, yMax: 194 };

// ── COOLDOWNS ──────────────────────────────────────────────────────────
/**
 * Cooldown duration in ms for an action on a node. Harvest scales up with
 * the node's current volatility so milking unstable compounds costs patience.
 */
export function cooldownFor(action, node) {
  if (action === 'harvest') {
    return COOLDOWN_MS.harvest * (1 + (node?.volatility ?? 0) / 50);
  }
  return COOLDOWN_MS[action] ?? 0;
}

/** ms remaining until the given action is usable on the node. */
export function cooldownRemaining(node, action, now = Date.now()) {
  const ts = node?.cooldowns?.[action];
  if (!ts) return 0;
  return Math.max(0, ts - now);
}

/** Immutable helper that sets a cooldown expiry on a node. */
export function withCooldown(node, action, now = Date.now()) {
  return {
    ...node,
    cooldowns: { ...(node.cooldowns ?? {}), [action]: now + cooldownFor(action, node) },
  };
}

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

// ── CHAOS OUTCOME ──────────────────────────────────────────────────────
/**
 * Roll chaos effects for a Catalyse action. Returns the child count to spawn.
 *   0 → chaos consumed the ingredient with no offspring
 *   1 → normal mutation
 *   2 → bonus growth — dish teaches you chaos is a double-edged sword
 *
 * Probabilities per spec §2 (Chaos effects).
 */
export function rollCatalyseChildren(parent, rng = Math.random) {
  const noP = CHAOS_NO_CHILD_PROB(parent.chaos ?? 0);
  const extraP = CHAOS_EXTRA_CHILD_PROB(parent.chaos ?? 0);
  const r = rng();
  if (r < noP) return 0;
  if (r < noP + extraP) return 2;
  return 1;
}

/**
 * Apply discard collateral: each eligible neighbour rolls a chaos-scaled
 * damage check. Damaged neighbours get a volatility spike, never death.
 * Contained / scarred / harvested neighbours are immune.
 *
 * Spec §3 (Discard cost) + §2 (Collapse blast mechanics — neighbours take
 * volatility spikes, not automatic collapse).
 */
export function applyDiscardCollateral(nodes, targetNodeId, rng = Math.random) {
  const target = nodes.find((n) => n.id === targetNodeId);
  if (!target) return { nodes, damaged: [] };

  const damaged = [];
  const chaosProb = DISCARD_COLLATERAL_PROB(target.chaos ?? 0);

  const neighbourIds = new Set();
  // Siblings (same parent)
  nodes
    .filter((n) => n.parent === target.parent && n.id !== target.id)
    .forEach((n) => neighbourIds.add(n.id));
  // Parent
  if (target.parent != null) neighbourIds.add(target.parent);

  const next = nodes.map((n) => {
    if (!neighbourIds.has(n.id)) return n;
    if (n.state === 'scar' || n.state === 'harvested' || n.state === 'contained') return n;
    if (rng() >= chaosProb) return n;
    const spike = Math.round(
      randBetween(DISCARD_COLLATERAL_VOL_SPIKE.min, DISCARD_COLLATERAL_VOL_SPIKE.max, rng)
    );
    const newVol = clamp((n.volatility ?? 0) + spike, 0, 100);
    damaged.push({ nodeId: n.id, name: n.name, from: n.volatility, to: newVol });
    return { ...n, volatility: newVol, state: stateFromVolatility(newVol, n.state) };
  });

  return { nodes: next, damaged };
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
