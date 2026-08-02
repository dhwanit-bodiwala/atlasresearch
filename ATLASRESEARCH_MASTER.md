# ATLASRESEARCH — MASTER PROMPT DOCUMENT
### Version 2.0 — No Constraints. Maxed Out.
### The constitution for every Cursor session. Read entirely before writing one line.

---

## 0. WHAT THIS DOCUMENT IS

This is the **single source of truth** for the AtlasResearch frontend. Every Cursor Composer session begins by reading this file. Every component built must satisfy the acceptance criteria here. When the AI IDE generates something that conflicts with this document — **override it immediately**.

### The one rule above everything:
> This is not a web app. This is not a dashboard. This is not a SaaS UI.
> This is a **spatial, cinematic, real-time experience** where the research pipeline IS the interface.
> If anything you build could appear on any other website — tear it down and rebuild it.

### The quality benchmark:
**igloo.inc** — Awwwards Site of the Day, July 2024. Built by Abeto + Bureaux.
Study it at https://www.igloo.inc before building anything.
Read the full case study at https://www.awwwards.com/igloo-inc-case-study.html.
That is the bar. We match it technically and exceed it narratively.

---

## 1. WHAT ATLASRESEARCH IS

A **fully local, offline three-agent research pipeline**.

The user asks a question. Three AI agents process it in sequence, communicating through shared PostgreSQL + pgvector memory:

- **Gatherer** — searches the web, extracts raw facts, writes `RAW_FINDING` memory rows
- **Synthesizer** — reads findings, compresses them into a synthesis, writes `SYNTHESIS` memory row
- **Critic** — stress-tests the synthesis against raw findings, writes `FLAGGED` rows if issues found

The backend is complete. This document covers the frontend only.

**Service map:**
| Service | Host | Port |
|---|---|---|
| FastAPI backend | localhost | 8000 |
| WebSocket | localhost | 8000 |
| Vite frontend | localhost | 5173 |
| Ollama | localhost | 11434 |
| PostgreSQL | localhost | 5432 |

**The frontend never talks to Ollama or PostgreSQL directly. Only FastAPI.**

---

## 2. THE REFERENCE: IGLOO.INC — FULL TECHNICAL DECODE

### What igloo.inc actually did (from their published case study):

**3D pipeline:** Houdini + Blender for geometry. Custom procedural crystal growth algorithm in Houdini. Each ice block was grown with a mathematical simulation of real ice crystal formation inside a container mesh.

**Rendering:** Everything runs in a single WebGL context. UI text, 3D geometry, particles, post-processing — all in one canvas. There is no HTML layer floating over a Three.js scene. They are unified.

**Shaders:** All written from scratch in GLSL. Key shaders:
- Frost displacement on ice surfaces
- Full fluid dynamics simulation on environment surfaces
- Chromatic aberration with RGB channel splitting
- Text SDF scramble shader (letters randomise by adjusting SDF texture offset in GLSL)
- Volume data shader for particle formations

**Textures:** KTX2 compressed for performance. HDRI environment maps for physically accurate reflections. Custom normal maps baked from Houdini geometry.

**Particles:** Volume data exported from Houdini in a custom browser-friendly format. Particles recolour based on velocity (fast = bright, slow = dim). Formation changes are animated by swirling particles between shapes.

**Transitions:** Chromatic aberration + frost displacement + tech glitch displacement. All three fire simultaneously during scene changes.

**Performance:** Despite all of this — LCP ≈ 1s. Achieved via KTX2 textures, progressive shader compilation, request-idle-callback observers, and custom geometry exporters that minimise file size.

**Tech stack they used:** Three.js, three-mesh-bhv, Svelte, GSAP, Vite, vanilla JavaScript, Houdini, Blender, Davinci Resolve (audio).

### What we use instead and why it matches:

| igloo.inc | AtlasResearch | Why it matches |
|---|---|---|
| Houdini procedural geometry | Custom GLSL vertex displacement noise on `IcosahedronGeometry` | FBM noise on vertices creates organic crystal irregularity without Houdini |
| Custom SDF text shader | `drei` `<Text>` with custom `onBeforeCompile` shader injection | Same visual result, less GPU overhead since we have less text |
| Custom fluid dynamics shader | FBM-based turbulence fragment shader on shaft cylinder walls | 40 lines of GLSL. Visually matches igloo's fluid walls. |
| KTX2 compressed HDR | `drei` `<Environment>` with `files` prop pointing to `.hdr` — use Polyhaven free HDRIs | EXR/HDR gives same quality, slightly larger file, acceptable for local app |
| Volume particle data | Three.js `BufferGeometry` Points with custom vertex shader for velocity colouring | Same colour-by-velocity behaviour |
| Svelte | React 18 + R3F | No visual difference — both compile to the same WebGL calls |
| three-mesh-bhv | `@react-three/drei` AccelerationStructure / BVH from `three-mesh-bvh` | Same library, different import |
| Chromatic aberration shader | `@react-three/postprocessing` ChromaticAberration effect | Same implementation |

**The conclusion:** We match igloo.inc's visual quality using R3F + custom GLSL. The tech stack difference is irrelevant — both output the same WebGL calls. The quality comes from the shaders, the material parameters, and the choreography. Those are all in our control.

---

## 3. THE CORE METAPHOR: CRYSTALLISATION

This metaphor governs **every single visual decision**. There are no exceptions.

### The narrative:
A question enters as raw, formless energy. Warm-edged. Turbulent. Chaotic. The pipeline forces it through three layers of cold intelligence. Raw material is gathered — jagged shards of data from the web. They are compressed into structure by the Synthesizer. The Critic stress-tests what was formed — fracture lines appear on the surface, either healing or becoming permanent fault lines. What emerges is a **crystal** — faceted, dense, cold, permanent. Knowledge made solid.

**Warm → Cold. Chaos → Order. Fluid → Solid. Question → Crystal.**

### The emotional arc:
- **Entry:** Anticipation. Standing at the edge of something consequential.
- **Descent:** Witnessing. Watching intelligence work in real time, depth by depth.
- **Emergence:** Satisfaction. Cold, perfect, earned.
- **Chat:** Dialogue. The crystal persists as context. The conversation flows beneath it.

### What does NOT map to crystallisation:
Loading spinners, progress bars, status badges, step indicators, sidebars, cards, modals — none of these exist in this experience. The **crystal IS the loading state**. The **depth position IS the progress**. The **shaft IS the status**. Never build a UI element that duplicates what the 3D scene already communicates.

---

## 4. TECH STACK — EXACT VERSIONS, NO SUBSTITUTIONS

```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "@react-three/fiber": "^8.17.10",
    "@react-three/drei": "^9.115.0",
    "@react-three/postprocessing": "^2.16.3",
    "three": "^0.169.0",
    "three-mesh-bvh": "^0.7.8",
    "gsap": "^3.12.5",
    "@gsap/react": "^2.1.1",
    "zustand": "^5.0.1",
    "postprocessing": "^6.36.3",
    "leva": "^0.9.35"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.3",
    "vite": "^5.4.10",
    "vite-plugin-glsl": "^1.3.0",
    "tailwindcss": "^3.4.14",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.47"
  }
}
```

### Critical: `vite-plugin-glsl`
This plugin allows importing `.glsl` files directly in JSX:
```javascript
import frostFrag from './shaders/frost.frag.glsl'
```
Without this plugin, all shader code must be written as template literal strings inside JS files — which is valid but harder to maintain. **Add this plugin to `vite.config.js`:**

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import glsl from 'vite-plugin-glsl'

