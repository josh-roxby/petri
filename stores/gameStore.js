/*
 * Zustand global game store.
 *
 * Action mutations call pure helpers in lib/gameLogic.js and immer-like
 * patterns via Zustand's set() with structural copies. The store is the only
 * place that mutates game state — components never touch it directly.
 *
 * Reference: proto-concepts/petri-ui-codebasis.md §13.
 */

import { create } from 'zustand';
import {
  STABILISE_REDUCTION,
  applyDiscardCollateral,
  buildChildNode,
  buildCombinedChildNode,
  clamp,
  cooldownRemaining,
  harvestOutcome,
  nextNodeId,
  pickChildPosition,
  rollCatalyseChildren,
  stateFromVolatility,
  withCooldown,
} from '@/lib/gameLogic';
import {
  dailyStoreSeed,
  dayKey,
  rollBuyInventory,
  rollSpecialOffer,
  sellPrice,
} from '@/lib/economy';
import { computeTimeDelta as runTimeDelta, summaryIsNoteworthy } from '@/lib/timeDelta';

// A passive / in-session time-delta with elapsed below this threshold animates
// collapses directly. Anything longer is treated as "away" and surfaced via
// the WhileAway modal instead.
export const IN_SESSION_THRESHOLD_MS = 5 * 60 * 1000;

const SAVE_KEY = 'petri_v1_save';

// Which material each action consumes. Harvest is free.
export const ACTION_MATERIAL = {
  stabilise: 'stabiliser',
  catalyse: 'ingredient',
  contain: 'plasmaGel',
  discard: 'bioFuel',
};

const initialState = {
  // ── PLAYER ──────────────────────────────────────────────────────────
  player: {
    level: 1,
    xp: 0,
    credits: 500,
    dishSlots: 1,
  },

  // ── DISHES ──────────────────────────────────────────────────────────
  // Seed nodes mirror the validated prototype dish so the Lab screen has
  // something to render from first paint.
  dishes: [
    {
      id: 1,
      name: 'Dish Alpha',
      nodes: [
        // prettier-ignore
        { id: 1, x: 140, y: 178, r: 17, aff: 0, state: 'stable',    potency: 72, volatility: 0,  purity: 68, toxicity: 12, chaos: 25, parent: null, name: 'Viridis-α' },
        // prettier-ignore
        { id: 2, x: 88,  y: 126, r: 13, aff: 1, state: 'alive',     potency: 55, volatility: 22, purity: 58, toxicity: 8,  chaos: 32, parent: 1,    name: 'Lysate-β' },
        // prettier-ignore
        { id: 3, x: 196, y: 122, r: 15, aff: 2, state: 'volatile',  potency: 60, volatility: 81, purity: 44, toxicity: 38, chaos: 62, parent: 1,    name: 'Corros-γ' },
        // prettier-ignore
        { id: 4, x: 50,  y: 68,  r: 11, aff: 3, state: 'stable',    potency: 48, volatility: 0,  purity: 71, toxicity: 6,  chaos: 18, parent: 2,    name: 'Ferric-α' },
        // prettier-ignore
        { id: 5, x: 126, y: 54,  r: 14, aff: 4, state: 'alive',     potency: 65, volatility: 34, purity: 52, toxicity: 22, chaos: 44, parent: 2,    name: 'Nullite-β' },
        // prettier-ignore
        { id: 6, x: 232, y: 58,  r: 9,  aff: 0, state: 'scar',      potency: 0,  volatility: 0,  purity: 0,  toxicity: 0,  chaos: 0,  parent: 3,    name: '[COLLAPSED]' },
        // prettier-ignore
        { id: 7, x: 36,  y: 18,  r: 8,  aff: 3, state: 'harvested', potency: 0,  volatility: 0,  purity: 0,  toxicity: 0,  chaos: 0,  parent: 4,    name: 'Ferric-α' },
      ],
    },
  ],
  activeDishId: 1,

  // ── INVENTORY ───────────────────────────────────────────────────────
  compounds: [], // harvested compounds with full property vectors
  materials: {
    stabiliser: 8,
    ingredient: 4,
    plasmaGel: 2,
    bioFuel: 2,
    catalyst: 1,
    antidote: 0,
  },

  // ── SHIPMENTS ───────────────────────────────────────────────────────
  // Only stabiliser + ingredient active in Pass 1. Plasm/Gel shipments
  // unlock via the Funding skill tree in Pass 3.
  shipmentQueues: {
    stabiliser: { count: 0, lastAt: null },
    ingredient: { count: 0, lastAt: null },
  },

  // ── DISCOVERIES ─────────────────────────────────────────────────────
  // Seed with the starting dish so the Pokédex isn't empty on first launch.
  // `{ name, aff, tier, seed, foundAt }` — one entry per unique compound name.
  journal: seedJournalFromStartingDish(),

  // ── SKILL TREES ─────────────────────────────────────────────────────
  skills: {
    harvest: { xp: 0, unlocked: ['h0'] },
    funding: { xp: 0, unlocked: ['f0'] },
    tooling: { xp: 0, unlocked: ['t0'] },
  },

  // ── STORE ───────────────────────────────────────────────────────────
  storeSeed: null, // today's rotation seed (mirrors day key)
  storeDay: null, // the day the seed was generated for
  storeSpecialPurchased: null, // id of today's special if already bought

  // ── TIME DELTA ──────────────────────────────────────────────────────
  lastSavedAt: null,
  lastOpenedAt: null, // timestamp of the last time computeTimeDelta ran
  lastSummary: null, // { elapsedMs, shipments, collapses } — cleared after display
};

