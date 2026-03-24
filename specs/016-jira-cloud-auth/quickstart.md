# Quickstart: 016 Jira Cloud Minimal-Auth Migration

## 1) Implementation intent

1. Keep external workflow unchanged: connect -> verify -> list -> attach.
2. Add Cloud-compatible Basic auth support with minimal localized code changes.
3. Preserve bearer-compatible path for existing records/environments where needed.
4. Preserve backend-only secret intake and `connection_id`-only MCP/tool operations.

## 2) Planned file targets

- `src/jira/jira-client.ts`
- `src/jira/jira-tool-schemas.ts`
- `src/jira/jira-tool-handlers.ts`
- `server.ts`
- `src/security/connection-lifecycle.ts`
- `src/security/token-vault.ts` (only if minimal metadata wrapping is necessary)
- `tests/unit/jira-client.test.ts`
- `tests/contract/jira-connections.contract.test.ts`
- `tests/integration/jira-attachments.success.test.ts`
- `docs/operator-guide.md`
- `docs/security-model.md`
- `skills/engage-red-hat-support/SKILL.md`

## 3) Contract artifact (this feature package)

- `specs/016-jira-cloud-auth/contracts/jira-cloud-auth-minimal-openapi.yaml`

## 4) Test strategy and commands

### Targeted verification commands

- `npm exec -- tsx --test tests/unit/jira-client.test.ts`
- `npm exec -- tsx --test tests/contract/jira-connections.contract.test.ts`
- `npm exec -- tsx --test tests/integration/jira-attachments.success.test.ts`

### Security regression commands

- `npm exec -- tsx --test tests/regression/no-pat-leakage-mcp.test.ts`
- `npm exec -- tsx --test tests/regression/no-pat-leakage-logs.test.ts`

### Broader safety checks (optional but recommended)

- `npm run test:unit`
- `npm run test:contract`
- `npm run test:integration`
- `npm run test:regression`

## 5) Manual verification runbook

### Happy path (canonical issue `APPENG-999999`)

1. Create connection with `POST /api/jira/connections` using:
   - `jira_base_url: https://redhat.atlassian.net`
   - Cloud auth input accepted by backend intake
2. Verify status with `GET /api/jira/connections/{connection_id}`.
3. List issue attachments for `APPENG-999999` using `connection_id`.
4. Attach local artifact to `APPENG-999999` using `connection_id`.
5. Re-list attachments and confirm newly uploaded file appears.

### Negative cases

1. Invalid Cloud credentials -> connect/status shows failure semantics without secret leakage.
2. Unknown `connection_id` -> list/attach returns current not-found response format.
3. Revoked/expired connection -> list/attach requires reconnect.
4. Wrong or inaccessible issue key -> mapped access/not-found errors.
5. Existing bearer-compatible connection -> unchanged behavior in supported environments.

## 6) Security checks during manual validation

- Confirm no PAT/API token values appear in:
  - MCP tool arguments/results
  - HTTP error response `message`/`text`
  - application logs
  - fallback text content
- Confirm only opaque `connection_id` is required for downstream list/attach operations.

## 7) Rollback checklist

1. Revert auth-mode metadata and auth-header changes in Jira/auth files.
2. Re-run targeted tests to confirm legacy bearer-compatible flow behavior.
3. Keep operator docs on last known-good auth instructions until patch update is ready.
