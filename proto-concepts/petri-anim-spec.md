# PETRI — Animation Spec v0.2

**Companion to:** petri-spec.md · petri-design.md · petri-ui-codebasis.md  
**Reference file:** petri-animlab.jsx (animation preview prototype)  
**Status:** All 18 animations locked. Ready for implementation.

**Changelog v0.1 → v0.2**
- S3 rewritten to follow existing mycelium edge bezier paths instead of drawing new straight lines
- SH1 timing reworked into three distinct phases: gentle shake → empty hold → stub fade-in. Jitter amplitude reduced from 4.5px to 1.6px
- T3 seed corrected to match the actual cell blob shape (was using `node.id*13`, now uses `node.id*13 + nodeIndex*7`)
- T5 centred at dish centre (140, 105), smoother in/out envelope
- T6 centred at dish centre (140, 105), fade-in + fade-out envelope, UNLOCKED label below icon
- F1/F2 fills now rendered as `position:absolute` divs inside the porthole's `overflow:hidden` wrapper rather than SVG shapes (SVG letterboxes inside the square porthole div)

---

## Status Legend

| Symbol | Meaning |
|---|---|
| ✅ Confirmed | Approved as-is |
| 🔁 Revised | Updated from original prototype |
| ⏳ Pending | Not yet reviewed |

---

## Tier 1 — Core loop, seen every session

### S1 — Stable: Pulse Ring ✅

**Trigger:** Node volatility reaches 0  
**Target:** The newly-stable node  
**Duration:** ~1.5s  
**Description:** Three concentric rings expand outward from the node in staggered sequence (~0.35s apart). Each ring starts tight, expands to ~4× node radius, and fades as it grows. White stroke only, no fill.  

```
Ring offsets: [0, 0.22, 0.44] of total progress
Expansion: node.r → node.r + 68
Fade: opacity = max(0, 1 - tp * 1.1)
```

---

### S2 — Stable: Circle + Diamond Grid ✅ (revised)

**Trigger:** Node volatility reaches 0  
**Target:** The newly-stable node  
**Duration:** ~1.5s  
**Description:** A circle overlay appears around the node, filled with a 45° rotated diamond grid pattern. Builds in, holds, then fades. Two concentric white rings frame the circle. The grid creates a crystalline containment feeling — a compound that has been locked in.

**Key implementation:** SVG `<pattern>` element with `patternTransform="rotate(45)"` + `<clipPath>` masking the fill to a circle. Grid stroke is white at low opacity, giving texture without competing with the node's affinity colour.

```
Overlay radius: node.r + 6
Grid cell size: 4.5px
Pattern: rotated 45° square grid (produces diamond appearance)
Fade out: p > 0.6
```

---

### S3 — Stable: Edge Ripple ✅ (revised)

**Trigger:** Node volatility reaches 0  
**Target:** The newly-stable node  
**Duration:** ~1.5s  
**Description:** Glowing white dots travel outward from the newly-stable node along the **existing mycelium edges** — not new straight lines. Each dot follows the same quadratic bezier curve the edge is drawn with. Dots fade as they approach their destination. Communicates that stability is propagating through the network.

**Key implementation:** The dot's position is computed by evaluating the quadratic bezier at parameter `t` using the same control-point formula used when the edges were originally drawn:

```javascript
// Recreate the exact control point the edge was drawn with
mx = (child.x + parent.x) / 2 + (((child.id*9 + parent.id*7) % 24) - 12) * 0.7
my = (child.y + parent.y) / 2 + (((child.id*11 + parent.id*5) % 20) - 10) * 0.7

// Evaluate bezier at parameter bt
// Forward travel (to child):   bt = easeOut(tp)
// Reverse travel (to parent):  bt = 1 - easeOut(tp)
mt   = 1 - bt
dotX = mt²·parent.x + 2·mt·bt·mx + bt²·child.x
dotY = mt²·parent.y + 2·mt·bt·my + bt²·child.y
```

