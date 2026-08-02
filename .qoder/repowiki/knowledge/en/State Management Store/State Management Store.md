---
kind: external_dependency
name: State Management Store
slug: zustand
category: external_dependency
category_hints:
    - framework_behavior
scope:
    - '**'
source_files:
    - frontend/package.json
    - frontend/src/store/atlasStore.js
---

Minimal state management library for global application state. Manages scene states (entry, descent, emergence, chat), crystal states (SEED, CHARGING, DESCENDING, FORMING, EMERGED), pipeline stages, data shards, chat messages, and VRAM swapping. The store is consumed across components via hooks and drives the entire visual narrative flow.