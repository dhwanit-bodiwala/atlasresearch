import time
import ollama
from gatherer import run_gatherer
from synthesizer import run_synthesizer
from critic import run_critic
from read_write_action import read_memory
from ollama_services import unload_model
from agent_config import get_model
from ws_events import emit_event


def run_orchestrator(question: str, project_tag: str, deep_research: bool = False, emit=None):

    total_start = time.time()
    emit_event(emit, "pipeline_started", question=question, project_tag=project_tag, deep_research=deep_research)

    # ---------------- Gatherer ----------------
    emit_event(emit, "agent_started", agent="gatherer")
    gatherer_start = time.time()
    gatherer_ids = run_gatherer(question=question, project_tag=project_tag, deep_research=deep_research, emit=emit)
    gatherer_duration = time.time() - gatherer_start
    print(f"[ORCH TIMING] gatherer: {gatherer_duration:.2f}s")
    emit_event(emit, "agent_completed", agent="gatherer", duration=gatherer_duration, fact_count=len(gatherer_ids) if gatherer_ids else 0)

    if not gatherer_ids:
        print("[ORCH] stopped — gatherer returned no results")
        emit_event(emit, "pipeline_stopped", reason="gatherer_empty")
        return None

    # ---------------- Synthesizer ----------------
    emit_event(emit, "agent_started", agent="synthesizer")
    synthesizer_start = time.time()
    synthesizer_id = run_synthesizer(question=question, project_tag=project_tag, emit=emit)
    synthesizer_duration = time.time() - synthesizer_start
    print(f"[ORCH TIMING] synthesizer: {synthesizer_duration:.2f}s")
    emit_event(emit, "agent_completed", agent="synthesizer", duration=synthesizer_duration, id=synthesizer_id)

    if synthesizer_id is None:
        print("[ORCH] stopped — synthesizer returned no result")
        emit_event(emit, "pipeline_stopped", reason="synthesizer_none")
        return None

    # ---------------- Model swap: 8b out, 14b in ----------------
    emit_event(emit, "model_unload_started", role="synthesizer")
    unload_start = time.time()
    unload_model(role="synthesizer")
    unload_duration = time.time() - unload_start
    print(f"[ORCH TIMING] unload synthesizer model (8b): {unload_duration:.2f}s")
    emit_event(emit, "model_unload_completed", role="synthesizer", duration=unload_duration)

    # Isolate pure 14b model load time from actual Critic generation time,
    # by firing a tiny throwaway call first.
    critic_model = get_model("critic")
    emit_event(emit, "model_load_started", role="critic", model=critic_model)
    load_start = time.time()
    ollama.generate(model=critic_model, prompt="hi", keep_alive="6m", think=False, options={"num_predict": 1})
    load_duration = time.time() - load_start
    print(f"[ORCH TIMING] 14b model load only: {load_duration:.2f}s")
    emit_event(emit, "model_load_completed", role="critic", model=critic_model, duration=load_duration)

    # ---------------- Critic ----------------
    emit_event(emit, "agent_started", agent="critic")
    critic_start = time.time()
    critic_ids = run_critic(question=question, project_tag=project_tag, emit=emit)
    critic_duration = time.time() - critic_start
    print(f"[ORCH TIMING] critic (generation only, model already warm): {critic_duration:.2f}s")
    emit_event(emit, "agent_completed", agent="critic", duration=critic_duration, flag_count=len(critic_ids) if critic_ids is not None else None)

    unload_start = time.time()
    unload_model(role="critic")
    unload_duration = time.time() - unload_start
    print(f"[ORCH TIMING] unload critic model (14b): {unload_duration:.2f}s")
    emit_event(emit, "model_unload_completed", role="critic", duration=unload_duration)

    if critic_ids is None:
        print("[ORCH] stopped — critic returned no result")
        emit_event(emit, "pipeline_stopped", reason="critic_none")
        return None

    synthesis = read_memory(query=question, filter="SYNTHESIS", limit=1, project_tag=project_tag)
    synthesis_text = synthesis[0][3] if synthesis else None

    output = {
        "question": question,
        "project_tag": project_tag,
        "processed_info": synthesis_text,
        "flagged_items": critic_ids,
    }

    total_duration = time.time() - total_start
    print(f"[ORCH TIMING] TOTAL: {total_duration:.2f}s")
    emit_event(emit, "pipeline_completed", duration=total_duration, output=output)

    return output


# result = run_orchestrator(question="how does load balancing work", project_tag="orchestrator_test_3")
# print(result)