// Pull unique live names from the seeded dish so Discoveries has something
// to show on first launch. Scars and harvested stubs are excluded.
function seedJournalFromStartingDish() {
  const nodes = [
    { name: 'Viridis-α', aff: 0 },
    { name: 'Lysate-β', aff: 1 },
    { name: 'Corros-γ', aff: 2 },
    { name: 'Ferric-α', aff: 3 },
    { name: 'Nullite-β', aff: 4 },
  ];
  return nodes.map((n) => ({
    name: n.name,
    aff: n.aff,
    tier: 1,
    seed: hashNameSeed(n.name),
    foundAt: null,
  }));
}

// Stable hash → small integer, used as the blob-shape seed for a compound
// across Inventory / Discoveries so the same compound looks identical.
export function hashNameSeed(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return Math.abs(h) % 997; // small prime mod for a compact seed
}

// ── INTERNAL HELPERS ─────────────────────────────────────────────────
// Apply a node-level update inside a dish. `updater(node)` returns the new
// node (or null to delete). Anything else is left untouched.
function patchNode(state, dishId, nodeId, updater) {
  return {
    dishes: state.dishes.map((d) => {
      if (d.id !== dishId) return d;
      return {
        ...d,
        nodes: d.nodes.map((n) => (n.id === nodeId ? updater(n) : n)).filter(Boolean),
      };
    }),
  };
}

function decrementMaterial(materials, key, by = 1) {
  return { ...materials, [key]: Math.max(0, (materials[key] ?? 0) - by) };
}

function findDish(state, dishId) {
  return state.dishes.find((d) => d.id === dishId);
}

function findNode(dish, nodeId) {
  return dish?.nodes.find((n) => n.id === nodeId);
}

