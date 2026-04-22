# PETRI — Design Language v0.2

**Companion to:** petri-spec.md  
**Status:** Locked — prototype validated

**Changelog v0.1 → v0.2**
- §9 added: Prototype-confirmed UI patterns
- §10 added: Material icon system
- Node modal colour rules confirmed from prototype iteration

---

## 0. Design Philosophy

Petri's UI has one job: disappear. The science happening inside the dish is the product. Every chrome decision — header, nav, panels, text — exists only to frame and surface what's growing, not to compete with it.

**Two visual registers, strict separation:**

| Register | What it covers | Palette |
|---|---|---|
| **Chrome** | All UI structure — header, nav, frames, labels, grids, glows, particles | White / grey / black only |
| **Biology** | Compound nodes, affinity indicators, highlighted compound data, active menu states | Vivid affinity colors only |

Color means something alive. If it's not a cell or a piece of data *about* a cell, it's greyscale.

---

## 1. Color System

### Chrome palette (UI structure)

| Token | Value | Usage |
|---|---|---|
| `--bg-primary` | `#060606` | App background |
| `--bg-dish` | `#090909` | Interior of petri dish |
| `--bg-surface` | `rgba(10,10,10,0.97)` | Cards, nav, panels |
| `--border-subtle` | `rgba(255,255,255,0.07)` | Porthole rings, panel edges |
| `--border-mid` | `rgba(255,255,255,0.12)` | Active borders, nav outline |
| `--text-primary` | `#ffffff` | Logo, headings |
| `--text-body` | `rgba(255,255,255,0.55)` | Labels, values |
| `--text-muted` | `rgba(255,255,255,0.25)` | Captions, metadata |
| `--glow-ambient` | `rgba(255,255,255,0.025)` | Radial background glow |
| `--grid-line` | `rgba(255,255,255,0.1)` at `opacity: 0.28` | Grid lines — effectively ~3% |

### Affinity color palette (biology only)

| Affinity | Token | Hex | Usage |
|---|---|---|---|
| Organic | `--aff-organic` | `#a3dd28` | Lime |
| Enzyme | `--aff-enzyme` | `#1fcc79` | Emerald |
| Acid | `--aff-acid` | `#ff5533` | Coral red |
| Mineral | `--aff-mineral` | `#44aaff` | Sky blue |
| Synthetic | `--aff-synthetic` | `#cc66ff` | Violet |

Unlockable affinities (added post-launch, names TBC) follow the same rule — one distinct vivid hue each.

### Volatile / state colors

| State | Color | Context |
|---|---|---|
| Volatile warning | `rgba(255,255,255,0.3)` on ring | Chrome ring only — not the node fill |
| Collapse imminent | Node own affinity color pulses intensely | The cell itself signals danger |
| Scar | `rgba(20,20,20,0.85)` fill + `rgba(255,255,255,0.08)` stroke | Greyscale — it's dead |
| Harvested stub | Affinity color at low opacity, dashed stroke | Still biologically coloured, visually ghosted |
| Stable | Affinity color at full + white hot centre | Brightest state |

---

## 2. Typography

| Usage | Font | Weight | Size | Color |
|---|---|---|---|---|
| Logo / wordmark | Space Mono | 700 | 13px | `#ffffff` |
| Nav labels | Space Mono | 400 | 6px | `rgba(255,255,255,0.2)` |
| Data readouts | Space Mono | 400 | 8–9px | `rgba(255,255,255,0.5–0.65)` |
| Metadata / captions | Chakra Petch | 300 | 7px | `rgba(255,255,255,0.25)` |
| UI labels | Chakra Petch | 500 | 7–8px | `rgba(255,255,255,0.35)` |
| Compound IDs (future) | Space Mono | 400 | 5–6px | Affinity color at 45% opacity |

**Rule:** monospace everywhere in the chrome. It reads as scientific instrumentation.

---

## 3. Core UI Motifs

### 3.1 The Grid

A soft square grid underpins every screen.

```
backgroundImage: linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                 linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
backgroundSize: 28px 28px
opacity: 0.28   // ← results in ~3% effective opacity. Soft but present.
```

