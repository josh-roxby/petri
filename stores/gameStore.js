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
  buildChildNode,
  clamp,
  harvestOutcome,
  nextNodeId,
  pickChildPosition,
  stateFromVolatility,
} from '@/lib/gameLogic';
import { computeTimeDelta as runTimeDelta, summaryIsNoteworthy } from '@/lib/timeDelta';

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
  journal: [], // all unique compounds ever synthesised

  // ── SKILL TREES ─────────────────────────────────────────────────────
  skills: {
    harvest: { xp: 0, unlocked: ['h0'] },
    funding: { xp: 0, unlocked: ['f0'] },
    tooling: { xp: 0, unlocked: ['t0'] },
  },

  // ── STORE ───────────────────────────────────────────────────────────
  storeSeed: null, // today's rotation seed, set by cron

  // ── TIME DELTA ──────────────────────────────────────────────────────
  lastSavedAt: null,
  lastOpenedAt: null, // timestamp of the last time computeTimeDelta ran
  lastSummary: null, // { elapsedMs, shipments, collapses } — cleared after display
};

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
    if (!node) return false;
    if (state.materials.stabiliser <= 0) return false;
    if (node.volatility <= 0) return false;
    if (node.state === 'scar' || node.state === 'harvested' || node.state === 'contained') {
      return false;
    }

    set((s) => ({
      materials: decrementMaterial(s.materials, 'stabiliser'),
      ...patchNode(s, dishId, nodeId, (n) => {
        const newVol = clamp(n.volatility - STABILISE_REDUCTION, 0, 100);
        return { ...n, volatility: newVol, state: stateFromVolatility(newVol, n.state) };
      }),
    }));
    get().save();
    return true;
  },

  /**
   * Catalyse: consume 1× Ingredient, force a mutation tick — spawn a child
   * with inherited + noisy properties.
   */
  catalyseNode: (dishId, nodeId) => {
    const state = get();
    const dish = findDish(state, dishId);
    const node = findNode(dish, nodeId);
    if (!node) return false;
    if (state.materials.ingredient <= 0) return false;
    if (node.state === 'scar' || node.state === 'harvested' || node.state === 'contained') {
      return false;
    }

    set((s) => {
      const liveDish = findDish(s, dishId);
      const position = pickChildPosition(node, liveDish.nodes);
      const child = buildChildNode({
        parent: node,
        id: nextNodeId(liveDish),
        position,
        nodes: liveDish.nodes,
      });
      return {
        materials: decrementMaterial(s.materials, 'ingredient'),
        dishes: s.dishes.map((d) => (d.id === dishId ? { ...d, nodes: [...d.nodes, child] } : d)),
      };
    });
    get().save();
    return true;
  },

  /**
   * Contain: consume 1× Plasm/Gel, freeze the node. Reversible: calling
   * again on a contained node releases it back to its prior state.
   */
  containNode: (dishId, nodeId) => {
    const state = get();
    const dish = findDish(state, dishId);
    const node = findNode(dish, nodeId);
    if (!node) return false;
    const alreadyContained = node.state === 'contained';
    if (!alreadyContained && state.materials.plasmaGel <= 0) return false;
    if (!alreadyContained && (node.state === 'scar' || node.state === 'harvested')) return false;

    set((s) => ({
      materials: alreadyContained ? s.materials : decrementMaterial(s.materials, 'plasmaGel'),
      ...patchNode(s, dishId, nodeId, (n) =>
        alreadyContained
          ? { ...n, state: stateFromVolatility(n.volatility, 'alive') }
          : { ...n, state: 'contained' }
      ),
    }));
    get().save();
    return true;
  },

  /**
   * Discard: consume 1× Bio-Inc. Fuel, scar the target. Pass 1 does not
   * model neighbour collateral yet — tracked in TODO for a later slice.
   */
  discardNode: (dishId, nodeId) => {
    const state = get();
    const dish = findDish(state, dishId);
    const node = findNode(dish, nodeId);
    if (!node) return false;
    if (state.materials.bioFuel <= 0) return false;
    if (node.state === 'scar') return false;

    set((s) => ({
      materials: decrementMaterial(s.materials, 'bioFuel'),
      ...patchNode(s, dishId, nodeId, (n) => ({
        ...n,
        state: 'scar',
        potency: 0,
        volatility: 0,
        purity: 0,
        toxicity: 0,
        name: '[COLLAPSED]',
      })),
    }));
    get().save();
    return true;
  },

  /**
   * Harvest: free. Stable nodes become one-shot harvested stubs; unstable
   * nodes can be harvested repeatedly but each harvest raises volatility.
   */
  harvestNode: (dishId, nodeId) => {
    const state = get();
    const dish = findDish(state, dishId);
    const node = findNode(dish, nodeId);
    if (!node) return false;
    if (node.state === 'scar' || node.state === 'harvested') return false;

    const outcome = harvestOutcome(node);

    set((s) => ({
      compounds: outcome.compound ? mergeCompound(s.compounds, outcome.compound) : s.compounds,
      ...patchNode(s, dishId, nodeId, (n) =>
        outcome.consumed
          ? { ...n, state: 'harvested', potency: 0, volatility: 0, purity: 0, toxicity: 0 }
          : {
              ...n,
              volatility: outcome.newVolatility,
              state: stateFromVolatility(outcome.newVolatility, n.state),
            }
      ),
    }));
    get().save();
    return outcome;
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
  computeTimeDelta: () => {
    const state = get();
    const { patch, summary } = runTimeDelta({ state });
    set({ ...patch, lastSummary: summaryIsNoteworthy(summary) ? summary : null });
    get().save();
    return summary;
  },

  clearLastSummary: () => set({ lastSummary: null }),

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
