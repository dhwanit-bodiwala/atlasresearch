ATLASRESEARCH — LAKE SCENE DESIGN DOCUMENT
------------------------------------------

#### The Mysterous Lake — Complete Scene Bible

### World State

The tundra is dead. Grey-white, flat, overcast. No movement anywhere. The fog sits heavy on the horizon. The camera starts far back — Z=90 as it is now — and the world feels vast and empty.

Except for one thing. A dark shape in the middle distance. The lake.

**Palette shift from current:**

ElementCurrentNewFog color#9aaab8 (blue-grey)#8a9aaa (slightly warmer grey, less blue)Background#8a9aa8#7a8a96 (darker, more oppressive)Lake water—#0a0e14 (near black, deep)Flora—Muted sage green, dead reed brownCrystal light on water—Warm amber-white caustic patch

The world should feel _heavier_ than it currently does. The lake being the only dark thing makes it magnetic.

### Components — What Gets Removed

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   IceFracture.jsx     ← DELETE  IceCrack.jsx        ← DELETE  FrozenLake.jsx      ← REPURPOSE into LakeBody.jsx   `

Remove from TundraScene.jsx:

*   IceFracture import + mount
    
*   IceCrack import + mount
    
*   crackScaleRef — gone entirely
    
*   FrozenLake import replaced with LakeBody
    

### Components — What Gets Added

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   environment/  ├── LakeBody.jsx          ← Irregular water surface, normal map animation  ├── LakeFlora.jsx         ← Cattails, flowers, grass along perimeter  ├── LakeRipple.jsx        ← Concentric rings on fall trigger  └── WaterEntry.jsx        ← Surface parting moment, caustic flash   `

### LakeBody.jsx — Design Spec

**Shape:** THREE.Shape with bezier curves. Approximately 12 control points, hand-tuned to feel like a natural pond. Roughly 28 units wide, 22 units deep. Elongated slightly on the Z axis. Not symmetric on any axis.

**Suggested shape points** (tune in Antigravity):

javascript

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   const shape = new THREE.Shape()  shape.moveTo(0, -11)  shape.bezierCurveTo(8, -12, 15, -7, 14, 0)  shape.bezierCurveTo(13, 6, 16, 11, 9, 13)  shape.bezierCurveTo(3, 15, -5, 14, -10, 10)  shape.bezierCurveTo(-16, 6, -15, -2, -13, -6)  shape.bezierCurveTo(-11, -10, -7, -10, 0, -11)   `

**Position:** \[0, -3.92, 150\] — slightly below tundra ground level so edges blend naturally. Z=150 matches where crystal sits.

**Material:**

*   MeshStandardMaterial
    
*   color: #0a0e14
    
*   roughness: 0.05
    
*   metalness: 0.3
    
*   Normal map: animated via uTime uniform — slow sine wave displacing normals for subtle breathing water surface
    
*   envMapIntensity: 1.2 for crystal reflection
    

**Crystal reflection on water:**A soft animated light patch directly below crystal position. Warm white-amber, PointLight at \[0, -3.5, 150\] intensity 0.8, distance 12. This simulates the crystal's light hitting the water below it.

**Subtle breathing animation:**Below the crystal only — a very slow vertical displacement of the water normal in a radius of ~4 units. Not actual geometry displacement, just normal map UV offset oscillating slowly. Frequency 0.3, amplitude 0.015. Imperceptible individually, felt as "the water is alive here."

### LakeFlora.jsx — Design Spec

Three flora types, all positioned along the lake perimeter:

**Type 1 — Cattails (bulrush)**

*   Tall, ~2.5 units high
    
*   CylinderGeometry(0.04, 0.06, 2.5) for stem, SphereGeometry(0.12) squished for head
    
*   Color: #4a3820 (dark brown head), #5a6840 (olive green stem)
    
*   Count: 18–22, clustered in 3–4 groups around lake edge
    
*   Wind: sway amplitude 0.06 radians, frequency 0.8
    

**Type 2 — Low arctic flowers**

*   Small, ground-hugging, 0.3–0.5 units tall
    
*   SphereGeometry(0.08) petals instanced around center point
    
*   Color: #c8b87a (pale yellow), #d4c890 (cream white)
    
*   Count: 30–40, scattered densely in 2–3 patches
    
*   Wind: amplitude 0.04, frequency 1.2 (faster, lighter)
    

**Type 3 — Sparse grass tufts**

*   Thin blades, PlaneGeometry(0.1, 0.8) double-sided, 3–5 blades per tuft
    
*   Color: #6a7850 (muted sage)
    
*   Count: 25–35 tufts
    
*   Wind: amplitude 0.08, frequency 0.9
    

**Wind shader (shared across all flora types):**

glsl

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   // Vertex shader addition  uniform float uTime;  uniform float uWindStrength;  uniform float uWindFrequency;  // Only sway top vertices (v.y > 0.3)  float swayFactor = max(0.0, position.y - 0.3) / 1.0;  float sway = sin(uTime * uWindFrequency + position.x * 2.1) * uWindStrength * swayFactor;  transformed.x += sway;  transformed.z += sway * 0.3;   `

