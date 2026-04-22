/**
 * Skill tree definitions and XP helpers.
 *
 * Three parallel trees (Harvest / Funding / Tooling) each earn XP from
 * their own activity source and have independent unlock graphs.
 *
 * Player level is fed by a separate XP pool (discoveries + sales +
 * stabilisations + petri-completion). It gates dish slot unlocks.
 *
 * Reference: proto-concepts/petri-spec.md §9, §10.
 */

// ── TREE NODE POSITIONS (SVG viewport: 300 × 320) ─────────────────────
// Tiers fill horizontal rows. Each tree shares the same spatial template.
//   T1: y=40   (root, centred)
//   T2: y=120  (2 branch nodes)
//   T3: y=200  (up to 3 nodes)
//   T4: y=280  (up to 3 leaf nodes)

export const HARVEST_NODES = [
  { id: 'h0', tier: 1, label: 'Base Harvest',    desc: 'Compound harvesting unlocked.',                    x: 150, y: 40,  cost: 0,   prereqs: [] },
  { id: 'h1', tier: 2, label: 'Precision I',     desc: '+5% harvest success chance.',                     x: 90,  y: 120, cost: 100, prereqs: ['h0'] },
  { id: 'h2', tier: 2, label: 'Speed I',         desc: 'Harvest cooldown reduced by 10%.',                x: 210, y: 120, cost: 100, prereqs: ['h0'] },
  { id: 'h3', tier: 3, label: 'Tier II Unlock',  desc: 'Can harvest T2 compounds.',                       x: 55,  y: 200, cost: 350, prereqs: ['h1'] },
  { id: 'h4', tier: 3, label: 'Refinery I',      desc: '+15% compound quality grade.',                    x: 150, y: 200, cost: 350, prereqs: ['h1', 'h2'] },
  { id: 'h5', tier: 3, label: 'Yield I',         desc: '+1 quantity per successful harvest.',             x: 245, y: 200, cost: 350, prereqs: ['h2'] },
  { id: 'h6', tier: 4, label: 'Stable Seeding',  desc: 'Stable harvests leave a re-growing child stub.',  x: 80,  y: 280, cost: 800, prereqs: ['h3'] },
  { id: 'h7', tier: 4, label: 'Precision II',    desc: '+10% harvest success chance (cumulative).',       x: 185, y: 280, cost: 800, prereqs: ['h4'] },
  { id: 'h8', tier: 4, label: 'Careful Harvest', desc: 'Unstable harvest never raises volatility.',       x: 265, y: 280, cost: 800, prereqs: ['h5'] },
];

export const FUNDING_NODES = [
  { id: 'f0', tier: 1, label: 'Base Market',      desc: 'Market access unlocked.',                           x: 150, y: 40,  cost: 0,   prereqs: [] },
  { id: 'f1', tier: 2, label: 'Cadence I',        desc: 'Shipments arrive 20% faster.',                     x: 90,  y: 120, cost: 100, prereqs: ['f0'] },
  { id: 'f2', tier: 2, label: 'Queue+',           desc: 'Shipment queue cap increased to 4.',               x: 210, y: 120, cost: 100, prereqs: ['f0'] },
  { id: 'f3', tier: 3, label: 'Plasm/Gel Supply', desc: 'Plasm/Gel now included in free shipments.',        x: 55,  y: 200, cost: 350, prereqs: ['f1'] },
  { id: 'f4', tier: 3, label: 'Price Band I',     desc: '+10% sell price on all compounds.',                x: 150, y: 200, cost: 350, prereqs: ['f1', 'f2'] },
  { id: 'f5', tier: 3, label: 'Bulk Queue',       desc: 'Shipment queue cap increased to 5.',               x: 245, y: 200, cost: 350, prereqs: ['f2'] },
  { id: 'f6', tier: 4, label: 'Cadence II',       desc: 'Shipments arrive 40% faster (total).',             x: 80,  y: 280, cost: 800, prereqs: ['f3'] },
  { id: 'f7', tier: 4, label: 'Price Band II',    desc: '+20% sell price on all compounds (total).',        x: 185, y: 280, cost: 800, prereqs: ['f4'] },
  { id: 'f8', tier: 4, label: 'Rare Rotation',    desc: 'Extra rare ingredient slot in the daily store.',   x: 265, y: 280, cost: 800, prereqs: ['f5'] },
];

