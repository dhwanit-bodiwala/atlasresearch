---
kind: external_dependency
name: Three.js 3D Graphics Engine
slug: three-js
category: external_dependency
category_hints:
    - vendor_identity
scope:
    - '**'
source_files:
    - frontend/package.json
    - frontend/src/components/crystal/CrystalScene.jsx
---

Core 3D graphics engine powering the spatial research interface. Used via @react-three/fiber for React integration, with direct Three.js imports for custom geometry manipulation, material creation, and WebGL context management. The crystal rendering pipeline relies on Three.js primitives (IcosahedronGeometry), BufferGeometry for particles, and GLTF loading for the two-part crystal model.