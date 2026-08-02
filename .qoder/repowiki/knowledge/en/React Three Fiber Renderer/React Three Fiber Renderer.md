---
kind: external_dependency
name: React Three Fiber Renderer
slug: react-three-fiber
category: external_dependency
category_hints:
    - sdk_real_api
scope:
    - '**'
source_files:
    - frontend/package.json
    - frontend/src/components/crystal/CrystalScene.jsx
---

React renderer for Three.js that enables declarative 3D scenes using React components. Provides Canvas component for WebGL context, useFrame hook for animation loops, and useThree hook for accessing the Three.js context. The project uses it for all 3D scene composition, camera management, and real-time updates driven by React state.