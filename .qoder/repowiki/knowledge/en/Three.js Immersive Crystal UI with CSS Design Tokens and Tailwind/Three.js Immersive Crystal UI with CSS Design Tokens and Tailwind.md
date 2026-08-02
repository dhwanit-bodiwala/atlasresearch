---
kind: frontend_style
name: Three.js Immersive Crystal UI with CSS Design Tokens and Tailwind
category: frontend_style
scope:
    - '**'
source_files:
    - frontend/src/styles/globals.css
    - frontend/tailwind.config.js
    - frontend/postcss.config.js
    - frontend/vite.config.js
    - frontend/package.json
    - frontend/src/components/crystal/CrystalScene.jsx
    - frontend/src/App.jsx
---

The Atlas Research frontend uses a React + Vite application built around an immersive Three.js crystal visualization. The styling approach combines CSS custom properties (design tokens), Tailwind CSS for utility classes, and inline styles for the 3D canvas overlay.

**Styling System Architecture:**
- **CSS Design Tokens**: All visual constants are centralized in `src/styles/globals.css` as CSS custom properties under `:root`, organized into semantic categories: backgrounds (`--bg-void`, `--bg-surface`, `--bg-shaft-*`), text colors (`--text-primary`, `--text-secondary`, `--text-ghost`, `--text-input`), accent glows (`--glow-ice`, `--glow-deep`, `--glow-critic`, `--glow-flag`, `--glow-success`, `--glow-error`), borders, typography variables, spacing units, z-index layers, and transition timings.
- **Typography**: Uses Google Fonts imports for Space Grotesk (display), JetBrains Mono (monospace/code), and Inter (body text).
- **Tailwind CSS**: Configured via `tailwind.config.js` with content scanning limited to `./index.html` and `./src/**/*.{js,jsx}`. The config is minimal with empty theme extensions, relying primarily on utility classes rather than custom Tailwind themes.
- **PostCSS Pipeline**: Processes Tailwind CSS and Autoprefixer for cross-browser compatibility.

**3D Canvas Styling Strategy:**
- The Three.js canvas uses inline styles for positioning (`position: fixed`, `inset: 0`) and cursor hiding (`cursor: none`)
- Custom cursor implemented as a DOM element with CSS transitions and mix-blend-mode effects
- GPU quality detection adjusts rendering quality (samples, resolution) based on hardware capabilities

**Visual Design Conventions:**
- Dark theme with near-black backgrounds using blue-tinted voids (`#c8cdd6` main void, `#0f0f14` surfaces)
- Color-coded agent zones: ice blue for Gatherer/particles, deep purple for Synthesizer, violet for Critic
- Warm orange reserved exclusively for flagged items, green for success states, red for errors
- Cinematic post-processing effects including bloom, chromatic aberration, vignette, noise, and depth of field
- ACES Filmic tone mapping for cinematic color grading

**Build Integration:**
- Vite configured with React plugin and GLSL shader support via `vite-plugin-glsl`
- Shader files (.glsl) imported directly into React components for Three.js materials
- GSAP for animation orchestration alongside React state management via Zustand