# TODO

Running task list for Petri. Organised by build pass (see `petri-spec.md` §14). Move items to `Done` with a date when complete.

## Now (Pass 1 — next up)

Core animations are in. Remaining Pass 1 work:

- [ ] Drag-ingredient-onto-node mutation path (currently only Catalyse spawns children)
- [ ] Tap-tap combine (two-parent mutation)
- [ ] Chaos multi-child / no-child rolls on Catalyse
- [ ] Discard collateral (chaos-scaled neighbour volatility spike) — placeholder exists
- [ ] Action cooldowns (short/medium per spec §3 table)
- [ ] Fire C1 for online collapses (currently only offline collapses run; passive re-sim could surface them)

## Next (Pass 1 — playable core loop)

Goal of pass: prove the loop feels good. Single petri, single dish slot, no economy, no skill trees.

**Shell + chrome**

- [x] `components/shell/AppHeader.jsx` — logo + currency + store button + settings
- [x] `components/shell/NavPill.jsx` — floating 5-item bottom pill
- [x] `components/shell/Grid.jsx` — ambient background grid
- [x] Wire up shared tick (`setInterval` 160ms) at app root, pass down as prop
- [x] Wave header divider (SVG, sin-driven)
- [x] Ambient floating particles (7 dots, sin y-motion)

**Lab screen**

- [x] `components/lab/Porthole.jsx` — ring + bolts + radial fill
- [x] `components/lab/PetriDish.jsx` — SVG node graph with blob rendering
- [x] Node rendering stack (8 layers: ambient glow → hot centre)
- [x] Mycelium edges (curved quad bezier, seeded)
- [x] `components/lab/LabScreen.jsx` — absolute-centred dish, overlays (dish switcher, level/XP bar, shipment card)
- [x] Dish stats readout (DISH / NODES / STABLE%)

**Node interaction**

- [x] `components/lab/NodeModal.jsx` — 60%-width centred modal, affinity bar + stat grid + action buttons
- [x] Stat colour rules (volatility 4-step scale; others white by opacity)
- [x] Outside-click close (mousedown listener on modal content ref)
- [x] Five actions wired to store mutations

**Game logic**

- [x] `lib/gameLogic.js` — property math: inheritance, chaos noise, volatility decay
- [x] Stabilise / Catalyse / Contain / Discard / Harvest resolution (basic)
- [x] Node state machine (alive / stable / volatile / contained / harvested-stub / scar)
- [ ] Collapse rolls (leaf/child only, chaos-driven blast radius) — deferred to timeDelta slice
- [ ] Drag-ingredient-to-node mutation path — Catalyse covers the programmatic path; drag UX comes with Inventory
- [ ] Tap-tap combine mutation path — Pass 1.2
- [ ] Chaos-driven multi/no-child on Catalyse — currently always 1 child
- [ ] Discard collateral (sibling/parent damage) — currently scars target only
- [ ] Action cooldowns — currently none (spam-limited only by materials)

**Time delta + persistence**

- [x] `lib/timeDelta.js` — offline sim on app open (shipment accrual, collapse rolls)
- [x] "While you were away" summary modal
- [x] Passive re-sim every 30s so long sessions accrue shipments
- [x] localStorage save/load (throttled per action)

**Shipments (Pass 1 subset: stabiliser + ingredients only)**

- [x] Shipment queue accrual logic
- [x] Floating shipment card on Lab screen
- [x] `components/screens/ShipmentsScreen.jsx` — queue + collect
- [ ] SH1 shipment collect animation (gentle shake → empty → stub fade-in)

**Journal + Library (basic)**

- [x] `components/screens/InventoryScreen.jsx` — Compounds + Materials tabs
- [x] `components/screens/DiscoveriesScreen.jsx` — 3-column grid, known + placeholders
- [x] `components/shared/BlobIcon.jsx`, `GeomIcon.jsx`, `AffBadge.jsx`, `Pill.jsx`
- [x] Journal seeding + recordDiscovery on catalyse

**Animations (from anim spec — Tier 1 + T1–T4 micro)**

- [x] S1 stable pulse rings
- [x] S2 stable circle + diamond grid (clipPath)
- [x] S3 stable edge ripple (bezier-traced)
- [x] V1 volatile erratic jitter (ambient state in PetriDish, shipped with Lab slice)
- [x] C1 collapse shockwave (renderer live; fires on online collapse once that lands)
- [x] H1 harvest particle burst
- [x] SH1 harvested stub fade (fires on stable harvest consumption)
- [x] T1 stabilise micro
- [x] T2 catalyse spark
- [x] T3 contain frost (seed-matched clipPath)
- [x] T4 discard burn

## Later (Pass 2 — economy)

- [ ] `components/store/StoreOverlay.jsx` — bottom sheet, Buy / Sell / Special tabs
- [ ] Sell side — single abstract market, daily rotated price bands
- [ ] Buy side — 2–3 rotating ingredient slots, Bio-Inc. fuel always available
- [ ] Plasm/Gel unlock pathway + shipments
- [ ] All 6 shipment types wired through
- [ ] Vercel Cron for daily store rotation seed
- [ ] T5 store sale flash animation

## Later (Pass 3 — progression)

