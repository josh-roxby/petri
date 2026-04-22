# PETRI — Game Spec v0.2

**Project:** Petri  
**Format:** Mobile-first PWA  
**Genre:** Sandbox fictional science / idle-adjacent  
**Status:** UI prototype complete — cleared for Pass 1 build

**Changelog v0.1 → v0.2**
- §16 open questions resolved (visual direction, ingredient roster, affinity enum)
- §17 UI Architecture updated to reflect locked prototype decisions
- §18 Node interaction model added (centred modal, button system, stat colour rules)
- §19 Layout system added (fixed shell, inner scroll)
- Visual direction locked — companion doc: petri-design.md
- Code basis locked — companion doc: petri-ui-codebasis.md

---

## 0. One-Line Pitch

Grow mutating compounds in a petri dish, balance volatility against potency, harvest what survives, sell it to fund deeper experiments.

---

## 1. Core Loop

**Macro loop:** experiment → discover → stabilise → harvest → sell → reinvest → unlock → experiment bigger.

**Session loop (per check-in):**
1. Collect pending shipments
2. Read the state of each petri (what mutated, what's volatile, what collapsed)
3. Apply actions — stabilise the valuable, discard the dangerous, catalyse the stuck
4. Harvest what's ready
5. Seed new growth with ingredients
6. Visit store if selling or restocking
7. Close app — sim keeps running via time-delta on next open

**Goal hierarchy:**
- Short-term: keep dishes alive, harvest materials
- Mid-term: fully stabilise a petri for big XP
- Long-term: level up skill trees, unlock rarer ingredients, grow more complex compounds, unlock dish slots

---

## 2. Property & Math Systems

### Compound property vector

Every node carries:

| Property | Range | Mutable? | Role |
|---|---|---|---|
| **Potency** | 0–100 | Yes (inheritance + mutation) | Sale value, harvest yield, visual size |
| **Volatility** | 0–100 | Yes (stabilise reduces; starts high) | Collapse probability + timing, harvest penalty |
| **Purity** | 0–100 | Yes (inheritance + mutation) | Sale quality multiplier, visual glow |
| **Toxicity** | 0–100 | Yes (inheritance + mutation) | Affects some sales categories, visual spikes |
| **Chaos** | 0–100 | **No — permanent at birth** | Collapse blast radius, mutation variance, visual jitter |
| **Affinity** | Enum (acid, enzyme, mineral, organic, synthetic, + unlockables) | Inherited dominant | Hue, combo rules |

### Inheritance rule

Child node numeric properties = weighted average of parent(s) + mutation noise. Noise amplitude scales with parent volatility AND parent chaos.

- One-parent (drag ingredient onto node): child is 70% parent / 30% ingredient, + noise
- Two-parent (tap-tap combine): 50/50 blend, + higher noise (combinations are more chaotic)

### Chaos effects

Chaos is the permanent "temperament" stamp. High chaos means:
- Wider mutation variance on children born from this node
- **Chance of no child produced** on mutation (material sink)
- **Chance of multiple children produced** on mutation (bonus growth)
- Larger collapse blast radius if volatility tips over
- Stronger visual jitter

### Volatility lifecycle

- Born high (e.g. 60–90 depending on parent chaos + combo type)
- Each **Stabilise** action reduces volatility by a small amount (~1–4 points, skill-modified)
- Estimated 25–100 stabilise applications to reach 0 depending on starting volatility and skill level
- Once volatility hits 0, node is **permanently stable** — cannot go volatile again
- While volatility > 0, node has a rising % chance per tick of collapse. Stabilising reduces both probability AND the timing window

### Collapse mechanics

- Only **leaf/child nodes** collapse passively — no mid-tree spontaneous collapse
- Exception: **Bio-incinerator** at low skill can damage mid-tree (this is the tool's identity)
- Collapse blast:
  - Base: the node itself burns
  - Chaos-driven: % chance of damaging siblings and/or parent scaled by chaos value
  - Damaged neighbours get a volatility spike, not automatic death
- Burnt nodes leave visible charcoal scars — that branch path is dead, cannot regrow from it

---

## 3. The Five Actions

All actions are **per-node interactions** via the node's popover. No bottom-bar action bar.

| Action | Cost | Cooldown | Effect |
|---|---|---|---|
| **Stabilise** | 1× Stabiliser | Short | Reduce volatility by skill-scaled amount |
| **Catalyse** | 1× Basic Ingredient | Short | Force a mutation tick — spawns a child (or multiple / none, per chaos) |
| **Contain** | 1× Plasm/Gel | Medium | Freeze node — no mutation, no collapse risk, no growth from it. Reversible (removes gel) |
| **Discard** | Bio-incinerator fuel | Medium | Destroy target node. Risk of damaging neighbours/parent at low Tooling skill |
| **Harvest** | Free | Scaled by volatility | Extract material — outcome depends on stability, harvest skill, potency |

### Node popover

Tapping any node opens a small modal showing:
- Compound ID / structural string (procedurally generated name)
- Property readouts (potency, volatility, purity, toxicity, chaos, affinity)
- Grade / quality indicator
- Action buttons (contextual — hidden if locked or unavailable)
- Parent lineage reference

---

## 4. Shipments & Consumables

Free materials arrive periodically. Player clicks to collect. Queue caps at 3–5 per shipment type to prevent stockpiling from long absences.

| Consumable | Source | Base Cadence | Notes |
|---|---|---|---|
| **Stabiliser** | Free shipments | ~30 min | Core resource, frequent |
| **Basic ingredients** | Free shipments | ~2 hrs | Drives Catalyse + new dish seeding |
| **Plasm/Gel** (name TBC) | Free shipments, unlocked via Funding tree | ~6 hrs | Contain fuel |
| **Bio-incinerator fuel** | Store purchase only | N/A | Discard fuel, costs money |
| **Rare/Epic ingredients** | Store (rotating), rare drops from odd pairings | N/A | Advanced compounds |

**Funding skill tree** reduces time between shipments and increases queue caps.

**Offline accrual:** shipments queue up while away, capped. Log in after a week = still only 3–5 per type waiting.

---

## 5. Harvest System

Harvest is **free but cooldown-gated**. No material cost.

### Harvest resolution formula

```
success_chance = base_skill_roll × stability_modifier
yield_quantity = skill_tier × potency_factor
quality_grade  = skill_tier × purity × (1 - toxicity_penalty)
cooldown_time  = base_cd × volatility_factor
```

### Stable vs. unstable harvest

| State | Success rate | Cooldown | Outcome |
|---|---|---|---|
| **Stable (volatility 0)** | High | Short | **One-shot.** Node becomes inert stub. Counts toward petri-completion XP. Cannot be harvested again. |
| **Unstable (volatility > 0)** | Lower (scales with volatility) | Longer (scales with volatility) | **Repeatable.** Each harvest slightly raises volatility. No harvest cap per node for now. Milk-it strategy available. |

### Harvest skill tree (standalone tree)

- **Tier unlocks:** compound rarity tiers 1–N
- **Precision:** success % at each tier
- **Refinery:** quality grade multiplier
- **Yield:** quantity per successful harvest
- **Speed:** cooldown reduction

### Tech tree perks (interleaved within harvest tiers)

Examples (to be expanded during build):
- "Harvest toxic without penalty"
- "Harvest unstable without volatility spike"
- "Double yield on rare compounds"
- "Stable harvests leave a seeded stub that re-grows a fresh child"

---

## 6. Mutation & Mix UX

### Two interaction paths

1. **Drag ingredient → node** = extend, spawn new child branching off that node
2. **Tap node A → tap node B** = cross-pollinate, spawn new child from both

### Mutation triggers

- **Catalyse** action (player-driven)
- **NOT** spontaneous/passive between check-ins for v1 — keeps the time-delta sim reasonable

### Landmark compounds

Hybrid system = emergent properties + a small set of **landmark discoveries** that act as guaranteed progression gates. Some combos deterministically produce named compounds that unlock tech tree nodes, journal entries, new ingredient slots.

---

## 7. Node Graph Visuals

### Visual language (locked)

| Visual Channel | Property |
|---|---|
| **Hue** | Affinity (family) |
| **Saturation + glow** | Purity |
| **Size** | Potency |
| **Pulse rate** | Volatility (slow = stable, rapid = about to collapse) |
| **Spikes / thorns on edge** | Toxicity |
| **Jitter / wobble** | Chaos |
| **Edge thickness to parent** | Inheritance strength |

### Aesthetic

Organic petri dish vibe + literal branching tree node graph. Nodes are living cells. Edges are visible bonds. Entire surface has subtle CSS/SVG texture (petri glass, faint grid, bio-glow).

### States

- **Alive + growing** — pulsing, full colour
- **Stable (vol 0)** — steady glow, no pulse, ring indicator
- **Contained** — frozen visual, crystalline overlay
- **Harvested stub (from stable)** — dim, inert, still takes up position
- **Collapsing (final window)** — violent jitter, rapid pulse, warning colour bleed
- **Burnt scar** — charcoal, cracked, no edges forward

---

## 8. Store (Thin v1)

### Sell side

- Single abstract market
- Prices randomised daily within preset ranges per rarity × quality grade
- No named buyers, no demand curves (v2)

### Buy side

- 2–3 daily rotating rare/epic ingredient slots
- Prices also randomised within preset range
- Bio-incinerator fuel available on-demand (not rotating)
- Higher-tier ingredients gated by player level

---

## 9. Skill Trees

### Three parallel trees, each earning XP from its own activity

**Harvest tree** (XP from harvesting)
- Tier unlocks (compound rarity ceiling)
- Success % per tier
- Quality multiplier
- Yield quantity
- Cooldown reduction
- Interleaved tech/perk nodes

**Funding tree** (XP from store sales)
- Shipment cadence reduction
- Shipment queue cap increase
- Unlock plasm/gel shipments
- Sale price multipliers
- Unlock rarer store rotation slots

**Tooling tree** (XP from using tools — primarily Catalyse, Discard)
- **Bio-incinerator: Precision** (reduces chance of damaging neighbours/parent)
- **Bio-incinerator: Efficiency** (reduces fuel consumption)
- Catalyse boost chance
- Contain duration / cost reduction
- Action cooldown reduction

### Player level (separate from skill trees)

Fed by: new discoveries + store sales + per-cell stabilisation XP + petri-completion bonus.

Gates:
- Dish slot unlocks (start 1 → unlock 2nd at ~L5, 3rd at ~L12, etc.)
- Compound tier access ceiling
- Some tech tree nodes

---

## 10. XP Sources

| Source | XP Event |
|---|---|
| New compound discovered (first time) | Lump sum, scales with tier |
| Per-cell stabilisation (volatility → 0) | Small drip per node |
| Full petri stabilisation (all nodes stable) | Big lump sum, scales with node count + complexity |
| Store sale | Proportional to sale value |
| Harvest | Feeds Harvest tree, not player level |
| Using tool | Feeds Tooling tree, not player level |
| Selling | Feeds Funding tree, not player level |

**Design intent:** full-petri stabilisation is the prestige goal. Player must decide when to lock in XP (one-shot harvest for stable nodes) vs. keep milking unstable material.

---

## 11. Journal + Library

**Discovery Journal** — Pokédex-style. Every unique compound ever produced. Read-only. Shows lineage, properties, rarity, first-discovered-on.

**Harvest Library** — Inventory of harvested compounds you currently own (stock counts). This is what feeds the sell side of the store.

Two separate screens. Journal is memory, Library is assets.

---

## 12. Save & Sync

### v1 (prototype phase through MVP)
- **Anonymous localStorage** save. No account required. Zero friction.
- Full game state persists client-side.
- Client-side time-delta sim runs on app open.

### v2 (post-pilot)
- Render-hosted backend, auth via magic link or OAuth
- Cloud save with cross-device sync
- "Upgrade to account" flow that migrates local save up

### Time simulation (both phases)
- On app open: compute elapsed time since last close
- Advance all volatility timers, collapse rolls, mutation ticks (if any), shipment accrual
- Resolve collapses in order
- Apply results, show player a summary of what happened while away

### Cron (v1)
- Vercel cron or GitHub Actions scheduled workflow
- Used for: daily store rotation seed, any server-side timed events
- Zero per-user compute — all user sim remains client-side on check-in

---

## 13. Cadence & Check-In Design

- **Casual idle** — designed for 2–4 hour gaps, 2–3 check-ins per day
- **Minimum viable session** ~2 min (collect shipments, quick actions)
- **Deep session** 20–30 min (active stabilising, harvesting, store visits, planning new petris)
- Volatility 1-hour warning window survives this cadence without being punishing

---

## 14. Build Plan — Sequenced Passes

### Pass 1 — Playable core loop (no economy, no skill trees)
- Single petri, single dish slot
- Drag ingredient + tap-combine mutation
- Property system full math
- Volatility / chaos / collapse
- 5 actions working
- Node graph viz with full visual grammar
- Popover
- Journal + Library (basic)
- Local save, time-delta on open
- Shipments (stabiliser + ingredients only)
- **Goal of pass:** prove the loop feels good

### Pass 2 — Economy
- Store (buy + sell, daily rotation)
- Bio-incinerator fuel purchase
- Plasm/gel unlock pathway
- Full shipment system with all consumables
- Daily rotation cron

### Pass 3 — Progression
- All three skill trees
- Tech/perk tree
- Player level + dish slot unlocks
- XP pipe across all sources
- Harvest tier gating

### Pass 4 — Polish
- Landmark compound discoveries
- Journal depth, lineage viewer
- Visual polish (CSS/SVG detail, animations)
- Sound design (optional)
- PWA install + offline shell
- Performance pass on large graphs

### Pass 5 — Backend (post-pilot)
- Render backend
- Auth + cloud save
- Account upgrade migration
- Server-side validation of key events (anti-cheat if public)

---

## 15. Tech Stack (locked from Lab standard)

- **Frontend:** Next.js (PWA config)
- **Hosting:** Vercel
- **Backend (Pass 5):** Render
- **State:** React + Zustand (or similar) + localStorage v1
- **Graph viz:** SVG with CSS animation for prototype; reassess canvas/WebGL if perf demands
- **Cron:** Vercel cron (v1), Render scheduled jobs (v2)

---

## 16. Open Questions / Deferred

### Resolved since v0.1

| Question | Resolution |
|---|---|
| Visual art direction | Locked — see petri-design.md |
| Starting ingredient roster | 6 ingredients, one per affinity + neutral. Viridis Extract, Ferric Salt, Lysate, Corrosive A, Nullite, Aether Trace. See §2 for base stats. |
| Affinity enum | Locked: Organic, Enzyme, Acid, Mineral, Synthetic + 2–3 unlockables via landmark discoveries |
| Node interaction model | Centred modal (60% width). See §18. |
| Level + XP display location | Lab screen overlay, above/beside porthole. Not in header. |
| Petri switcher UI | Modal carousel, mini dish previews, tap to switch |
| Material icons | White geometric shapes — distinct per type. See §18. |

### Still open

- Plasm/Gel final name
- Landmark compound list (the guaranteed discovery gates)
- XP curve constants (linear vs exponential per source)
- Store price ranges per tier
- Volatility decay formula constants (placeholder for Pass 1, tune in Pass 2)
- Audio / sound design (Pass 4)
- Named buyer system (v2)
- Passive mutation between check-ins (v2)
- Demand curves / market dynamics (v2)
- Monetisation (not in scope)

---

## 17. UI Architecture

### App Shell Layout (locked)

```
┌─────────────────────────────┐  ← height: 100vh, overflow: hidden
│  HEADER  (56px, fixed)      │  ← never scrolls
├─────────────────────────────┤
│                             │
│  CONTENT AREA               │  ← flex:1, overflow:hidden, paddingBottom:80px
│  (each screen scrolls       │    each screen: height:100%, overflowY:auto
│   independently here)       │
│                             │
├─────────────────────────────┤
│  NAV PILL (position:abs)    │  ← always pinned bottom:20px
└─────────────────────────────┘
```

**Critical rule:** The shell never scrolls. Only the inner content area of each screen scrolls. Header and nav are always visible on every screen.

### Header (fixed)

| Position | Element |
|---|---|
| Left | PETRI wordmark + LAB label |
| Centre | Currency dot + balance |
| Right | STORE button + settings icon |

### Bottom Nav — floating pill, not full width

| Position | Item | Notes |
|---|---|---|
| 1 | Inventory (◈) | Badge on new items |
| 2 | Shipments (▣) | Badge when ready to collect |
| 3 centre | Lab (◉) | Default landing. White filled circle, elevated |
| 4 | Discover (◎) | Badge on new discovery |
| 5 | Skills (⬡) | All trees in one screen |

### Lab Screen

- Petri dish **absolutely centred** (`position:absolute, top:50%, left:50%, transform:translate(-50%,-50%)`) in the available space between header and nav — unaffected by any other UI elements
- Dish stats row (DISH / NODES / STABLE%) sits directly below the porthole, moves with it
- Top-left overlay: dish switcher button (☰ Dish Name)
- Top-right overlay: LVL + XP bar
- Floating shipment card: top-left, appears when shipments are ready
- Petri switcher: centred modal carousel on dish-switcher tap

### Store (accessed from header)

Bottom sheet overlay. Three tabs:
- **Buy** — staple ingredients, prices fixed per session
- **Sell** — owned compounds, daily price range slider showing today's value
- **Special** — time-limited offers with countdown

### Shipments

Two collection points:
1. Floating card on Lab screen (top area) — tap to collect in context
2. Shipments screen — full queue, cadence info, Funding tree upgrade links

### Inventory

Two tabs:
- **Compounds** — blob icon + name + affinity badge + tier + grade + quantity
- **Materials** — 2-column grid, white geometric icons (distinct shape per type), quantity + fill bar

### Discoveries

3-column grid. Known compounds show blob icon + name + rarity. Unknown show dashed circle placeholder. Tap to expand detail panel below grid.

### Skills

Three sub-tabs: Harvest / Funding / Tooling. Each shows:
- Tree XP bar
- SVG tree with tier labels (T1–T4), edge lines, circle nodes
- Active = white fill + dot. Unlocked = dim. Locked = hollow + lock glyph
- Tap node → detail card below with description + activate/unlock button

---

## 18. Node Interaction Model (locked)

### Centred Modal

Tapping any node opens a **centred modal** — not anchored to the node, not a bottom drawer.

```
Width:  60% of screen
Height: auto (content-driven)
Position: absolute, centred with backdrop blur
Close:  tap outside OR × button
```

**Modal structure top to bottom:**

1. **Affinity colour bar** — 3px gradient strip, only decorative colour element on the frame
2. **Header row** — affinity dot (coloured) · compound name · state label (grey)
3. **Affinity badge** — coloured chip (only coloured element in the info section)
4. **Compound ID strip** — grey monospace
5. **2×2 stat grid** — Potency / Volatility / Purity / Chaos
6. **2×2 action button grid** — Catalyse / Harvest / Contain / Discard
7. **Full-width Stabilise** — primary action, white, below the grid

### Stat colour rules

| Stat | Bar colour | Value colour |
|---|---|---|
| Potency | White 30% | White 75% |
| Volatility | **Colour-coded** by % | Same as bar |
| Purity | White 30% | White 75% |
| Chaos | White 22% | White 55% |

**Volatility colour scale:**
- 0 (stable) → `#1fcc79` emerald
- 1–29 → `rgba(180,220,100,0.8)` lime-yellow
- 30–59 → `rgba(255,200,50,0.85)` amber
- 60–100 → `#ff5533` coral red

### Action button system

All five actions use **white chrome** with a **coloured dot** — no coloured button backgrounds.

| Action | Dot colour | Notes |
|---|---|---|
| Catalyse | `#f5c842` yellow | Consistent regardless of affinity |
| Harvest | `#1fcc79` emerald | |
| Contain | `#44aaff` sky blue | |
| Discard | `#ff5533` coral | |
| Stabilise | White | Full-width primary, no dot when disabled |

### Material icons (Inventory + Shipments)

White geometric SVG icons — square-oriented, distinct per type. No organic/blob shapes.

| Material | Icon shape |
|---|---|
| Stabiliser | Rotated square (diamond) |
| Basic Ingredient | Flat hexagon |
| Plasm/Gel | Nested squares |
| Bio-Inc. Fuel | Triangle |
| Catalyst Pack | Cross / plus |
| Antidote Vial | Pill / capsule |

---

## 19. Layout Rules (locked)

1. **Shell is always `height:100vh, overflow:hidden`** — nothing escapes it
2. **Header never moves** — `flexShrink:0`, always visible
3. **Nav always pinned** — `position:absolute, bottom:20px, zIndex:30`
4. **Content area** — `flex:1, overflow:hidden, paddingBottom:80px`. Screens scroll inside this.
5. **Each screen** — `height:100%, overflowY:auto`. Title/controls at top, content scrolls below.
6. **Lab dish** — `position:absolute, top:50%, left:50%, transform:translate(-50%,-50%)`. Always geometrically centred. Never affected by surrounding overlay elements.
7. **Modals and overlays** — rendered at app root level (`position:absolute, inset:0, zIndex:55+`) so they always cover full shell

---

## Sign-off

v0.2 reflects all prototype decisions. Pass 1 build can begin from this document + petri-design.md + petri-ui-codebasis.md.
