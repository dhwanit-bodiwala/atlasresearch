# Multi-Agent Pipeline Trace — Proof of Concept

**Purpose:** Demonstrates the core project thesis — a single agent's unsupported claims, missed by that agent itself, get caught by a dedicated downstream Critic agent.

**Model tier:** GPU (qwen3:8b / qwen3:14b)
**Date captured:** During development testing, Step 4 validation

---

## Step 1: Gatherer Output

**Input (Topic + Source):**
```
Topic: How does JWT authentication work?

Source text: JWT tokens are signed using a secret key on the server, and the
client includes the token in the Authorization header of each request.
```

**Gatherer Output (RAW_FINDING):**
```
JWT tokens are signed using a secret key on the server, and the client
includes the token in the Authorization header of each request.
```

**Observation:** Gatherer correctly extracted the single relevant fact, verbatim in substance, no added interpretation.

---

## Step 2: Synthesizer Output

**Input (Question + Raw Finding):**
```
Research question: What are the security vulnerabilities of JWT tokens?

Raw findings:
- JWT tokens are signed using a secret key on the server, and the client
  includes the token in the Authorization header of each request.
```

**Synthesizer Output (SYNTHESIS):**
```
JWT tokens rely on server-side secret keys for signing, which, if exposed,
could allow attackers to forge or tamper with tokens. The inclusion of
tokens in the Authorization header of HTTP requests means they are
transmitted as part of the request payload, potentially exposing them to
interception if not encrypted via HTTPS. Additionally, the lack of
built-in expiration mechanisms in JWTs could lead to long-lived tokens
being misused if compromised, though this specific detail is not
explicitly mentioned in the findings.
```

**Observation:** The Synthesizer introduced three claims not present in the raw findings:
1. Secret key exposure enabling forgery (plausible, but unstated)
2. "Transmitted as part of the request payload" (factually imprecise — it's a header, not the payload)
3. "Lack of built-in expiration mechanisms" (entirely unstated in findings)

Notably, the model itself flagged its own third claim as unsupported ("though this specific detail is not explicitly mentioned in the findings") — yet included it anyway. This is the exact failure mode the Critic agent exists to catch.

---

## Step 3: Critic Output

**Input (Synthesis + Original Raw Finding):**
```
Synthesis: [output from Step 2, above]

Raw findings:
- JWT tokens are signed using a secret key on the server, and the client
  includes the token in the Authorization header of each request.
```

**Critic Output (FLAGGED):**
```
FLAG: The synthesis incorrectly states that JWT tokens are "transmitted as
part of the request payload," whereas the raw findings explicitly mention
they are included in the "Authorization header," which is a header, not
the payload.

FLAG: The synthesis introduces the claim about "lack of built-in expiration
mechanisms," which is not mentioned in the raw findings.

FLAG: The synthesis adds the unmentioned detail about requiring "HTTPS to
prevent interception," which is not addressed in the raw findings.
```

**Observed runtime:** ~15 seconds (GPU tier)

---

## Why This Trace Matters

This is a real, reproducible example — not a hypothetical — of the project's central thesis in action:

> A single agent, reasoning alone, blended verified source information with plausible-sounding general knowledge without flagging the difference. A dedicated Critic pass, checking the synthesis against the original evidence, caught two of the three fabricated claims with specific, actionable detail.

This directly supports the report framing established for this project:

> "A single reasoning agent has the same blind spot a person working alone has — no built-in way to catch its own errors. Three agents — Gatherer, Synthesizer, and Critic — each handle one explicit responsibility, coordinating entirely through a shared local memory layer."

**Note on Flag 1:** the "payload vs. header" flag is a valid catch but a comparatively minor wording distinction rather than a fabricated fact, unlike Flags 2 and 3. Worth noting in a report as evidence the Critic errs toward thoroughness rather than under-flagging — a reasonable design tradeoff to state explicitly if asked in a viva.