export const TOOLING_NODES = [
  { id: 't0', tier: 1, label: 'Basic Tools',       desc: 'Tool access unlocked.',                                  x: 150, y: 40,  cost: 0,   prereqs: [] },
  { id: 't1', tier: 2, label: 'Bio-Inc Precision', desc: 'Discard collateral chance reduced by 30%.',             x: 90,  y: 120, cost: 100, prereqs: ['t0'] },
  { id: 't2', tier: 2, label: 'Cooldown I',        desc: 'All action cooldowns reduced by 10%.',                  x: 210, y: 120, cost: 100, prereqs: ['t0'] },
  { id: 't3', tier: 3, label: 'Catalyse Boost',    desc: '+15% chance of producing 2 children on Catalyse.',     x: 55,  y: 200, cost: 350, prereqs: ['t1'] },
  { id: 't4', tier: 3, label: 'Contain Economy',   desc: 'Every other Contain action costs no Plasm/Gel.',       x: 150, y: 200, cost: 350, prereqs: ['t1', 't2'] },
  { id: 't5', tier: 3, label: 'Precision II',      desc: 'Discard collateral chance reduced by 50% (total).',    x: 245, y: 200, cost: 350, prereqs: ['t2'] },
  { id: 't6', tier: 4, label: 'Cooldown II',       desc: 'All action cooldowns reduced by 20% (total).',         x: 80,  y: 280, cost: 800, prereqs: ['t3'] },
  { id: 't7', tier: 4, label: 'Fuel Economy',      desc: '40% chance a Discard action costs no fuel.',           x: 185, y: 280, cost: 800, prereqs: ['t4'] },
  { id: 't8', tier: 4, label: 'Catalyse Mastery',  desc: '+25% chance of 2 children on Catalyse (cumulative).', x: 265, y: 280, cost: 800, prereqs: ['t5'] },
];

export const SKILL_TREES = {
  harvest: HARVEST_NODES,
  funding: FUNDING_NODES,
  tooling: TOOLING_NODES,
};

// ── XP REWARDS ────────────────────────────────────────────────────────
// Per-action XP granted to tree or player pools.

export const XP = {
  // Player level pool
  DISCOVERY: 25,          // new compound discovered
  STABILISE_NODE: 8,      // per node hitting volatility 0
  SALE_PERCENT: 0.04,     // 4% of sale credits → player XP
  PETRI_BASE: 150,        // full-dish stabilisation base
  PETRI_PER_NODE: 15,     // additional per node in dish

  // Skill tree pools
  HARVEST_STABLE: 40,     // stable one-shot harvest
  HARVEST_UNSTABLE: 15,   // repeatable unstable harvest
  FUNDING_PERCENT: 0.08,  // 8% of sale credits → funding XP
  TOOLING_CATALYSE: 5,    // per successful catalyse
  TOOLING_DISCARD: 12,    // per discard
  TOOLING_CONTAIN: 3,     // per contain
};

// ── PLAYER LEVEL ──────────────────────────────────────────────────────
// xpRequired is cumulative XP to reach that level.
export const PLAYER_LEVELS = [
  { level: 1,  xpRequired: 0    },
  { level: 2,  xpRequired: 150  },
  { level: 3,  xpRequired: 375  },
  { level: 4,  xpRequired: 700  },
  { level: 5,  xpRequired: 1200, dishSlots: 2 },
  { level: 6,  xpRequired: 1900 },
  { level: 7,  xpRequired: 2800 },
  { level: 8,  xpRequired: 4000 },
  { level: 9,  xpRequired: 5500 },
  { level: 10, xpRequired: 7500 },
  { level: 11, xpRequired: 10000 },
  { level: 12, xpRequired: 13500, dishSlots: 3 },
];

