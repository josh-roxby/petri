# PETRI — UI Code Basis v0.1

**Companion to:** petri-spec.md · petri-design.md  
**Purpose:** Reference for Claude Code and any developer building Pass 1. Defines component architecture, patterns, tokens, and constraints derived from the validated prototype.

---

## 0. Overview

The Petri UI is a **React PWA** built with inline styles and SVG. No CSS-in-JS library, no Tailwind. Style tokens are defined as JS constants and applied inline — this keeps the component self-contained and the design system explicit.

The prototype (`petri-v4.jsx`) is the validated reference. All architectural decisions below are derived from it.

---

## 1. Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js (App Router) | PWA config via `next-pwa` or manual service worker |
| Styling | Inline styles + SVG | No Tailwind, no CSS modules in core game UI |
| State | Zustand | Global game state. React local state for UI-only concerns |
| Persistence (v1) | localStorage | Full game state serialised on every meaningful action |
| Persistence (v2) | Render + Postgres | Post-pilot. Anonymous → account upgrade flow |
| Fonts | Google Fonts | Space Mono (mono/data), Chakra Petch (UI/labels) |
| Graph viz | SVG | Blob paths computed with quadratic bezier. Reassess canvas if >50 nodes shows perf issues |
| Cron | Vercel Cron | Daily store rotation seed. All per-user sim is client-side |
| Animation | `setInterval` tick | 160ms tick drives all animations. No CSS animation libraries in core loop |

---

## 2. Design Tokens

Define these as JS constants at the top of every file that needs them. Do not hard-code hex values inline.

```javascript
// ── AFFINITY COLORS ────────────────────────────────────────────────────
const AFF_COLORS = [
  '#a3dd28', // 0 Organic  — lime
  '#1fcc79', // 1 Enzyme   — emerald
  '#ff5533', // 2 Acid     — coral red
  '#44aaff', // 3 Mineral  — sky blue
  '#cc66ff', // 4 Synthetic — violet
];
const AFF_NAMES = ['Organic', 'Enzyme', 'Acid', 'Mineral', 'Synthetic'];

// ── ACTION DOT COLORS (fixed, not affinity-relative) ───────────────────
const ACTION_COLORS = {
  catalyse:  '#f5c842', // yellow  — always
  harvest:   '#1fcc79', // emerald — always
  contain:   '#44aaff', // sky     — always
  discard:   '#ff5533', // coral   — always
  stabilise: '#ffffff', // white   — always
};

// ── CHROME PALETTE ──────────────────────────────────────────────────────
const CHROME = {
  bg:           '#060606',
  bgDish:       '#090909',
  bgSurface:    'rgba(10,10,10,0.97)',
  borderSubtle: 'rgba(255,255,255,0.07)',
  borderMid:    'rgba(255,255,255,0.14)',
  borderStrong: 'rgba(255,255,255,0.25)',
  textPrimary:  '#ffffff',
  textBody:     'rgba(255,255,255,0.55)',
  textMuted:    'rgba(255,255,255,0.25)',
  textGhost:    'rgba(255,255,255,0.18)',
};

// ── TYPOGRAPHY ──────────────────────────────────────────────────────────
const MONO   = "'Space Mono', monospace";    // data, IDs, numbers, nav labels
const CHAKRA = "'Chakra Petch', sans-serif"; // UI labels, buttons, headings

// ── LAYOUT ──────────────────────────────────────────────────────────────
const DISH_SIZE    = 264;  // px — porthole inner diameter
const HEADER_H     = 56;   // px
const NAV_H        = 52;   // px
const NAV_BOTTOM   = 20;   // px — distance from bottom of shell
const NAV_WIDTH    = 286;  // px
const GRID_SIZE    = 28;   // px — background grid cell
const GRID_OPACITY = 0.28; // effective ~3%
```

---

## 3. Font Loading

Load via `<style>` tag in the root layout, not per-component:

```javascript
// app/layout.jsx or _app.jsx
<style>{`@import url('https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@300;500;600&family=Space+Mono:wght@400;700&display=swap');`}</style>
```

---

## 4. App Shell