```
Dot radius: 3.5px white + 6px soft halo at 30% opacity
Stagger per target: 0.18 of total progress
Easing: easeOut on t
No duplicate line drawn — dot traces the already-rendered edge
```

**Note:** All three stable animations (S1, S2, S3) can run simultaneously or in sequence on the same node — they are not mutually exclusive in the final game. In the prototype they are triggered individually for review.

---

### V1 — Volatile Warning: Erratic Jitter ✅

**Trigger:** Node enters the 1-hour collapse warning window (volatility climbing toward 100)  
**Target:** The volatile node (Corros-γ shown in prototype)  
**Duration:** Ongoing ambient state — not a one-shot animation  
**Description:** Node jitters erratically. Jitter amplitude scales with volatility — low volatility = barely perceptible, 80%+ = violent shaking. A red bleed glow pulses around the node. The edge connecting it to its parent flickers red. A dashed orange ring rotates around the node.

```
Jitter: irregular XY offset, amplitude = intensity * 4
Jitter pattern: non-uniform (tick%3, tick%4 offsets for irregularity)
Red glow: circle r+12, #ff5533, opacity = intensity * 0.25
Rotating ring: #ff5533, dashed, rotates tick*20 degrees
Edge flicker: parent edge alternates rgba(255,80,50,0.05) and 0.35
```

**Implementation note:** This is a persistent state, not triggered once. The game renders it continuously while `node.volatility > COLLAPSE_THRESHOLD`.

---

### C1 — Collapse: Shockwave ✅

**Trigger:** Node collapses (volatility overflow + chaos roll)  
**Target:** The collapsing node and its siblings  
**Duration:** ~1.2s  
**Phases:**

| Phase | Timing | What happens |
|---|---|---|
| Flash | 0–20% | Bright white circle expands briefly from node centre |
| Shockwave | 20–70% | Orange ring expands outward. Secondary white ring at 70% radius. Siblings flash red. |
| Scar | 70–100% | Node fades to dark scar fill + × glyph |

**Sibling damage:** Siblings flash with `#ff5533` fill during the shockwave phase. Their own volatility should spike in game logic as a result.

```
Shockwave ring: #ff8844, r = node.r + easeOut(swP) * 90
Secondary ring: white 50%, r = swR * 0.7
Sibling flash: red fill opacity peaks at swP=0.35, fades by swP=0.5
```

---

### H1 — Harvest: Particle Burst ✅

**Trigger:** Successful harvest action on a node  
**Target:** The harvested node  
**Duration:** ~1s  
**Description:** 14 particles burst radially outward from the node in the node's affinity colour. Particles vary in speed, distance, and size (seeded by index). A brief colour flash on the node centre at the start. Particles shrink and fade as they travel.

```
Particle count: 14
Colour: node affinity colour
Distance range: 36–78px
Speed variance: 0.6–1.1×
Flash: affinity fill, fades by p=0.2
```

---

### SH1 — Shipment Collect: Gentle Fade to Stub ✅ (revised)

**Trigger:** Player taps "Collect" on a shipment card  
**Target:** A live node in the dish (shown on Node 2 / Lysate-β in prototype)  
**Duration:** ~1.2s  
**Description:** The target node performs a **gentle** shake, fades to opacity zero, holds empty for a visible beat, then the dashed harvested stub fades in. This creates a clear narrative beat — shake → gone → pause → stub appears — so the player registers that material has been taken from the dish.

**Three phases:**

| Phase | Timing | What happens |
|---|---|---|
| Shake + fade | 0 – 35% | Gentle jitter (max 1.6px amplitude), opacity fades 1 → 0 |
| Empty hold | 35 – 72% | Nothing visible. The beat that says "something left" |
| Stub appears | 72 – 100% | Dashed harvested stub fades in |

**Rationale for change from v0.1:** The previous version had too-aggressive shake (4.5px amplitude) and no pause between node disappearing and stub appearing, which made the transition feel like a single blur rather than a deliberate transaction.

