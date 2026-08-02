---
kind: external_dependency
name: React Three Drei Utilities
slug: react-three-drei
category: external_dependency
category_hints:
    - framework_behavior
scope:
    - '**'
source_files:
    - frontend/package.json
    - frontend/src/components/crystal/CrystalMesh.jsx
---

Collection of essential Three.js utilities for React Three Fiber. Key usage includes MeshTransmissionMaterial for the frosted ice shell effect, Environment for HDRI lighting, useGLTF for loading the two-part crystal model, and Text for rendering synthesis content on crystal faces. The transmission material is critical for achieving the igloo.inc-style frosted glass appearance.