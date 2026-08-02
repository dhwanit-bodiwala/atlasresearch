---
kind: external_dependency
name: Local AI Model Runtime
slug: ollama
category: external_dependency
category_hints:
    - vendor_identity
scope:
    - '**'
source_files:
    - backend/requirements.txt
    - ATLASRESEARCH_MASTER.md
---

Local AI model runtime service running on localhost:11434. Powers the three-agent research pipeline (Gatherer, Synthesizer, Critic) through LangChain integration. The frontend never communicates directly with Ollama — all interactions go through the FastAPI backend which handles model selection, prompt engineering, and response processing.