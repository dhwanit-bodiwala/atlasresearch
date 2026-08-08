import time
from read_write_action import read_memory, write_memory, count_memories
from ollama_services import call_agent
from ws_events import emit_event

ROLE = "critic"


# Adaptive limit rule: use 40% of available RAW_FINDINGs,
# but never fewer than 5 (if that many exist) and never more than 20.
MIN_FINDINGS = 5
MAX_FINDINGS = 20
FINDINGS_FRACTION = 0.4

# Fixed budget for NOTE rows — same as Synthesizer so the Critic
# sees the same note-backed claims it needs to fact-check.
NOTE_LIMIT = 5


def _compute_adaptive_limit(available_count: int) -> int:
    if available_count == 0:
        return 0

    target = int(available_count * FINDINGS_FRACTION)
    target = max(target, MIN_FINDINGS)
    target = min(target, MAX_FINDINGS)
    # Never ask for more than what actually exists
    target = min(target, available_count)

    return target


def run_critic(question: str, project_tag: str, emit=None):

    total_start = time.time()
    emit_event(emit, "critic_started", question=question)

    available_count = count_memories(type="RAW_FINDING", project_tag=project_tag)

    if available_count == 0:
        print("[TIMING] critic skipped — no RAW_FINDINGs available")
        emit_event(emit, "critic_skipped", reason="no_findings")
        return None

    finding_limit = _compute_adaptive_limit(available_count=available_count)

    synthesis = read_memory(query=question, filter="SYNTHESIS", limit=1, project_tag=project_tag)

    if not synthesis:
        print("[TIMING] critic skipped — no SYNTHESIS available")
        emit_event(emit, "critic_skipped", reason="no_synthesis")
        return None

    synthesis_content = synthesis[0][3]
    synthesis_id = synthesis[0][0]

    # ── RAW_FINDINGs ─────────────────────────────────────────────
    raw_findings = read_memory(query=question, filter="RAW_FINDING", limit=finding_limit, project_tag=project_tag)
    print(f"[TIMING] critic retrieved {len(raw_findings)}/{available_count} findings (limit={finding_limit})")
    emit_event(
        emit, "findings_retrieved", available_count=available_count,
        finding_limit=finding_limit, retrieved_count=len(raw_findings)
    )

    raw_findings_content = ""
    raw_findings_id = []

    for i in raw_findings:
        raw_findings_content += "\n\n" + i[3]
        raw_findings_id.append(i[0])

    # ── NOTEs (separate fixed budget) ────────────────────────────
    notes = read_memory(query=question, filter="NOTE", limit=NOTE_LIMIT, project_tag=project_tag)
    print(f"[TIMING] critic retrieved {len(notes)} notes (limit={NOTE_LIMIT})")
    emit_event(emit, "notes_retrieved", note_limit=NOTE_LIMIT, retrieved_count=len(notes))

    notes_content = ""
    for note in notes:
        notes_content += "\n\n" + note[3]

    # ── Build prompt ─────────────────────────────────────────────
    combined_prompt = f"Synthesis: {synthesis_content}\n\nRaw findings: {raw_findings_content}"
    if notes_content.strip():
        combined_prompt += f"\n\nUser notes (from ingested documents): {notes_content}"

    model_start = time.time()
    model_response = call_agent(role=ROLE, prompt=combined_prompt)
    model_duration = time.time() - model_start
    print(f"[TIMING] critic call_agent: {model_duration:.2f}s")

    if model_response == "NO_ISSUES":
        emit_event(emit, "critic_generation_completed", duration=model_duration, outcome="no_issues", flag_count=0)
        total_duration = time.time() - total_start
        emit_event(emit, "critic_completed", flag_count=0, duration=total_duration)
        return []

    if "FLAG:" not in model_response:
        print("[WARNING] critic failed format check (no 'FLAG:' found)")
        emit_event(emit, "critic_generation_completed", duration=model_duration, outcome="format_failure", flag_count=0)
        emit_event(emit, "critic_completed", flag_count=None, duration=time.time() - total_start)
        return None

    refined = [flag.strip() for flag in model_response.split("FLAG: ") if flag.strip() != ""]
    emit_event(emit, "critic_generation_completed", duration=model_duration, outcome="success", flag_count=len(refined))

    ids = []
    for flag in refined:
        write_start = time.time()
        id = write_memory(content=flag, type="FLAGGED", created_by="critic", parent_id=synthesis_id, source="critic", project_tag=project_tag)
        write_duration = time.time() - write_start
        print(f"[TIMING] critic write_memory: {write_duration:.2f}s")
        emit_event(emit, "memory_written", id=id, type="FLAGGED", source="critic", project_tag=project_tag, duration=write_duration)
        ids.append({"id": id, "content": flag})

    total_duration = time.time() - total_start
    print(f"[TIMING] critic TOTAL: {total_duration:.2f}s")
    emit_event(emit, "critic_completed", flag_count=len(ids), duration=total_duration)

    return ids


# run_critic(question="How does rate limiting work in API?",project_tag="test3")