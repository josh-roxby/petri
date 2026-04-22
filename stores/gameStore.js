/*
 * Zustand global game store — Pass 1 skeleton.
 * Mutations are stubs; real logic lands in Pass 1 alongside lib/gameLogic.js
 * and lib/timeDelta.js.
 *
 * Reference: proto-concepts/petri-ui-codebasis.md §13.
 */

import { create } from 'zustand';

const SAVE_KEY = 'petri_v1_save';

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
  // something to render before mutation logic lands in the next slice.
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
    stabiliser: 3,
    ingredient: 2,
    plasmaGel: 0,
    bioFuel: 0,
    catalyst: 1,
    antidote: 0,
  },

  // ── SHIPMENTS ───────────────────────────────────────────────────────
  shipmentQueues: {
    stabiliser: { count: 0, lastAt: null },
    ingredient: { count: 0, lastAt: null },
    plasmaGel: { count: 0, lastAt: null },
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
};

export const useGameStore = create((set, get) => ({
  ...initialState,

  // ── ACTIONS (Pass 1 stubs — replace with real logic) ────────────────
  stabiliseNode: (_dishId, _nodeId) => {
    // TODO Pass 1: reduce volatility by skill-scaled amount
  },
  catalyseNode: (_dishId, _nodeId, _ingredientId) => {
    // TODO Pass 1: force mutation tick, spawn child per chaos roll
  },
  harvestNode: (_dishId, _nodeId) => {
    // TODO Pass 1: resolve harvest formula, push compound to inventory
  },
  containNode: (_dishId, _nodeId) => {
    // TODO Pass 1: freeze node, flag contained
  },
  discardNode: (_dishId, _nodeId) => {
    // TODO Pass 1: destroy with collateral calc
  },
  collectShipment: (_type) => {
    // TODO Pass 1: drain queue, add to materials
  },
  computeTimeDelta: (_elapsedMs) => {
    // TODO Pass 1: offline sim on app open
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