export default defineConfig({
  plugins: [react(), glsl()],
})
```

### Library roles:
- `@react-three/fiber` — React renderer for Three.js. Drives 3D from React state and WS events.
- `@react-three/drei` — MeshTransmissionMaterial, Environment, Float, Text, Sparkles, BVH acceleration.
- `@react-three/postprocessing` — EffectComposer, Bloom, ChromaticAberration, Vignette, Noise.
- `three-mesh-bvh` — BVH acceleration for raycasting on complex crystal geometry.
- `gsap` + `@gsap/react` — all animation orchestration. Camera timelines, transition sequences.
- `zustand` — global state: scene, crystal state, pipeline stage, WS events, results.
- `leva` — debug panel for shader tweaking during development. Stripped in production build.
- `vite-plugin-glsl` — import `.glsl` files natively.
- `postprocessing` — peer dependency of `@react-three/postprocessing`.

---

## 5. FOLDER STRUCTURE — COMPLETE

```
atlasresearch-frontend/
├── public/
│   └── hdri/
│       └── night.hdr              # Download from Polyhaven: "Starry Night" or "Kloppenheim"
├── src/
│   ├── components/
│   │   ├── crystal/
│   │   │   ├── CrystalScene.jsx         # R3F Canvas wrapper, camera, post-processing
│   │   │   ├── CrystalMesh.jsx          # IcosahedronGeometry + MeshTransmissionMaterial
│   │   │   ├── CrystalParticles.jsx     # Particle field, custom velocity-colour shader
│   │   │   ├── CrystalShatter.jsx       # Shatter on click: face explosion + orbit
│   │   │   ├── CrystalFracture.jsx      # Fault lines for flagged items
│   │   │   └── shaders/
│   │   │       ├── crystalVertex.glsl   # Vertex displacement noise (FBM)
│   │   │       ├── frost.frag.glsl      # Frost spread on synthesis event
│   │   │       ├── fluid.frag.glsl      # Fluid turbulence for shaft walls
│   │   │       ├── chromatic.glsl       # Chromatic aberration (also via postprocessing)
│   │   │       ├── particleVertex.glsl  # Velocity-based colour for particles
│   │   │       └── particleFrag.glsl    # Particle glow + soft point rendering
│   │   ├── pipeline/
│   │   │   ├── DepthShaft.jsx           # Cylinder tunnel, three-zone material
│   │   │   ├── ShaftZone.jsx            # Individual zone (Gatherer/Synth/Critic)
│   │   │   ├── GathererLayer.jsx        # Zone 1: data shards + fluid walls
│   │   │   ├── SynthesizerLayer.jsx     # Zone 2: compression chamber + frost walls
│   │   │   ├── CriticLayer.jsx          # Zone 3: stress fractures + narrow walls
│   │   │   ├── DataShard.jsx            # Individual fact shard (Tetrahedron + custom mat)
│   │   │   ├── ScanLine.jsx             # Horizontal scan line (search_started event)
│   │   │   └── VRAMSwap.jsx             # Wall reconfiguration on model_unload/load events
│   │   ├── results/
│   │   │   ├── CrystalResult.jsx        # Emerged crystal: EMERGED state, orbital controls
│   │   │   ├── SynthesisFaces.jsx       # Synthesis text etched on crystal faces
│   │   │   └── FlagFracture.jsx         # Orange fault lines + ⚠ glyph on flagged faces
│   │   ├── chat/
│   │   │   ├── ChatLayer.jsx            # Full chat surface below crystal
│   │   │   ├── ChatMessage.jsx          # Individual message with scramble-in animation
│   │   │   └── ChatInput.jsx            # Minimal bottom input bar
│   │   └── ui/
│   │       ├── ProjectTagPill.jsx       # Bottom-left: project tag selector
│   │       ├── DepthToggle.jsx          # Bottom-right: SURFACE / DEEP
│   │       ├── RingText.jsx             # Rotating ring text around crystal
│   │       └── BreadcrumbBar.jsx        # Persistent context during descent
│   ├── context/
│   │   ├── WSContext.jsx                # WebSocket provider
│   │   └── PipelineContext.jsx          # Pipeline state provider
│   ├── hooks/
│   │   ├── useWebSocket.js              # WS connection + full event parsing
│   │   ├── useCrystalEvents.js          # WS events → crystal scene commands
│   │   ├── useGSAPCamera.js             # Camera position timelines
│   │   └── useShaderUniforms.js         # Shared uniform refs across shaders
│   ├── scenes/
│   │   ├── EntryScene.jsx               # Act 1: Crystal seed + input
│   │   ├── DescentScene.jsx             # Act 2: Three-layer pipeline
│   │   ├── EmergenceScene.jsx           # Act 3: Crystal surfaces
│   │   └── ChatScene.jsx                # Act 4: Conversation layer
│   ├── store/
│   │   └── atlasStore.js                # Zustand store
│   ├── styles/
│   │   └── globals.css                  # CSS vars, font imports, body reset only
│   ├── utils/
│   │   ├── textScramble.js              # Character randomiser utility
│   │   ├── colorMap.js                  # Agent → colour mappings
│   │   ├── noise.js                     # FBM noise functions (JS side)
│   │   └── wsEventTypes.js              # All WS event type constants
│   ├── App.jsx                          # Scene orchestrator
│   └── main.jsx                         # Entry point
├── .cursorrules                          # Points Cursor to this document
├── ATLASRESEARCH_MASTER.md              # This file
├── vite.config.js
├── tailwind.config.js
└── package.json
```

---

## 6. DESIGN TOKENS — IMMUTABLE

```css
/* src/styles/globals.css */
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500&family=JetBrains+Mono:wght@300;400&family=Inter:wght@300;400&display=swap');

:root {
  /* ── Backgrounds ─────────────────────────── */
  --bg-void:         #08080a;   /* Main void. Near-black, blue-tinted. NEVER pure black. */
  --bg-surface:      #0f0f14;   /* Elevated HTML surfaces */
  --bg-shaft-1:      #080810;   /* Gatherer zone walls */
  --bg-shaft-2:      #09090f;   /* Synthesizer zone walls */
  --bg-shaft-3:      #0a080f;   /* Critic zone walls — violet shifted */

  /* ── Text ────────────────────────────────── */
  --text-primary:    #c4c8d4;   /* Main text. Cold silver. */
  --text-secondary:  #4a5060;   /* Muted labels, metadata */
  --text-ghost:      #2a2d36;   /* Near-invisible, for depth */
  --text-input:      #ffffff;   /* User-typed text only. Pure white. */

  /* ── Accent Glows ────────────────────────── */
  --glow-ice:        #4fc3f7;   /* Primary: crystal, Gatherer, particles */
  --glow-deep:       #818cf8;   /* Synthesizer layer, compression */
  --glow-critic:     #a78bfa;   /* Critic layer, violet */
  --glow-flag:       #f97316;   /* Flagged items ONLY. Warm orange. */
  --glow-success:    #34d399;   /* NO_ISSUES confirmation. Cold green. */
  --glow-error:      #ef4444;   /* Pipeline errors only */

  /* ── Borders ─────────────────────────────── */
  --border-dim:      #1a1a24;
  --border-glow:     rgba(79, 195, 247, 0.2);
  --border-active:   rgba(79, 195, 247, 0.5);

  /* ── Typography ──────────────────────────── */
  --font-display:    'Space Grotesk', sans-serif;
  --font-mono:       'JetBrains Mono', monospace;
  --font-body:       'Inter', sans-serif;

  /* ── Type Scale ──────────────────────────── */
  --text-2xs:   0.55rem;
  --text-xs:    0.65rem;
  --text-sm:    0.8rem;
  --text-base:  1rem;
  --text-lg:    1.25rem;
  --text-xl:    1.75rem;
  --text-ring:  clamp(0.55rem, 1vw, 0.7rem);   /* Ring text around crystal */

  /* ── Spacing ─────────────────────────────── */
  --space-unit:  8px;   /* All spacing is multiples of 8 */

  /* ── Z-layers ────────────────────────────── */
  --z-canvas:    0;
  --z-ui:       10;
  --z-overlay:  20;
  --z-top:      30;

  /* ── Timing ──────────────────────────────── */
  --transition-fast:    0.2s;
  --transition-med:     0.4s;
  --transition-slow:    0.8s;
  --transition-cinematic: 1.4s;
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html, body, #root {
  width: 100%; height: 100%;
  background: var(--bg-void);
  overflow: hidden;
  cursor: none;   /* Custom cursor — crosshair dot that reacts to crystal proximity */
}

