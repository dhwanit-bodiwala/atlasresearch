---
kind: dependency_management
name: Dual-Stack Dependency Management (pip + npm)
category: dependency_management
scope:
    - '**'
source_files:
    - backend/requirements.txt
    - frontend/package.json
    - frontend/package-lock.json
---

This repository manages dependencies for two separate stacks — a Python backend and a React/Three.js frontend — using their respective native package managers.

**Backend (Python)**
- Dependencies are declared in `backend/requirements.txt` with pinned versions using the `==` operator (e.g. `fastapi==0.139.2`, `ollama==0.6.2`, `langchain-core==1.5.0`, `torch==2.13.0`). There is no `pyproject.toml`, `Pipfile`, or `poetry.lock`; `requirements.txt` is the single source of truth.
- A local virtual environment exists at `backend/venv/`, indicating development installs via `pip install -r requirements.txt`. No vendored `site-packages` directory is committed, so packages are resolved from PyPI at install time.
- No private PyPI registry, `pip.conf`, or `--index-url` configuration is present in the repo.

**Frontend (Node.js / Vite + React)**
- Dependencies are declared in `frontend/package.json` under `dependencies` and `devDependencies`, using caret ranges (`^`) to allow compatible updates (e.g. `react: ^18.3.1`, `three: ^0.169.0`, `vite: ^5.4.10`).
- A `frontend/package-lock.json` (lockfileVersion 3) is committed alongside `package.json`, pinning every transitive dependency with exact versions and integrity hashes. This ensures deterministic builds across environments.
- The `node_modules/` directory is not committed; dependencies are installed via `npm install` (or equivalent). Build scripts are defined as `dev`, `build`, and `preview` pointing to `vite`.
- No `.npmrc`, private registry configuration, or vendored `node_modules` is present.

**Conventions observed**
- Backend pins every package to an exact version (`==`), prioritizing reproducibility over flexibility.
- Frontend uses semver-compatible ranges (`^`) in `package.json` but locks them deterministically via `package-lock.json`, balancing update flexibility with build stability.
- Each stack keeps its dependency manifest in its own subdirectory; there is no shared monorepo tool (no `pnpm-workspace.yaml`, `lerna.json`, or `pyproject.toml` aggregation).
- No automated dependency-update tooling (e.g. Dependabot, Renovate) or CI steps updating manifests were found in the inspected files.