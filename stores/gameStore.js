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
  dishes: [{ id: 1, name: 'Dish Alpha', nodes: [] }],
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
