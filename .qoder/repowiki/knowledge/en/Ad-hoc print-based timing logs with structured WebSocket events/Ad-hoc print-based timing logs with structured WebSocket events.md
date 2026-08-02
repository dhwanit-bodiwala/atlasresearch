---
kind: logging_system
name: Ad-hoc print-based timing logs with structured WebSocket events
category: logging_system
scope:
    - '**'
source_files:
    - backend/ws_events.py
    - backend/orchestrator.py
    - backend/main.py
    - backend/gatherer.py
    - backend/critic.py
---

The Atlas Research backend does not use a dedicated logging framework. Instead, it relies on two complementary ad-hoc mechanisms:

1. **Console `print` statements for timing/debug output** — Every agent module (`gatherer.py`, `synthesizer.py`, `critic.py`) and the orchestrator (`orchestrator.py`) emit human-readable timing lines via `print(...)`, prefixed with tags like `[TIMING]`, `[ORCH TIMING]`, and `[WARNING]`. These are plain stdout lines used during development and local runs; there is no log-level configuration, rotation, or file sink.

2. **Structured WebSocket events for runtime telemetry** — The `ws_events.py` module provides an `emit_event(emit, event_type, **kwargs)` helper that serializes every pipeline milestone into a uniform JSON-like dict with three fields: `type` (event name), `timestamp` (epoch seconds), and `data` (arbitrary payload). The orchestrator calls `emit_event` at each stage (`pipeline_started`, `agent_started`, `agent_completed`, `model_unload_started/completed`, `model_load_started/completed`, `pipeline_stopped`, `pipeline_completed`). Errors from FastAPI request validation and unexpected exceptions are also emitted as `pipeline_error` events through the same structure. The frontend consumes these events to drive the UI state.

There is no centralized logger instance, no log-level hierarchy, no structured logging library (e.g., `logging`, `loguru`, `structlog`), and no separation between debug/info/warn/error levels. All console output goes to stdout, and all operational telemetry flows over the WebSocket channel using the `emit` callback pattern passed down from `main.py` → `run_orchestrator` → each agent.