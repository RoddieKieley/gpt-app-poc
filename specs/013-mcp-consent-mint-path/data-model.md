# Data Model: MCP Consent Mint Path

## Entity: Workflow Session Context

- **Purpose**: Tracks Engage workflow state for a user and MCP transport session.
- **Core fields**:
  - `user_id` (string)
  - `session_id` (string, MCP session binding)
  - `workflow_session_id` (string, workflow-level correlation identifier)
  - `selected_product` (enum: `linux`)
  - `current_step` (enum: `select_product`, `sos_report`, `jira_attach`)
- **Validation rules**:
  - `selected_product` must be `linux` before consent mint or generation.
  - If `workflow_session_id` is provided in tool calls, it must map to an existing session owned by the user.

## Entity: Consent Mint Request

- **Purpose**: Explicit user action to mint consent for diagnostics generation.
- **Core fields**:
  - `workflow_session_id` (optional string)
- **Derived context**:
  - `user_id` from auth/session context
  - `session_id` resolved from MCP session or workflow session mapping
  - `scope` fixed to `generate_sosreport`
  - `step` fixed to `2`
- **Validation rules**:
  - Request denied if Step 1 product selection is incomplete.
  - If `workflow_session_id` is provided, malformed or non-owned values are denied.

## Entity: Consent Token

- **Purpose**: Short-lived, single-use authorization artifact for `generate_sosreport`.
- **Claims**:
  - `sub` (user binding)
  - `session_id` (session binding)
  - `scope` (`generate_sosreport`)
  - `step` (`2`)
  - `iat`, `exp`, `jti`
- **Output fields**:
  - `consent_token` (signed token string)
  - `expires_at` (ISO timestamp)
  - `workflow_session_id` (workflow correlation returned to caller)
- **Validation rules**:
  - Signature must be valid.
  - Token must be unexpired.
  - User/session/scope/step must match expected generation context.
  - `jti` must be single-use (replay denied).

## Entity: Sosreport Generation Request

- **Purpose**: Execute `generate_sosreport` with explicit consent evidence.
- **Core fields**:
  - `consent_token` (required for authorization)
  - `workflow_session_id` (optional, must match context when provided)
  - existing plugin/log/redaction options (unchanged)
- **Validation rules**:
  - Deny when consent missing/invalid/replayed/mismatched.
  - Deny when Step 1 not completed.

## State Transitions

1. `start_engage_red_hat_support` -> workflow created, Step 1 pending.
2. `select_engage_product(product=linux)` -> Step 1 complete.
3. `mint_engage_consent_token(...)` -> consent token minted for Step 2 scope.
4. `generate_sosreport(consent_token, workflow_session_id?)` -> authorized once; replay denied.
5. `fetch_sosreport(fetch_reference)` -> artifact retrieval.
