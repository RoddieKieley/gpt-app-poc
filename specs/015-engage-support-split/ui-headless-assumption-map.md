# UI-vs-Headless Assumption Map

## Host capability matrix

| Host Mode | UI Availability | Primary Routing | Required Guidance |
|-----------|------------------|-----------------|------------------|
| UI-capable | Full UI rendering available | Stay on primary `engage-red-hat-support` UI flow | Continue with normal web/UI interaction model |
| Partial UI | Incomplete/unstable UI rendering | Treat as non-UI safe path when deterministic handoff parsing is required | Provide alternate headless skill URI placeholder and text fallback keys |
| Text-only | No UI rendering available | Route to alternate headless skill URI placeholder guidance | Provide deterministic `key: value` fallback parse blocks |

## Blocking handoffs and workaround patterns

| Workflow Step | Blocking Handoff | Current Workaround Pattern | Split-readiness Requirement |
|---------------|------------------|----------------------------|-----------------------------|
| Consent mint | `consent_token`, `expires_at`, `workflow_session_id` | Parse fallback lines from `content.text` if structured payload unavailable | Keep deterministic `key: value` lines with exact value parity to structured output |
| Generate async | `job_id`, `status` | Poll with structured status when available; text-only clients currently infer from free-form text | Add deterministic status parse lines so text-only clients can continue reliably |
| Fetch handoff | `fetch_reference` | Use structured fetch reference where available | Add deterministic fallback parse line and preserve exact parity |
| Jira connect/verify/attach | `connection_id` | Prefer structured connection payload; text-only may parse generic prose | Add deterministic connection parse line for bridge-safe continuation |

## Deterministic fallback key coverage map

| Key | Source Stage | Required In Text Fallback | Required In Structured Output | Notes |
|-----|--------------|---------------------------|-------------------------------|-------|
| `workflow_session_id` | Consent mint | Yes | Yes | Session continuity for later steps |
| `consent_token` | Consent mint | Yes | Yes | Required for invasive diagnostics authorization |
| `expires_at` | Consent mint | Yes | Yes | Expiry validation for short-lived token |
| `job_id` | Generate start/status | Yes | Yes | Required for polling |
| `status` | Generate status | Yes | Yes | Required to detect queued/running/succeeded/failed |
| `fetch_reference` | Generate status success | Yes | Yes | Required to call `fetch_sosreport` |
| `connection_id` | Jira connect/status | Yes | Yes | Required opaque reference for Jira operations |

## Routing decision examples

- **UI-capable host**:
  - Continue normal `engage-red-hat-support` flow.
  - Preserve current compatibility entry behavior `ui://engage-red-hat-support/app.html`.
- **Text-only host**:
  - Return guidance that primary skill is UI-first.
  - Provide alternate headless skill URI placeholder and deterministic fallback keys for handoffs.

## Out-of-scope boundary

- This feature does not create, register, or activate a new headless skill implementation.
- This feature does not remove existing UI resources or alter current web/UI flow semantics.