```
Jitter amplitude: sin(shakePhase * PI) * 1.6 — gentle, peaks mid-shake
Jitter pattern: irregular XY (tick%3, tick%4 offsets)
Node fade:  1 - (p / 0.35) during shake phase, then 0
Stub fade:  (p - 0.72) / 0.28 after empty hold
Stub style: dashed stroke, affinity colour at 44% opacity
```

---

## Tier 2 — Feedback and reward moments

### X1 — XP Gain / Level Up: Porthole Breathe ✅

**Trigger:** Significant XP gain or level-up event  
**Target:** The dish area (centred on porthole)  
**Duration:** ~2s loop  
**Description:** Two concentric ripple rings emanate from the dish centre, staggered 0.35s apart. A soft white ambient glow pulses. XP amount floats upward and fades (+240 XP shown in prototype). At progress ~0.6, a "LEVEL UP" label briefly appears. The XP bar in the header visually fills as a secondary indicator.

```
Ripple rings: cx=140, cy=105 (dish centre in SVG space)
Ring range: r = 20 → 130
Ring fade: max(0, 1 - tp) * 0.5
XP text: rises 30px, fades after 60% progress
LEVEL UP text: visible p=0.55–0.75, Chakra Petch, letterSpacing=3
```

**Porthole glow:** The outer porthole ring structure in the DOM (outside the SVG) gets a brief CSS white glow via the `animId==='X1'` condition on the porthole wrapper `boxShadow`.

---

### F1 — Full Petri Stable: Green Glow ✅ (revised)

**Trigger:** All nodes in a dish reach volatility = 0 simultaneously  
**Target:** Entire porthole  
**Duration:** ~2s  
**Description:** A deep green fill covers the entire porthole circle, builds in, holds, then fades. All live nodes simultaneously receive a green ring. "DISH STABLE" text appears briefly at the bottom of the dish.

**Key implementation — not SVG:** The green fill is a `position:absolute, inset:0` div placed **inside the porthole's `overflow:hidden, border-radius:50%` wrapper**. The wrapper div natively clips to a circle. SVG can't fill the full porthole because its viewBox (280×210) letterboxes inside the square porthole div, leaving ~33px dead zones at top and bottom. Node rings continue to be rendered via SVG since they're positioned in node coordinate space.

```
Fill layer: <div style={{position:'absolute', inset:0,
  background: 'rgba(31,204,121,' + opacity + ')',
  zIndex:14}} />
Opacity curve: builds to ~0.28 via easeOut, fades from p=0.75
Node rings: SVG circles, #1fcc79 stroke, r = node.r + 8–12
Text: DISH STABLE, 8px mono, letter-spacing 2, fades p=0.4–0.8
```

---

### F2 — Full Petri Stable: Light Cascade ✅ (revised)

**Trigger:** All nodes in a dish reach volatility = 0 simultaneously  
**Target:** Entire porthole  
**Duration:** ~2s  
**Description:** A band of white light sweeps left-to-right across the dish. As it passes each node, that node briefly gains a white ring.

**Key implementation — CSS gradient, not SVG:** Same approach as F1. The sweeping wave is a `position:absolute, inset:0` div with a `linear-gradient` background whose stops shift based on `waveX`. The porthole wrapper clips it to a circle natively.

```
Wave layer: <div style={{position:'absolute', inset:0,
  background: 'linear-gradient(90deg, transparent x0%,
    rgba(255,255,255,0.18) x1%, rgba(255,255,255,0.32) x2%,
    rgba(255,255,255,0.18) x3%, transparent x4%)',
  zIndex:14}} />
Stop positions: derived from waveX in SVG units (0–280), converted to %
Sweep: waveX = easeOut(p) * 340 - 40
Node ring: SVG circles light up as wave passes their x position
```

**Note:** F1 and F2 both play on full stabilisation. They can run sequentially (F1 first, then F2) or simultaneously — to be decided in implementation.

