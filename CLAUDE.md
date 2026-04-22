# Petri

Project context for Claude Code. Read this first, then consult the specs in `proto-concepts/` for detail.

## Overview

Petri is a **mobile-first PWA** — a sandbox fictional-science / idle-adjacent game. The player grows mutating compounds inside a petri dish, balances volatility against potency, harvests what survives, and sells it to fund deeper experiments.

**Macro loop:** experiment → discover → stabilise → harvest → sell → reinvest → unlock → experiment bigger.

**Cadence:** 2–4 hour gaps, 2–3 check-ins per day. Minimum session ~2 min, deep session 20–30 min.

## Status

- UI prototype **validated and locked** (`proto-concepts/petri-v4.jsx`)
- Animation spec **locked**, 18 animations defined (`proto-concepts/petri-anim-spec.md`)
- Design language **locked** (`proto-concepts/petri-design.md`)
- Code basis **locked** (`proto-concepts/petri-ui-codebasis.md`)
- Cleared for **Pass 1** build (playable core loop)

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router), PWA config |
| Hosting | Vercel (v1), Render backend (v2, post-pilot) |
| Styling | Inline styles + SVG — no Tailwind, no CSS-in-JS lib |
| State | Zustand + React local state for UI-only |
| Persistence | localStorage (v1), Render + Postgres (v2) |
| Graph viz | SVG, blob paths via seeded quadratic bezier |
| Animation | Single `setInterval` tick at 160ms, no CSS keyframes / GSAP |
| Cron | Vercel Cron — daily store rotation seed only |
| Fonts | Space Mono (data/mono), Chakra Petch (UI labels) |

## Design non-negotiables

These rules are invariant across every screen and component:

1. **Chrome is white / grey / black. Always.** No exceptions outside the node system.
2. **Affinity colours live on cells and cell data only.** Modal borders, button backgrounds, stat bars — all white/grey.
3. **Volatility is the only stat with colour** (emerald → lime-yellow → amber → coral red scale). All other property bars are white at varying opacities.
4. **Action button dots are fixed semantic colours**, not affinity-driven: Catalyse yellow, Harvest emerald, Contain sky, Discard coral, Stabilise white.
5. **The grid is always present** — `rgba(255,255,255,0.1)` at `opacity:0.28`, `28px` cell.
6. **Circular motif for primary containers** — dish, Lab nav button, node halos.
7. **Glows are white except on nodes** — nodes glow in their affinity colour.
8. **No colour in mycelium edges** — white low-opacity only.
9. **Shell is `height:100vh, overflow:hidden`.** Header and nav are always visible; screens scroll inside the content area.
10. **Dish is always centred via absolute positioning**, never flexbox. Overlay elements are `position:absolute` and never affect dish centring.

## Core game systems (v1 scope)

**Compound property vector:** Potency, Volatility, Purity, Toxicity, Chaos (permanent at birth), Affinity (enum: Organic, Enzyme, Acid, Mineral, Synthetic + unlockables).

**Five actions, per-node via centred modal:**
- **Stabilise** — reduce volatility (1× Stabiliser, short cd)
- **Catalyse** — force mutation tick, spawn child (1× Basic Ingredient, short cd)
- **Contain** — freeze node (1× Plasm/Gel, medium cd, reversible)
- **Discard** — destroy node with collateral risk (Bio-Inc. fuel, medium cd)
- **Harvest** — extract material (free, cooldown-gated, volatility-scaled)

**Mutation paths:**
- Drag ingredient → node (70/30 parent/ingredient + noise)
- Tap-tap combine (50/50 + higher noise)

**Collapse:** leaf/child nodes only. Chaos drives blast radius. Scars are permanent dead branches.

**Harvest:** stable nodes = one-shot high-value + XP; unstable = repeatable but raises volatility.

**XP / levelling:** three parallel skill trees (Harvest / Funding / Tooling) fed by their own activities. Player level fed by discoveries + sales + stabilisations + petri-completion.

**Save & sync:** anonymous localStorage v1, time-delta sim on app open. v2 adds cloud save + account upgrade migration.

Full mechanics: `proto-concepts/petri-spec.md`.

## Repo layout

```
/
├── CLAUDE.md               ← this file
├── TODO.md                 ← project task tracker
└── proto-concepts/         ← locked specs + reference prototypes
    ├── petri-spec.md          (v0.2 — game spec, mechanics)
    ├── petri-design.md        (v0.2 — visual design language)
    ├── petri-anim-spec.md     (v0.2 — 18 locked animations)
    ├── petri-ui-codebasis.md  (v0.1 — component architecture)
    ├── petri-v4.jsx           (validated UI prototype)
    └── petri-animlab.jsx      (animation preview prototype)
```

**Planned build layout (from code basis §16):**

```
app/
  page.jsx                 root, loads game shell
  layout.jsx               font imports, metadata
components/
  shell/                   AppHeader, NavPill, Grid
  lab/                     LabScreen, PetriDish, Porthole, NodeModal, PetriSwitcher
  screens/                 InventoryScreen, ShipmentsScreen, DiscoveriesScreen, SkillsScreen
  store/                   StoreOverlay
  shared/                  BlobIcon, GeomIcon, AffBadge, Pill, PropBar
lib/
  blobD.js                 blob path generator
  gameLogic.js             volatility, collapse, mutation math
  timeDelta.js             offline sim
  tokens.js                AFF_COLORS, CHROME, MONO, CHAKRA, layout constants
stores/
  gameStore.js             Zustand
public/
  manifest.json            PWA manifest
  sw.js                    service worker
```

## Key patterns

- **Design tokens as JS constants** at the top of every file that needs them — never hard-code hex inline. See `petri-ui-codebasis.md` §2.
- **Single shared tick** (`setInterval` 160ms) drives all animation. Pass `tick` prop down. Volatile nodes jitter, stable breathe, scars are static.
- **Blob path seed convention:** `seed = node.id * 13 + nodeIndex * 7` for base shape. Glow halos use `seed + N` (2, 4, 6, 8). **Any animation that clips to a blob must recompute the same seed** or the clip won't align (see T3, S2 in anim spec).
- **Overlays render at app root level** — siblings of content area, never children of the triggering screen. Z-index ladder: grid 1 · content 2 · header 20 · nav 30 · store 55 · modals 60.
- **Porthole full-circle fills** (F1, F2 animations) must be `position:absolute` divs inside the porthole's `overflow:hidden, border-radius:50%` wrapper, **not** SVG. SVG letterboxes inside the square porthole div.
- **localStorage save** is throttled to one per meaningful action, never per render or per tick.

## Development

### Setup

_TBD — project not yet scaffolded. Pass 1 kicks off with `npx create-next-app` (App Router) and pulling in design tokens._

### Common commands

_TBD — will be populated as scripts are added (dev, build, lint, typecheck, test)._

### Conventions

- Branch for active work: `claude/improve-test-coverage-uExr1`
- Commit style: short imperative subject, optional body with "why"
- Keep CLAUDE.md current — it's the first thing read every session

## Open questions

Tracked in `petri-spec.md` §16 — all critical items resolved for Pass 1. Still open:
- Plasm/Gel final name
- Landmark compound list
- XP curve constants
- Store price ranges per tier
- Volatility decay formula constants (placeholder for Pass 1, tune in Pass 2)
- Audio design (Pass 4)

## References

- Active branch: `claude/improve-test-coverage-uExr1`
- Build pass plan: see `TODO.md` and `petri-spec.md` §14
