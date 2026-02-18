# Data Model: Engage Red Hat Support

**Feature**: 007-engage-red-hat-support  
**Date**: 2026-02-18

This feature adds workflow-level entities for orchestrating existing Jira and sosreport tools. It does not introduce a new persistent database model.

## Entities

### SupportEngagementSession

- **Fields**:
  - `session_id: string`
  - `product: "linux"`
  - `issue_key: string`
  - `connection_id: string`
  - `current_step: "connection_verified" | "generating" | "fetching" | "attaching" | "completed" | "failed"`
  - `started_at: string` (ISO timestamp)
  - `finished_at?: string` (ISO timestamp)
  - `status_message: string` (non-secret text)
- **Validation**:
  - `product` must be `linux`.
  - `issue_key` must be present before attach step.
  - `connection_id` must be present and verified before generate step.
- **Role**: Tracks one end-to-end run from connection verification through attachment.

### JiraConnectionReference

- **Fields**:
  - `connection_id: string`
  - `status: "connected" | "error" | "expired" | "revoked"`
  - `jira_base_url: string`
  - `expires_at?: string`
  - `last_verified_at?: string`
- **Validation**:
  - Must be obtained from secure backend PAT intake endpoint or prior verified session.
  - Must never include PAT or token-bearing fields.
- **Role**: Opaque authentication handle used for all downstream MCP calls.

### SupportIssueTarget

- **Fields**:
  - `issue_key: string`
  - `validation_state: "unknown" | "valid" | "invalid" | "inaccessible"`
- **Validation**:
  - Must be non-empty before attachment.
  - Malformed or inaccessible keys transition to `invalid`/`inaccessible`.
- **Role**: Captures issue destination and eligibility for attachment.

### DiagnosticArtifactReference

- **Fields**:
  - `fetch_reference: string`
  - `archive_path: string`
  - `size_bytes?: number`
  - `sha256?: string`
  - `ready_for_attach: boolean`
- **Validation**:
  - `fetch_reference` produced by `generate_sosreport`.
  - `archive_path` produced by `fetch_sosreport` and must be usable as `artifact_ref`.
- **Role**: Bridges diagnostic generation/fetch outputs into Jira attachment input.

### WorkflowStepResult

- **Fields**:
  - `step_name: "connect" | "verify" | "generate" | "fetch" | "attach"`
  - `status: "pending" | "running" | "succeeded" | "failed"`
  - `message: string` (sanitized, user-actionable)
  - `error_code?: string`
  - `updated_at: string` (ISO timestamp)
- **Validation**:
  - `message` must not contain PAT/token-like fields.
  - `failed` step must include retry guidance.
- **Role**: Standardized status model for UI and text fallback progress reporting.

## Relationships

- One `SupportEngagementSession` references one `JiraConnectionReference`.
- One `SupportEngagementSession` references one `SupportIssueTarget`.
- One `SupportEngagementSession` may transition through one `DiagnosticArtifactReference` lifecycle (generate -> fetch -> attach).
- One `SupportEngagementSession` owns multiple `WorkflowStepResult` records (one per step).

## State Transitions

### Engagement flow

1. `initialized` -> PAT intake completed and `connection_id` issued
2. `initialized` -> `connection_verified`
3. `connection_verified` -> `generating`
4. `generating` -> `fetching` (requires valid `fetch_reference`)
5. `fetching` -> `attaching` (requires valid `archive_path` and `issue_key`)
6. `attaching` -> `completed`

### Failure flow

- Any step may transition to `failed`.
- On `failed`, sequence stops and no subsequent step executes automatically.
- Retry resumes from failed step prerequisites without re-exposing PAT.

## Secret Boundary Constraints

- PAT is not modeled as an entity field outside secure backend intake handling.
- Tool-facing entities (`JiraConnectionReference`, `WorkflowStepResult`) expose only non-secret identifiers and messages.
- Any logged or displayed values must pass sanitization rules consistent with current security model.