/* Custom cursor */
.cursor {
  position: fixed;
  width: 6px; height: 6px;
  background: var(--glow-ice);
  border-radius: 50%;
  pointer-events: none;
  z-index: var(--z-top);
  transform: translate(-50%, -50%);
  transition: width 0.15s, height 0.15s, opacity 0.15s;
  mix-blend-mode: screen;
}
.cursor.near-crystal {
  width: 20px; height: 20px;
  background: transparent;
  border: 1px solid var(--glow-ice);
  opacity: 0.6;
}
```

**Typography rules — non-negotiable:**
- Display / labels: Space Grotesk weight 300, UPPERCASE, letter-spacing `0.15em` minimum
- Data / URLs / facts: JetBrains Mono weight 300-400
- Synthesis body text: Inter weight 300, line-height `1.85`
- Never weight above 400 in the UI. Heaviness comes from glow and scale, not boldness.
- Never use colour brighter than `--text-primary` for body. White is reserved for user input only.

---

## 7. THE CUSTOM SHADERS — WRITE THESE BEFORE ANY COMPONENT

These are not optional. These are what separate this from a tutorial project.

---

### 7.1 Crystal Vertex Displacement — `crystalVertex.glsl`

```glsl
// crystalVertex.glsl
// Displaces crystal vertices with FBM noise to create raw crystalline irregularity
// displacementAmount: 0.0 = perfect crystal (EMERGED), 0.3 = raw seed (SEED)

uniform float uTime;
uniform float uDisplacementAmount;
uniform float uGlowIntensity;

varying vec3 vNormal;
varying vec3 vPosition;
varying float vDisplacement;

