# Jira Credential and Consent Token Security Model

## Secret Boundary

- Credential entry is allowed only through backend endpoint `POST /api/jira/connections`.
- PAT/API token values are stored encrypted at rest in backend vault storage.
- MCP tool arguments and tool results use opaque `connection_id` references only.
- PAT/API token values are never included in prompts, transcripts, or structured tool payloads.
- Consent tokens are server-minted, signed, short-lived, user/session-bound, scope-bound to
  `generate_sosreport`, and single-use.

## Allowed and Forbidden Data Flows

- **Allowed**: UI -> backend connect endpoint over HTTPS:
  - legacy-compatible payload: (`jira_base_url`, `pat`)
  - Cloud payload: (`jira_base_url`, `auth_mode`, `account_email`, `api_token`)
- **Allowed**: MCP tools -> backend (`connection_id`, `issue_key`, `artifact_ref`).
- **Forbidden**: `pat`, `api_token`, `token`, `authorization`, or any equivalent secret fields in MCP tools or logs.
- **Allowed (scoped exception)**: `consent_token` in `generate_sosreport` MCP arguments only.

## Deterministic Fallback Output Security Rules

- Structured output remains canonical when available; text fallback is compatibility path.
- Deterministic text fallback lines must remain machine parseable for:
  - `workflow_session_id`
  - `consent_token`
  - `expires_at`
  - `job_id`
  - `status`
  - `fetch_reference`
  - `connection_id`
- Fallback text must never introduce secret-bearing fields (`pat`, `api_token`, `authorization`, raw credentials).
- Key values in text fallback must match structured output values exactly for parity-checked fields.

## Threat Notes and Controls

- **Log leakage**: mitigated by centralized redaction utilities.
- **Cross-user misuse**: mitigated by owner checks on each `connection_id`.
- **Credential replay after revoke/expiry**: mitigated by lifecycle state enforcement and vault revocation.
- **Error-body leakage**: mitigated by mapped non-sensitive error messages.
- **Replay attacks**: mitigated by one-time `jti` reservation/consumption checks.
- **Text-parser drift**: mitigated by deterministic key formatting contracts and regression tests for text-only clients.