---

### D1 — Discovery: Affinity Burst ✅

**Trigger:** Player produces a compound for the first time  
**Target:** The node that produced the new compound  
**Duration:** ~1s  
**Description:** 12 rays expand radially outward from the node in the affinity colour, alongside an expanding ring. A brief affinity-colour flash on the node core. High energy, celebratory.

```
Rays: 12, length grows from r+4 to r+28–52
Ring: expands r → r+55, affinity colour
Core flash: affinity fill, fades by p=0.23
```

---

### D2 — Discovery: NEW Chip ✅

**Trigger:** Player produces a compound for the first time  
**Target:** The node that produced the new compound  
**Duration:** ~1s  
**Description:** A rounded pill chip with "NEW" in the affinity colour rises from the node, holds, then fades. A faint ring on the node border simultaneously. Quieter than D1 — designed to run when D1 is not appropriate (e.g. re-discovery of a variant).

```
Chip: rounded rect, fill = affinity colour, text = rgba(0,0,0,0.8)
Rise: easeOut, 38px travel
Appear: fade in p=0–0.25, fade out p=0.55–1
Node ring: affinity stroke at 60% opacity
```

---

## Tier 3 — Micro interactions (fast, per-action)

### T1 — Stabilise Micro ✅

**Duration:** ~0.6s  
**Description:** Single white ring expands from the node and fades. Quiet confirmation that the stabilise action landed.

```
Ring: r = node.r → node.r+22, white, fade = 1 - p * 1.1
```

---

### T2 — Catalyse Spark ✅

**Duration:** ~1s  
**Description:** Yellow spark burst radiates from node (8 particles). At 45% progress a new child node grows on a connecting edge from the node.

```
Sparks: 8 particles, #f5c842, radial burst
Child: grows from radius 0 → 10px, affinity colour
Child position: fixed offset for preview (node.x+28, node.y-44)
Edge: white dashed, fades in with child
```

---

### T3 — Contain Frost ✅ (revised)

**Duration:** ~1.2s  
**Description:** A diamond grid pattern fills the interior of the cell, masked exactly to the blob shape using a `<clipPath>`. A cool blue border traces the blob outline. A small freeze dot appears at the node centre.

**Key implementation:** Clip path and frost border must use the **exact same seed** the base renderer uses for the cell's blob shape, otherwise the frost sits on a different shape than the cell. The base renderer uses `seed = node.id * 13 + nodeIndex * 7`.

```
Seed: node.id * 13 + NODES.indexOf(node) * 7  // CRITICAL — must match base renderer
Grid: 45° rotated, 3.8px cell, rgba(180,210,255,0.9) stroke
Clip: blobD(node.x, node.y, node.r, seed)
Border: rgba(140,180,255,0.8), 1.4px, traces the cell outline
Tint: rgba(120,160,255,0.10) fill inside clip
Centre dot: rgba(200,220,255,0.65), r = node.r * 0.22
```

---

### T4 — Discard Burn ✅

**Duration:** ~1s  
**Description:** 10 fire particles rise from the node (orange/red/yellow, varying by index). Node burns to dark scar. Sibling nodes flash red briefly from the incinerator collateral.

```
Particles: 10, directional upward spread ±0.6rad from -PI/2
Colours: #ff8844, #ff5533, #ffcc44 (alternating by index)
Scar: rgba(20,20,20,0.9) fades in
Sibling flash: #ff5533, peaks at burnP=0.25
```

---

### T5 — Store Sale Flash ✅ (revised)

**Duration:** ~0.8s  
**Description:** Credit amount (+355 ◈) fades in centred in the dish, rises a short distance, and fades out. Previously anchored to the bottom of the dish which clipped inside the porthole; now centred at (140, 105) in SVG space so it always sits in the visual centre of the porthole.

