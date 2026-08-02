---
kind: business_term
name: Business Glossary
category: business_term
scope:
    - '**'
---

### Crystal
- Definition：The central 3D visualization metaphor representing processed knowledge. Transforms through states (SEED → CHARGING → DESCENDING → FORMING → EMERGED) mirroring the research pipeline. Composed of two parts: a frosted outer shell (MeshTransmissionMaterial) and a soft inner core (emissive meshStandardMaterial). The crystal IS the loading state, depth position IS progress, and surface fractures represent flagged findings.
- Aliases：crystal object、knowledge crystal

### Depth Shaft
- Definition：The cylindrical tunnel representing the three-stage research pipeline. Rendered from inside using BackSide material with AdditiveBlending. Contains three zones: Gatherer (ice blue fluid shader), Synthesizer (frost pattern), and Critic (violet narrow walls). Camera descends through these zones during processing, with each zone having distinct visual characteristics and shader effects.
- Aliases：shaft、pipeline tunnel、descent shaft

### Data Shards
- Definition：TetrahedronGeometry representations of raw facts gathered from sources. Each shard progresses through states: spawning (translucent, pulsing) → solidified (URL text appears) → glowing (attracted to crystal) → exhausted (drifts away). Maximum 12 shards visible simultaneously, with oldest removed when limit exceeded. Visualize the Gatherer agent's work in real-time.
- Aliases：shard、fact shard、data fragment

### Pipeline States
- Definition：The four-stage research process: Gatherer (web search and fact extraction), Synthesizer (compression and organization), Critic (stress-testing and validation). Each state triggers specific visual responses in the 3D scene, including zone activation, camera movement, and material changes. State managed via Zustand store and WebSocket events.
- Aliases：research pipeline、agent stages、processing stages

### Flagged Items
- Definition：Findings identified by the Critic agent as potentially problematic or requiring attention. Visually represented as orange fracture lines on crystal faces with ⚠ glyphs. Users can click to view details and optionally save corrections. Represents the quality assurance aspect of the research process.
- Aliases：flags、fractures、quality flags

### Synthesis Faces
- Definition：Text chunks from the synthesized research output displayed on individual crystal faces after pipeline completion. Each face receives a portion of the processed information, with text scrambling animation revealing content face-by-face. Uses drei's Text component positioned at face centroids with proper orientation toward face normals.
- Aliases：synthesis text、face text、processed info

### VRAM Swapping
- Definition：Memory management system for handling large 3D models and textures. Triggers visual feedback through zone transition animations when models are unloaded or loaded. Events include MODEL_UNLOAD_STARTED, MODEL_UNLOAD_COMPLETED, MODEL_LOAD_STARTED, and MODEL_LOAD_COMPLETED, each producing specific visual responses in the shaft walls.
- Aliases：memory swap、model swapping、VRAM management

### Project Tag
- Definition：User-selectable categorization label for organizing research sessions. Displayed as a monospace tag selector in the bottom-left corner. Passed to backend with each research query and chat message to group related research outputs. Default value is 'default' but can be customized per session.
- Aliases：tag、project identifier、session tag

### Deep Research
- Definition：Boolean flag indicating whether to perform comprehensive research with extended source analysis. When enabled, the pipeline performs more thorough gathering and synthesis processes. Toggle available in the bottom-right UI element alongside the depth indicator.
- Aliases：deep mode、extended research、comprehensive mode

### Correction Flow
- Definition：Mechanism for users to provide feedback on incorrect research outputs. Triggered when user types correction phrases like 'that's wrong' or 'incorrect'. Presents a subtle SAVE CORRECTION? prompt with YES/NO options. If confirmed, re-sends the query with save_correction: true and the correction content appended.
- Aliases：correction、feedback loop、user correction
