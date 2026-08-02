# Data Flow & Communication

<cite>
**Referenced Files in This Document**
- [main.py](file://backend/main.py)
- [ws_events.py](file://backend/ws_events.py)
- [orchestrator.py](file://backend/orchestrator.py)
- [gatherer.py](file://backend/gatherer.py)
- [synthesizer.py](file://backend/synthesizer.py)
- [critic.py](file://backend/critic.py)
- [read_write_action.py](file://backend/read_write_action.py)
- [ollama_services.py](file://backend/ollama_services.py)
- [agent_config.py](file://backend/agent_config.py)
- [wsEventTypes.js](file://frontend/src/utils/wsEventTypes.js)
- [atlasStore.js](file://frontend/src/store/atlasStore.js)
</cite>

## Table of Contents
1. Introduction
2. Project Structure
3. Core Components
4. Architecture Overview
5. Detailed Component Analysis
6. Dependency Analysis
7. Performance Considerations
8. Troubleshooting Guide
9. Conclusion

## Introduction
This document explains the end-to-end data flow and communication patterns of Atlas Research, from user input through a WebSocket connection to the FastAPI backend, orchestrator processing, agent execution, and PostgreSQL storage. It details the bidirectional protocol where the frontend sends research questions and receives real-time progress updates via WebSocket events. It also documents how the Zustand store maps incoming events to state changes that drive UI updates, and describes the data transformation pipeline where raw facts are synthesized and critiqued before being stored. Finally, it covers error propagation, retry mechanisms, and connection recovery strategies for reliability.

## Project Structure
The system is split into a Python FastAPI backend and a React/Vite frontend:
- Backend modules implement the WebSocket endpoint, event emission, orchestration, agents (Gatherer, Synthesizer, Critic), LLM integration, and database operations.
- Frontend defines event type constants and a Zustand store for application state.

```mermaid
graph TB
subgraph "Frontend"
FE_WS["WebSocket Client"]
FE_STORE["Zustand Store<br/>atlasStore.js"]
FE_TYPES["Event Types<br/>wsEventTypes.js"]
end
subgraph "Backend"
API["FastAPI App<br/>main.py"]
WS["WebSocket Endpoint<br/>/ws/research"]
ORCH["Orchestrator<br/>orchestrator.py"]
GATHERER["Gatherer Agent<br/>gatherer.py"]
SYNTH["Synthesizer Agent<br/>synthesizer.py"]
CRITIC["Critic Agent<br/>critic.py"]
OLLAMA["Ollama Services<br/>ollama_services.py"]
AGCONF["Agent Config<br/>agent_config.py"]
DB["PostgreSQL + pgvector<br/>read_write_action.py"]
EVENTS["Event Emitter<br/>ws_events.py"]
end
FE_WS --> API
API --> WS
WS --> ORCH
ORCH --> GATHERER
ORCH --> SYNTH
ORCH --> CRITIC
GATHERER --> DB
SYNTH --> DB
CRITIC --> DB
GATHERER --> OLLAMA
SYNTH --> OLLAMA
CRITIC --> OLLAMA
OLLAMA --> AGCONF
GATHERER --> EVENTS
SYNTH --> EVENTS
CRITIC --> EVENTS
ORCH --> EVENTS
WS --> EVENTS
EVENTS --> WS
WS --> FE_WS
FE_WS --> FE_STORE
FE_TYPES --> FE_STORE
```

**Diagram sources**
- [main.py:1-110](file://backend/main.py#L1-L110)
- [orchestrator.py:1-98](file://backend/orchestrator.py#L1-L98)
- [gatherer.py:1-152](file://backend/gatherer.py#L1-L152)
- [synthesizer.py:1-101](file://backend/synthesizer.py#L1-L101)
- [critic.py:1-122](file://backend/critic.py#L1-L122)
- [ollama_services.py:1-26](file://backend/ollama_services.py#L1-L26)
- [agent_config.py:1-111](file://backend/agent_config.py#L1-L111)
- [read_write_action.py:1-100](file://backend/read_write_action.py#L1-L100)
- [ws_events.py:1-14](file://backend/ws_events.py#L1-L14)
- [wsEventTypes.js:1-45](file://frontend/src/utils/wsEventTypes.js#L1-L45)
- [atlasStore.js:1-84](file://frontend/src/store/atlasStore.js#L1-L84)

**Section sources**
- [main.py:1-110](file://backend/main.py#L1-L110)
- [wsEventTypes.js:1-45](file://frontend/src/utils/wsEventTypes.js#L1-L45)
- [atlasStore.js:1-84](file://frontend/src/store/atlasStore.js#L1-L84)

## Core Components
- FastAPI WebSocket endpoint: Accepts JSON requests, validates them, runs the orchestrator on a worker thread, and streams events back over WebSocket.
- Orchestrator: Coordinates the Gatherer, Synthesizer, and Critic phases; emits lifecycle and timing events; manages model loading/unloading.
- Agents:
  - Gatherer: Searches web sources, extracts text, calls LLM to extract facts, writes RAW_FINDING rows, emits source-level events.
  - Synthesizer: Reads RAW_FINDINGs and NOTEs, generates a synthesis, marks old syntheses as superseded, writes SYNTHESIS row.
  - Critic: Reads synthesis and findings, flags issues, writes FLAGGED rows.
- Database layer: Uses psycopg2 with pgvector to embed queries and persist structured memories.
- Event emitter: Central helper to emit standardized WebSocket events with timestamps and typed payloads.
- Frontend event types and store: Define event names and map events to state updates for UI rendering.

**Section sources**
- [main.py:34-110](file://backend/main.py#L34-L110)
- [orchestrator.py:12-94](file://backend/orchestrator.py#L12-L94)
- [gatherer.py:91-152](file://backend/gatherer.py#L91-L152)
- [synthesizer.py:31-101](file://backend/synthesizer.py#L31-L101)
- [critic.py:33-122](file://backend/critic.py#L33-L122)
- [read_write_action.py:14-100](file://backend/read_write_action.py#L14-L100)
- [ws_events.py:1-14](file://backend/ws_events.py#L1-L14)
- [wsEventTypes.js:1-45](file://frontend/src/utils/wsEventTypes.js#L1-L45)
- [atlasStore.js:1-84](file://frontend/src/store/atlasStore.js#L1-L84)

## Architecture Overview
The system uses a synchronous pipeline executed on a background thread, with asynchronous event streaming over WebSocket. The frontend connects to /ws/research, sends a JSON payload, and receives a stream of typed events. Each agent emits granular events for progress, timing, and results. The database stores embeddings alongside content for semantic retrieval.

```mermaid
sequenceDiagram
participant FE as "Frontend"
participant API as "FastAPI /ws/research"
participant Q as "Queue"
participant ORCH as "Orchestrator"
participant G as "Gatherer"
participant S as "Synthesizer"
participant C as "Critic"
participant DB as "PostgreSQL"
participant LLM as "Ollama"
FE->>API : Connect WebSocket
FE->>API : Send JSON {question, project_tag, deep_research}
API->>Q : Create queue
API->>ORCH : Start _run_pipeline_in_thread(q, ...)
ORCH-->>API : Emit pipeline_started
ORCH->>G : run_gatherer(...)
G->>DB : Write RAW_FINDING rows
G-->>API : Emit search_* and memory_written events
ORCH->>S : run_synthesizer(...)
S->>DB : Read RAW_FINDINGs and NOTEs
S->>LLM : Generate synthesis
S-->>API : Emit synthesizer_* and memory_written events
ORCH->>LLM : Unload synthesizer model
ORCH->>LLM : Load critic model
ORCH->>C : run_critic(...)
C->>DB : Read SYNTHESIS and RAW_FINDINGs
C->>LLM : Flag issues
C-->>API : Emit critic_* and memory_written events
ORCH-->>API : Emit pipeline_completed with output
API-->>FE : Stream all events
```

**Diagram sources**
- [main.py:71-110](file://backend/main.py#L71-L110)
- [orchestrator.py:12-94](file://backend/orchestrator.py#L12-L94)
- [gatherer.py:91-152](file://backend/gatherer.py#L91-L152)
- [synthesizer.py:31-101](file://backend/synthesizer.py#L31-L101)
- [critic.py:33-122](file://backend/critic.py#L33-L122)
- [read_write_action.py:14-100](file://backend/read_write_action.py#L14-L100)
- [ollama_services.py:1-26](file://backend/ollama_services.py#L1-L26)

## Detailed Component Analysis

### WebSocket Endpoint and Streaming
- Accepts connections at /ws/research, validates request body using Pydantic, and starts a background thread to run the orchestrator.
- Streams events by reading from a queue until a sentinel None is received or the client disconnects.
- Emits pipeline_error for invalid requests and ensures graceful close.

```mermaid
flowchart TD
Start(["WS Connect"]) --> Accept["Accept Connection"]
Accept --> Receive["Receive JSON"]
Receive --> Validate{"Valid Request?"}
Validate --> |No| SendError["Send pipeline_error"]
SendError --> Close["Close WS"]
Validate --> |Yes| Spawn["Spawn Thread: _run_pipeline_in_thread"]
Spawn --> Loop["Loop: q.get() -> send_json(event)"]
Loop --> Sentinel{"event is None?"}
Sentinel --> |Yes| Close
Sentinel --> |No| Loop
Close --> End(["Done"])
```

**Diagram sources**
- [main.py:71-110](file://backend/main.py#L71-L110)

**Section sources**
- [main.py:23-46](file://backend/main.py#L23-L46)
- [main.py:71-110](file://backend/main.py#L71-L110)

### Orchestrator Pipeline
- Emits pipeline_started, then sequentially runs Gatherer, Synthesizer, and Critic.
- Manages model swaps: unloads synthesizer model, pre-warms critic model, measures load times, and emits model lifecycle events.
- Collects final output and emits pipeline_completed with processed_info and flagged_items.

```mermaid
classDiagram
class Orchestrator {
+run_orchestrator(question, project_tag, deep_research, emit)
}
class Gatherer {
+run_gatherer(question, project_tag, deep_research, emit)
}
class Synthesizer {
+run_synthesizer(question, project_tag, emit)
}
class Critic {
+run_critic(question, project_tag, emit)
}
class OllamaServices {
+call_agent(role, prompt)
+unload_model(role)
}
class AgentConfig {
+get_model(role)
+get_system_prompt(role)
+get_max_tokens(role)
}
Orchestrator --> Gatherer : "executes"
Orchestrator --> Synthesizer : "executes"
Orchestrator --> Critic : "executes"
Orchestrator --> OllamaServices : "model swap"
OllamaServices --> AgentConfig : "config"
```

**Diagram sources**
- [orchestrator.py:12-94](file://backend/orchestrator.py#L12-L94)
- [ollama_services.py:1-26](file://backend/ollama_services.py#L1-L26)
- [agent_config.py:104-111](file://backend/agent_config.py#L104-L111)

**Section sources**
- [orchestrator.py:12-94](file://backend/orchestrator.py#L12-L94)

### Gatherer Agent
- Performs web search with DDGS, fetches and extracts text, calls LLM to extract FACT lines, writes RAW_FINDING rows, and emits detailed source-level events.
- Implements retry logic with reserve pool: if a primary source fails hard, tries one replacement; otherwise emits source_exhausted.

```mermaid
flowchart TD
Start(["run_gatherer"]) --> Search["Search with DDGS"]
Search --> ForEach["For each primary URL"]
ForEach --> TrySource["_try_source(url)"]
TrySource --> Fetch["Fetch + Extract"]
Fetch --> ExtractOK{"Extract OK?"}
ExtractOK --> |No| Fail["Emit source_fetch_completed(success=False)"]
Fail --> NextURL["Next URL"]
ExtractOK --> |Yes| CallLLM["Call LLM for FACT extraction"]
CallLLM --> Outcome{"Outcome"}
Outcome --> |NO_RELEVANT_INFO| Skip["Emit generation_completed(outcome=no_relevant_info)"]
Outcome --> |Format Failure| HardFail["Emit generation_completed(outcome=format_failure)"]
HardFail --> ReserveCheck{"Reserve available?"}
ReserveCheck --> |No| Exhausted["Emit source_exhausted"]
Exhausted --> NextURL
ReserveCheck --> |Yes| Replace["Try replacement URL"]
Replace --> TrySource
Outcome --> |Success| WriteMem["Write RAW_FINDING rows"]
WriteMem --> EmitMem["Emit memory_written per fact"]
EmitMem --> NextURL
NextURL --> Done(["Emit gatherer_completed"])
```

**Diagram sources**
- [gatherer.py:91-152](file://backend/gatherer.py#L91-L152)

**Section sources**
- [gatherer.py:12-89](file://backend/gatherer.py#L12-L89)
- [gatherer.py:91-152](file://backend/gatherer.py#L91-L152)

### Synthesizer Agent
- Computes adaptive limit based on available RAW_FINDINGs and fixed budget for NOTEs.
- Retrieves relevant data, builds prompt, calls LLM, supersedes previous SYNTHESIS rows, writes new SYNTHESIS, and emits lifecycle events.

```mermaid
flowchart TD
Start(["run_synthesizer"]) --> Count["Count RAW_FINDINGs"]
Count --> Check{"Any findings?"}
Check --> |No| Skip["Emit synthesizer_skipped(reason=no_findings)"]
Skip --> ReturnNone["Return None"]
Check --> |Yes| Limit["Compute adaptive limit"]
Limit --> ReadFindings["Read RAW_FINDINGs"]
ReadFindings --> ReadNotes["Read NOTEs"]
ReadNotes --> Prompt["Build combined prompt"]
Prompt --> CallLLM["Call LLM"]
CallLLM --> Supersede["Supersede existing SYNTHESIS"]
Supersede --> WriteSynth["Write SYNTHESIS"]
WriteSynth --> EmitCompleted["Emit synthesizer_completed"]
EmitCompleted --> ReturnID["Return id"]
```

**Diagram sources**
- [synthesizer.py:31-101](file://backend/synthesizer.py#L31-L101)

**Section sources**
- [synthesizer.py:31-101](file://backend/synthesizer.py#L31-L101)

### Critic Agent
- Reads SYNTHESIS and RAW_FINDINGs (plus NOTEs), calls LLM to identify issues, writes FLAGGED rows linked to the synthesis, and emits lifecycle events.
- Handles NO_ISSUES and format failures gracefully.

```mermaid
flowchart TD
Start(["run_critic"]) --> Count["Count RAW_FINDINGs"]
Count --> Check{"Any findings?"}
Check --> |No| Skip["Emit critic_skipped(reason=no_findings)"]
Skip --> ReturnNone["Return None"]
Check --> |Yes| ReadSynth["Read SYNTHESIS"]
ReadSynth --> ReadFindings["Read RAW_FINDINGs"]
ReadFindings --> ReadNotes["Read NOTEs"]
ReadNotes --> Prompt["Build combined prompt"]
Prompt --> CallLLM["Call LLM"]
CallLLM --> Outcome{"Outcome"}
Outcome --> |NO_ISSUES| EmitNoIssues["Emit critic_generation_completed(no_issues)"]
EmitNoIssues --> Completed["Emit critic_completed(flag_count=0)"]
Outcome --> |Format Failure| EmitFmt["Emit critic_generation_completed(format_failure)"]
EmitFmt --> Completed
Outcome --> |Success| WriteFlags["Write FLAGGED rows"]
WriteFlags --> EmitFlags["Emit memory_written per flag"]
EmitFlags --> Completed
Completed --> ReturnIDs["Return ids"]
```

**Diagram sources**
- [critic.py:33-122](file://backend/critic.py#L33-L122)

**Section sources**
- [critic.py:33-122](file://backend/critic.py#L33-L122)

### Database Layer (PostgreSQL + pgvector)
- Embeds queries using HuggingFace embeddings and performs vector similarity searches.
- Persists structured memories with metadata and supports counting and superseding records.

```mermaid
classDiagram
class ReadWriteAction {
+write_memory(content, type, created_by, parent_id, source, project_tag)
+read_memory(query, filter, limit, project_tag)
+count_memories(type, project_tag)
+supersede_memories(type, project_tag)
}
class Postgres {
+memories table
+embedding vector column
}
ReadWriteAction --> Postgres : "psycopg2 + pgvector"
```

**Diagram sources**
- [read_write_action.py:14-100](file://backend/read_write_action.py#L14-L100)

**Section sources**
- [read_write_action.py:14-100](file://backend/read_write_action.py#L14-L100)

### Event Emitter and Protocol
- All agents and the orchestrator use a centralized emit_event helper to produce consistent event dictionaries with type, timestamp, and data fields.
- Frontend defines event type constants aligned with backend emissions.

```mermaid
sequenceDiagram
participant ORCH as "Orchestrator"
participant G as "Gatherer"
participant S as "Synthesizer"
participant C as "Critic"
participant EVT as "emit_event"
participant WS as "WebSocket"
ORCH->>EVT : emit("pipeline_started", {...})
ORCH->>G : run_gatherer(emit=EVT)
G->>EVT : emit("search_started", {...})
G->>EVT : emit("source_*", {...})
G->>EVT : emit("memory_written", {...})
ORCH->>S : run_synthesizer(emit=EVT)
S->>EVT : emit("synthesizer_*", {...})
ORCH->>C : run_critic(emit=EVT)
C->>EVT : emit("critic_*", {...})
ORCH->>EVT : emit("pipeline_completed", {...})
EVT-->>WS : send_json(event)
```

**Diagram sources**
- [ws_events.py:1-14](file://backend/ws_events.py#L1-L14)
- [orchestrator.py:12-94](file://backend/orchestrator.py#L12-L94)
- [gatherer.py:91-152](file://backend/gatherer.py#L91-L152)
- [synthesizer.py:31-101](file://backend/synthesizer.py#L31-L101)
- [critic.py:33-122](file://backend/critic.py#L33-L122)

**Section sources**
- [ws_events.py:1-14](file://backend/ws_events.py#L1-L14)
- [wsEventTypes.js:1-45](file://frontend/src/utils/wsEventTypes.js#L1-L45)

### Frontend State Mapping (Zustand)
- The store exposes fields for scene, crystal state, pipeline stage, errors, inputs, results, data shards, scan line, VRAM swapping, and chat messages.
- Incoming WebSocket events should be mapped to setters such as setPipelineStage, setPipelineError, addShard, updateShard, removeShard, setResults, and setVramSwapping to reflect real-time progress and outcomes.

```mermaid
flowchart TD
WSIn["WebSocket Event"] --> Type{"Event Type"}
Type --> |pipeline_started| SetStage["setPipelineStage('gatherer')"]
Type --> |search_*| AddShard["addShard({type:'search', ...})"]
Type --> |source_*| UpdateShard["updateShard(id, {status, duration})"]
Type --> |memory_written| AddOrUpdate["addShard/updateShard for memory"]
Type --> |synthesizer_*| SetStage["setPipelineStage('synthesizer')"]
Type --> |critic_*| SetStage["setPipelineStage('critic')"]
Type --> |pipeline_completed| SetResults["setResults(id, info, flags)"]
Type --> |pipeline_error| SetError["setPipelineError(err)"]
Type --> |model_*| SetVRAM["setVramSwapping(true/false)"]
```

**Diagram sources**
- [atlasStore.js:1-84](file://frontend/src/store/atlasStore.js#L1-L84)
- [wsEventTypes.js:1-45](file://frontend/src/utils/wsEventTypes.js#L1-L45)

**Section sources**
- [atlasStore.js:1-84](file://frontend/src/store/atlasStore.js#L1-L84)
- [wsEventTypes.js:1-45](file://frontend/src/utils/wsEventTypes.js#L1-L45)

## Dependency Analysis
The backend components have clear dependencies:
- Orchestrator depends on agents and LLM services.
- Agents depend on read_write_action for DB operations and ollama_services for LLM calls.
- read_write_action depends on psycopg2 and pgvector for embedding and querying.
- ws_events provides a shared event emission mechanism used across the pipeline.

```mermaid
graph TB
ORCH["orchestrator.py"] --> G["gatherer.py"]
ORCH --> S["synthesizer.py"]
ORCH --> C["critic.py"]
G --> RW["read_write_action.py"]
S --> RW
C --> RW
G --> OLL["ollama_services.py"]
S --> OLL
C --> OLL
OLL --> AC["agent_config.py"]
ORCH --> EV["ws_events.py"]
G --> EV
S --> EV
C --> EV
```

**Diagram sources**
- [orchestrator.py:1-98](file://backend/orchestrator.py#L1-L98)
- [gatherer.py:1-152](file://backend/gatherer.py#L1-L152)
- [synthesizer.py:1-101](file://backend/synthesizer.py#L1-L101)
- [critic.py:1-122](file://backend/critic.py#L1-L122)
- [read_write_action.py:1-100](file://backend/read_write_action.py#L1-L100)
- [ollama_services.py:1-26](file://backend/ollama_services.py#L1-L26)
- [agent_config.py:1-111](file://backend/agent_config.py#L1-L111)
- [ws_events.py:1-14](file://backend/ws_events.py#L1-L14)

**Section sources**
- [orchestrator.py:1-98](file://backend/orchestrator.py#L1-L98)
- [gatherer.py:1-152](file://backend/gatherer.py#L1-L152)
- [synthesizer.py:1-101](file://backend/synthesizer.py#L1-L101)
- [critic.py:1-122](file://backend/critic.py#L1-L122)
- [read_write_action.py:1-100](file://backend/read_write_action.py#L1-L100)
- [ollama_services.py:1-26](file://backend/ollama_services.py#L1-L26)
- [agent_config.py:1-111](file://backend/agent_config.py#L1-L111)
- [ws_events.py:1-14](file://backend/ws_events.py#L1-L14)

## Performance Considerations
- Model lifecycle management: The orchestrator explicitly unloads and loads models to minimize VRAM usage and measure warm-up time separately from generation time.
- Adaptive limits: Synthesizer and Critic compute limits based on available findings to balance throughput and context size.
- Embedding overhead: read_write_action loads an embedding model once at import time; subsequent queries reuse it.
- Queue-based streaming: Using a queue decouples blocking agent execution from the async event loop, preventing stalls.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common issues and recovery strategies:
- Invalid request validation: The WebSocket handler sends a pipeline_error event and closes the connection when the request body fails validation.
- Early client disconnect: If the client disconnects, the background pipeline continues to completion; events are simply not consumed.
- Source failures: Gatherer emits source_fetch_completed with success=false and may try a reserve URL; if both fail, it emits source_exhausted.
- Format failures: Both Gatherer and Critic check for expected prefixes ("FACT:" and "FLAG:") and emit generation_completed with outcome indicating failure.
- Empty pipelines: Orchestrator emits pipeline_stopped with reasons like gatherer_empty, synthesizer_none, or critic_none when intermediate steps return no results.
- Memory operations: Errors in DB operations will propagate up; ensure connectivity and correct credentials.

**Section sources**
- [main.py:76-83](file://backend/main.py#L76-L83)
- [gatherer.py:27-38](file://backend/gatherer.py#L27-L38)
- [gatherer.py:127-144](file://backend/gatherer.py#L127-L144)
- [synthesizer.py:38-41](file://backend/synthesizer.py#L38-L41)
- [critic.py:91-101](file://backend/critic.py#L91-L101)
- [orchestrator.py:25-41](file://backend/orchestrator.py#L25-L41)
- [orchestrator.py:75-78](file://backend/orchestrator.py#L75-L78)

## Conclusion
Atlas Research implements a robust, event-driven research pipeline with clear separation of concerns: a FastAPI WebSocket endpoint streams real-time progress, an orchestrator coordinates agents, and specialized agents handle gathering, synthesis, and critique. The database layer persists structured memories with embeddings for semantic retrieval. Error handling and retries ensure resilience, while model lifecycle management optimizes resource usage. The frontend’s event types and Zustand store enable responsive UI updates driven by backend events.