```
Position: x=140, y=112 (centred in dish, slightly above middle)
Text: "+355 ◈", #1fcc79, 15px mono bold
Rise: easeOut * 20px travel (gentler than v0.1)
Fade in:  p = 0 – 0.2
Fade out: p = 0.6 – 1.0
```

---

### T6 — Skill Unlock ✅ (revised)

**Duration:** ~1s  
**Description:** A skill node icon fades in centred in the dish, pulses with an expanding ring and glow, then fades out. "UNLOCKED" label sits below the icon. Previously anchored to the bottom-left corner which clipped against the porthole edge; now centred.

```
Position: x=140, y=105 (centre of dish)
Expanding ring: r = 10 → 32, white, fades with travel
Node icon: 9px circle, white stroke, glow pulses via sin(p*PI)
Inner dot: 3.5px white, opacity follows glow
Label: "UNLOCKED", 7px mono, letter-spacing 1.5, centred below icon (y + 24)
Fade in:  p = 0 – 0.15
Fade out: p = 0.7 – 1.0
```

---

## Implementation Notes

### Porthole coordinate space + full-circle fills

The animation SVG uses `viewBox="0 0 280 210"` with default `preserveAspectRatio="xMidYMid meet"`. Inside the 264×264 square porthole div, this letterboxes to 264×198, leaving **~33px dead zones at top and bottom** where SVG shapes cannot reach.

**Therefore: full-porthole fills (F1, F2) must NOT be SVG shapes.** They must be rendered as `position:absolute, inset:0` divs placed **inside** the porthole's `overflow:hidden, border-radius:50%` wrapper. The wrapper's CSS clipping handles the circular boundary.

Rendering structure:

```
<div overflow:hidden, border-radius:50%>   ← porthole wrapper, clips to circle
  <svg viewBox="0 0 280 210">               ← base nodes (letterboxed, OK for nodes)
  <div inset:0 background:...>              ← F1/F2 full-circle fills (clipped by wrapper)
  <svg viewBox="0 0 280 210">               ← animation overlay (node-level effects)
</div>
```

Node-level effects (rings on individual nodes, particles around a node, etc.) can safely stay in SVG because they're positioned within the safe SVG area.

### Seed matching for blob-shape clips

Any animation that clips to a cell's blob shape (currently T3) **must** recompute the seed using the same formula as the base renderer:

```
seed = node.id * 13 + NODES.indexOf(node) * 7
```

Using only `node.id * 13` will produce a different shape than the actual cell and the clip won't align.

### ClipPath in SVG animations

S2 and T3 use SVG `<clipPath>`. Important rules:
- ClipPath IDs must be **unique per node** — use `node.id` in the ID string to avoid conflicts when multiple animations run simultaneously
- `<defs>` blocks must be siblings of the elements that reference them in the same SVG
- The animation overlay SVG has `pointerEvents="none"` and `zIndex:15` — it sits above the base node layer but doesn't intercept taps

### Bezier path tracing (S3)

Animations that follow existing mycelium edges (currently S3) must recreate the exact control point the edge was drawn with, then evaluate the quadratic bezier at parameter `t`:

```javascript
// Control point formula (matches edge renderer in PetriDish)
mx = (child.x + parent.x) / 2 + (((child.id*9  + parent.id*7) % 24) - 12) * 0.7
my = (child.y + parent.y) / 2 + (((child.id*11 + parent.id*5) % 20) - 10) * 0.7

// Evaluate quadratic bezier at t
mt = 1 - t
x  = mt² · parent.x + 2·mt·t · mx + t² · child.x
y  = mt² · parent.y + 2·mt·t · my + t² · child.y
```

### Timing system

All animations use the 50ms `fastTick` interval for smooth playback. Progress `p` runs 0→1 and loops in the preview. In production, one-shot animations play to completion and are removed from state.

### Multiple simultaneous animations

In production, multiple animations may run concurrently (e.g. S1 + S3 on the same node, F1 + F2 on the dish). The overlay SVG should accept an array of active animations and render all of them, each with their own progress value.
