---
kind: external_dependency
name: Python Web Framework
slug: fastapi
category: external_dependency
category_hints:
    - vendor_identity
scope:
    - '**'
source_files:
    - backend/requirements.txt
    - backend/main.py
---

Modern Python web framework serving as the backend API. Handles WebSocket connections for real-time pipeline events, REST endpoints for research queries and chat, and CORS configuration for frontend communication. The orchestrator runs the three-agent research pipeline asynchronously while streaming events back to the frontend via WebSocket.