# Synthesizer & Critic — Build, Debugging, and Performance Trace

**Purpose:** Documents how the Synthesizer and Critic agents were built, the real bugs encountered during development, root-cause analysis for each, and final validated performance — following the same evidence-based process used for the Gatherer agent.

**Hardware/config at time of testing:** GPU tier (qwen3:8b), `think=False`, per-role token caps (gatherer: 1000, synthesizer: 900, critic: 400)

---

## 1. Synthesizer

### 1.1 Function Design

`run_synthesizer(question, project_tag)`:
1. Count available `RAW_FINDING` memories for the given `project_tag`
2. Compute an **adaptive retrieval limit** — not a fixed number — based on how much material actually exists
3. Retrieve that many findings via semantic search (`read_memory`)
4. Combine them into one prompt, call the model
5. Write the result to memory as `type = SYNTHESIS`, `created_by = synthesizer`

### 1.2 Adaptive Limit Logic

Initially used a hardcoded `limit=2`, which was found to badly under-serve Synthesizer once Gatherer began producing 20–40+ atomic facts per run (see Gatherer trace). Replaced with an adaptive rule:

```
target = available_count * 0.4       # use 40% of what exists
target = max(target, 5)              # floor — never starve it below 5, if that many exist
target = min(target, 20)             # ceiling — never overload the prompt
target = min(target, available_count) # never ask for more than actually exists
```

This required a new function, `count_memories(type, project_tag)`, returning a plain count via `SELECT COUNT(*)` — separate from `read_memory`, which only returns matching rows, not a total.

### 1.3 Bugs Found During Development

**Bug: `write_memory`'s `id` return value ambiguity** — `cur.fetchone()` returns a tuple `(id,)`, not a plain integer. Not yet a blocking issue, but flagged as relevant once `parent_id` chaining (Critic → Synthesis) was implemented.

**Bug: hardcoded `limit=2` severely limited synthesis quality** — with only 2 findings visible, Synthesizer could not draw on the full range of available material (e.g. algorithms, best practices, tooling all present in the data but invisible at `limit=2`). Fixed via the adaptive limit above.

