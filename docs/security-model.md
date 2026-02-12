# Jira PAT Security Model

## Secret Boundary

- PAT entry is allowed only through backend endpoint `POST /api/jira/connections`.
- PAT values are stored encrypted at rest in backend vault storage.
- MCP tool arguments and tool results use opaque `connection_id` references only.
- PAT values are never included in prompts, transcripts, or structured tool payloads.

## Allowed and Forbidden Data Flows

- **Allowed**: UI -> backend connect endpoint (`jira_base_url`, `pat`) over HTTPS.
- **Allowed**: MCP tools -> backend (`connection_id`, `issue_key`, `artifact_ref`).
- **Forbidden**: `pat`, `token`, `authorization`, or any equivalent secret fields in MCP tools or logs.

## Threat Notes and Controls

- **Log leakage**: mitigated by centralized redaction utilities.
- **Cross-user misuse**: mitigated by owner checks on each `connection_id`.
- **Credential replay after revoke/expiry**: mitigated by lifecycle state enforcement and vault revocation.
- **Error-body leakage**: mitigated by mapped non-sensitive error messages.