// ── STORE ────────────────────────────────────────────────────────────
export const useGameStore = create((set, get) => ({
  ...initialState,

  // ── ACTIONS ──────────────────────────────────────────────────────
  /**
   * Stabilise: consume 1× Stabiliser, reduce volatility. If volatility
   * hits 0 the node is permanently stable.
   */
  stabiliseNode: (dishId, nodeId) => {
    const state = get();
    const dish = findDish(state, dishId);
    const node = findNode(dish, nodeId);
    if (!node) return { ok: false };
    if (state.materials.stabiliser <= 0) return { ok: false };
    if (node.volatility <= 0) return { ok: false };
    if (node.state === 'scar' || node.state === 'harvested' || node.state === 'contained') {
      return { ok: false };
    }
    if (cooldownRemaining(node, 'stabilise') > 0) return { ok: false };

    const newVol = clamp(node.volatility - STABILISE_REDUCTION, 0, 100);
    const crossedIntoStable = node.volatility > 0 && newVol <= 0;

    set((s) => ({
      materials: decrementMaterial(s.materials, 'stabiliser'),
      ...patchNode(s, dishId, nodeId, (n) =>
        withCooldown(
          { ...n, volatility: newVol, state: stateFromVolatility(newVol, n.state) },
          'stabilise'
        )
      ),
    }));
    get().save();
    // Stabilise always micro-rings. First touchdown to 0 adds the full
    // stable-reward triplet (S1+S2+S3) since the anim spec allows them to
    // run concurrently on the same node.
    const events = [{ type: 'T1', nodeId }];
    if (crossedIntoStable) {
      events.push({ type: 'S1', nodeId }, { type: 'S2', nodeId }, { type: 'S3', nodeId });
    }
    return { ok: true, events };
  },

  /**
   * Catalyse: consume 1× Ingredient, force a mutation tick — spawn a child
   * with inherited + noisy properties.
   */
  catalyseNode: (dishId, nodeId) => {
    const state = get();
    const dish = findDish(state, dishId);
    const node = findNode(dish, nodeId);
    if (!node) return { ok: false };
    if (state.materials.ingredient <= 0) return { ok: false };
    if (node.state === 'scar' || node.state === 'harvested' || node.state === 'contained') {
      return { ok: false };
    }
    if (cooldownRemaining(node, 'catalyse') > 0) return { ok: false };

    // Chaos roll — the ingredient is consumed regardless, chaos may produce
    // 0 / 1 / 2 children.
    const childCount = rollCatalyseChildren(node);

    set((s) => {
      const liveDish = findDish(s, dishId);
      // Build new children one at a time so each picks a non-overlapping
      // position with the previous.
      let workingNodes = liveDish.nodes;
      let nextId = nextNodeId(liveDish);
      const newChildren = [];
      for (let i = 0; i < childCount; i++) {
        const position = pickChildPosition(node, workingNodes);
        const child = buildChildNode({
          parent: node,
          id: nextId++,
          position,
          nodes: workingNodes,
        });
        newChildren.push(child);
        workingNodes = [...workingNodes, child];
      }
      let journal = s.journal;
      for (const c of newChildren) {
        journal = recordDiscovery(journal, {
          name: c.name,
          aff: c.aff,
          tier: 1,
          seed: hashNameSeed(c.name),
        });
      }
      return {
        materials: decrementMaterial(s.materials, 'ingredient'),
        dishes: s.dishes.map((d) =>
          d.id === dishId
            ? {
                ...d,
                nodes: [
                  ...d.nodes.map((n) => (n.id === nodeId ? withCooldown(n, 'catalyse') : n)),
                  ...newChildren,
                ],
              }
            : d
        ),
        journal,
      };
    });
    get().save();
    // T2 fires even on no-child — the spark signals the ingredient was consumed.
    return { ok: true, events: [{ type: 'T2', nodeId }], childCount };
  },

  /**
   * Contain: consume 1× Plasm/Gel, freeze the node. Reversible: calling
   * again on a contained node releases it back to its prior state.
   */
  containNode: (dishId, nodeId) => {
    const state = get();
    const dish = findDish(state, dishId);
    const node = findNode(dish, nodeId);
    if (!node) return { ok: false };
    const alreadyContained = node.state === 'contained';
    if (!alreadyContained && state.materials.plasmaGel <= 0) return { ok: false };
    if (!alreadyContained && (node.state === 'scar' || node.state === 'harvested')) {
      return { ok: false };
    }
    if (cooldownRemaining(node, 'contain') > 0) return { ok: false };

    set((s) => ({
      materials: alreadyContained ? s.materials : decrementMaterial(s.materials, 'plasmaGel'),
      ...patchNode(s, dishId, nodeId, (n) =>
        alreadyContained
          ? withCooldown({ ...n, state: stateFromVolatility(n.volatility, 'alive') }, 'contain')
          : withCooldown({ ...n, state: 'contained' }, 'contain')
      ),
    }));
    get().save();
    // T3 frost fires on containment only — releasing shouldn't replay it.
    return {
      ok: true,
      events: alreadyContained ? [] : [{ type: 'T3', nodeId }],
    };
  },

  /**
   * Discard: consume 1× Bio-Inc. Fuel, scar the target. Pass 1 does not
   * model neighbour collateral yet — tracked in TODO for a later slice.
   */
  discardNode: (dishId, nodeId) => {
    const state = get();
    const dish = findDish(state, dishId);
    const node = findNode(dish, nodeId);
    if (!node) return { ok: false };
    if (state.materials.bioFuel <= 0) return { ok: false };
    if (node.state === 'scar') return { ok: false };
    if (cooldownRemaining(node, 'discard') > 0) return { ok: false };

    let damaged = [];

    set((s) => {
      const liveDish = findDish(s, dishId);
      const { nodes: afterCollateral, damaged: dmg } = applyDiscardCollateral(
        liveDish.nodes,
        nodeId
      );
      damaged = dmg;
      // Scar the target itself after collateral resolution.
      const finalNodes = afterCollateral.map((n) =>
        n.id === nodeId
          ? withCooldown(
              {
                ...n,
                state: 'scar',
                potency: 0,
                volatility: 0,
                purity: 0,
                toxicity: 0,
                name: '[COLLAPSED]',
              },
              'discard'
            )
          : n
      );
      return {
        materials: decrementMaterial(s.materials, 'bioFuel'),
        dishes: s.dishes.map((d) => (d.id === dishId ? { ...d, nodes: finalNodes } : d)),
      };
    });
    get().save();
    return { ok: true, events: [{ type: 'T4', nodeId }], damaged };
  },

  /**
   * Harvest: free. Stable nodes become one-shot harvested stubs; unstable
   * nodes can be harvested repeatedly but each harvest raises volatility.
   */
  harvestNode: (dishId, nodeId) => {
    const state = get();
    const dish = findDish(state, dishId);
    const node = findNode(dish, nodeId);
    if (!node) return { ok: false };
    if (node.state === 'scar' || node.state === 'harvested') return { ok: false };
    if (cooldownRemaining(node, 'harvest') > 0) return { ok: false };

    const outcome = harvestOutcome(node);

    set((s) => ({
      compounds: outcome.compound ? mergeCompound(s.compounds, outcome.compound) : s.compounds,
      ...patchNode(s, dishId, nodeId, (n) =>
        outcome.consumed
          ? {
              ...n,
              state: 'harvested',
              potency: 0,
              volatility: 0,
              purity: 0,
              toxicity: 0,
            }
          : withCooldown(
              {
                ...n,
                volatility: outcome.newVolatility,
                state: stateFromVolatility(outcome.newVolatility, n.state),
              },
              'harvest'
            )
      ),
    }));
    get().save();
    // H1 always on success. SH1 only on stable one-shot (node transitions to stub).
    const events = [];
    if (outcome.success) events.push({ type: 'H1', nodeId });
    if (outcome.consumed) events.push({ type: 'SH1', nodeId });
    return { ok: true, events, outcome };
  },

  /**
   * Two-parent combine. Spawns a child inheriting from both parents (50/50
   * blend with higher noise per spec §2). Costs 1× Basic Ingredient and
   * puts both parents on catalyse cooldown so the action can't spam.
   * Spec §6 mutation paths.
   */
  combineNodes: (dishId, aId, bId) => {
    if (aId === bId) return { ok: false };
    const state = get();
    const dish = findDish(state, dishId);
    if (!dish) return { ok: false };
    const a = findNode(dish, aId);
    const b = findNode(dish, bId);
    if (!a || !b) return { ok: false };
    if (state.materials.ingredient <= 0) return { ok: false };
    const bad = (n) => n.state === 'scar' || n.state === 'harvested' || n.state === 'contained';
    if (bad(a) || bad(b)) return { ok: false };
    if (cooldownRemaining(a, 'catalyse') > 0 || cooldownRemaining(b, 'catalyse') > 0) {
      return { ok: false };
    }

    let newChildId = null;
    set((s) => {
      const liveDish = findDish(s, dishId);
      // Child seeks a free spot near the midpoint between the two parents.
      const midAnchor = {
        x: (a.x + b.x) / 2,
        y: (a.y + b.y) / 2,
        r: Math.max(a.r, b.r),
      };
      const position = pickChildPosition(midAnchor, liveDish.nodes);
      const child = buildCombinedChildNode({
        a,
        b,
        id: nextNodeId(liveDish),
        position,
        nodes: liveDish.nodes,
      });
      newChildId = child.id;
      return {
        materials: decrementMaterial(s.materials, 'ingredient'),
        dishes: s.dishes.map((d) =>
          d.id === dishId
            ? {
                ...d,
                nodes: [
                  ...d.nodes.map((n) =>
                    n.id === aId || n.id === bId ? withCooldown(n, 'catalyse') : n
                  ),
                  child,
                ],
              }
            : d
        ),
        journal: recordDiscovery(s.journal, {
          name: child.name,
          aff: child.aff,
          tier: 1,
          seed: hashNameSeed(child.name),
        }),
      };
    });
    get().save();
    // T2 spark fires at both parents so the action has visual weight on
    // both ends of the cross-pollination.
    return {
      ok: true,
      events: [
        { type: 'T2', nodeId: aId },
        { type: 'T2', nodeId: bId },
      ],
      childId: newChildId,
    };
  },

  /**
   * Drain a shipment queue into the matching material stock.
   * Material key matches queue key (stabiliser / ingredient / plasmaGel).
   */
  collectShipment: (type) => {
    const state = get();
    const queue = state.shipmentQueues[type];
    if (!queue || queue.count <= 0) return 0;
    const qty = queue.count;
    set((s) => ({
      shipmentQueues: {
        ...s.shipmentQueues,
        [type]: { ...s.shipmentQueues[type], count: 0 },
      },
      materials: { ...s.materials, [type]: (s.materials[type] ?? 0) + qty },
    }));
    get().save();
    return qty;
  },

  /**
   * Run the offline sim for elapsed time since lastOpenedAt. Call once on
   * app mount. Also run passively during long sessions to keep shipment
   * queues accurate if the page stays open for hours.
   */
  /**
   * Returns the summary so the caller can decide how to surface it:
   *   - Long gaps (> IN_SESSION_THRESHOLD_MS) populate lastSummary for the
   *     WhileAway modal; the player sees the scars already in place.
   *   - Short gaps (passive re-sim during a live session) leave lastSummary
   *     clear and the caller fires C1 animations for each collapse so the
   *     narrative beat plays live.
   */
  computeTimeDelta: () => {
    const state = get();
    const { patch, summary } = runTimeDelta({ state });
    const inSession = summary.elapsedMs < IN_SESSION_THRESHOLD_MS;
    set({
      ...patch,
      lastSummary: !inSession && summaryIsNoteworthy(summary) ? summary : null,
    });
    get().save();
    return { ...summary, inSession };
  },

  clearLastSummary: () => set({ lastSummary: null }),

  // ── STORE ECONOMY ──────────────────────────────────────────────────
  /**
   * Re-roll the daily store rotation if the current seed is stale. Also
   * clears storeSpecialPurchased when a new day starts so today's special
   * becomes available again. Safe to call frequently.
   */
  refreshStoreRotation: (now = Date.now()) => {
    const today = dayKey(now);
    if (get().storeDay === today) return;
    set({
      storeSeed: dailyStoreSeed(now),
      storeDay: today,
      storeSpecialPurchased: null,
    });
    get().save();
  },

  /**
   * Sell `qty` of a compound stack. Compound is identified by its full
   * inventory key (name|grade|tier) rather than transient id so the call
   * is safe across save/loads.
   */
  sellCompound: (compoundKey, qty = 1) => {
    const state = get();
    const compound = state.compounds.find((c) => `${c.name}|${c.grade}|${c.tier}` === compoundKey);
    if (!compound) return { ok: false };
    if (qty <= 0 || qty > compound.qty) return { ok: false };
    if (state.storeSeed == null) return { ok: false };

    const unit = sellPrice(compound, state.storeSeed);
    const total = unit * qty;

    set((s) => ({
      player: { ...s.player, credits: s.player.credits + total },
      compounds: s.compounds
        .map((c) =>
          `${c.name}|${c.grade}|${c.tier}` === compoundKey ? { ...c, qty: c.qty - qty } : c
        )
        .filter((c) => c.qty > 0),
    }));
    get().save();
    // T5 is dish-centred, not node-anchored — carry the total amount
    // so the renderer can format "+NNN ◈".
    return { ok: true, events: [{ type: 'T5', amount: total }], amount: total };
  },

  /**
   * Buy a store item. Consumes credits, adds `qty` of the item's material.
   * Returns the added quantity so the UI can flash feedback.
   */
  buyItem: (itemId) => {
    const state = get();
    if (state.storeSeed == null) return { ok: false };
    const buyList = rollBuyInventory(state.storeSeed);
    const item = buyList.find((i) => i.id === itemId);
    if (!item) return { ok: false };
    if (state.player.credits < item.price) return { ok: false };

    set((s) => ({
      player: { ...s.player, credits: s.player.credits - item.price },
      materials: {
        ...s.materials,
        [item.material]: (s.materials[item.material] ?? 0) + item.qty,
      },
    }));
    get().save();
    return { ok: true, added: item.qty, material: item.material, paid: item.price };
  },

  /**
   * Buy today's special offer (if any, and not yet bought). Credits the
   * material payload from the offer into materials.
   */
  buySpecial: () => {
    const state = get();
    if (state.storeSeed == null) return { ok: false };
    if (state.storeSpecialPurchased) return { ok: false };
    const offer = rollSpecialOffer(state.storeSeed);
    if (!offer) return { ok: false };
    if (state.player.credits < offer.price) return { ok: false };

    set((s) => {
      const nextMaterials = { ...s.materials };
      for (const [key, add] of Object.entries(offer.give ?? {})) {
        nextMaterials[key] = (nextMaterials[key] ?? 0) + add;
      }
      return {
        player: { ...s.player, credits: s.player.credits - offer.price },
        materials: nextMaterials,
        storeSpecialPurchased: offer.id,
      };
    });
    get().save();
    return { ok: true, offer };
  },

  // ── PERSISTENCE ─────────────────────────────────────────────────────
  save: () => {
    if (typeof window === 'undefined') return;
    const { save: _s, load: _l, reset: _r, ...snapshot } = get();
    localStorage.setItem(SAVE_KEY, JSON.stringify({ ...snapshot, lastSavedAt: Date.now() }));
  },

  load: () => {
    if (typeof window === 'undefined') return;
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return;
    try {
      set(JSON.parse(raw));
    } catch {
      // corrupted save — leave initial state in place
    }
  },

  reset: () => set(initialState),
}));

// Merge a new harvest payload into the compounds inventory, stacking by
// name + grade + tier so the list doesn't grow one entry per harvest.
function mergeCompound(compounds, add) {
  const key = (c) => `${c.name}|${c.grade}|${c.tier}`;
  const idx = compounds.findIndex((c) => key(c) === key(add));
  if (idx < 0) return [...compounds, add];
  const merged = { ...compounds[idx], qty: compounds[idx].qty + add.qty };
  const next = [...compounds];
  next[idx] = merged;
  return next;
}

// Add a compound to the journal if its name is new. Dedup is by name — the
// stat vector can vary run-to-run but the name is the "Pokédex entry".
function recordDiscovery(journal, entry) {
  if (journal.some((j) => j.name === entry.name)) return journal;
  return [...journal, { ...entry, foundAt: Date.now() }];
}
