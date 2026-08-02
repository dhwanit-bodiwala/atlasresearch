---
kind: configuration_system
name: Hardcoded Python Module Configuration with No Centralized Config System
category: configuration_system
scope:
    - '**'
source_files:
    - backend/agent_config.py
    - backend/read_write_action.py
    - backend/gatherer.py
    - backend/ollama_services.py
    - backend/main.py
---

This repository does not implement a formal configuration system. Instead, all runtime configuration is embedded directly as Python module-level constants and inline values across several backend files:

- **Model tier selection**: `agent_config.py` defines a single `CURRENT_TIER = "gpu"` variable that selects which Ollama models are used for each agent role (gatherer, synthesizer, critic, followup) via a `models` dict keyed by tier. There is no `.env`, CLI flag, or API parameter to change this at runtime.
- **System prompts**: The same file hardcodes the full prompt text for each agent role as module-level string constants (`GATHERER`, `SYNTHESIZER`, `CRITIC`, `FOLLOWUP`) and exposes them through `get_system_prompt(role)`.
- **Token limits**: Per-role maximum token counts are defined in a `max_tokens` dict and accessed via `get_max_tokens(role)`.
- **Database credentials**: `read_write_action.py` contains a hardcoded PostgreSQL connection string (`dbname=AtlasResearch user=postgres password=9582 client_encoding=utf8`) — no environment variables, config files, or connection pooling.
- **Hugging Face offline mode**: `HF_HUB_OFFLINE=1` is set directly via `os.environ` at module import time to prevent network access when loading embeddings.
- **Trafilatura timeouts**: Download and extraction timeouts are set programmatically via `use_config().set("DEFAULT", "DOWNLOAD_TIMEOUT", "8")` inside `gatherer.py` rather than through a config file.
- **CORS origins**: The allowed frontend origin `http://localhost:5173` is hardcoded in `main.py`'s `CORSMiddleware` setup.
- **Ollama keep-alive**: Model caching duration (`keep_alive="6m"`) and generation options (`think=False`, `num_predict`) are baked into `ollama_services.call_agent()`.

There are no `.env` files, no `pydantic-settings` or `python-dotenv` usage, no YAML/TOML/JSON config files, and no configuration CLI. All settings are discovered by reading the Python source code directly. Changes require editing the source files and restarting the server.