/*
 * Design tokens — the single source of truth for colour, type, and layout.
 * Import from here; never hard-code hex values in components.
 * Reference: proto-concepts/petri-ui-codebasis.md §2, proto-concepts/petri-design.md §1.
 */

// ── AFFINITY COLOURS (biology only — cells and cell data) ────────────────
export const AFF_COLORS = [
  '#a3dd28', // 0 Organic    — lime
  '#1fcc79', // 1 Enzyme     — emerald
  '#ff5533', // 2 Acid       — coral red
  '#44aaff', // 3 Mineral    — sky blue
  '#cc66ff', // 4 Synthetic  — violet
];

export const AFF_NAMES = ['Organic', 'Enzyme', 'Acid', 'Mineral', 'Synthetic'];

export const AFFINITY = {
  ORGANIC: 0,
  ENZYME: 1,
  ACID: 2,
  MINERAL: 3,
  SYNTHETIC: 4,
};

// ── ACTION DOT COLOURS (fixed semantic, not affinity-relative) ───────────
export const ACTION_COLORS = {
  catalyse: '#f5c842', // yellow
  harvest: '#1fcc79', // emerald
  contain: '#44aaff', // sky blue
  discard: '#ff5533', // coral
  stabilise: '#ffffff', // white
};

// ── VOLATILITY COLOUR SCALE (the only stat that gets colour) ─────────────
// Input: volatility 0–100. Returns hex/rgba for both bar and value text.
export function volatilityColor(v) {
  if (v <= 0) return '#1fcc79'; // stable — emerald
  if (v < 30) return 'rgba(180,220,100,0.8)'; // lime-yellow
  if (v < 60) return 'rgba(255,200,50,0.85)'; // amber
  return '#ff5533'; // coral red
}

// ── CHROME PALETTE (UI structure — white/grey/black only) ────────────────
export const CHROME = {
  bg: '#060606',
  bgDish: '#090909',
  bgSurface: 'rgba(10,10,10,0.97)',
  borderSubtle: 'rgba(255,255,255,0.07)',
  borderMid: 'rgba(255,255,255,0.14)',
  borderStrong: 'rgba(255,255,255,0.25)',
  textPrimary: '#ffffff',
  textBody: 'rgba(255,255,255,0.55)',
  textMuted: 'rgba(255,255,255,0.25)',
  textGhost: 'rgba(255,255,255,0.18)',
  glowAmbient: 'rgba(255,255,255,0.025)',
};

// ── TYPOGRAPHY ────────────────────────────────────────────────────────────
// Fonts are loaded via next/font in app/layout.jsx and exposed as CSS vars.
export const MONO = 'var(--font-space-mono), monospace';
export const CHAKRA = 'var(--font-chakra-petch), sans-serif';

// ── LAYOUT CONSTANTS ──────────────────────────────────────────────────────
export const DISH_SIZE = 264;
export const PORTHOLE_BOLT = 6;
export const HEADER_H = 56;
export const NAV_H = 52;
export const NAV_BOTTOM = 20;
export const NAV_WIDTH = 286;
export const NAV_RADIUS = 26;
export const SHELL_MAX_W = 420;

// Grid
export const GRID_SIZE = 28;
export const GRID_LINE = 'rgba(255,255,255,0.1)';
export const GRID_OPACITY = 0.28;

// Overlay z-index ladder
export const Z = {
  grid: 1,
  content: 2,
  header: 20,
  nav: 30,
  store: 55,
  modal: 60,
};

// Animation tick interval (ms). Single shared setInterval drives everything.
export const TICK_MS = 160;
