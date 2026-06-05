## User Personas & Problem Statement

### Who is this for?

---

#### Primary user — Claims adjuster

An insurance professional responsible for reviewing incoming claims,
verifying policy coverage, and making payout decisions. They typically
handle 40–80 claims per day across auto, property, and liability lines.

**Their reality today:**
- Spends 15–30 minutes manually reading unstructured accident narratives
- Cross-references 3–5 internal systems to verify coverage and history
- Flags fraud based on intuition and experience rather than data signals
- Faces pressure to close claims fast while keeping payout accuracy high

---

#### Secondary user — Claims operations manager

Oversees a team of adjusters and is accountable for team throughput,
decision consistency, and fraud loss ratios.

**Their reality today:**
- No standardized scoring across adjuster decisions
- Hard to audit why a claim was approved or denied after the fact
- Fraud slips through because manual review doesn't scale

---

### The problem

Insurance claims adjusters waste hours every day doing work that
does not require human judgment — reading raw accident descriptions,
checking coverage tables, and manually scanning for fraud indicators.

This creates three compounding problems:

| Problem | Impact |
|---------|--------|
| Slow review cycles | Claimants wait days for decisions that could take minutes |
| Inconsistent decisions | Two adjusters reviewing the same claim may reach different outcomes |
| Missed fraud signals | Manual spot-checks catch only a fraction of suspicious patterns |

---

### What ClaimsIQ Pro solves

ClaimsIQ Pro puts an AI agent layer in front of the adjuster's queue.
By the time a human reviews a claim, the system has already:

- Structured the raw narrative into clean, searchable data
- Verified coverage eligibility against policy rules automatically
- Scored the claim on a fraud risk model trained on historical patterns
- Drafted a recommended decision with a full reasoning trail

The adjuster shifts from **doing the analysis** to **reviewing and approving it** —
reducing average claim review time from ~25 minutes to under 5 minutes,
while improving decision consistency and fraud detection coverage.

---

### Who this is NOT for

- Personal lines self-service portals (no claimant-facing UI)
- High-complexity liability litigation (requires legal judgment beyond AI scope)
- Jurisdictions with strict human-in-the-loop regulatory requirements
  (system supports human review but cannot operate fully autonomously)

<img width="808" height="419" alt="Screenshot 2026-06-06 034034" src="https://github.com/user-attachments/assets/da002bcc-0a97-4937-8575-1eaa163fd8b1" />

<img width="1387" height="768" alt="Canva" src="https://github.com/user-attachments/assets/dd9a3f9c-859c-46d3-aea0-33b00b42fa7b" />

<img width="1387" height="821" alt="Screenshot 2026-06-06 022558" src="https://github.com/user-attachments/assets/f3c54e1f-ead6-41d9-9ab2-eff8ede8a762" />
<img width="1714" height="838" alt="Screenshot 2026-06-06 033802" src="https://github.com/user-attachments/assets/7be6520b-1f8f-44b1-82ba-8d376aceb4f2" />

## PM Teardown — Engineering Decisions & Problem Solving

> This section documents the real technical challenges encountered during
> development, how they were diagnosed, and the product decisions made to
> resolve them. Written for portfolio review and team onboarding.

---

### Challenge 1 — HTTP 500 error on claim submission

#### What happened
The claim form submitted successfully from the UI but the backend
returned a `500 Internal Server Error` every time. The frontend showed
a blank failure state with no actionable message for the user.

#### How we diagnosed it
Traced the request path layer by layer:

```
UI form submit
    → API webhook gateway ✓ (received payload)
    → n8n workflow trigger ✗ (500 thrown here)
```

The n8n workflow was configured to respond **immediately** on trigger —
before the AI agents had finished processing. The response fired into
an empty pipeline and crashed because there was no data to return yet.

#### The fix
Changed the n8n webhook **response mode** from:

| Before | After |
|--------|-------|
| `Respond immediately` | `Respond when last node finishes` |

This told n8n to hold the HTTP connection open until the full
agent pipeline completed and a structured payload was ready to return.

#### PM decision note
We chose to keep this synchronous (hold the connection) rather than
move to a polling or websocket model. Given average agent runtime of
under 10 seconds, a held connection was simpler to ship and easier
to debug. Async polling can be revisited if agent latency grows.

---

### Challenge 2 — Webhook response mode misconfiguration

#### What happened
Even after fixing the 500 error, responses were arriving at the client
incomplete — the decision payload was missing the `reasoning` and
`payout` fields. The status (`Approved` / `Denied`) came through,
but nothing else.

#### How we diagnosed it
Inspected the n8n workflow execution log and found the webhook node
was returning the output of the **trigger node** — not the output of
the **final compilation node**. It was responding with the raw
incoming payload, not the processed result.

```
Webhook trigger  →  Agent layer  →  Compile final decision
      ↑
      Responding from here (wrong)
                                             ↑
                                    Should respond from here
```