The grid is structural atmosphere — it should be perceived subconsciously, not read. Never increase opacity above 0.35 globally. It can pulse or intensify locally (e.g. around a volatile node) as a UI effect.

### 3.2 The Circular

Circular forms are the primary container language. The petri dish is a circle. The porthole is a circle. The Lab nav button is a circle. The primary action on any screen should live inside a circular boundary.

**Porthole frame construction:**
- Outer ring: 3px border, `rgba(255,255,255,0.08)`
- Middle ring: 1px border, `rgba(255,255,255,0.07)`, inset 4px
- 4 bolts at cardinal points: 6×6px circles, `rgba(255,255,255,0.12)` fill, `rgba(255,255,255,0.18)` border
- Inner dish: dark radial fill `rgba(12,12,12,0.85) → rgba(4,4,4,0.95)`
- Overflow: hidden (nodes clipped to circle)

The grid and the circle together define Petri's spatial language. Every new screen should be asked: where is the circle, and where is the grid?

### 3.3 Glows and Depth

Glows are white, ambient, and restrained. They suggest depth and light source without competing with node color.

- **Ambient background glow:** `radial-gradient(ellipse at 50% 42%, rgba(255,255,255,0.025) 0%, transparent 65%)`
- **Porthole outer shadow:** `0 0 40px rgba(255,255,255,0.03)`
- **Nav pill shadow:** `0 8px 40px rgba(0,0,0,0.9), 0 2px 8px rgba(0,0,0,0.98)`
- **Lab nav button (active):** `0 0 20px rgba(255,255,255,0.18)`

**Node glows are the exception** — they use the node's affinity color. This is intentional and is what makes the nodes read as alive. All other glows remain white.

### 3.4 Floating Particles

Small ambient particles drift on the screen — present but unobtrusive.

```
7 particles
width/height: 1.5px, border-radius: 50%
color: rgba(255,255,255,0.5)
opacity: 0.15 + sin(tick * 0.04 + i) * 0.12  // ~0.03–0.27 range
position: distributed across top third of screen
motion: sin wave on y-axis, slow tick
```

Particles reinforce the "contained environment" feeling without animation complexity.

### 3.5 Wave Header Divider

The header/body boundary uses an animated SVG wave instead of a hard border line.

```svg
viewBox="0 0 320 8"
path: M0,{4+wave} Q80,{1+wave} 160,{4+wave} Q240,{7+wave} 320,{4+wave}
stroke: rgba(255,255,255,0.1)
strokeWidth: 1
wave amplitude: sin(tick * 0.05) * 2.5
```

Slow, barely perceptible movement. The header breathes.

---

## 4. Node Visual Grammar

All compound nodes are **blob-shaped** (organic irregular paths, not circles). Shape is computed from a seed based on node ID — same node always renders the same blob.

| Visual property | Maps to compound property | Notes |
|---|---|---|
| **Hue** | Affinity | Fixed per affinity family — the color system above |
| **Size (radius)** | Potency | Larger node = more potent compound |
| **Glow ring intensity** | Purity | Brighter/more defined outer rings = purer compound |
| **Pulse rate** | Volatility | Slow steady = stable. Rapid = volatile. Violent jitter = collapse imminent |
| **Jitter / wobble** | Chaos | Inherited permanent chaos drives how erratic the animation is |
| **Spikes / rough edge** | Toxicity | High toxicity produces more jagged blob paths (seed-driven) |
| **Edge thickness to parent** | Inheritance strength | Thicker mycelium edge = stronger parent influence |

### Node states (visual summary)

| State | Fill | Stroke | Outer rings | Animation |
|---|---|---|---|---|
| Alive | Affinity + `28` opacity | Affinity, 1.6px | Faint color halos | Gentle drift |
| Stable | Affinity + `28` opacity | Affinity, 1.6px | Strong color halos + white chrome ring | Slow breathe |
| Volatile | Affinity + `28` opacity | Affinity, 1.6px | White warning ring, intensifying | Jitter scaled by chaos |
| Harvested | Transparent | Affinity at 50%, dashed | None | None |
| Scar | Near-black | White 8% | None | None |