The shell is the one place that enforces the fixed-height contract. Nothing inside it should break out.

```jsx
// Shell structure — enforced, non-negotiable
<div style={{
  height: '100vh',
  overflow: 'hidden',
  background: '#0a0a0a',
  display: 'flex',
  justifyContent: 'center',
}}>
  <div style={{
    width: '100%',
    maxWidth: 420,
    height: '100vh',
    background: CHROME.bg,
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  }}>
    <Grid />                    {/* ambient background grid, zIndex:1 */}
    <AppHeader />               {/* flexShrink:0, height:56px, zIndex:20 */}
    
    {/* Content — only this area scrolls, per-screen */}
    <div style={{
      flex: 1,
      overflow: 'hidden',
      paddingBottom: 80,        {/* nav clearance */}
      position: 'relative',
      zIndex: 2,
    }}>
      {/* active screen renders here */}
    </div>

    <NavPill />                 {/* position:absolute, bottom:20, zIndex:30 */}

    {/* Overlays at root level — always cover full shell */}
    {nodeModal     && <NodeModal />}
    {storeOpen     && <StoreOverlay />}
    {petriSwitcher && <PetriSwitcher />}
  </div>
</div>
```

---

## 5. Screen Components

Every non-Lab screen follows this contract:

```jsx
function ScreenName() {
  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      padding: '16px 16px 0',
      overflowY: 'auto',        // ← ONLY this scrolls, not the shell
    }}>
      {/* screen title — flexShrink:0 */}
      <div style={{ color: '#fff', fontSize: 14, fontFamily: MONO, fontWeight: 700, marginBottom: 4 }}>
        Screen Title
      </div>
      {/* scrollable content below */}
    </div>
  );
}
```

**Lab screen is different** — it uses absolute positioning for the dish and has no inner scroll. See §6.

---

## 6. Lab Screen & Dish Centering

The dish must be geometrically centred in the available space at all times. Use absolute positioning — never flexbox centering, which is skewed by sibling elements.

```jsx
function LabScreen() {
  return (
    <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>

      {/* ALL overlay elements are position:absolute and do not affect dish centering */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}>
        {/* dish switcher, level bar */}
      </div>
      <div style={{ position: 'absolute', top: 40, left: 16, zIndex: 10 }}>
        {/* shipment card */}
      </div>

      {/* DISH — always centred, always */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 2,
      }}>
        <Porthole>
          <PetriDish />
        </Porthole>
        <DishStats /> {/* sits below porthole, moves with it */}
      </div>

    </div>
  );
}
```

---

## 7. Animation System

All animation runs on a single shared tick, driven by a `setInterval` at 160ms. No CSS keyframes, no GSAP, no requestAnimationFrame in the core loop.

```javascript
// In the root App component
const [tick, setTick] = useState(0);
useEffect(() => {
  const id = setInterval(() => setTick(t => t + 1), 160);
  return () => clearInterval(id);
}, []);

// Pass tick down as a prop to animated components
<LabScreen tick={tick} />
<AppHeader tick={tick} />
```

**Tick-driven patterns:**

```javascript
// Wave header divider
const wave = Math.sin(tick * 0.05) * 2.5;

// Node pulse ring
const pulse = 0.3 + Math.sin(tick * 0.09) * 0.12;

// Volatile jitter
const jx = vol ? (tick % 2 === 0 ? 1.7 : -1.7) : 0;
const jy = vol ? (tick % 3 === 0 ? 1.1 : -1.0) : 0;

// Glow ring intensity
const p1 = 0.12 + Math.sin(tick * 0.08 + nodeIndex) * 0.07;

// Ambient particle float
const opacity = 0.10 + Math.sin(tick * 0.04 + i) * 0.09;
const top     = (14 + Math.sin(tick * 0.03 + i) * 12) + '%';

// Terminal cursor blink
const cursorVisible = tick % 8 < 4;
```

**Rule:** Volatile nodes jitter, stable nodes breathe slowly, scar nodes are static. The tick multiplier controls speed — higher = faster, more panicked.

---

## 8. Blob Path System

