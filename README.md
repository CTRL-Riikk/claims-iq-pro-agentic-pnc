


<img width="243" height="150" alt="claimsiq_agent_layer" src="https://github.com/user-attachments/assets/3a9d99bd-64f5-4c3b-a5c3-360b15355558" />

<img width="808" height="419" alt="Screenshot 2026-06-06 034034" src="https://github.com/user-attachments/assets/da002bcc-0a97-4937-8575-1eaa163fd8b1" />

<img width="1387" height="768" alt="Canva" src="https://github.com/user-attachments/assets/dd9a3f9c-859c-46d3-aea0-33b00b42fa7b" />

<img width="1387" height="821" alt="Screenshot 2026-06-06 022558" src="https://github.com/user-attachments/assets/f3c54e1f-ead6-41d9-9ab2-eff8ede8a762" />
<img width="1714" height="838" alt="Screenshot 2026-06-06 033802" src="https://github.com/user-attachments/assets/7be6520b-1f8f-44b1-82ba-8d376aceb4f2" />



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