### Edges (mycelium)

Edges between nodes are curved quadratic bezier paths — not straight lines. Curvature is deterministic per edge (seed-based) so the graph looks organic but is consistent.

```
stroke: rgba(255,255,255,0.14)   // alive edge
stroke: rgba(255,255,255,0.05)   // scar edge
strokeWidth: 1.2 / 0.5
strokeLinecap: round
```

Edges carry **no color**. Color belongs to nodes only.

---

## 5. Screen-by-Screen Application

### Lab (primary screen)

- Full-width porthole dish, centered
- Header: wave divider, logo left, currency + settings right
- Soft grid behind everything
- Shipment card: top-left, grey chrome
- Store button: top-right, grey chrome
- Level/XP: below porthole, minimal grey readout
- Dish stats: below level, pipe-separated grey labels

### Inventory

- Compounds tab: each compound rendered as a small blob node (affinity color) + grey data readout
- Materials tab: grey count cards — no color unless a material is rare (then affinity color accent on the count)
- Grid continues behind content

### Shipments

- Grey chrome card list — collection state uses a subtle white glow on the card
- Collected items shown in affinity color briefly on collect (flash transition)
- Cadence info and upgrade progress in grey

### Discoveries (journal)

- Each discovered compound: blob node icon (affinity color) + grey metadata
- Undiscovered: grey placeholder silhouette
- First-discovery moment: affinity color glow burst (the one animation exception)

### Skills

- Tree nodes: grey chrome circles/hexagons
- Active/unlocked nodes: white fill, white glow
- Locked nodes: `rgba(255,255,255,0.1)` fill
- Skill lines/branches: white at low opacity
- Exception: when a skill directly relates to an affinity (e.g. "harvest toxic"), the node gets a faint affinity color accent border only

### Store

- Buy/Sell/Special tabs: grey chrome
- Compound listings: blob icon in affinity color + grey price/rarity data
- Special slot: slightly brighter white border to signal urgency — no color added

---

## 6. Animation Principles

Animations should feel biological, not mechanical.

- **Organic motion:** sin waves, not linear transitions
- **Slow by default:** most animations run on a 160ms tick — leisurely
- **Volatile acceleration:** the only fast animation is a node approaching collapse
- **No bounce, no spring physics in chrome:** bounce belongs to nodes, not UI
- **Glow changes:** opacity crossfade only, never scale
- **Color never transitions in chrome:** a grey element stays grey — it just becomes more or less visible
- **Affinity color is always full saturation:** never tint or desaturate a node color as a state indicator — use opacity and glow intensity instead

---

## 7. CSS Variable Reference

```css
:root {
  /* Chrome */
  --bg-primary: #060606;
  --bg-dish: #090909;
  --bg-surface: rgba(10,10,10,0.97);
  --border-subtle: rgba(255,255,255,0.07);
  --border-mid: rgba(255,255,255,0.12);
  --text-primary: #ffffff;
  --text-body: rgba(255,255,255,0.55);
  --text-muted: rgba(255,255,255,0.25);
  --glow-ambient: rgba(255,255,255,0.025);
  --grid-line: rgba(255,255,255,0.1);
  --grid-opacity: 0.28;
  --grid-size: 28px;

  /* Biology */
  --aff-organic: #a3dd28;
  --aff-enzyme: #1fcc79;
  --aff-acid: #ff5533;
  --aff-mineral: #44aaff;
  --aff-synthetic: #cc66ff;

  /* Layout */
  --dish-size: 262px;
  --porthole-bolt-size: 6px;
  --nav-height: 52px;
  --nav-width: 286px;
  --nav-radius: 26px;
  --header-height: 56px;
  --grid-step: 28px;
}
```

---

## 8. What Never Changes

These are non-negotiable across every screen, every component, every state:

