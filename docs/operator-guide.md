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
- Validate operator setup:
  - `sudo -n sos report --help` should not prompt for password

### Runtime Notes

- `generate_sosreport` fails fast when `sos` is unavailable.
- `generate_sosreport` requires `sudo -n`; password prompts are not supported.
- `fetch_sosreport` reads a validated local archive and writes a copied file to `/tmp`.
- Returned `/tmp` archive path is intended for `jira_attach_artifact` `artifact_ref` usage.

### Cleanup Guidance

- Periodically remove stale copied archives under `/tmp` according to local retention policy.
- This phase does not include automated cleanup scheduling.

### Deferred Scope

- SSH-based execution
- Remote connection lifecycle
- Host trust and SSH secret management
- Multi-tenant controls and rate limits

