/*
 * Economy — pure, deterministic pricing and daily rotation helpers.
 *
 * Spec §8 (Store) + §12 (daily rotation cron).
 *
 * Design notes:
 * - Seed is derived from a UTC day key. Clients can re-derive locally; a
 *   Vercel Cron (see app/api/cron/store-rotation) publishes the canonical
 *   seed for v2 backend validation.
 * - Prices are deterministic given (compound/item, seed) so every client
 *   agrees on "today's price" without any server round-trip.
 */

export const DAY_MS = 24 * 60 * 60 * 1000;

/** UTC day number since epoch — the seed's canonical unit. */
export function dayKey(now = Date.now()) {
  return Math.floor(now / DAY_MS);
}

/** Reproducible small-int seed from the day key (+ optional salt). */
export function dailyStoreSeed(now = Date.now(), salt = 0) {
  const d = dayKey(now);
  // mulberry32 constant + day; salt lets callers split streams.
  return ((d * 2654435769) ^ (salt * 16777619)) >>> 0;
}

/** mulberry32 — small deterministic PRNG. Returns a function returning [0, 1). */
export function mulberry32(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Stable small-int hash from a string. */
export function strHash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// ── BUY SIDE ─────────────────────────────────────────────────────────
/**
 * Rotating buy pool. Three entries get picked each day; Bio-Inc. Fuel is
 * always available (spec §8 "Bio-incinerator fuel available on-demand").
 * `basePrice` is in credits; actual price rolls ±15% from the daily seed.
 */
export const BUY_POOL = [
  { id: 'buy-stab', label: 'Stabiliser ×5', material: 'stabiliser', qty: 5, basePrice: 120 },
  { id: 'buy-ingr', label: 'Basic Ingredient ×3', material: 'ingredient', qty: 3, basePrice: 180 },
  { id: 'buy-plasm', label: 'Plasm/Gel ×1', material: 'plasmaGel', qty: 1, basePrice: 220 },
  { id: 'buy-cat', label: 'Catalyst Pack ×1', material: 'catalyst', qty: 1, basePrice: 340 },
  { id: 'buy-ant', label: 'Antidote Vial ×1', material: 'antidote', qty: 1, basePrice: 260 },
];

export const BIO_FUEL_ITEM = {
  id: 'buy-fuel',
  label: 'Bio-Inc. Fuel ×1',
  material: 'bioFuel',
  qty: 1,
  basePrice: 95,
  alwaysAvailable: true,
};

/** Choose 3 ingredients + always-on Bio-Fuel, prices rolled for today. */
export function rollBuyInventory(seed) {
  const rng = mulberry32(seed);
  const shuffled = [...BUY_POOL].sort((a, b) => {
    // Deterministic shuffle via paired rng draws.
    return rng() - rng();
  });
  const chosen = shuffled.slice(0, 3);
  const priceRoll = (item) => {
    const h = strHash(item.id);
    const rr = mulberry32(seed ^ h);
    const variance = 0.3 * rr() - 0.15; // ±15%
    return Math.round(item.basePrice * (1 + variance));
  };
  return [
    ...chosen.map((i) => ({ ...i, price: priceRoll(i) })),
    { ...BIO_FUEL_ITEM, price: priceRoll(BIO_FUEL_ITEM) },
  ];
}

// ── SELL SIDE ────────────────────────────────────────────────────────
/** Base price per tier × grade. Tune in Pass 3 with real tuning data. */
export const SELL_BASE = {
  // tier → grade → price
  1: { A: 180, B: 100, C: 60, D: 30 },
  2: { A: 420, B: 240, C: 140, D: 80 },
  3: { A: 820, B: 500, C: 300, D: 180 },
};

/** Today's sale price for a compound, deterministic per (compound, seed). */
export function sellPrice(compound, seed) {
  const base = SELL_BASE[compound.tier]?.[compound.grade] ?? 50;
  const h = strHash(`${compound.name}|${compound.grade}|${compound.tier}`);
  const rng = mulberry32(seed ^ h);
  const variance = 0.6 * rng() - 0.3; // ±30%
  return Math.max(1, Math.round(base * (1 + variance)));
}

/** Daily min/max band — the range the price slider shows. */
export function sellPriceBand(compound) {
  const base = SELL_BASE[compound.tier]?.[compound.grade] ?? 50;
  return { min: Math.round(base * 0.7), max: Math.round(base * 1.3) };
}

// ── SPECIAL SIDE ─────────────────────────────────────────────────────
/**
 * Special offers give a material stockpile for a premium price. All offers
 * in Pass 2 are material-give (so they all "work" without new mechanics).
 * Complex effects (consumable modifiers, etc.) land in Pass 3.
 */
export const SPECIAL_POOL = [
  {
    id: 'sp-stabx',
    label: 'Stabiliser Burst',
    desc: 'Bulk delivery of stabiliser — +10 on collect.',
    price: 520,
    give: { stabiliser: 10 },
  },
  {
    id: 'sp-plasm',
    label: 'Plasm Cache',
    desc: 'Rare Plasm/Gel cache — +5 on collect.',
    price: 760,
    give: { plasmaGel: 5 },
  },
  {
    id: 'sp-ingr',
    label: 'Ingredient Hoard',
    desc: 'Basic Ingredient stockpile — +8 on collect.',
    price: 640,
    give: { ingredient: 8 },
  },
  {
    id: 'sp-fuel',
    label: 'Fuel Tanker',
    desc: 'Bio-Inc. fuel cache — +4 on collect.',
    price: 300,
    give: { bioFuel: 4 },
  },
];

/** Zero or one special offer per day. Half the days have no special. */
export function rollSpecialOffer(seed) {
  const rng = mulberry32(seed ^ 0xfeed);
  if (rng() < 0.5) return null;
  const idx = Math.floor(rng() * SPECIAL_POOL.length) % SPECIAL_POOL.length;
  return SPECIAL_POOL[idx];
}

/** Milliseconds until the next UTC day rollover (for "next offer in" labels). */
export function msUntilNextDay(now = Date.now()) {
  const d = dayKey(now);
  return (d + 1) * DAY_MS - now;
}