#### The fix
Explicitly set the webhook **response data source** to the output of
the `Compile Final Decision` node — the last node in the workflow.
This ensured the full structured payload (status + payout + reasoning)
was what got sent back to the client.

#### PM decision note
This is a non-obvious n8n configuration that catches most first-time
builders. Documented here so any future engineer inheriting this
workflow knows exactly where to look if partial responses reappear.

---

### Challenge 3 — LLM returning raw text instead of JSON

#### What happened
GPT-4o occasionally returned its decision as a plain conversational
string rather than the structured JSON the frontend expected. This
caused the UI to silently fail — the response handler received data
it couldn't parse and rendered a blank decision panel.

**Example of the problematic response:**
```
"Based on my analysis, this claim appears to be legitimate and I would
recommend approving it. The coverage is valid and no fraud indicators
were detected."
```

**Expected response shape:**
```json
{
  "status": "Approved",
  "payout": 4200.00,
  "reasoning": "Coverage verified. No fraud signals detected.",
  "confidence": 0.91
}
```

#### How we diagnosed it
Logged raw LLM responses before the parsing step and found ~15% of
responses were unstructured prose — particularly on edge-case claims
where the model added explanatory commentary around the JSON block,
or skipped the JSON format entirely under ambiguous inputs.

#### The fix
Implemented a two-path response handler on the client:

```
LLM response received
        │
        ▼
   Valid JSON? ──── Yes ──→ Parse directly → Render full UI
        │
        No
        │
        ▼
  Fallback parser
  (regex + keyword scan)
        │
   Extract: "Approved" / "Denied" from prose
        │
        ▼
  Render minimal UI
  (status only, no payout breakdown)
```

**Fallback parser logic (simplified):**
```javascript
function extractDecision(rawText) {
  const lower = rawText.toLowerCase();
  if (lower.includes("approved") || lower.includes("approve")) {
    return { status: "Approved", fallback: true };
  }
  if (lower.includes("denied") || lower.includes("deny")
      || lower.includes("reject")) {
    return { status: "Denied", fallback: true };
  }
  return { status: "Unclear", fallback: true };
}
```

The `fallback: true` flag lets the UI show a soft warning:
*"Partial result — manual review recommended."*

#### PM decision note
The real fix is prompt engineering — tightening the system prompt
to enforce JSON-only output. But prompt changes can introduce
regressions in other cases. The fallback parser ships as a
permanent safety net regardless of how reliable the prompt becomes.
It costs almost nothing and prevents a blank screen from ever
reaching a user.

**Prompt change also shipped:**
```
Added to system prompt:
"You must respond only in valid JSON using the exact schema provided.
Do not include explanatory text, preamble, or markdown formatting."
```

---

### Summary — decisions made

| Challenge | Root cause | Fix shipped | Future consideration |
|-----------|-----------|-------------|----------------------|
| HTTP 500 | n8n responding before pipeline finished | Response mode → last node | Move to async if latency grows |
| Incomplete payload | Webhook returning trigger data, not final output | Set response source to final node | Add schema validation on return |
| Raw text from LLM | GPT-4o ignoring JSON format on edge cases | Fallback parser + prompt hardening | Structured outputs / function calling |

---

### What this demonstrates (for portfolio reviewers)

- Ability to **trace bugs across a multi-layer stack** — UI, gateway,
  orchestration, and AI — without direct backend access
- Product instinct to **ship a fallback before fixing the root cause**,
  so users never hit a blank screen while the real fix is validated
- Documentation discipline: writing decisions down *as they happen*
  so the next engineer doesn't re-solve the same problem


## How it works — step by step

| Step | What happens |
|------|-------------|
| 1 | User fills out the claim form in the React UI and hits submit |
| 2 | The form payload is sent via HTTP POST to the API webhook gateway |
| 3 | n8n picks up the request and starts the async orchestration workflow |
| 4 | GPT-4o (the orchestrator) fans the claim out to three specialist agents simultaneously |
| 5 | Each agent does its job and returns its findings |
| 6 | The results are compiled into a single structured decision |
| 7 | The UI receives the response and renders the outcome |

---

## The three AI agents

### Data intake agent
Reads and normalizes the raw claim submission — extracts dates, amounts, claimant info, and event descriptions into a structured format the other agents can use.

### Coverage inspector agent
Checks the claim against the relevant policy rules — verifies coverage type, policy limits, deductibles, and whether the claimed event falls within scope.

### Fraud sleuth agent
Scans for red flags — duplicate claims, inconsistent timelines, anomalous payout amounts, or patterns that match known fraud signatures.

---

## Response handling

The client handles two possible response shapes:

- **Structured JSON** — directly renders the status, payout amount, and GPT-4o reasoning chain
- **Raw string fallback** — if the response isn't clean JSON, the handler parses it semantically to extract an `Approved` or `Denied` verdict

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, Tailwind CSS |
| Orchestration | n8n (async workflow) |
| AI brain | OpenAI GPT-4o |
| Gateway | Webhook API |
