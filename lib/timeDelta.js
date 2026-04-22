/*
 * Offline simulation — pure functions.
 *
 * Runs once on app open to advance game state across the "while you were
 * away" window. Produces a new state plus a summary the UI surfaces to
 * the player so offline changes don't feel like bugs.
 *
 * Reference: proto-concepts/petri-spec.md §12 (save & sync).
 */

// ── CONSTANTS (Pass 1 placeholders) ──────────────────────────────────
export const MINUTE_MS = 60 * 1000;
export const HOUR_MS = 60 * MINUTE_MS;

// Cadence per shipment type (spec §4). Only stabiliser + ingredient are
// active in Pass 1; Plasm/Gel shipments unlock via the Funding skill tree.
export const SHIPMENT_CADENCE_MS = {
  stabiliser: 30 * MINUTE_MS,
  ingredient: 2 * HOUR_MS,
  plasmaGel: 6 * HOUR_MS,
};

// Queue cap per type. Spec allows 3–5 scaling with Funding. Pass 1 = 3.
export const SHIPMENT_QUEUE_CAP = 3;

// Collapse probability tuning. Derived so that a volatility-80 node has
// roughly a 50% chance of collapsing across a 4-hour absence (matches the
// "2–4 hour gaps" cadence in spec §13 — not too punishing, not decorative).
//
//   P(collapse) = 1 - exp(-COLLAPSE_RATE_MS × volatility × elapsedMs)
//
// Tuned: rate ≈ ln(2) / (80 × 4 × HOUR_MS) ≈ 6.02e-10
export const COLLAPSE_RATE_MS = 6.02e-10;

// ── SHIPMENT ACCRUAL ─────────────────────────────────────────────────
/**
 * Accrue shipments for one queue. Returns the new queue plus the number
 * just added. `lastAt` advances by `accrued × cadence` so fractional
 * progress is preserved across sessions.
 */
export function accrueShipment(queue, now, cadenceMs, cap = SHIPMENT_QUEUE_CAP) {
  const lastAt = queue.lastAt ?? now;
  const elapsed = Math.max(0, now - lastAt);
  const rawAccrued = Math.floor(elapsed / cadenceMs);
  if (rawAccrued <= 0) {
    // Anchor lastAt on first touch so the queue starts accruing from now.
    return {
      next: queue.lastAt == null ? { ...queue, lastAt: now } : queue,
      added: 0,
    };
  }
  const currentCount = queue.count ?? 0;
  const room = Math.max(0, cap - currentCount);
  const added = Math.min(rawAccrued, room);
  return {
    next: {
      count: currentCount + added,
      // Advance lastAt by the full amount we accrued (not room-capped) so
      // the queue doesn't silently earn extra cadences once the cap is hit.
      lastAt: lastAt + rawAccrued * cadenceMs,
    },
    added,
  };
}

// ── COLLAPSE ROLLS ───────────────────────────────────────────────────
/**
 * Roll offline collapse for each volatile node. Only nodes with state
 * `volatile` (volatility ≥ VOLATILE_THRESHOLD) are eligible. Contained,
 * scarred, and harvested nodes are untouched.
 *
 * Pass 1 does not model neighbour/parent damage from collapse — the
 * target is scarred in place. Full blast-radius logic is TODO.
 */
export function rollCollapses(nodes, elapsedMs, rng = Math.random) {
  const events = [];
  const next = nodes.map((n) => {
    if (n.state !== 'volatile') return n;
    const p = 1 - Math.exp(-COLLAPSE_RATE_MS * n.volatility * elapsedMs);
    if (rng() < p) {
      events.push({ nodeId: n.id, name: n.name });
      return {
        ...n,
        state: 'scar',
        name: '[COLLAPSED]',
        potency: 0,
        volatility: 0,
        purity: 0,
        toxicity: 0,
      };
    }
    return n;
  });
  return { nodes: next, collapses: events };
}

// ── ORCHESTRATOR ─────────────────────────────────────────────────────
/**
 * Compute the full time-delta. Returns the next state fragments to merge
 * into the store plus a summary for the "while you were away" modal.
 *
 * Shape of the summary:
 *   { elapsedMs, shipments: [{type, added}], collapses: [{nodeId, name}] }
 */
export function computeTimeDelta({ state, now = Date.now(), rng = Math.random }) {
  const lastOpenedAt = state.lastOpenedAt ?? now;
  const elapsedMs = Math.max(0, now - lastOpenedAt);

  // 1. Shipment accrual — one pass per active queue.
  const shipmentQueues = { ...state.shipmentQueues };
  const shipmentSummary = [];
  for (const type of Object.keys(state.shipmentQueues)) {
    const cadence = SHIPMENT_CADENCE_MS[type];
    if (!cadence) continue; // type not yet unlocked / no cadence configured
    const { next, added } = accrueShipment(state.shipmentQueues[type], now, cadence);
    shipmentQueues[type] = next;
    if (added > 0) shipmentSummary.push({ type, added });
  }

  // 2. Collapse rolls — per dish, per volatile node.
  const dishes = state.dishes.map((d) => {
    const { nodes, collapses } = rollCollapses(d.nodes, elapsedMs, rng);
    return { ...d, nodes, _collapses: collapses };
  });
  const collapseSummary = dishes.flatMap((d) =>
    (d._collapses ?? []).map((c) => ({ dishId: d.id, dishName: d.name, ...c }))
  );
  // Strip the transient _collapses field before returning the merged state.
  const cleanedDishes = dishes.map(({ _collapses: _c, ...d }) => d);

  return {
    patch: {
      dishes: cleanedDishes,
      shipmentQueues,
      lastOpenedAt: now,
    },
    summary: {
      elapsedMs,
      shipments: shipmentSummary,
      collapses: collapseSummary,
    },
  };
}

/**
 * Is the summary worth showing the player? An elapsed session with no
 * shipments and no collapses is noise.
 */
export function summaryIsNoteworthy(summary) {
  if (!summary) return false;
  return (summary.shipments?.length ?? 0) > 0 || (summary.collapses?.length ?? 0) > 0;
}