uWindStrength: 0.06, uWindFrequency: 0.9 — passed as uniforms, same values across all flora for coherent wind feel.

**Placement logic:**Scatter along lake perimeter. Not uniform — cluster in 4–5 natural groupings with gaps between. South edge of lake (toward camera) denser. North edge sparser. Flora never extends more than 3 units from lake edge.

### FallSequencer — New Timeline

Replaces current crackScaleRef logic entirely:

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   t=0.0  → Everything stills. Flora sway stops (uWindStrength → 0, 0.3s).            Water surface flattens (normal map amplitude → 0, 0.3s).  t=0.4  → First ripple ring emerges from crystal position on water surface.  t=0.9  → Second ripple ring.  t=1.3  → Third ripple ring.  t=1.6  → Crystal begins descent. Y: 3.5 → -3.9 (water surface level). Duration: 1.4s ease.in  t=3.0  → Crystal hits water. WaterEntry fires:            - Caustic flash (white ring expands outward, opacity 0→1→0, 0.4s)            - Surface "parting" shader triggers (ripple inverts inward briefly)            - Crystal continues below surface Y: -3.9 → -55  t=3.2  → fallPhase → 'parallel'  t=3.8  → setScene('descent')   `

### LakeRipple.jsx — Design Spec

Three rings, staggered. Each ring:

*   RingGeometry(0, maxRadius, 64) starting at radius 0, expanding
    
*   MeshBasicMaterial, color #4a6880, transparent, opacity animated 0 → 0.6 → 0
    
*   fog: false so rings punch through any mist
    
*   Max radius: slightly less than lake edge so rings don't visually escape the water
    

GSAP drives radius and opacity per ring, triggered by FallSequencer at t=0.4, t=0.9, t=1.3.

### WaterEntry.jsx — Design Spec

One-shot component, fires at t=3.0:

*   White caustic ring: RingGeometry expanding from radius 0 → 6, duration 0.4s, opacity 0 → 1 → 0
    
*   Water "parting": normal map amplitude briefly spikes then collapses to 0
    
*   After crystal passes through, lake surface returns to subtle breathing state — or goes still entirely (your call, I'd go still — the lake _closes_, the event is over)
    

### TundraScene.jsx — Changes Summary

javascript

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   // REMOVE  import IceFracture from './IceFracture'  import IceCrack from './IceCrack'  import FrozenLake from './FrozenLake'  const crackScaleRef = useRef({ value: null })  // gone  // ADD  import LakeBody from './LakeBody'  import LakeFlora from './LakeFlora'  import LakeRipple from './LakeRipple'  import WaterEntry from './WaterEntry'  // FallSequencer no longer needs crackScaleRef  // New refs needed:  const rippleTriggerRef = useRef(false)  const windStrengthRef = useRef({ value: 0.06 })  const waterEntryRef = useRef(false)   `

FogController stays identical. CameraRig stays identical — parallel offsets X=8, Z=10 still valid, just now the crystal is falling into water not a void.

### Phased Build Order — Stop Gates

#### Phase 1 — World restructure ⛔ STOP GATE

Remove IceFracture, IceCrack, FrozenLake. Add LakeBody. Confirm lake shape reads correctly from entry camera position. Adjust bezier points until it feels like a natural pond. Confirm water material looks deep and dark.

**Done when:** Scroll from start to crystal. Lake is visible from distance as dark irregular shape. Water looks real. No z-fighting with TundraGround.

#### Phase 2 — Flora ⛔ STOP GATE

Add LakeFlora. Wind shader working. Flora placed naturally around lake perimeter in clusters.

**Done when:** Flora sways continuously. Tundra behind it is still. The contrast reads — dead world, alive edge.

#### Phase 3 — Fall sequence retiming ⛔ STOP GATE

Rewrite FallSequencer. Still → ripples → descent → water entry → DescentScene.

**Done when:** Full cinematic plays correctly. Ripples read on water surface. Crystal enters water cleanly. No ground clip.

#### Phase 4 — WaterEntry flash ⛔ STOP GATE

Caustic ring on impact. Surface closes.

**Done when:** The moment the crystal enters water has visual punctuation. It feels like a _threshold crossing_, not just a mesh passing through a plane.

#### Phase 5 — DescentScene reframe

Shaft wall shader colors shifted to read as underwater depth zones. No structural change — purely color/uniform tuning.

**Done when:** DescentScene feels like descending through water, not falling through space.