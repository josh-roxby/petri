# TODO

Running task list for Petri. Organised by build pass (see `petri-spec.md` §14). Move items to `Done` with a date when complete.

## Now (Pass 0 — scaffolding)

- [ ] Scaffold Next.js App Router project at repo root (`app/`, `public/`)
- [ ] Add PWA config (`manifest.json`, service worker stub)
- [ ] Configure Google Fonts (Space Mono, Chakra Petch) via root layout
- [ ] Create `lib/tokens.js` with `AFF_COLORS`, `ACTION_COLORS`, `CHROME`, `MONO`, `CHAKRA`, layout constants
- [ ] Create `lib/blobD.js` (seeded quadratic bezier blob path generator)
- [ ] Set up Zustand store skeleton (`stores/gameStore.js`)
- [ ] Add lint (ESLint), formatter (Prettier), and basic `package.json` scripts (`dev`, `build`, `lint`, `typecheck`)
- [ ] Decide on TypeScript vs JS — prototype is JS; lean JS for v1, revisit at Pass 3
- [ ] Add minimal CI (GitHub Actions: lint + build on PR)

## Next (Pass 1 — playable core loop)

Goal of pass: prove the loop feels good. Single petri, single dish slot, no economy, no skill trees.

**Shell + chrome**
- [ ] `components/shell/AppHeader.jsx` — logo + currency + store button + settings
- [ ] `components/shell/NavPill.jsx` — floating 5-item bottom pill
- [ ] `components/shell/Grid.jsx` — ambient background grid
- [ ] Wire up shared tick (`setInterval` 160ms) at app root, pass down as prop
- [ ] Wave header divider (SVG, sin-driven)
- [ ] Ambient floating particles (7 dots, sin y-motion)

**Lab screen**
- [ ] `components/lab/Porthole.jsx` — ring + bolts + radial fill
- [ ] `components/lab/PetriDish.jsx` — SVG node graph with blob rendering
- [ ] Node rendering stack (8 layers: ambient glow → hot centre)
- [ ] Mycelium edges (curved quad bezier, seeded)
- [ ] `components/lab/LabScreen.jsx` — absolute-centred dish, overlays (dish switcher, level/XP bar, shipment card)
- [ ] Dish stats readout (DISH / NODES / STABLE%)

**Node interaction**
- [ ] `components/lab/NodeModal.jsx` — 60%-width centred modal, affinity bar + stat grid + action buttons
- [ ] Stat colour rules (volatility 4-step scale; others white by opacity)
- [ ] Outside-click close (mousedown listener on modal content ref)
- [ ] Five actions wired to store mutations

**Game logic**
- [ ] `lib/gameLogic.js` — property math: inheritance, chaos noise, volatility decay
- [ ] Collapse rolls (leaf/child only, chaos-driven blast radius)
- [ ] Stabilise / Catalyse / Contain / Discard / Harvest resolution
- [ ] Node state machine (alive / stable / volatile / contained / harvested-stub / scar)
- [ ] Drag-ingredient-to-node mutation path
- [ ] Tap-tap combine mutation path

**Time delta + persistence**
- [ ] `lib/timeDelta.js` — offline sim on app open (shipment accrual, collapse rolls, volatility ticks)
- [ ] "While you were away" summary screen
- [ ] localStorage save/load (throttled per action)

**Shipments (Pass 1 subset: stabiliser + ingredients only)**
- [ ] Shipment queue accrual logic
- [ ] Floating shipment card on Lab screen
- [ ] `components/screens/ShipmentsScreen.jsx` — queue + collect
- [ ] SH1 shipment collect animation (gentle shake → empty → stub fade-in)

**Journal + Library (basic)**
- [ ] `components/screens/InventoryScreen.jsx` — Compounds + Materials tabs
- [ ] `components/screens/DiscoveriesScreen.jsx` — 3-column grid, known + placeholders
- [ ] `components/shared/BlobIcon.jsx`, `GeomIcon.jsx`, `AffBadge.jsx`

**Animations (from anim spec — Tier 1 + T1–T4 micro)**
- [ ] S1 stable pulse rings
- [ ] S2 stable circle + diamond grid (clipPath)
- [ ] S3 stable edge ripple (bezier-traced)
- [ ] V1 volatile erratic jitter (ambient state)
- [ ] C1 collapse shockwave
- [ ] H1 harvest particle burst
- [ ] T1 stabilise micro
- [ ] T2 catalyse spark
- [ ] T3 contain frost (seed-matched clipPath)
- [ ] T4 discard burn

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

---

**Conventions**
- Check items off (`[x]`) when complete and move to `Done` with the date.
- Keep `Now` to 1–3 active items at any moment.
- Add notes/links inline under an item when helpful.
- Pass boundaries are guidance, not walls — shift items between passes if scope changes.
