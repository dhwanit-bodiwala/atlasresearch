---
kind: external_dependency
name: HDRI Environment Maps
slug: polyhaven-hdris
category: external_dependency
category_hints:
    - vendor_identity
scope:
    - '**'
source_files:
    - ATLASRESEARCH_MASTER.md
    - frontend/src/components/crystal/CrystalScene.jsx
---

Free high-dynamic-range environment maps from Polyhaven used for realistic lighting and reflections in the 3D scene. The kloofendal_puresky.hdr file provides a flat studio/sky background without terrain elements, essential for achieving the clean, focused aesthetic described in the master document. Files are loaded via drei's Environment component.