- [ ] `components/screens/SkillsScreen.jsx` — three sub-tabs (Harvest / Funding / Tooling)
- [ ] SVG skill tree renderer (tier labels, edges, node states)
- [ ] Harvest tree nodes (tier unlocks, precision, refinery, yield, speed + perks)
- [ ] Funding tree nodes (cadence, queue, plasm/gel unlock, price multipliers, rotation slots)
- [ ] Tooling tree nodes (bio-inc precision/efficiency, catalyse boost, contain duration, cooldowns)
- [ ] Player level system + dish slot unlocks (L5, L12, …)
- [ ] XP pipe across all sources
- [ ] Harvest tier gating on compound rarity
- [ ] `PetriSwitcher` modal carousel for multi-dish
- [ ] X1 XP gain / level-up animation
- [ ] T6 skill unlock animation

## Later (Pass 4 — polish)

- [ ] Landmark compound discoveries (guaranteed progression gates)
- [ ] Discovery journal depth (lineage viewer, first-discovered-on, rarity)
- [ ] Visual polish pass (CSS/SVG detail, animation refinement)
- [ ] PWA install prompt + offline shell
- [ ] Performance pass on large graphs (memoize `blobD()`, evaluate canvas for glow halos if >30 nodes)
- [ ] F1 dish-stable green glow
- [ ] F2 dish-stable light cascade
- [ ] D1 discovery affinity burst
- [ ] D2 discovery NEW chip
- [ ] Sound design (optional)

## Later (Pass 5 — backend, post-pilot)

- [ ] Render backend + Postgres
- [ ] Auth (magic link or OAuth)
- [ ] Cloud save + cross-device sync
- [ ] "Upgrade to account" migration flow (localStorage → cloud)
- [ ] Server-side validation of key events (anti-cheat surface area)
- [ ] Migrate cron from Vercel to Render scheduled jobs

## Open design decisions to resolve in-flight

_Reference `petri-spec.md` §16. These can be stubbed during Pass 1 and tuned later._

- [ ] Plasm/Gel final name
- [ ] Landmark compound list (which combos deterministically produce which named discoveries)
- [ ] XP curve constants (linear vs exponential per source)
- [ ] Store price ranges per tier
- [ ] Volatility decay formula constants (placeholder Pass 1 → tune Pass 2)

## Done

- [x] **2026-04-22** — Initial repo scaffold: CLAUDE.md + TODO.md placeholders
- [x] **2026-04-22** — Import proto-concepts docs from local dev folder
- [x] **2026-04-22** — Rewrite CLAUDE.md and TODO.md from specs; lock build plan
- [x] **2026-04-22** — Pass 0: Next.js 15 App Router scaffold (JS, not TS), PWA manifest, next/font (Space Mono + Chakra Petch), ESLint + Prettier, GitHub Actions CI
- [x] **2026-04-22** — `lib/tokens.js` (AFF_COLORS, ACTION_COLORS, volatilityColor, CHROME, MONO, CHAKRA, layout constants, z-index ladder, TICK_MS)
- [x] **2026-04-22** — `lib/blobD.js` (blobD, nodeSeed, edgeControlPoint, evalQuadBezier)
- [x] **2026-04-22** — `stores/gameStore.js` Zustand skeleton with save/load/reset + action stubs
- [x] **2026-04-22** — Pass 1 shell: AppHeader, NavPill, Grid, Particles, useTick, ScreenPlaceholder
- [x] **2026-04-22** — Pass 1 Lab slice: Porthole, PetriDish (8-layer blob stack), NodeModal (60% centred with volatility colour, 5 actions), LabScreen (absolute-centred dish, overlays), AffBadge; seeded dish nodes
- [x] **2026-04-22** — Pass 1 game logic: `lib/gameLogic.js` pure helpers (inheritance, harvest formula, state transitions, child spawn). Store actions now mutate real state with material consumption. Modal buttons disable on insufficient material. localStorage save throttled per action.
- [x] **2026-04-22** — Pass 1 offline sim: `lib/timeDelta.js` (shipment accrual, collapse rolls for volatile nodes). `ShipmentsScreen` with queue + collect + countdown. `WhileAwayModal` surfaces offline changes. `GeomIcon` shared component. Passive re-sim every 30s. Lab floating shipment card wired to live queues.
- [x] **2026-04-22** — Pass 1 inventory + discoveries: `InventoryScreen` (Compounds / Materials tabs), `DiscoveriesScreen` (3-col grid + detail panel, dashed placeholder slots). Shared `BlobIcon` and `Pill` components. Journal seeded from starting dish + `recordDiscovery` dedup on catalyse with `hashNameSeed` for stable blob shapes across screens.
- [x] **2026-04-22** — Pass 1 animations: 10 renderers (S1/S2/S3 stable, C1 collapse, H1 + SH1 harvest, T1–T4 micros) in `components/lab/animations.jsx`. `lib/useAnimations.js` drives a self-starting/stopping rAF loop (idle at zero cost when no anims are live). `AnimOverlay` sits above PetriDish in the Porthole clip with `pointerEvents:none`. Store actions return `{ok, events}` and the page fires them. Stabilise micro (T1) always; first touchdown to vol 0 also triggers the S1+S2+S3 reward triplet. Harvest fires H1 on success + SH1 additionally when stable one-shot consumed.

---

**Conventions**

- Check items off (`[x]`) when complete and move to `Done` with the date.
- Keep `Now` to 1–3 active items at any moment.
- Add notes/links inline under an item when helpful.
- Pass boundaries are guidance, not walls — shift items between passes if scope changes.
