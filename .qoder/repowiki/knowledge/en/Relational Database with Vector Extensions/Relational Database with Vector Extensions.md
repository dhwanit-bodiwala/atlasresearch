---
kind: external_dependency
name: Relational Database with Vector Extensions
slug: postgresql
category: external_dependency
category_hints:
    - vendor_identity
scope:
    - '**'
source_files:
    - backend/requirements.txt
    - ATLASRESEARCH_MASTER.md
---

PostgreSQL database with pgvector extension for semantic search capabilities. Stores RAW_FINDING rows from the Gatherer agent, SYNTHESIS rows from the Synthesizer, and FLAGGED rows from the Critic. Serves as shared memory between the three agents and persists research results across sessions. Runs on localhost:5432.