// Classic 3D noise
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute( permute( permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

// FBM: multiple octaves of noise for crystal-like jaggedness
float fbm(vec3 p) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;
  for (int i = 0; i < 5; i++) {
    value += amplitude * snoise(p * frequency + uTime * 0.05);
    amplitude *= 0.5;
    frequency *= 2.2;
  }
  return value;
}

void main() {
  vNormal = normal;
  vPosition = position;

  // Displace vertices along normal direction
  float noise = fbm(position * 2.0);
  float displacement = noise * uDisplacementAmount;
  vDisplacement = displacement;

  vec3 displaced = position + normal * displacement;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
}
```

---

### 7.2 Fluid Wall Shader — `fluid.frag.glsl`

```glsl
// fluid.frag.glsl
// Turbulent fluid simulation for Gatherer zone shaft walls
// Makes walls feel alive — disturbed water / liquefied data

uniform float uTime;
uniform vec3 uColorA;    // --glow-ice: vec3(0.31, 0.76, 0.97)
uniform vec3 uColorB;    // deep void: vec3(0.03, 0.03, 0.06)
uniform float uIntensity; // 0.0 = off, 1.0 = fully active
uniform float uScanLine;  // Y position of active scan line (0.0–1.0)

varying vec2 vUv;

// Same snoise from crystalVertex, included here too
// (In production, use a shared include via vite-plugin-glsl #include)

vec3 mod289v3(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289v4(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permutef(vec4 x) { return mod289v4(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrtf(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289v3(i);
  vec4 p = permutef(permutef(permutef(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);
  vec4 norm = taylorInvSqrtf(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

float fbm(vec3 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 6; i++) {
    v += a * snoise(p);
    p = p * 2.2 + vec3(1.7, 9.2, 0.3);
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = vUv;

  // Domain-warped fluid: distort UV with noise before sampling noise again
  vec2 q = vec2(
    fbm(vec3(uv * 2.0, uTime * 0.08)),
    fbm(vec3(uv * 2.0 + vec2(5.2, 1.3), uTime * 0.08))
  );

  vec2 r = vec2(
    fbm(vec3(uv * 2.0 + 4.0 * q + vec2(1.7, 9.2), uTime * 0.06)),
    fbm(vec3(uv * 2.0 + 4.0 * q + vec2(8.3, 2.8), uTime * 0.06))
  );

  float f = fbm(vec3(uv * 2.0 + 4.0 * r, uTime * 0.04));

  // Map noise to colour
  vec3 color = mix(uColorB, uColorA, clamp(f * f * 4.0, 0.0, 1.0));
  color = mix(color, uColorA * 0.5, clamp(length(q), 0.0, 1.0));

  // Scan line: bright horizontal band that sweeps down the wall
  float scanDist = abs(uv.y - uScanLine);
  float scanGlow = smoothstep(0.03, 0.0, scanDist) * 0.8;
  color += uColorA * scanGlow;

  // Edge vignette: walls glow more at top (where crystal enters)
  float edgeFade = smoothstep(0.0, 0.3, uv.y) * smoothstep(1.0, 0.7, uv.y);
  float alpha = (f * 0.3 + 0.06 + scanGlow) * uIntensity * edgeFade;

  gl_FragColor = vec4(color, alpha);
}
```

---

### 7.3 Frost Spread Shader — `frost.frag.glsl`

```glsl
// frost.frag.glsl
// Ice crystal growth pattern — spreads from center outward on synthesis event
// uFrostAmount: 0.0 = no frost, 1.0 = fully covered

uniform float uTime;
uniform float uFrostAmount;  // Animated 0→1 on synthesizer_completed
uniform vec3 uFrostColor;    // vec3(0.7, 0.85, 1.0) — cold blue-white

varying vec2 vUv;

float snoise(vec3 v) {
  // [Same snoise implementation as above]
  // In production: use vite-plugin-glsl #include "noise.glsl"
  return 0.0; // placeholder — replace with full implementation
}

// Voronoi-based crystal growth pattern
vec2 voronoi(vec2 x) {
  vec2 p = floor(x);
  vec2 f = fract(x);
  float minDist = 8.0;
  vec2 minPoint = vec2(0.0);
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 b = vec2(float(i), float(j));
      vec2 r = b - f + fract(sin(dot(p + b, vec2(127.1, 311.7))) * 43758.5453);
      float d = dot(r, r);
      if (d < minDist) {
        minDist = d;
        minPoint = r;
      }
    }
  }
  return vec2(sqrt(minDist), dot(minPoint, minPoint));
}

void main() {
  vec2 uv = vUv;

  // Distance from center — frost grows outward from crystal contact points
  float dist = length(uv - 0.5) * 2.0;

  // Frost front: smooth edge that advances as uFrostAmount increases
  float frostFront = uFrostAmount * 1.4; // slightly overshot so edges fully cover
  float frostMask = smoothstep(frostFront, frostFront - 0.4, dist);

  // Voronoi crystal pattern for the frost texture
  vec2 vor = voronoi(uv * 12.0 + uTime * 0.1);
  float crystalPattern = vor.x * 0.5 + vor.y * 0.3;

  // Edge of frost cells = bright ice lines
  float iceLines = 1.0 - smoothstep(0.0, 0.08, vor.x);

  vec3 frostColor = mix(
    uFrostColor * 0.3,           // cell interior: dim
    uFrostColor,                  // cell edge: bright ice lines
    iceLines
  );

  // Add subtle noise variation within cells
  float variation = snoise(vec3(uv * 8.0, uTime * 0.05)) * 0.2 + 0.8;
  frostColor *= variation;

  float alpha = frostMask * (crystalPattern * 0.6 + iceLines * 0.4) * 0.7;

  gl_FragColor = vec4(frostColor, alpha);
}
```

---

### 7.4 Particle Vertex Shader — `particleVertex.glsl`

```glsl
// particleVertex.glsl
// Velocity-based colour: fast particles = bright ice blue, slow = dim violet
// Matches igloo.inc's particle colouring behaviour exactly

uniform float uTime;
uniform float uPixelRatio;
uniform float uSize;

attribute vec3 aVelocity;    // Per-particle velocity vector
attribute float aPhase;      // Random phase offset per particle

varying vec3 vColor;
varying float vAlpha;

void main() {
  // Colour by speed: map velocity magnitude to colour gradient
  float speed = length(aVelocity);
  float normalizedSpeed = clamp(speed / 0.08, 0.0, 1.0);

  // Slow: dim violet (#a78bfa) → Fast: bright ice (#4fc3f7)
  vec3 slowColor = vec3(0.655, 0.545, 0.980);
  vec3 fastColor = vec3(0.310, 0.765, 0.969);
  vColor = mix(slowColor, fastColor, normalizedSpeed);

  // Alpha: pulsing based on speed + phase
  vAlpha = 0.2 + normalizedSpeed * 0.6 + sin(uTime * 2.0 + aPhase) * 0.1;

  // Billboard point
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = uSize * uPixelRatio * (1.0 / -mvPosition.z);
  gl_Position = projectionMatrix * mvPosition;
}
```

### 7.5 Particle Fragment Shader — `particleFrag.glsl`

```glsl
// particleFrag.glsl
// Soft glowing points — not hard circles

varying vec3 vColor;
varying float vAlpha;

void main() {
  // Soft circle: bright center, feathered edges
  vec2 center = gl_PointCoord - 0.5;
  float dist = length(center);
  float circle = 1.0 - smoothstep(0.3, 0.5, dist);

  // Glow: extend beyond circle edge
  float glow = exp(-dist * 8.0) * 0.4;

  float alpha = (circle + glow) * vAlpha;
  gl_FragColor = vec4(vColor, alpha);
}
```

---

## 8. THE CRYSTAL — EXACT SPECIFICATION

The crystal is the soul of this experience. **Build this first. Get it perfect. Do not proceed until it matches.**

### Geometry:

```javascript
// SEED state (Entry): rough, asymmetric
const seedGeometry = new THREE.IcosahedronGeometry(1.8, 1)
// 80 triangular faces. Apply vertex displacement via crystalVertex.glsl (uDisplacementAmount: 0.25)

// EMERGED state (Results): perfect, fully formed
const emergedGeometry = new THREE.IcosahedronGeometry(1.8, 2)
// 320 triangular faces. uDisplacementAmount: 0.0 (perfectly smooth)

// Morph between them using morphTargets during pipeline completion
```

### Material — `MeshTransmissionMaterial` from drei:

```jsx
// Use drei's MeshTransmissionMaterial — it handles the transmission render target
// internally, which plain MeshPhysicalMaterial doesn't in R3F without extra setup
<MeshTransmissionMaterial
  transmission={0.94}
  thickness={2.8}
  roughness={0.06}
  metalness={0.0}
  ior={1.45}
  iridescence={1.0}
  iridescenceIOR={1.3}
  iridescenceThicknessRange={[80, 900]}
  color="#b8d4f0"
  envMapIntensity={3.0}
  background={scene.background}   // pass scene background for accurate refraction
  samples={6}                      // transmission samples — lower on low-end GPU
  resolution={512}                 // render target resolution
  anisotropy={0.2}
  distortion={0.1}
  distortionScale={0.2}
  temporalDistortion={0.08}
/>
```

### Lighting setup:

```jsx
// Environment
<Environment files="/hdri/night.hdr" />

// Key light: ice blue, top-left
<directionalLight
  color="#4fc3f7"
  intensity={2.5}
  position={[-4, 6, 2]}
/>

// Fill light: deep violet, bottom-right
<directionalLight
  color="#818cf8"
  intensity={1.5}
  position={[4, -3, -2]}
/>

// Rim light: cold white, behind
<directionalLight
  color="#c4c8d4"
  intensity={0.8}
  position={[0, 0, -5]}
/>

// Point light at crystal: for bloom interaction
<pointLight
  color="#4fc3f7"
  intensity={0.6}
  position={[0, 0, 0]}
  distance={5}
/>
```

### Crystal states:

| State | Name | Trigger | uDisplacementAmount | Rotation Speed | Particle Direction |
|---|---|---|---|---|---|
| 0 | `SEED` | App load | 0.25 | 0.002 Y + 0.0005 X | Outward drift |
| 1 | `CHARGING` | User typing | 0.20 (lerps down) | 0.002 + text.length * 0.0003 | Inward pull |
| 2 | `DESCENDING` | pipeline_started | 0.15 | 0 (held) | Orbiting |
| 3 | `FORMING` | synthesizer_completed | 0.08 (lerps down) | 0 | Collapsing inward |
| 4 | `EMERGED` | pipeline_completed | 0.0 | 0.001 Y (majestic) | Outward drift (slower) |

All state transitions: GSAP `gsap.to(uniforms.uDisplacementAmount, { value: target, duration: 1.2, ease: "power3.inOut" })`

---

## 9. ENTRY SCENE — ACT 1 — EXACT BUILD SPEC

### Canvas setup:

```jsx
<Canvas
  gl={{
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
    stencil: false,
  }}
  dpr={[1, 2]}
  camera={{ fov: 50, position: [0, 0, 6], near: 0.1, far: 100 }}
  style={{ position: 'fixed', inset: 0 }}
>
  <color attach="background" args={['#08080a']} />
  <fog attach="fog" args={['#08080a', 8, 20]} />  {/* subtle depth fog */}
  ...
</Canvas>
```

### Ring text:
- HTML `<div>` positioned absolute, centered on canvas
- Text: `ATLAS · RESEARCH · FOCUS · YOUR · QUESTION · ATLAS · RESEARCH · FOCUS · YOUR · QUESTION ·`
- Font: Space Grotesk 300, `var(--text-ring)`, `var(--text-secondary)`, letter-spacing `0.28em`
- CSS: `border-radius: 50%; width: 340px; height: 340px; display: flex; align-items: center; justify-content: center;` — but text is arranged in a circle using SVG `<textPath>` on a circle path, NOT CSS border-radius trick
- Rotation: `animation: ringRotate 35s linear infinite` — slow clockwise
- On crystal hover: transition `color` to `var(--glow-ice)`, letter-spacing to `0.36em`

```jsx
// RingText.jsx — use SVG textPath for true circular text
<svg viewBox="0 0 340 340" style={{position:'absolute', width:340, height:340}}>
  <defs>
    <path id="ring" d="M 170,170 m -140,0 a 140,140 0 1,1 280,0 a 140,140 0 1,1 -280,0" />
  </defs>
  <text fontFamily="Space Grotesk" fontSize="9" fontWeight="300"
        letterSpacing="6" fill="var(--text-secondary)">
    <textPath href="#ring" startOffset="0%">
      ATLAS · RESEARCH · FOCUS · YOUR · QUESTION · ATLAS · RESEARCH · FOCUS · YOUR · QUESTION ·
    </textPath>
  </text>
</svg>
```

### Crystal click → shatter:
On R3F `onClick` on crystal mesh:

1. Get all face positions from `IcosahedronGeometry` (group vertices into triangles)
2. GSAP timeline: each face/group explodes outward along face normal direction
   - `duration: 0.6`, `ease: "power4.out"`, stagger `0.01`
   - Distance: random `0.5–2.0` units along normal
3. After 600ms: faces freeze in place, rotate slowly in orbit
4. After 800ms: HTML input appears at canvas center, text scramble runs

### Text scramble implementation:

```javascript
// utils/textScramble.js
const CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*<>?/|'

export class TextScramble {
  constructor(el) {
    this.el = el
    this.resolve = null
    this.frameRequest = null
    this.frame = 0
    this.queue = []
    this.update = this.update.bind(this)
  }

  setText(newText) {
    const oldText = this.el.innerText
    const length = Math.max(oldText.length, newText.length)
    return new Promise((resolve) => {
      this.resolve = resolve
      this.queue = []
      for (let i = 0; i < length; i++) {
        const from = oldText[i] || ''
        const to = newText[i] || ''
        const start = Math.floor(Math.random() * 20)
        const end = start + Math.floor(Math.random() * 20)
        this.queue.push({ from, to, start, end })
      }
      cancelAnimationFrame(this.frameRequest)
      this.frame = 0
      this.update()
    })
  }

  update() {
    let output = ''
    let complete = 0
    for (let i = 0, n = this.queue.length; i < n; i++) {
      let { from, to, start, end, char } = this.queue[i]
      if (this.frame >= end) {
        complete++
        output += to
      } else if (this.frame >= start) {
        if (!char || Math.random() < 0.28) {
          char = CHARSET[Math.floor(Math.random() * CHARSET.length)]
          this.queue[i].char = char
        }
        output += `<span style="color:var(--glow-ice);opacity:0.6">${char}</span>`
      } else {
        output += from
      }
    }
    this.el.innerHTML = output
    if (complete === this.queue.length) {
      this.resolve()
    } else {
      this.frameRequest = requestAnimationFrame(this.update)
      this.frame++
    }
  }
}
```

### Input:

```jsx
<textarea
  ref={inputRef}
  style={{
    position: 'absolute',
    top: '50%', left: '50%',
    transform: 'translate(-50%, -50%)',
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: '#ffffff',
    fontFamily: 'var(--font-display)',
    fontSize: 'clamp(1.2rem, 2.2vw, 2rem)',
    fontWeight: 300,
    letterSpacing: '0.08em',
    textAlign: 'center',
    width: '60vw',
    resize: 'none',
    caretColor: 'var(--glow-ice)',
    lineHeight: 1.4,
    rows: 3,
    zIndex: 'var(--z-ui)',
  }}
  onKeyDown={(e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }}
/>
```

### Submit transition:
1. GSAP: orbiting shards collapse back into crystal over `0.8s`
2. Crystal reforms: `uDisplacementAmount` lerps from 0.25 → 0.15
3. ChromaticAberration offset ramps: `[0,0]` → `[0.012, 0.012]` over `0.2s`
4. Hold at peak for `0.15s`
5. Snap back: `[0.012, 0.012]` → `[0,0]` over `0.15s`
6. During step 5: scene switches to DescentScene, camera begins descending

---

## 10. WEBSOCKET — COMPLETE EVENT MAP

### All WS event types and their exact visual consequence:

```javascript
// utils/wsEventTypes.js
export const WS_EVENTS = {
  // Pipeline
  PIPELINE_STARTED:    'pipeline_started',
  PIPELINE_COMPLETED:  'pipeline_completed',
  PIPELINE_STOPPED:    'pipeline_stopped',
  PIPELINE_ERROR:      'pipeline_error',

  // Agents
  AGENT_STARTED:       'agent_started',
  AGENT_COMPLETED:     'agent_completed',

  // Gatherer
  SEARCH_STARTED:               'search_started',
  SEARCH_COMPLETED:             'search_completed',
  SOURCE_STARTED:               'source_started',
  SOURCE_FETCH_COMPLETED:       'source_fetch_completed',
  SOURCE_GENERATION_COMPLETED:  'source_generation_completed',
  SOURCE_REPLACED:              'source_replaced',
  SOURCE_EXHAUSTED:             'source_exhausted',
  GATHERER_COMPLETED:           'gatherer_completed',

  // Synthesizer
  SYNTHESIZER_STARTED:              'synthesizer_started',
  SYNTHESIZER_SKIPPED:              'synthesizer_skipped',
  SYNTHESIZER_COMPLETED:            'synthesizer_completed',
  FINDINGS_RETRIEVED:               'findings_retrieved',
  SYNTHESIZER_GENERATION_COMPLETED: 'synthesizer_generation_completed',
  SYNTHESIS_SUPERSEDED:             'synthesis_superseded',

  // Critic
  CRITIC_STARTED:              'critic_started',
  CRITIC_SKIPPED:              'critic_skipped',
  CRITIC_COMPLETED:            'critic_completed',
  CRITIC_GENERATION_COMPLETED: 'critic_generation_completed',

  // Memory
  MEMORY_WRITTEN: 'memory_written',

  // VRAM
  MODEL_UNLOAD_STARTED:    'model_unload_started',
  MODEL_UNLOAD_COMPLETED:  'model_unload_completed',
  MODEL_LOAD_STARTED:      'model_load_started',
  MODEL_LOAD_COMPLETED:    'model_load_completed',
}
```

### Event → Visual mapping (complete):

| Event | Visual |
|---|---|
| `pipeline_started` | Camera descends. Shaft materialises. Crystal enters DESCENDING state. |
| `pipeline_completed` | Camera rises. Shaft fades. Crystal emerges. EmergenceScene. |
| `pipeline_stopped` | Shaft walls flash cold red. Crystal fragments stay suspended. Error message scrambles in. |
| `pipeline_error` | Same as stopped + `--glow-error` pulse on walls. |
| `agent_started` (gatherer) | Zone 1 fluid shader activates (`uIntensity` → 1.0 over 0.6s). Zone 1 walls pulse ice blue. |
| `agent_started` (synthesizer) | Chromatic aberration transition. Camera moves to Zone 2. Fluid fades. Frost shader activates on Zone 2 walls. |
| `agent_started` (critic) | Chromatic aberration transition. Camera moves to Zone 3. Walls go violet-tinted. Geometry narrower. |
| `agent_completed` | Current zone dims 30%. Small completion glyph on wall (✦ in JetBrains Mono, via drei `<Text>`). |
| `search_started` | ScanLine component appears at top of Zone 1, begins sweeping downward over 3s. |
| `search_completed` | ScanLine dissolves with `opacity → 0`, `scaleX → 2` over 0.4s. |
| `source_started` | DataShard spawns at shaft wall edge. Random angle. Dim, semi-transparent. Pulsing. |
| `source_fetch_completed` | Shard solidifies. URL text appears on shard face. `emissive` brightens slightly. |
| `source_generation_completed` | Shard glows `--glow-ice` at full intensity. Begins drifting toward crystal. |
| `source_replaced` | Old shard dissolves (scale → 0, 0.3s). New shard spawns immediately. |
| `source_exhausted` | Shard colour shifts to `--text-secondary`, drifts away from crystal slowly. |
| `gatherer_completed` | All glowing shards orbit crystal in formation. Crystal begins to look denser (vertex count morph). |
| `synthesizer_started` | Orbiting shards begin converging. GSAP spiral animation inward. |
| `findings_retrieved` | Each relevant shard flashes `--glow-ice` once. |
| `synthesizer_generation_completed` | All shards collapse INTO crystal surface in one simultaneous pulse. Point light intensity spike. |
| `synthesis_superseded` | Crystal emits shockwave: `THREE.RingGeometry` expands outward from crystal, fades. Frost explodes across Zone 2 walls. |
| `synthesizer_skipped` | Crystal dims briefly. Yellow warning glyph (⚠) floats past camera. |
| `synthesizer_completed` | Crystal fully compressed, glowing at Zone 2 depth. `uDisplacementAmount` at 0.08. |
| `critic_started` | Zone 3 activates. Walls narrow (cylinder radius lerps 2.5 → 1.8). Violet ambient. |
| `critic_generation_completed` | Crystal held still. Fine fracture lines scan across surface (thin emissive lines drawn on geometry). |
| `critic_completed` (no flags) | All fracture lines heal: `--glow-success` pulse. Crystal surface clears. |
| `critic_completed` (flags) | Flagged faces retain orange lines. Others heal. |
| `critic_skipped` | Zone 3 walls flash once, camera rises immediately without stopping. |
| `memory_written` (RAW_FINDING) | Corresponding DataShard solidifies (same as source_fetch_completed). |
| `memory_written` (SYNTHESIS) | Crystal pulse as in synthesizer_generation_completed. |
| `memory_written` (FLAGGED) | One crystal face cracks: thin `--glow-flag` line appears on that face. |
| `model_unload_started` | Camera freeze. Zone transition walls slide/reconfigure: GSAP animates panel positions. |
| `model_unload_completed` | Panels lock. 0.3s darkness pulse. |
| `model_load_started` | New zone panels illuminate, different colour temperature. |
| `model_load_completed` | Camera resumes descent. ChromaticAberration micro-flash. |

---

## 11. DEPTH SHAFT — FULL SPECIFICATION

```javascript
// Three.js cylinder — rendered from inside (BackSide)
const shaft = new THREE.CylinderGeometry(
  3.2,    // top radius
  2.2,    // bottom radius — tapers as you descend
  35,     // depth
  48,     // radial segments — smooth enough for fluid shader
  24,     // height segments — enough for UV-based zone shader
  true    // open-ended
)
// material.side = THREE.BackSide
```

### Zone shader switching:
Each zone (Gatherer, Synthesizer, Critic) is a **separate cylinder mesh** occupying its third of the shaft. They share the same geometry type but have different shader materials with different uniforms:

- Zone 1: `fluid.frag.glsl` with `uColorA = vec3(0.31, 0.76, 0.97)` (ice blue)
- Zone 2: frost pattern on walls, `uColorA = vec3(0.51, 0.55, 0.97)` (indigo)
- Zone 3: narrow walls, `uColorA = vec3(0.655, 0.545, 0.98)` (violet)

All zone materials: `transparent: true, depthWrite: false, blending: THREE.AdditiveBlending`

Additive blending is critical — it makes the glowing wall effects accumulate naturally in the dark void.

### Camera positions during descent:
```javascript
const CAMERA_POSITIONS = {
  entry:       { x: 0, y: 0,   z: 6  },   // outside shaft, looking in
  shaft_top:   { x: 0, y: 2,   z: 0  },   // just inside shaft top
  gatherer:    { x: 0, y: 0,   z: 0  },   // Zone 1 center
  synthesizer: { x: 0, y: -11, z: 0  },   // Zone 2 center
  critic:      { x: 0, y: -22, z: 0  },   // Zone 3 center
  emergence:   { x: 0, y: 5,   z: 6  },   // above shaft, crystal rising
}
// All transitions: gsap.to(camera.position, { ...pos, duration: 1.6, ease: "power3.inOut" })
// Always update OrbitControls target simultaneously
```

---

## 12. DATA SHARDS — FULL SPECIFICATION

```jsx
// DataShard.jsx
const shardStates = {
  spawning: {
    transmission: 0.8, roughness: 0.5,
    color: '#1a2535', emissiveIntensity: 0,
    opacity: 0.5, scale: 0.6
  },
  solidified: {
    transmission: 0.5, roughness: 0.2,
    color: '#1a3a5c', emissiveIntensity: 0.1,
    opacity: 1.0, scale: 1.0
  },
  glowing: {
    transmission: 0.3, roughness: 0.1,
    color: '#2a5080', emissiveIntensity: 0.6,
    emissive: '#4fc3f7', opacity: 1.0, scale: 1.1
  },
  exhausted: {
    transmission: 0.9, roughness: 0.6,
    color: '#2a2d36', emissiveIntensity: 0,
    opacity: 0.3, scale: 0.8
  }
}
```

Geometry: `THREE.TetrahedronGeometry(0.18, 0)` — each shard gets `rotation.set(random, random, random)` on spawn for unique orientation.

Material: `MeshTransmissionMaterial` (same as crystal, lower quality settings — `samples={2}, resolution={128}`)

Text on shards: `@react-three/drei` `<Text>`, `fontSize={0.035}`, JetBrains Mono, `color="var(--glow-ice)"`, truncated URL (30 chars max), positioned on front face of tetrahedron.

State transitions: GSAP on material uniforms. Never snap states.

Max shards: 12. On 13th spawn, oldest shard plays exit animation (scale → 0, opacity → 0, 0.5s) then removes from scene.

---

## 13. EMERGED CRYSTAL — ACT 3 — FULL SPECIFICATION

### Crystal morph on emergence:
During camera rise, crystal morphs from `IcosahedronGeometry(1.8, 1)` to `IcosahedronGeometry(1.8, 2)`.
Use `morphTargets` or simply swap geometry during the transition blur moment.
`uDisplacementAmount` animates from 0.08 → 0.0 over 2.0s.

### Synthesis text on faces:
```jsx
// SynthesisFaces.jsx
// Split processedInfo into chunks, place each on a crystal face

const faces = getFacePositions(crystalGeometry)   // compute centroid + normal of each face
const chunks = splitIntoChunks(processedInfo, faces.length)

return faces.map((face, i) => (
  <Text
    key={i}
    position={face.centroid.clone().multiplyScalar(1.05)}  // slightly outside face
    rotation={/* orient toward face normal */}
    fontSize={0.1}
    maxWidth={1.0}
    lineHeight={1.6}
    font="/fonts/Inter_300.woff"   // host locally for offline use
    color="#c4c8d4"
    anchorX="center"
    anchorY="middle"
    outlineWidth={0.002}
    outlineColor="#000000"
  >
    {chunks[i]}
    {/* Text scramble-in on mount: use onSync callback + TextScramble */}
  </Text>
))
```

Text scrambles in face by face: each face reveals 200ms after the previous.

### Flagged faces:
For each `id` in `flaggedItems`:
- Find corresponding face (map by index: `flaggedItems[0]` → face 0, etc.)
- Overlay a thin `THREE.EdgesGeometry` on that face with `LineBasicMaterial({ color: '#f97316', linewidth: 2 })`
- Place `<Text>` with `⚠` glyph at face centroid, `color="#f97316"`, `fontSize={0.15}`
- On click: HTML tooltip appears with flag detail (fetched from backend if available, else show ID)

### Orbit controls on emerged crystal:
```jsx
<OrbitControls
  enablePan={false}
  enableZoom={false}
  minPolarAngle={Math.PI * 0.2}
  maxPolarAngle={Math.PI * 0.8}
  autoRotate={false}
  rotateSpeed={0.4}
/>
// Auto-rotation resumes if user hasn't interacted for 4 seconds
```

---

## 14. CHAT LAYER — ACT 4

### Layout:
```
┌─────────────────────────────────────────┐
│  [Emerged Crystal — 55% scale, orbiting]│
├─────────────────────────────────────────┤  ← thin line: 1px var(--border-dim)
│  [chat messages flowing down]           │
│                                         │
│  [message]                  user msg →  │
│  ← [response]                           │
│                                         │
├─────────────────────────────────────────┤  ← 1px var(--border-dim)
│  [ ask something deeper...          → ] │
└─────────────────────────────────────────┘
```

The crystal stays visible in the top section — still rotating, smaller. It is the persistent context anchor. Its faces still show synthesis text. It never leaves until the user starts a new session.

### Message component:
```jsx
// ChatMessage.jsx
// Each message appears with TextScramble — letters randomise then settle

<div style={{
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--text-base)',
  fontWeight: 300,
  lineHeight: 1.85,
  color: isUser ? 'var(--text-input)' : 'var(--text-primary)',
  textAlign: isUser ? 'right' : 'left',
  maxWidth: '70%',
  alignSelf: isUser ? 'flex-end' : 'flex-start',
  // No background. No bubble. No border. Just text in the void.
  // A small SVG micro-shard (3-4px) floats near the message as a marker
}}>
  <span ref={textRef} />  {/* TextScramble target */}
</div>
```

### POST /chat integration:
```javascript
// On Enter in ChatInput:
const response = await fetch('http://localhost:8000/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: chatMessages,          // full history
    project_tag: projectTag,
    synthesis_id: synthesisId,
  })
})
const data = await response.json()
addChatMessage({ role: 'assistant', content: data.reply })
```

Correction save: when user types "that's wrong" / "incorrect" / correction intent detected — show a subtle prompt: `SAVE CORRECTION?  [YES]  [NO]` in JetBrains Mono at `--text-secondary`. If YES: re-send with `save_correction: true, correction_content: lastUserMessage`.

---

## 15. POST-PROCESSING — FULL PIPELINE

```jsx
import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
  Vignette,
  Noise,
  DepthOfField
} from '@react-three/postprocessing'
import { BlendFunction, KernelSize } from 'postprocessing'

<EffectComposer multisampling={4}>

  {/* Bloom: makes emissive materials glow. Crystal, shards, particles all bloom. */}
  <Bloom
    intensity={0.5}
    luminanceThreshold={0.55}
    luminanceSmoothing={0.85}
    kernelSize={KernelSize.LARGE}
    mipmapBlur
  />

  {/* ChromaticAberration: zero offset normally, animated during transitions */}
  <ChromaticAberration
    ref={chromaticRef}         // ref to animate offset via GSAP
    offset={[0, 0]}
    blendFunction={BlendFunction.NORMAL}
    radialModulation={true}    // stronger at edges, like real lens aberration
    modulationOffset={0.4}
  />

  {/* Vignette: always on. Frames experience, pulls focus to center. */}
  <Vignette
    offset={0.28}
    darkness={0.75}
    eskil={false}
    blendFunction={BlendFunction.NORMAL}
  />

  {/* Film noise: very subtle. Makes scene feel alive, not CG-sterile. */}
  <Noise
    opacity={0.018}
    blendFunction={BlendFunction.SCREEN}
  />

  {/* Depth of Field: active during descent only. Blurs shaft walls behind crystal. */}
  <DepthOfField
    ref={dofRef}
    focusDistance={0.01}
    focalLength={0.04}
    bokehScale={2}
    enabled={currentScene === 'descent'}
  />

</EffectComposer>
```

### ChromaticAberration animation:
```javascript
// useGSAPCamera.js — triggerChromatic function
export function triggerChromatic(chromaticRef) {
  const tl = gsap.timeline()
  tl.to(chromaticRef.current.offset, {
    x: 0.014, y: 0.014,
    duration: 0.18,
    ease: 'power4.in'
  })
  .to(chromaticRef.current.offset, {
    x: 0, y: 0,
    duration: 0.22,
    ease: 'power4.out'
  })
}
```

---

## 16. ZUSTAND STORE — COMPLETE

```javascript
// store/atlasStore.js
import { create } from 'zustand'

const useAtlasStore = create((set, get) => ({
  // ── Scene ─────────────────────────────────────────
  currentScene: 'entry',    // 'entry' | 'descent' | 'emergence' | 'chat'
  setScene: (scene) => set({ currentScene: scene }),

  // ── Crystal ───────────────────────────────────────
  crystalState: 'SEED',     // SEED | CHARGING | DESCENDING | FORMING | EMERGED
  setCrystalState: (s) => set({ crystalState: s }),

  // ── Pipeline ──────────────────────────────────────
  pipelineStage: null,      // null | 'gatherer' | 'synthesizer' | 'critic'
  setPipelineStage: (stage) => set({ pipelineStage: stage }),
  pipelineError: null,
  setPipelineError: (err) => set({ pipelineError: err }),

  // ── Input ─────────────────────────────────────────
  question: '',
  setQuestion: (q) => set({ question: q }),
  projectTag: 'default',
  setProjectTag: (tag) => set({ projectTag: tag }),
  deepResearch: false,
  setDeepResearch: (v) => set({ deepResearch: v }),

  // ── Results ───────────────────────────────────────
  synthesisId: null,
  processedInfo: null,
  flaggedItems: [],
  setResults: (id, info, flags) => set({
    synthesisId: id,
    processedInfo: info,
    flaggedItems: flags ?? []
  }),

  // ── Data Shards ───────────────────────────────────
  dataShards: [],
  addShard: (shard) => set((s) => {
    const existing = s.dataShards
    const trimmed = existing.length >= 12
      ? existing.slice(1)   // remove oldest
      : existing
    return { dataShards: [...trimmed, shard] }
  }),
  updateShard: (id, updates) => set((s) => ({
    dataShards: s.dataShards.map(sh => sh.id === id ? { ...sh, ...updates } : sh)
  })),
  removeShard: (id) => set((s) => ({
    dataShards: s.dataShards.filter(sh => sh.id !== id)
  })),

  // ── Scan line ─────────────────────────────────────
  scanLineActive: false,
  scanLineY: 0,
  setScanLine: (active, y = 0) => set({ scanLineActive: active, scanLineY: y }),

  // ── VRAM ──────────────────────────────────────────
  vramSwapping: false,
  setVramSwapping: (v) => set({ vramSwapping: v }),

  // ── Chat ──────────────────────────────────────────
  chatMessages: [],
  addChatMessage: (msg) => set((s) => ({
    chatMessages: [...s.chatMessages, msg]
  })),
  clearChat: () => set({ chatMessages: [] }),

  // ── Reset ─────────────────────────────────────────
  resetPipeline: () => set({
    currentScene: 'entry',
    crystalState: 'SEED',
    pipelineStage: null,
    pipelineError: null,
    dataShards: [],
    scanLineActive: false,
    synthesisId: null,
    processedInfo: null,
    flaggedItems: [],
    chatMessages: [],
  }),
}))

export default useAtlasStore
```

---

## 17. PERFORMANCE RULES — NON-NEGOTIABLE

These match igloo.inc's approach to maintaining high performance with heavy WebGL.

- **Crystal geometry:** `IcosahedronGeometry` detail level max 2. Never 3+.
- **Particles:** Single `BufferGeometry` with `Points`. Max 800 points. Never individual meshes per particle.
- **Data shards:** Max 12 meshes in scene. Hard limit enforced in store.
- **Dispose:** All Three.js geometries and materials disposed on component unmount via `useEffect` cleanup.
- **MeshTransmissionMaterial samples:** `6` for crystal, `2` for shards. Drop to `4`/`1` on detected low-end GPU.
- **Shader uniforms:** Update via `useFrame` ref mutations. Never trigger re-renders for animation.
- **GSAP:** Kill all timelines and ScrollTriggers in cleanup functions.
- **React.memo:** All Three.js mesh components wrapped.
- **Textures:** Use `useTexture` from drei (cached). Only the HDRI file — no other texture files.
- **Font:** Host Inter woff locally in `/public/fonts/` for offline use.
- **No dynamic imports inside render:** Pre-import all shaders at module level.

### GPU detection for adaptive quality:
```javascript
// In CrystalScene.jsx
const { gl } = useThree()
const isLowEnd = gl.getParameter(gl.MAX_TEXTURE_SIZE) < 8192
// If low-end: reduce transmission samples, particle count, disable DepthOfField
```

---

## 18. THE ANTI-PATTERNS — WHAT GETS TORN DOWN

Before committing any code, ask yourself: **could this appear on a generic SaaS dashboard?**

**NEVER build:**
- Progress bars of any kind
- Loading spinners
- Status badges (ACTIVE / COMPLETED / ERROR as text labels)
- Step indicator components (Step 1 of 3)
- Sidebar navigation
- Card components with backgrounds, borders, box-shadows
- Modal dialogs
- Tooltips that appear on hover (except flagged face detail)
- Navbar or header bar
- Footer
- Toast notifications
- Any text that narrates what is happening ("Synthesizing your research...")
- Gradient blobs or noise textures on HTML elements
- Any colour not in the design tokens
- `setTimeout` for sequencing — use GSAP timelines
- CSS `transition` for 3D elements — use GSAP
- `console.log` in production code

**The 3D scene handles:**
- Loading states (crystal motion)
- Progress (depth position)
- Stage status (zone lighting)
- Errors (wall colour temperature)
- Memory writes (shard solidification)

**HTML handles only:**
- Text input (the question)
- Chat messages
- Project tag selector
- Depth toggle
- Ring text

---

## 19. CURSOR PROMPTS — USE THESE EXACTLY

Save these in a `PROMPTS/` folder. Paste into Cursor Composer at the start of each phase.

---

### PROMPT: PHASE 1 — Scaffold

```
Read ATLASRESEARCH_MASTER.md sections 4 (tech stack), 5 (folder structure), and 6 (design tokens) completely before doing anything.

Create the complete project scaffold:
1. package.json with exact dependency versions from section 4
2. vite.config.js with vite-plugin-glsl added
3. tailwind.config.js (content paths for src/)
4. src/styles/globals.css — exact CSS vars from section 6, font imports, body reset, custom cursor
5. src/main.jsx — mount App to #root
6. src/App.jsx — placeholder that renders EntryScene
7. All empty folders from section 5's folder structure
8. .cursorrules file containing: "Always read ATLASRESEARCH_MASTER.md before writing any code."
9. src/store/atlasStore.js — complete Zustand store from section 16
10. src/utils/wsEventTypes.js — all event type constants from section 10

Do NOT build any components yet. Scaffold and store only.
Run `npm install` mentally and confirm all deps resolve.
```

---

### PROMPT: PHASE 2 — The Shaders

```
Read ATLASRESEARCH_MASTER.md section 7 (The Custom Shaders) completely.

Create all 5 shader files exactly as specified:
- src/components/crystal/shaders/crystalVertex.glsl — full FBM vertex displacement with snoise
- src/components/crystal/shaders/fluid.frag.glsl — domain-warped fluid with scan line
- src/components/crystal/shaders/frost.frag.glsl — Voronoi crystal growth pattern
- src/components/crystal/shaders/particleVertex.glsl — velocity-based colour shader
- src/components/crystal/shaders/particleFrag.glsl — soft glowing points

These are raw GLSL files, not JavaScript. Import them via vite-plugin-glsl.
Do not simplify or stub these shaders. Write the complete GLSL as shown.
These shaders are what make this not a tutorial project.
```

---

### PROMPT: PHASE 3 — The Crystal

```
Read ATLASRESEARCH_MASTER.md sections 7 and 8 (The Crystal) completely.

Build CrystalScene.jsx, CrystalMesh.jsx, CrystalParticles.jsx.

CrystalScene.jsx requirements:
- R3F Canvas: antialias, alpha false, powerPreference high-performance, dpr [1,2]
- Camera: fov 50, position [0,0,6]
- Background: color #08080a + fog #08080a 8 20
- Environment from /public/hdri/night.hdr
- Three directional lights as specified in section 8
- EffectComposer with Bloom, Vignette, ChromaticAberration (ref exported), Noise, DepthOfField
- GPU quality detection for adaptive samples

CrystalMesh.jsx requirements:
- IcosahedronGeometry(1.8, 1) SEED state
- MeshTransmissionMaterial with ALL params from section 8 (transmission 0.94, thickness 2.8, etc.)
- crystalVertex.glsl injected via onBeforeCompile to add uDisplacementAmount, uTime uniforms
- uDisplacementAmount: 0.25 in SEED state
- Slow rotation: Y += 0.002, X += 0.0005 per frame via useFrame

CrystalParticles.jsx requirements:
- 800 particles in single BufferGeometry Points
- particleVertex.glsl + particleFrag.glsl as ShaderMaterial
- aVelocity attribute: random outward vectors * 0.03
- Particles drift outward slowly, wrap at radius 3.5

DO NOT use flat/lambert/phong materials anywhere.
DO NOT add any HTML until crystal is visually correct.
The crystal must look like real ice/glass with iridescent colour shift as it rotates.
Bloom must be visible on crystal edges.
```

---

### PROMPT: PHASE 4 — Entry Scene

```
Read ATLASRESEARCH_MASTER.md section 9 (Entry Scene) completely.

The crystal scene works correctly. Now build the entry interaction.

Build: RingText.jsx, CrystalShatter.jsx, EntryScene.jsx, ProjectTagPill.jsx, DepthToggle.jsx
Build: src/utils/textScramble.js — exact implementation from section 9

RingText.jsx: SVG textPath on circle, "ATLAS · RESEARCH · FOCUS · YOUR · QUESTION ·" repeating, CSS rotation animation 35s

CrystalShatter.jsx:
- On crystal onClick: decompose IcosahedronGeometry faces
- GSAP: each face flies outward along face normal, duration 0.6s, power4.out, stagger 0.01
- After 600ms: faces freeze, orbit slowly
- After 800ms: input appears, TextScramble runs "WHAT DO YOU NEED TO KNOW?"

EntryScene.jsx:
- Assembles CrystalScene + RingText + CrystalShatter
- Transparent textarea: exact styles from section 9
- Space Grotesk 300, centered, white caret
- Orbiting shards accelerate proportionally to question.length
- On Enter: shards collapse to crystal, chromatic aberration 400ms, scene → DescentScene

ProjectTagPill: bottom-left, monospace, --text-secondary, click to edit/select tag
DepthToggle: bottom-right, "SURFACE ● DEEP", dot slides with CSS transition

Use GSAP for everything. No CSS transition for shards or crystal movements.
```

---

### PROMPT: PHASE 5 — Depth Shaft + WebSocket

```
Read ATLASRESEARCH_MASTER.md sections 10 (WebSocket Event Map) and 11 (Depth Shaft) completely.

Build: useWebSocket.js, DepthShaft.jsx, GathererLayer.jsx, DataShard.jsx, ScanLine.jsx

useWebSocket.js:
- Connect to ws://localhost:8000/ws/research
- Send { question, project_tag, deep_research } on open
- Parse ALL 30+ event types from section 10
- Map each to exact store action listed in the event → visual table
- Export: { connect, disconnect, isConnected }

DepthShaft.jsx:
- CylinderGeometry(3.2, 2.2, 35, 48, 24, true), BackSide
- Three zone meshes: Gatherer / Synthesizer / Critic
- Zone 1: fluid.frag.glsl ShaderMaterial, uIntensity controlled by store
- Zone 2: frost.frag.glsl on walls (uFrostAmount)
- Zone 3: same fluid shader but uColorA = violet, walls narrower
- All zone materials: transparent, depthWrite false, AdditiveBlending

GathererLayer.jsx:
- Renders DataShard components for each shard in store.dataShards
- ScanLine when store.scanLineActive

DataShard.jsx:
- TetrahedronGeometry(0.18, 0)
- MeshTransmissionMaterial, samples 2, resolution 128
- Shard states from section 12 — GSAP transitions between states
- drei Text for URL on solidified shards
- Position: shaft wall edge at random angle, radius 2.8

useGSAPCamera.js:
- Camera timeline from CAMERA_POSITIONS in section 11
- triggerChromatic() function for aberration transitions
- Driven by store.currentScene and store.pipelineStage changes

DO NOT build status indicators, progress bars, or text labels for pipeline stages.
The shaft zones and shard states ARE the status system.
```

---

### PROMPT: PHASE 6 — Emergence + Chat

```
Read ATLASRESEARCH_MASTER.md sections 13 (Emerged Crystal) and 14 (Chat Layer) completely.

Build: EmergenceScene.jsx, SynthesisFaces.jsx, FlagFracture.jsx, ChatScene.jsx, ChatLayer.jsx, ChatMessage.jsx, ChatInput.jsx

EmergenceScene.jsx:
- Triggered by pipeline_completed store event
- Camera rises from Zone 3 to emergence position (CAMERA_POSITIONS.emergence)
- Shaft walls fade opacity → 0 over 1.2s
- Crystal geometry swaps/morphs to IcosahedronGeometry(1.8, 2)
- uDisplacementAmount animates 0.08 → 0.0 over 2.0s
- SynthesisFaces mounts and text scrambles in face-by-face, 200ms stagger

SynthesisFaces.jsx:
- Compute face centroids + normals from emerged geometry
- Place drei Text at each face centroid, facing outward
- Split processedInfo into chunks by face count
- TextScramble on each chunk, staggered 200ms
- OrbitControls (section 13 params)

FlagFracture.jsx:
- For each id in flaggedItems: EdgesGeometry overlay on that face, --glow-flag orange
- ⚠ glyph Text at centroid
- onClick: HTML tooltip with flag detail

ChatScene.jsx:
- Crystal at 55% scale, top section, still orbiting
- Horizontal divider line
- ChatLayer below

ChatLayer.jsx + ChatMessage.jsx:
- Messages as plain text in void — no bubbles, no cards, no backgrounds
- TextScramble on assistant messages
- POST /chat on submit (section 14)
- Correction detection + SAVE CORRECTION prompt

All text Inter 300, --text-primary for assistant, white for user.
No borders, no background cards. Text in the void only.
```

---

## 20. BUILD ORDER — STRICT SEQUENCE

```
Phase 1  │  Scaffold + store + event constants
Phase 2  │  All 5 GLSL shader files — written in full
Phase 3  │  CrystalScene + CrystalMesh + CrystalParticles
         │  ⛔ STOP. Crystal must look like real glass/ice before proceeding.
Phase 4  │  Entry Scene: ring text, shatter, input, scramble, submit transition
         │  ⛔ STOP. Entry experience must feel complete before proceeding.
Phase 5  │  Depth shaft + WebSocket hook + full event parsing + DataShards
         │  ⛔ STOP. Connect to live backend. Verify shards appear correctly.
Phase 6  │  Emergence scene + synthesis faces + flag fractures
Phase 7  │  Chat layer + POST /chat integration + correction flow
Phase 8  │  Polish: GPU quality detection, dispose cleanup, VRAM swap animation,
         │  custom cursor, mobile graceful degradation, leva panel removal
```

The ⛔ stops are not optional. Each phase must work end-to-end before the next begins.

---

## 21. REFERENCE LINKS

| Resource | URL |
|---|---|
| igloo.inc live site | https://www.igloo.inc |
| igloo.inc Awwwards case study | https://www.awwwards.com/igloo-inc-case-study.html |
| igloo.inc Awwwards SOTD page | https://www.awwwards.com/sites/igloo-inc |
| Refs.Gallery breakdown | https://www.refs.gallery/projects/igloo-inc |
| Three.js MeshPhysicalMaterial | https://threejs.org/docs/#api/en/materials/MeshPhysicalMaterial |
| drei MeshTransmissionMaterial | https://drei.docs.pmnd.rs/materials/mesh-transmission-material |
| R3F docs | https://r3f.docs.pmnd.rs |
| drei docs | https://drei.docs.pmnd.rs |
| GSAP docs | https://gsap.com/docs/v3 |
| postprocessing docs | https://pmndrs.github.io/postprocessing/public/docs |
| three-mesh-bvh | https://github.com/gkjohnson/three-mesh-bvh |
| Polyhaven HDRIs (free) | https://polyhaven.com/hdris |
| Space Grotesk (Google Fonts) | https://fonts.google.com/specimen/Space+Grotesk |
| JetBrains Mono (Google Fonts) | https://fonts.google.com/specimen/JetBrains+Mono |

---

*This document is the law. When Cursor generates something that doesn't match — override it.
The experience comes first. Always.*