All compound nodes are drawn as irregular blob shapes using a seeded quadratic bezier algorithm. Same seed always produces same shape.

```javascript
function blobD(cx, cy, r, seed) {
  const n = 8;
  const pts = Array.from({ length: n }, (_, i) => {
    const a     = (2 * Math.PI * i / n) - Math.PI / 2;
    const noise = ((seed * 17 * (i + 1) + 13) % 100) / 100;
    const rad   = r * (0.7 + noise * 0.6); // ±30% radius variance
    return [cx + rad * Math.cos(a), cy + rad * Math.sin(a)];
  });

  let d = `M ${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i];
    const p2 = pts[(i + 1) % n],     p3 = pts[(i + 2) % n];
    const t  = 0.38; // tension
    const cp1x = p1[0] + (p2[0] - p0[0]) * t / 2;
    const cp1y = p1[1] + (p2[1] - p0[1]) * t / 2;
    const cp2x = p2[0] - (p3[0] - p1[0]) * t / 2;
    const cp2y = p2[1] - (p3[1] - p1[1]) * t / 2;
    d += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d + ' Z';
}

// Usage — node with seed derived from its ID
<path d={blobD(node.x, node.y, node.r, node.id * 13 + nodeIndex * 7)} />
```

**Seed convention:** `node.id * 13 + nodeIndex * 7` for the base shape. Glow halos use `seed + N` (2, 4, 6, 8) so each ring has a slightly different irregular shape.

---

## 9. Node Rendering Layers

Each node is rendered as a stack of SVG elements in this order (back to front):

```
1. Outer ambient glow  — blobD(r+16, seed+8) — fill only, affinity+'06'
2. Mid glow            — blobD(r+9,  seed+6) — fill only, affinity+'09'
3. Ring outline        — blobD(r+4,  seed+4) — stroke, affinity, opacity=p1
4. Stable chrome ring  — blobD(r+11, seed+2) — stroke, white 10%, opacity=pulse
   OR volatile ring    — blobD(r+6,  seed+5) — stroke, white 28%, opacity=vPulse
5. Inner fill layer    — blobD(r+1,  seed+1) — fill, affinity+'10'
6. Main blob           — blobD(r,    seed)   — fill affinity+'25', stroke affinity
7. Inner core circle   — circle r*0.40       — fill affinity, opacity 0.55–0.72
8. White hot centre    — circle r*0.13       — fill white, opacity 0.2–0.5
```

**State exceptions:**
- `scar`: only layer 6 (near-black fill, white 7% stroke). Static. × glyph.
- `harvested`: only layer 6 (transparent fill, affinity 44% dashed stroke). Static.

---

## 10. Mycelium Edge Rendering

Edges between nodes are curved quad bezier paths — not straight lines.

```javascript
// Curvature is deterministic per edge, seeded by node IDs
const mx = (n.x + p.x) / 2 + (((n.id * 9 + p.id * 7) % 24) - 12) * 0.7;
const my = (n.y + p.y) / 2 + (((n.id * 11 + p.id * 5) % 20) - 10) * 0.7;

<path
  d={`M ${p.x},${p.y} Q ${mx},${my} ${n.x},${n.y}`}
  fill="none"
  stroke={scar ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.13)'}
  strokeWidth={scar ? 0.5 : 1.1}
  strokeLinecap="round"
/>
```

Edges carry no colour. Scar edges are barely visible.

---

## 11. Overlay & Modal System

All overlays are rendered at the **app root level** — siblings of the main content area, not children of the screen that triggered them. This ensures they always cover the full shell and are never clipped.

```jsx
// In App component — overlays OUTSIDE the content area
<div className="shell">
  <AppHeader />
  <div className="content">{/* screens */}</div>
  <NavPill />

  {/* All overlays at root */}
  {nodeModal     && <NodeModal     node={nodeModal}  onClose={...} />}
  {storeOpen     && <StoreOverlay                    onClose={...} />}
  {petriSwitcher && <PetriSwitcher                   onClose={...} />}