**Symptom (not a Synthesizer bug): near-verbatim output** — early testing (before Gatherer's atomic-extraction fix) showed Synthesizer producing output nearly identical to a single raw finding, because that finding was itself an entire article Gatherer had failed to distill. Root-caused to Gatherer, not Synthesizer — resolved once Gatherer's extraction prompt was fixed (see Gatherer trace, Section on "reframed extraction test").

**Symptom (not a Synthesizer bug): conversational drift** — one test produced a response complimenting "your excellent breakdown" and offering to "dive deeper," breaking character entirely. Root-caused to the same Gatherer issue — feeding Synthesizer article-shaped input caused the model to default to a conversational/reviewer persona. Confirmed resolved once retested against genuinely atomic Gatherer output; symptom did not reappear.

**Bug: output truncation mid-sentence** — after raising `finding_limit` from 2 to 10, responses began cutting off mid-sentence. Root cause: `synthesizer`'s token cap (600) was sized for the smaller `limit=2` input and did not scale with the larger, richer input now being provided. Fixed by raising the cap to 900.

### 1.4 Performance

| Configuration | Result |
|---|---|
| Before `think=False` | Not separately measured (masked by other issues at the time) |
| After `think=False` | **~4 seconds**, complete 3-paragraph synthesis |

### 1.5 Known Limitation

Semantic retrieval favors *relevance*, not *topical diversity*. Even at `limit=18` (out of 46 available findings), only one of four parallel rate-limiting algorithms (token bucket, leaky bucket, fixed window, sliding window) consistently surfaced in the synthesis — the other three, while present in memory, ranked below other content for this specific question phrasing. This is a property of pure similarity-based retrieval, not a bug: it optimizes for "most relevant to the query," not "most representative of all sub-topics." Documented as a known limitation rather than fixed, since resolving it would require a materially different retrieval strategy (e.g. topic-diversified retrieval) outside current project scope.

---

## 2. Critic

### 2.1 Function Design

`run_critic(question, project_tag)`:
1. Retrieve the single most relevant `SYNTHESIS` for the given `project_tag` (`limit=1`)
2. If none exists, return `None` (nothing to check yet)
3. Retrieve `RAW_FINDING`s using the same adaptive-limit logic as Synthesizer
4. Combine synthesis + findings into one prompt, call the model
5. Parse the response for `FLAG:` lines (or `NO_ISSUES`), write each flag as `type = FLAGGED`, `parent_id` pointing to the synthesis being questioned

### 2.2 Bugs Found During Development

**Bug: multiple stale `SYNTHESIS` rows caused ambiguous retrieval** — after repeated same-`project_tag` testing throughout the day, multiple `SYNTHESIS` versions (including an earlier, truncated one) existed simultaneously. Semantic search retrieved the truncated, stale version rather than the latest correct one, since ranking is based on similarity, not recency. Resolved for testing purposes by truncating and regenerating a single clean synthesis. **Flagged as a real, unresolved design gap**: the schema's `status` column (`ACTIVE`/`SUPERSEDED`) was designed to prevent exactly this, but the write path does not yet mark old syntheses as `SUPERSEDED` when a new one is generated for the same question/project. Left as a documented follow-up, not yet implemented.

**Bug: empty model response with no error (`model_response == ''`)** — Critic's first real test returned a silent empty string instead of `NO_ISSUES` or `FLAG:` lines, with no exception raised. Root cause identified through direct debugging (adding print statements around the `call_agent` call and checking length/content): **Qwen3's default "thinking" mode was consuming the entire per-role token cap (400) on invisible internal reasoning, before the model ever reached its visible answer.** The generation was cut off by `num_predict` while still inside the reasoning phase, producing a technically valid but empty response.

**Fix:** added `think=False` to the Ollama `generate()` call in `ollama_services.py`. This did not just fix the empty-response bug — it also **applied globally to Gatherer and Synthesizer**, since the change was made once, centrally, in the shared service function.

### 2.3 Performance Impact of `think=False` — Major Finding

This was the most significant discovery of the day's debugging work, worth stating precisely:

| Agent | Before `think=False` | After `think=False` |
|---|---|---|
| Critic | Empty response (bug) | **~3–4 seconds** |
| Synthesizer | ~10–20s (varied) | **~4 seconds** |
| Gatherer | ~13–25s per source | **~11–23s per source** (largely unchanged) |

**Why the effect differed so sharply between agents:** Synthesizer and Critic both perform bounded, comparison/organization-style tasks with short, constrained outputs — tasks where visible step-by-step reasoning offers little benefit, so the invisible "thinking" phase was pure overhead. Gatherer's task (open-ended extraction of every checkable claim from a source, sometimes 20–30+ facts per call) is inherently generation-heavy regardless of thinking mode — disabling it removed wasted overhead, but did not reduce the legitimately large volume of output Gatherer produces by design.

### 2.4 Design Question Considered: Does Critic Need Thinking Mode?

Explicitly considered before disabling it. Conclusion: **no** — Critic's task (comparing a bounded set of claims against source text for support/contradiction) is a verification/matching task, not a multi-step reasoning problem where exploring alternative reasoning paths measurably improves output quality. This was supported by evidence from an earlier manual test (prior to building `critic_agent.py` as a function), where Critic correctly caught a fabricated claim about JWT security with accurate, specific reasoning — with no separate visible "thinking" step at all, since that test predated the thinking-mode investigation. The quality of reasoning was already present directly in the answer; thinking mode was not adding new reasoning capability, it was consuming budget that prevented any answer from being produced at all under a small token cap.

---

## 3. Full Pipeline — End-to-End Result

One complete run, question: *"how does rate limiting work in an API?"*, all fixes applied (`think=False`, per-role token caps, adaptive retrieval limits, reserve-pool source replacement):

| Stage | Time | % of total |
|---|---|---|
| Gatherer (3 sources, 113 facts written) | ~57s | ~87% |
| Synthesizer | ~4s | ~6% |
| Critic | ~3–4s | ~5% |
| **Total** | **~65 seconds** | 100% |

**Conclusion:** the pipeline's total runtime is now almost entirely attributable to Gatherer, whose cost is structural to its task (open-ended, multi-fact extraction across multiple independent sources) rather than a symptom of inefficiency. Synthesizer and Critic, once `think=False` was applied, contribute less than 10% of total runtime combined. Further optimization effort, if pursued, should target Gatherer specifically (e.g. a smaller/faster model traded against extraction quality, tested empirically) rather than the pipeline's coordination logic, which is now well-optimized.

---

## 4. Report Framing

> "While Gatherer's extraction task is inherently generation-heavy and its runtime is structural to that task, Synthesizer and Critic are comparison and organization tasks well-suited to smaller, bounded outputs. Disabling the model's default 'thinking' mode for these two agents reduced their runtime from double digits (or, in Critic's case, a silent failure under a small token cap) to 3–4 seconds each — a discovery made through direct root-cause debugging of an unexplained empty response, not a general performance tuning pass. This distinction — matching reasoning depth to task type rather than applying a uniform configuration across all three agents — is itself a deliberate architectural choice worth defending on its own terms."
