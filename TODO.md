# TODO

Running task list for Petri. Organised by build pass (see `petri-spec.md` §14). Move items to `Done` with a date when complete.

## Now (Pass 4 — polish, up next)

Pass 1, 2, 3 all shipped. PWA foundation landed out-of-band (installable + offline). Remaining Pass 4 priorities:

- [ ] Landmark compound discoveries (guaranteed progression gates)
- [ ] Discovery journal depth (lineage viewer, first-discovered-on, rarity)
- [ ] F1 dish-stable green glow + F2 light cascade (prestige beat for full stabilisation)
- [ ] Real PNG icons for Android launchers that prefer raster over SVG
- [ ] iOS splash screens per device size (noticeable on launch in standalone mode)
- [ ] Drag-ingredient onto node (modal Catalyse + tap-tap combine cover most cases; true drag UX deferred)

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

- [x] `components/store/StoreOverlay.jsx` — bottom sheet, Buy / Sell / Special tabs
- [x] Sell side — single abstract market, daily rotated price bands
- [x] Buy side — 3 rotating material packs, Bio-Inc. fuel always available
- [x] Vercel Cron for daily store rotation seed (endpoint stub + vercel.json)
- [x] T5 store sale flash animation
- [ ] Plasm/Gel shipment unlock pathway (currently locked in UI; needs trigger)
- [ ] All 6 shipment types wired (antidote + catalyst shipments pending)

## Later (Pass 3 — progression)

- [x] `components/screens/SkillsScreen.jsx` — three sub-tabs (Harvest / Funding / Tooling)
- [x] SVG skill tree renderer (tier labels, edges, node states)
- [x] Harvest tree nodes (tier unlocks, precision, refinery, yield, speed + perks)
- [x] Funding tree nodes (cadence, queue, plasm/gel unlock, price multipliers, rotation slots)
- [x] Tooling tree nodes (bio-inc precision/efficiency, catalyse boost, contain duration, cooldowns)
- [x] Player level system + dish slot unlocks (L5, L12, …)
- [x] XP pipe across all sources
- [x] X1 XP gain / level-up animation
- [x] T6 skill unlock animation
- [ ] Harvest tier gating on compound rarity (effects wired in `lib/skills.js`, but journal/store enforcement pending)
- [ ] `PetriSwitcher` modal carousel for multi-dish (slot unlocks work; UI deferred to Pass 4)

## Later (Pass 4 — polish)

- [ ] Landmark compound discoveries (guaranteed progression gates)
- [ ] Discovery journal depth (lineage viewer, first-discovered-on, rarity)
- [ ] Visual polish pass (CSS/SVG detail, animation refinement)
- [ ] Performance pass on large graphs (memoize `blobD()`, evaluate canvas for glow halos if >30 nodes)
- [ ] F1 dish-stable green glow
- [ ] F2 dish-stable light cascade
- [ ] D1 discovery affinity burst
- [ ] D2 discovery NEW chip
- [ ] Sound design (optional)

## Later (PWA polish — landed foundation, residual items)

- [x] Manifest with icons (SVG 192 / 512 / maskable)
- [x] Dynamic PNG apple-touch-icon via Next ImageResponse
- [x] Service worker + offline shell (precache + cache-first statics + network-first HTML)
- [x] beforeinstallprompt chip + iOS Share-sheet hint modal
- [x] Apple-web-app meta, OG/Twitter cards, `--safe-*` CSS custom properties
- [ ] Raster PNG icons at 192/512 for Android launchers that dislike SVG
- [ ] iOS splash screens per device size (launch image in standalone mode)
- [ ] "Update available" banner when a new SW is waiting (currently auto-claims on next load)

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
- [x] **2026-04-22** — Pass 1 polish: per-node per-action cooldowns (stabilise 5s, catalyse 6s, contain/discard 20s, harvest 10s × (1+vol/50)); chaos rolls on Catalyse (0/1/2 children per chaos probability); discard collateral (chaos-scaled volatility spikes on parent + siblings, contained/scar/harvested immune); `computeTimeDelta` split so in-session collapses fire C1 live while long-gap collapses populate the WhileAway modal.
- [x] **2026-04-22** — Pass 1 two-parent combine: `mutateFromTwoParents` (50/50 blend, higher noise), `buildCombinedChildNode` (dual `parents` array, dominant-parent affinity + name). `combineNodes` store action consumes 1× Ingredient, cooldowns both parents. Lab screen `⇌ COMBINE` button toggles combine mode; selection ring highlights the first parent; dish-stats strip turns into `— TAP SECOND PARENT —` hint. PetriDish renders edges for the full `parents` array so combined children show both lineage lines.
- [x] **2026-04-22** — Pass 2 economy: `lib/economy.js` (dayKey + dailyStoreSeed + mulberry32 + rollBuyInventory + rollSpecialOffer + sellPrice / sellPriceBand — all deterministic per UTC day). Store actions `refreshStoreRotation`, `sellCompound`, `buyItem`, `buySpecial` with credit math and `storeSpecialPurchased` dedup. `StoreOverlay` bottom-sheet with Buy / Sell / Special tabs (daily-band slider for sell price, countdown to next rotation, locked-already-bought state for specials). T5 renderer fires at dish centre on sell with the credit amount. Vercel Cron endpoint at `/api/cron/store-rotation` + `vercel.json` scheduling it at 00:05 UTC daily (canonical seed for v2 server-side validation).
- [x] **2026-04-22** — Pass 3 progression: `lib/skills.js` (three 9-node trees Harvest/Funding/Tooling, cumulative tier costs 100/350/800 XP, `getActiveEffects` derives flat modifier map from unlocked sets, `playerLevelFromXp` table with dish-slot gates at L5/L12). XP pipe wired in every store action — stabilise→player, harvest→harvest+player, sell→funding+player, catalyse/contain/discard→tooling. `unlockSkill` action consumes tree XP + fires T6; f3 unlock dynamically provisions a `plasmaGel` shipment queue. Cooldowns/sell-price/shipment-cadence/collateral now respect skill effects. X1 and T6 animation renderers added (X1 drives a Porthole glow via `hasX1` prop passed through LabScreen). `SkillsScreen.jsx` renders 300×320 SVG tree per tab with tier labels, edges derived from prereqs, and tap-to-unlock detail card.
- [x] **2026-04-22** — PWA foundation (out-of-band of Pass 4): `public/icons/` 192/512/maskable SVG, `app/icon.svg` favicon, `app/apple-icon.jsx` renders 180×180 PNG via Next ImageResponse. `public/sw.js` precache shell + cache-first `/_next/static` + network-first HTML + always-bypass `/api/*` + versioned cache eviction on activate. `ServiceWorkerRegistrar` mounted in root layout, production-only. `InstallPrompt` floating chip: Chrome/Edge/Android uses `beforeinstallprompt`; iOS shows a Share-sheet hint modal; session-scoped dismissal. Metadata adds appleWebApp (black-translucent), formatDetection off, OG/Twitter cards. `--safe-*` CSS custom properties for surgical safe-area insets.

---

**Conventions**

- Check items off (`[x]`) when complete and move to `Done` with the date.
- Keep `Now` to 1–3 active items at any moment.
- Add notes/links inline under an item when helpful.
- Pass boundaries are guidance, not walls — shift items between passes if scope changes.