</div>
```

**Overlay z-index ladder:**

| Layer | zIndex | What |
|---|---|---|
| Grid | 1 | Background grid |
| Content | 2 | Screen content |
| Header | 20 | App header |
| Nav | 30 | Bottom nav pill |
| Store | 55 | Store bottom sheet |
| Modals | 60 | Node modal, petri switcher |

**Outside-click close pattern:**

```javascript
const ref = useRef(null);
useEffect(() => {
  const handler = (e) => {
    if (ref.current && !ref.current.contains(e.target)) onClose();
  };
  document.addEventListener('mousedown', handler);
  return () => document.removeEventListener('mousedown', handler);
}, [onClose]);

// Attach ref to the modal content element, NOT the backdrop
<div style={{ position:'absolute', inset:0, ... }} /* backdrop */>
  <div ref={ref} style={{ /* modal content */ }}>
    {/* ... */}
  </div>
</div>
```

---

## 12. Geometric Material Icons

White SVG icons for materials — sharp, square-oriented, no blob language.

```jsx
function GeomIcon({ shape, size = 28, opacity = 0.65 }) {
  const s = size, h = s / 2, q = s / 4;
  const base = { stroke: 'white', strokeWidth: 1.5, fill: 'none',
                 strokeLinecap: 'square', strokeLinejoin: 'miter' };
  const shapes = {
    diamond:  <polygon points={`${h},${q*.55} ${s-q*.55},${h} ${h},${s-q*.55} ${q*.55},${h}`} {...base}/>,
    hex:      <polygon points={[0,1,2,3,4,5].map(i => {
                const a = (Math.PI/3)*i - Math.PI/6;
                return `${(h+h*.72*Math.cos(a)).toFixed(1)},${(h+h*.72*Math.sin(a)).toFixed(1)}`;
              }).join(' ')} {...base}/>,
    nested:   <><rect x={q*.4} y={q*.4} width={h*1.6} height={h*1.6} rx={1.5} {...base}/>
                <rect x={q*1.1} y={q*1.1} width={h*.6} height={h*.6} rx={1} fill="white" stroke="none" opacity={.5}/></>,
    triangle: <polygon points={`${h},${q*.5} ${s-q*.5},${s-q*.55} ${q*.5},${s-q*.55}`} {...base}/>,
    cross:    <><line x1={h} y1={q*.55} x2={h} y2={s-q*.55} {...base}/>
                <line x1={q*.55} y1={h} x2={s-q*.55} y2={h} {...base}/></>,
    pill:     <rect x={q*.7} y={q*.32} width={h*.85} height={h*1.35} rx={h*.42} {...base}/>,
  };
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{ display:'block', opacity }}>
      {shapes[shape]}
    </svg>
  );
}
```

---

## 13. State Architecture (Zustand)

Proposed store shape for Pass 1. Exact implementation deferred to build phase.

```javascript
// stores/gameStore.js
const useGameStore = create((set, get) => ({

  // ── PLAYER ────────────────────────────────────────────────────────
  player: {
    level:    1,
    xp:       0,
    credits:  500,
    dishSlots: 1,
  },

  // ── DISHES ────────────────────────────────────────────────────────
  dishes: [
    { id: 1, name: 'Dish Alpha', nodes: [] }
  ],
  activeDishId: 1,

  // ── INVENTORY ─────────────────────────────────────────────────────
  compounds: [],   // harvested compounds with full property vectors
  materials: {
    stabiliser: 3,
    ingredient: 2,
    plasmaGel:  0,
    bioFuel:    0,
    catalyst:   1,
    antidote:   0,
  },

  // ── SHIPMENTS ─────────────────────────────────────────────────────
  shipmentQueues: {
    stabiliser: { count: 0, lastAt: null },
    ingredient: { count: 0, lastAt: null },
    // etc
  },

  // ── DISCOVERIES ───────────────────────────────────────────────────
  journal: [],     // all unique compounds ever synthesised

  // ── SKILL TREES ───────────────────────────────────────────────────
  skills: {
    harvest: { xp: 0, unlocked: ['h0'] },
    funding: { xp: 0, unlocked: ['f0'] },
    tooling: { xp: 0, unlocked: ['t0'] },
  },

  // ── STORE ─────────────────────────────────────────────────────────
  storeSeed: null, // today's rotation seed, set by cron

  // ── TIME DELTA ────────────────────────────────────────────────────
  lastSavedAt: null,

  // ── ACTIONS (examples) ────────────────────────────────────────────
  stabiliseNode:  (dishId, nodeId) => { /* reduce volatility */ },
  catalyseNode:   (dishId, nodeId, ingredientId) => { /* spawn child */ },
  harvestNode:    (dishId, nodeId) => { /* extract compound */ },
  containNode:    (dishId, nodeId) => { /* freeze node */ },
  discardNode:    (dishId, nodeId) => { /* destroy with collateral calc */ },
  collectShipment:(type) => { /* add to materials */ },
  computeTimeDelta: () => { /* run offline sim on app open */ },
}));
```

---

## 14. Time Delta Simulation

On every app open, run the time delta sim before rendering:

```javascript
// On app mount
useEffect(() => {
  const store = useGameStore.getState();
  const now   = Date.now();
  const elapsed = now - (store.lastSavedAt || now); // ms

  store.computeTimeDelta(elapsed);
  store.setLastSavedAt(now);
}, []);

