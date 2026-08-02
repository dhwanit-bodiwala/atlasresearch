import time
from read_write_action import read_memory, write_memory, count_memories, supersede_memories
from ollama_services import call_agent
from ws_events import emit_event

ROLE = "synthesizer"

# Adaptive limit rule: use 40% of available RAW_FINDINGs,
# but never fewer than 5 (if that many exist) and never more than 20.
MIN_FINDINGS = 5
MAX_FINDINGS = 20
FINDINGS_FRACTION = 0.4

# Fixed budget for NOTE rows — separate from RAW_FINDING adaptive limit
# so a large ingested document can't crowd out web findings.
NOTE_LIMIT = 5


def _compute_adaptive_limit(available_count: int) -> int:
    if available_count == 0:
        return 0

    target = int(available_count * FINDINGS_FRACTION)
    target = max(target, MIN_FINDINGS)
    target = min(target, MAX_FINDINGS)
    target = min(target, available_count)

    return target


def run_synthesizer(question: str, project_tag: str, emit=None):

    total_start = time.time()
    emit_event(emit, "synthesizer_started", question=question)

    available_count = count_memories(type="RAW_FINDING", project_tag=project_tag)

    if available_count == 0:
        print("[TIMING] synthesizer skipped — no RAW_FINDINGs available")
        emit_event(emit, "synthesizer_skipped", reason="no_findings")
        return None

    finding_limit = _compute_adaptive_limit(available_count)

    # ── RAW_FINDINGs ─────────────────────────────────────────────
    ans = read_memory(query=question, filter="RAW_FINDING", limit=finding_limit, project_tag=project_tag)
    print(f"[TIMING] synthesizer retrieved {len(ans)}/{available_count} findings (limit={finding_limit})")
    emit_event(
        emit, "findings_retrieved", available_count=available_count,
        finding_limit=finding_limit, retrieved_count=len(ans)
    )

    findings_content = ""
    for i in range(len(ans)):
        findings_content += "\n\n" + ans[i][3]

    # ── NOTEs (separate fixed budget) ────────────────────────────
    notes = read_memory(query=question, filter="NOTE", limit=NOTE_LIMIT, project_tag=project_tag)
    print(f"[TIMING] synthesizer retrieved {len(notes)} notes (limit={NOTE_LIMIT})")
    emit_event(emit, "notes_retrieved", note_limit=NOTE_LIMIT, retrieved_count=len(notes))

    notes_content = ""
    for note in notes:
        notes_content += "\n\n" + note[3]

    # ── Build prompt ─────────────────────────────────────────────
    # NOTEs are labeled separately so the model knows they come from
    # user-ingested documents, not live web findings.
    combined_prompt = f"Question: {question}\n\nRaw findings: {findings_content}"
    if notes_content.strip():
        combined_prompt += f"\n\nUser notes (from ingested documents): {notes_content}"

    model_start = time.time()
    model_response = call_agent(role=ROLE, prompt=combined_prompt)
    model_duration = time.time() - model_start
    print(f"[TIMING] synthesizer call_agent: {model_duration:.2f}s")
    emit_event(emit, "synthesizer_generation_completed", duration=model_duration)

    # Mark any existing synthesis for this project_tag as outdated before
    # writing the new one — prevents stale versions from competing in
    # future semantic search results (e.g. when Critic looks for "the" synthesis).
    superseded_count = supersede_memories(type="SYNTHESIS", project_tag=project_tag)
    emit_event(emit, "synthesis_superseded", count=superseded_count)

    db_content: str = model_response
    type = "SYNTHESIS"
    created_by = ROLE
    parent_id = None
    source: str = "synthesizer"

    write_start = time.time()
    id = write_memory(content=db_content, type=type, created_by=created_by, parent_id=parent_id, source=source, project_tag=project_tag)
    write_duration = time.time() - write_start
    print(f"[TIMING] synthesizer write_memory: {write_duration:.2f}s")
    emit_event(emit, "memory_written", id=id, type="SYNTHESIS", source=source, project_tag=project_tag, duration=write_duration)

    total_duration = time.time() - total_start
    print(f"[TIMING] synthesizer TOTAL: {total_duration:.2f}s")
    emit_event(emit, "synthesizer_completed", id=id, duration=total_duration)

    return id