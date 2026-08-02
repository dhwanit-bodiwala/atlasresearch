import time
from ddgs import DDGS
import trafilatura
from trafilatura.settings import use_config
from read_write_action import write_memory
from ollama_services import call_agent
from ws_events import emit_event

ROLE = "gatherer"


def _try_source(url: str, question: str, project_tag: str, config, source_index: int, attempt_label: str, emit=None):
    """
    Runs fetch -> extract -> call_agent -> format check for ONE url.
    Returns (list_of_fact_ids_written, hard_failure_bool).
    hard_failure = True means: extract failed, OR format check failed.
    hard_failure = False means: either succeeded, or a clean NO_RELEVANT_INFO skip.
    """
    emit_event(emit, "source_started", index=source_index, url=url, attempt_label=attempt_label)

    fetch_start = time.time()
    downloaded = trafilatura.fetch_url(url, config=config)
    text = trafilatura.extract(downloaded, config=config)
    fetch_duration = time.time() - fetch_start
    print(f"[TIMING] source {source_index} ({attempt_label}) fetch+extract: {fetch_duration:.2f}s  ({url})")

    if text is None:
        print(f"[TIMING] source {source_index} ({attempt_label}) failed (extract failed)")
        emit_event(
            emit, "source_fetch_completed", index=source_index, url=url,
            attempt_label=attempt_label, duration=fetch_duration, success=False
        )
        return [], True

    emit_event(
        emit, "source_fetch_completed", index=source_index, url=url,
        attempt_label=attempt_label, duration=fetch_duration, success=True
    )

    combined_prompt = f"Topic : {question}\n\nSource text: {text}"

    model_start = time.time()
    model_response = call_agent(role=ROLE, prompt=combined_prompt)
    model_duration = time.time() - model_start
    print(f"[TIMING] source {source_index} ({attempt_label}) call_agent: {model_duration:.2f}s")

    if model_response == "NO_RELEVANT_INFO":
        print(f"[TIMING] source {source_index} ({attempt_label}) skipped (NO_RELEVANT_INFO)")
        emit_event(
            emit, "source_generation_completed", index=source_index, url=url,
            attempt_label=attempt_label, duration=model_duration,
            outcome="no_relevant_info", fact_count=0
        )
        return [], False

    if "FACT:" not in model_response:
        print(f"[WARNING] source {source_index} ({attempt_label}) failed format check (no 'FACT:' found)")
        emit_event(
            emit, "source_generation_completed", index=source_index, url=url,
            attempt_label=attempt_label, duration=model_duration,
            outcome="format_failure", fact_count=0
        )
        return [], True

    refined = [piece.strip() for piece in model_response.split("FACT: ") if piece.strip() != ""]

    ids = []
    for fact in refined:
        write_start = time.time()
        id = write_memory(
            content=fact, type="RAW_FINDING", created_by="gatherer",
            parent_id=None, source=url, project_tag=project_tag
        )
        write_duration = time.time() - write_start
        print(f"[TIMING] source {source_index} ({attempt_label}) write_memory: {write_duration:.2f}s")
        emit_event(
            emit, "memory_written", id=id, type="RAW_FINDING",
            source=url, project_tag=project_tag, duration=write_duration
        )
        ids.append(id)

    emit_event(
        emit, "source_generation_completed", index=source_index, url=url,
        attempt_label=attempt_label, duration=model_duration,
        outcome="success", fact_count=len(ids)
    )

    return ids, False


def run_gatherer(question: str, project_tag: str, deep_research: bool = False, emit=None):

    max_results = 5 if deep_research else 3
    reserve_count = 2  # how many extra URLs to keep on hand as backups

    id_list = list()
    total_start = time.time()

    emit_event(emit, "search_started", question=question, max_results=max_results)

    search_start = time.time()
    with DDGS() as ddgs:
        all_results = ddgs.text(question, max_results=max_results + reserve_count)
    search_duration = time.time() - search_start
    print(f"[TIMING] search: {search_duration:.2f}s  (got {len(all_results)} results, using {max_results} primary + reserve pool)")
    emit_event(
        emit, "search_completed", duration=search_duration,
        result_count=len(all_results), max_results=max_results
    )

    primary_results = all_results[:max_results]
    reserve_pool = all_results[max_results:]  # untouched URLs, only used if a primary source fails

    config = use_config()
    config.set("DEFAULT", "DOWNLOAD_TIMEOUT", "8")
    config.set("DEFAULT", "EXTRACTION_TIMEOUT", "8")

    for i, r in enumerate(primary_results):
        current_url = r["href"]

        fact_ids, hard_failure = _try_source(current_url, question, project_tag, config, i, "primary", emit=emit)
        id_list.extend(fact_ids)

        if not hard_failure:
            continue  # succeeded, or a clean NO_RELEVANT_INFO skip — nothing more to do

        # Primary source hard-failed — try ONE replacement from the reserve pool, if one is available.
        if not reserve_pool:
            print(f"[TIMING] source {i} no reserve URL left — giving up on this slot")
            emit_event(emit, "source_exhausted", index=i)
            continue

        replacement = reserve_pool.pop(0)
        replacement_url = replacement["href"]

        emit_event(emit, "source_replaced", index=i, replacement_url=replacement_url)

        fact_ids, hard_failure = _try_source(replacement_url, question, project_tag, config, i, "replacement", emit=emit)
        id_list.extend(fact_ids)

        if hard_failure:
            print(f"[TIMING] source {i} replacement also failed — giving up on this slot")
            emit_event(emit, "source_exhausted", index=i)

    total_duration = time.time() - total_start
    print(f"[TIMING] TOTAL: {total_duration:.2f}s")
    emit_event(emit, "gatherer_completed", fact_count=len(id_list), duration=total_duration)

    return id_list


# run_gatherer(question="how does rate limiting work in an API?",project_tag="test3")