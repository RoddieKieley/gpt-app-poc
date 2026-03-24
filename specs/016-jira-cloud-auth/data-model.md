# Data Model: Jira Cloud Minimal-Auth Compatibility

## Entity: Jira Connection Record

- **Purpose**: Stores backend-owned Jira connection lifecycle and non-secret metadata.
- **Existing fields (preserved)**:
  - `connectionId`
  - `userId`
  - `jiraBaseUrl`
  - `status` (`connected`, `expired`, `revoked`, `error`)
  - `createdAt`, `updatedAt`, `expiresAt`, `revokedAt`, `lastVerifiedAt`, `lastErrorCode`
- **Additive fields (minimal)**:
  - `authMode`: enum-like string (`basic_cloud` or `bearer_pat`)
  - `accountEmail`: optional string (required when `authMode=basic_cloud`)
- **Backward compatibility rules**:
  - Records with missing `authMode` are interpreted as `bearer_pat`.
  - Records with missing `accountEmail` remain valid for `bearer_pat`.

## Entity: Secret Vault Entry

- **Purpose**: Stores encrypted secret material keyed by `connectionId`.
- **Shape**: unchanged (`ciphertext`, `iv`, `tag`, `keyVersion`, `createdAt`).
- **Compatibility rule**:
  - Vault storage format remains unchanged to avoid migration risk.
  - Secret meaning depends on connection auth mode:
    - `basic_cloud`: stored secret is Cloud API token.
    - `bearer_pat`: stored secret is PAT.

## Entity: Connect Intake Payload

- **Purpose**: Backend-only connection intake contract.
- **Legacy payload (must remain valid)**:
  - `jira_base_url`
  - `pat`
- **Additive Cloud-capable payload (minimal extension)**:
  - `jira_base_url`
  - `auth_mode` (`basic_cloud` or `bearer_pat`)
  - `account_email` (required for `basic_cloud`)
  - `api_token` (when `basic_cloud`) or `pat` (when `bearer_pat`)
- **Validation rules**:
  - `jira_base_url` must be HTTPS.
  - Exactly one secret path must be used per request.
  - `account_email` must be present for `basic_cloud`.

## Entity: MCP and HTTP Operational Reference

- **Purpose**: Non-secret reference used for list/attach/status/disconnect flows.
- **Fields**:
  - `connection_id` (opaque, required)
  - Existing non-secret operation fields (`issue_key`, `artifact_ref`)
- **Validation rules**:
  - No secret-bearing credential fields are accepted in MCP-facing operations.
  - `connection_id` owner checks remain required.

## State Transitions

1. `connect_requested` -> `connected` when verify succeeds with resolved auth context.
2. `connect_requested` -> `error` when verify fails (mapped Jira auth/access error).
3. `connected` -> `expired` when TTL is exceeded.
4. `connected` -> `revoked` when disconnect is requested.
5. Any non-terminal state -> `error` on downstream Jira request failure (unless already `expired`/`revoked`).

## Invariants

- Secrets are accepted only through backend connect intake.
- MCP and downstream HTTP workflow uses opaque `connection_id` only.
- Endpoint response envelopes for connect/status/list/attach remain stable.
- Auth-mode metadata additions must not break legacy connection record reads.
