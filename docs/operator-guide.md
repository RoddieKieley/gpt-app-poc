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

