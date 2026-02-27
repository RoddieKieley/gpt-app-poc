# Jira Token Vault Operator Guide

## Configuration

- Set `TOKEN_VAULT_MASTER_KEY` to a strong secret in deployment.
- Set `JIRA_CONNECTION_TTL_SECONDS` to enforce bounded credential lifetime.
- Set `JIRA_ATTACHMENT_MAX_BYTES` for upload limits.
- Use `JIRA_MOCK_MODE=1` only in test environments.

## Lifecycle Operations

- Connect users through `POST /api/jira/connections`.
- Verify status through `GET /api/jira/connections/{connection_id}`.
- Revoke through `DELETE /api/jira/connections/{connection_id}`.
- Reconnect users when connection status is `expired` or `revoked`.

## Incident Response

- If credential compromise is suspected, revoke connection immediately.
- Rotate `TOKEN_VAULT_MASTER_KEY` and reconnect all users if key exposure is suspected.
- Review security event logs for `connect`, `attach`, `revoke`, and denied access patterns.
- Never request users to paste PATs into prompts or MCP tool calls.

## Local Sosreport Operations (Phase 1)

### Prerequisites

- Install `sos` package on the host running `gpt-app-poc`.
- Configure non-interactive sudo for sosreport generation:
  - create `/etc/sudoers.d/mcp-sos`
  - grant required `sos report` command path with `NOPASSWD`
  - expected command shape: `sos report --batch --tmp-dir /var/tmp --name linux-mcp-sos`
- Validate operator setup:
  - `sudo -n sos report --help` should not prompt for password

### Runtime Notes

- `generate_sosreport` requires explicit consent token minted via `POST /api/engage/consent-tokens`.
- `generate_sosreport` fails fast when `sos` is unavailable.
- `generate_sosreport` requires `sudo -n`; password prompts are not supported.
- `fetch_sosreport` reads a validated local archive and writes a copied file to `/tmp`.
- `fetch_sosreport` first attempts direct read, then uses `sudo -n cat` fallback for root-owned archives.
- Returned `/tmp` archive path is intended for `jira_attach_artifact` `artifact_ref` usage.

### Cleanup Guidance

- Periodically remove stale copied archives under `/tmp` according to local retention policy.
- This phase does not include automated cleanup scheduling.

### Deferred Scope

- SSH-based execution
- Remote connection lifecycle
- Host trust and SSH secret management
- Multi-tenant controls and rate limits

## Engage Red Hat Support Operations (007)

### Scope and sequencing

- Product scope is Linux-only for this workflow.
- Compatibility entry URI remains `ui://engage-red-hat-support/app.html`.
- End-to-end 3-step sequence:
  1. Start workflow and select product (`linux` only) via `start_engage_red_hat_support` + `select_engage_product` (or HTTP workflow start/select endpoints for UI flow).
  2. Mint one-time consent token with `POST /api/engage/consent-tokens`, run `generate_sosreport` with `consent_token`, then `fetch_sosreport` to obtain `artifact_ref`.
  3. Connect with PAT through `POST /api/jira/connections`, verify active `connection_id`, verify issue read access with `jira_list_attachments`, then run `jira_attach_artifact`.
- Step 2 consent validation denies requests when token is missing, invalid, expired, replayed, wrong-user/session, or wrong-scope/step.

### Lifecycle gating

- `connected`: proceed with diagnostics/attach.
- `expired`: stop and reconnect before continuing.
- `revoked`: stop and reconnect before continuing.

### Secret boundary reminders

- PAT must only be entered in secure backend intake requests.
- PAT must never be passed in MCP tool arguments or shown in logs/transcripts.
- Downstream MCP and API usage should rely on opaque `connection_id`.

### Connection troubleshooting

- Use `POST /api/jira/connections` (plural). The singular path is not a valid intake endpoint.
- No extra request header in this app bypasses Jira SAML/SSO redirects.
- If Jira redirects API calls to login/IdP, use a Jira API-capable base URL and a PAT that supports direct REST API access.
- If `jira_list_attachments` fails, treat issue-read verification as failed and do not proceed to attach.

### Incident response

- If exposure is suspected, revoke impacted connections immediately.
- Reconnect users with new PAT intake only after mitigation.
- Review security event logs for connect/verify/attach/revoke outcomes and denied access patterns.

