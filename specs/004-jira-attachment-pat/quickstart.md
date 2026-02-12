# Quickstart: Jira Attachment via User PAT Secret Boundary

## Prerequisites

- Node.js 18+
- Reachable self-hosted Jira instance over HTTPS
- Jira PAT with permission to view issues and manage attachments as required

## Build and run

```bash
npm install
npm run build
npm run serve
```

MCP endpoint is served at `http://localhost:3001/mcp` in local development.

## Planned flow validation

1. Open MCP Apps host and invoke Jira connect flow through widget/text fallback.
2. Submit Jira base URL + PAT through backend-only connect path.
3. Confirm response returns opaque `connection_id` and never returns token.
4. Verify connection status reports only non-sensitive metadata.
5. List attachments for an accessible issue.
6. Attach a selected local artifact to the same issue.
7. Revoke/disconnect and verify subsequent list/attach attempts fail with
   reconnect guidance.

## Security checks

- Confirm no PAT appears in:
  - MCP tool arguments
  - MCP tool results
  - Prompt-visible output/transcripts
  - Application logs
- Confirm vault records are encrypted at rest and user-scoped.
- Confirm cross-user `connection_id` reuse is denied.
- Confirm expired connections cannot list/attach until reconnect.

## Test commands (planned additions)

```bash
npm run test:mcp
npx tsx scripts/jira-token-boundary-tests.ts
npm run test:jira
```

## Text fallback validation

For each tool action (`connect`, `status`, `list-attachments`, `attach`,
`disconnect`), verify a complete text response exists when UI is unavailable.

## Jira sandbox assumptions for local verification

- Use a dedicated Jira test project and PAT with least required permissions.
- Set `JIRA_MOCK_MODE=1` for CI/local deterministic tests that do not call real Jira.
- For real Jira validation, unset mock mode and provide a reachable HTTPS Jira base URL.

## Validation results

- Contract tests: validate schema and opaque reference boundaries.
- Integration tests: validate connect/list/upload/disconnect lifecycle behavior.
- Regression tests: validate no PAT leakage in tool payloads and log sanitization.
- Latest run status:
  - `npm run test:jira` -> PASS
  - `npm run test:mcp` -> PASS
  - `npx tsx scripts/jira-token-boundary-tests.ts` -> PASS