// computeTimeDelta logic sketch
function computeTimeDelta(elapsedMs) {
  const ticks     = Math.floor(elapsedMs / TICK_INTERVAL); // e.g. 60s ticks
  const newShipments = computeShipmentAccrual(ticks);
  const collapseResults = runCollapseRolls(ticks);
  // Apply results, build summary for "while you were away" display
}
```

---

## 15. localStorage Persistence

```javascript
// Persist full game state on every meaningful action
const SAVE_KEY = 'petri_v1_save';

function saveGame(state) {
  localStorage.setItem(SAVE_KEY, JSON.stringify({
    ...state,
    lastSavedAt: Date.now(),
  }));
}

function loadGame() {
  const raw = localStorage.getItem(SAVE_KEY);
  return raw ? JSON.parse(raw) : null;
}
```

Add a Zustand middleware to auto-save on every state mutation, or call `saveGame()` explicitly after each action. The latter is safer for performance.

---

## 16. File Structure (proposed)

```
app/
  page.jsx              ← root, loads game shell
  layout.jsx            ← font imports, metadata

components/
  shell/
    AppHeader.jsx
    NavPill.jsx
    Grid.jsx
  lab/
    LabScreen.jsx
    PetriDish.jsx        ← SVG node graph
    Porthole.jsx         ← ring frame + bolts
    NodeModal.jsx        ← centred node interaction modal
    PetriSwitcher.jsx    ← dish carousel modal
  screens/
    InventoryScreen.jsx
    ShipmentsScreen.jsx
    DiscoveriesScreen.jsx
    SkillsScreen.jsx
  store/
    StoreOverlay.jsx
  shared/
    BlobIcon.jsx         ← compound blob preview
    GeomIcon.jsx         ← material geometric icon
    AffBadge.jsx         ← coloured affinity chip
    Pill.jsx             ← tab/filter pill button
    PropBar.jsx          ← labelled stat bar

lib/
  blobD.js              ← blob path generator
  gameLogic.js          ← volatility, collapse, mutation math
  timeDelta.js          ← offline sim
  tokens.js             ← AFF_COLORS, CHROME, MONO, CHAKRA, etc.

stores/
  gameStore.js          ← Zustand store

public/
  manifest.json         ← PWA manifest
  sw.js                 ← service worker (offline shell)
```

---

## 17. Performance Notes

- **Blob paths are deterministic** — memoize `blobD()` results keyed by `(cx, cy, r, seed)` if dishes grow large
- **Tick drives all animation** — a single `setInterval` at 160ms drives everything. Never use `requestAnimationFrame` for game logic, only for rendering if needed
- **SVG vs canvas** — SVG is fine up to ~30 nodes per dish. Above that, consider a canvas layer for the glow halos (the most expensive part). Evaluate at Pass 4.
- **`will-change: transform`** — apply to the dish container to hint GPU compositing
- **localStorage saves** — throttle to once per meaningful action, not on every tick. Never save on every render.
