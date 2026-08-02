---
kind: build_system
name: Build System — Vite + FastAPI Local Development
category: build_system
scope:
    - '**'
source_files:
    - backend/requirements.txt
    - frontend/package.json
    - frontend/vite.config.js
---

This repository does not define a formal build system (no Makefile, Dockerfile, CI pipeline, or deployment scripts). Build and packaging are handled through the native tooling of each subproject:

- Backend (Python/FastAPI): Dependencies are pinned in `backend/requirements.txt` and installed via `pip install -r requirements.txt`. The application is run directly with Python (no virtual environment script or service manager is included).
- Frontend (React/Vite): Build and development are driven by Vite. Scripts defined in `frontend/package.json` provide `dev`, `build`, and `preview`. Vite configuration (`frontend/vite.config.js`) enables React and GLSL shader support via `vite-plugin-glsl`. Tailwind CSS and PostCSS are configured through `tailwind.config.js` and `postcss.config.js`.

There is no cross-compilation, containerization, release automation, or CI/CD configuration present in the repository. Development appears to be local-only, with each side built independently using its own package manager.