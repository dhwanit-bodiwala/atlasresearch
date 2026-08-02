---
kind: error_handling
name: FastAPI HTTPException and WebSocket Error Propagation
category: error_handling
scope:
    - '**'
source_files:
    - backend/main.py
    - backend/ingest.py
    - backend/chat.py
    - backend/orchestrator.py
---

The Atlas Research backend uses FastAPI's built-in `HTTPException` for REST error handling and a custom pipeline-error event pattern for WebSocket streaming. There is no centralized exception hierarchy or custom error types — errors are raised inline at the point of failure.

**REST endpoints** (`chat.py`, `ingest.py`, `main.py`) raise `HTTPException` with explicit status codes (400 for client input/validation errors, 404 for missing resources). The `/ingest` endpoint wraps file parsing in try/except blocks that catch `UnicodeDecodeError` and generic exceptions, converting them to structured 400 responses with human-readable detail messages. Validation failures on the `/research` POST endpoint use Pydantic's `ValidationError` to reject malformed request bodies.

**WebSocket streaming** (`main.py`) uses a dual-path error strategy:
- Request validation errors during `receive_json()` are caught as `(ValidationError, ValueError)` and sent back as `{"type": "pipeline_error", ...}` before closing the socket.
- Pipeline-level exceptions from the blocking orchestrator thread are caught by `_run_pipeline_in_thread`, which emits a `{"type": "pipeline_error", "timestamp": ..., "data": {"message": str(e)}}` event into the queue and then sends a `None` sentinel to unblock the reader loop.
- Client disconnects are handled via `WebSocketDisconnect` exceptions, allowing background pipelines to continue running independently.

**Orchestrator flow control** returns `None` instead of raising exceptions when intermediate stages fail (gatherer empty, synthesizer none, critic none), which the REST `/research` endpoint converts to a 404 `HTTPException`. This treats pipeline failures as normal control flow rather than exceptional conditions.

**No global middleware** exists for error transformation — each route handles its own errors. There is no `@app.exception_handler` decorator, no custom exception classes, and no structured logging framework for errors beyond print statements.