/** Derive the player level and XP-to-next from a total XP value. */
export function playerLevelFromXp(totalXp) {
  let levelEntry = PLAYER_LEVELS[0];
  for (const row of PLAYER_LEVELS) {
    if (totalXp >= row.xpRequired) levelEntry = row;
    else break;
  }
  const nextRow = PLAYER_LEVELS.find((r) => r.level === levelEntry.level + 1);
  const xpIntoLevel = totalXp - levelEntry.xpRequired;
  const xpForLevel = nextRow ? nextRow.xpRequired - levelEntry.xpRequired : 1;
  return {
    level: levelEntry.level,
    xpIntoLevel,
    xpForLevel,
    xpPercent: Math.min(100, (xpIntoLevel / xpForLevel) * 100),
    dishSlots: PLAYER_LEVELS.slice()
      .reverse()
      .find((r) => r.dishSlots && totalXp >= r.xpRequired)?.dishSlots ?? 1,
  };
}

// ── ACTIVE EFFECTS ────────────────────────────────────────────────────
/**
 * Derive a flat effects map from the union of all three unlocked sets.
 * Components and actions call this to read modifier values.
 *
 * Returned shape (all optional, defaults shown):
 *   harvestSuccessBonus: 0        (additive %, e.g. 0.05 = +5%)
 *   harvestCooldownMult: 1        (<1 = faster)
 *   harvestYieldBonus: 0          (flat qty)
 *   harvestQualityMult: 1
 *   harvestNoVolSpike: false
 *   shipmentCadenceMult: 1        (<1 = faster)
 *   shipmentQueueCap: 3
 *   plasmaGelShipments: false
 *   sellPriceMult: 1
 *   rareRotation: false
 *   discardCollateralMult: 1      (<1 = less collateral)
 *   cooldownMult: 1               (<1 = shorter cooldowns)
 *   containFreeEveryOther: false
 *   discardFuelFreeChance: 0      (0–1 probability)
 *   catalyseExtraChildBonus: 0    (additive % on top of base chaos roll)
 */
export function getActiveEffects(skills) {
  const h = new Set(skills?.harvest?.unlocked ?? []);
  const f = new Set(skills?.funding?.unlocked ?? []);
  const t = new Set(skills?.tooling?.unlocked ?? []);

  return {
    harvestSuccessBonus: (h.has('h1') ? 0.05 : 0) + (h.has('h7') ? 0.10 : 0),
    harvestCooldownMult: h.has('h2') ? 0.9 : 1,
    harvestYieldBonus: h.has('h5') ? 1 : 0,
    harvestQualityMult: h.has('h4') ? 1.15 : 1,
    harvestNoVolSpike: h.has('h8'),

    shipmentCadenceMult: f.has('f6') ? 0.6 : f.has('f1') ? 0.8 : 1,
    shipmentQueueCap: f.has('f5') ? 5 : f.has('f2') ? 4 : 3,
    plasmaGelShipments: f.has('f3'),
    sellPriceMult: f.has('f7') ? 1.20 : f.has('f4') ? 1.10 : 1,
    rareRotation: f.has('f8'),

    discardCollateralMult: t.has('t5') ? 0.5 : t.has('t1') ? 0.7 : 1,
    cooldownMult: t.has('t6') ? 0.8 : t.has('t2') ? 0.9 : 1,
    containFreeEveryOther: t.has('t4'),
    discardFuelFreeChance: t.has('t7') ? 0.4 : 0,
    catalyseExtraChildBonus: t.has('t8') ? 0.25 : t.has('t3') ? 0.15 : 0,
  };
}

/** Check if a skill node can be unlocked given the current unlocked set. */
export function canUnlock(tree, nodeId, unlockedSet) {
  const nodes = SKILL_TREES[tree] ?? [];
  const node = nodes.find((n) => n.id === nodeId);
  if (!node) return false;
  if (unlockedSet.has(nodeId)) return false;
  return node.prereqs.every((p) => unlockedSet.has(p));
}