1. **Chrome is white/grey/black. Always.** No exceptions outside the node system.
2. **Affinity colors live on cells and cell data only.** A skill tree node is grey. A skill that affects acid compounds gets an acid-colored border — the node itself stays grey.
3. **The grid is always present.** It may be hidden behind content but it underlies every surface.
4. **The circular motif applies to primary containers.** The dish is a circle. Primary actions (Lab nav button) are circles. If you're designing a primary screen, find the circle first.
5. **Glows are white except on nodes.** Node glows use affinity color. Everything else glows white.
6. **No color in edges.** Mycelium edges are white at low opacity. Color only radiates from the nodes themselves.

---

## 9. Prototype-Confirmed UI Patterns

These patterns were iterated and locked during the interactive prototype phase.

### Node Modal

The node interaction surface. Centred, 60% width, auto height.

**Colour rule — strictly enforced:**
- Affinity colour appears on: top accent bar (3px), header dot, affinity chip
- Everything else is white / grey chrome — borders, backgrounds, text, stat bars (except volatility)
- Modal border: `rgba(255,255,255,0.18)` — never affinity-coloured
- Box shadow: white-only — `0 24px 64px rgba(0,0,0,0.95)`

**Volatility is the only stat that gets colour.** All other stat bars (Potency, Purity, Chaos) are white at varying opacities. Volatility uses a 4-step colour scale — see spec §18.

### Action Button System

Five actions, all white chrome with a single coloured dot. No coloured backgrounds, no coloured borders.

Dot colours are **fixed and semantic** — not tied to affinity:
- Catalyse → `#f5c842` yellow (always, regardless of node affinity)
- Harvest → `#1fcc79` emerald
- Contain → `#44aaff` sky blue
- Discard → `#ff5533` coral
- Stabilise → white (full-width primary, dot only when active)

**Disabled state:** border and text drop to 6% and 18% white. No dot shown.

### Lab Screen Centering

The dish is always geometrically centred using absolute positioning — never flexbox centering. This ensures it stays centred regardless of surrounding overlay elements (shipment cards, level bar, dish switcher).

```css
position: absolute;
top: 50%;
left: 50%;
transform: translate(-50%, -50%);
```

Overlay elements (top bar, shipment card) are `position:absolute` and do not participate in the layout flow that could push the dish off-centre.

---

## 10. Material Icon System

Materials use **white geometric SVG icons** — sharp, square-oriented, distinct from the organic blob language of compounds. This separation is intentional: materials are inert tools, compounds are living things.

| Material | Shape | Key characteristic |
|---|---|---|
| Stabiliser | Rotated square (diamond) | Simple, fundamental |
| Basic Ingredient | Flat hexagon | Scientific, neutral |
| Plasm/Gel | Nested squares | Container / containment |
| Bio-Inc. Fuel | Triangle | Directional, dangerous |
| Catalyst Pack | Cross / plus | Additive, reactive |
| Antidote Vial | Pill / capsule | Medical, protective |

**Icon rules:**
- Stroke only — no fill (except the inner square of Plasm/Gel which uses a small white fill)
- `strokeWidth: 1.5`, `strokeLinecap: 'square'`, `strokeLinejoin: 'miter'`
- Colour: always white
- Opacity: 0.65 when available, 0.2 when qty === 0
- Container in Shipments screen: square-rounded tile (`borderRadius:10`), not circle

---

## 11. What Never Changes (updated)

These are non-negotiable across every screen, every component, every state:

1. **Chrome is white/grey/black. Always.** No exceptions outside the node system.
2. **Affinity colours live on cells and cell data only.** Modal border, button backgrounds, stat bars — all white/grey.
3. **Volatility is the only stat with colour.** All other property bars are white at varying opacities.
4. **Action button dots are fixed semantic colours.** Catalyse is always yellow. Not the node's affinity colour.
5. **The grid is always present.** `rgba(255,255,255,0.1)` at `opacity:0.28`, `28px` grid.
6. **The circular motif applies to primary containers.** Dish is a circle. Lab nav is a circle. Node glow halos are circles.
7. **Glows are white except on nodes.** Node glows use affinity colour. Everything else glows white.
8. **No colour in edges.** Mycelium edges are white at low opacity.
9. **Header and nav are always visible.** Shell is `height:100vh, overflow:hidden`. Screens scroll inside.
10. **Dish is always centred.** Absolute positioning, never affected by sibling layout elements.
