---
kind: external_dependency
name: React Three Post-Processing Effects
slug: react-three-postprocessing
category: external_dependency
category_hints:
    - framework_behavior
scope:
    - '**'
source_files:
    - frontend/package.json
    - frontend/src/components/crystal/CrystalScene.jsx
---

Post-processing effects pipeline for Three.js scenes in React. Implements Bloom for emissive glow, ChromaticAberration for lens distortion during transitions, Vignette for framing, Noise for film grain, and DepthOfField for focus effects. The EffectComposer wraps the entire render pipeline and manages effect ordering and performance optimization.