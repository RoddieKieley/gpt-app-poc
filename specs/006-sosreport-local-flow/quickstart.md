# Quickstart: Local-First Sosreport MCP Tools (006)

**Feature**: 006-sosreport-local-flow  
**Branch**: `006-sosreport-local-flow`

## Prerequisites

- Node.js 18+
- Dependencies installed: `npm install`
- Local `sos` package installed and available in PATH
- Non-interactive sudoers configured for required sos commands:
  - `/etc/sudoers.d/mcp-sos` contains `NOPASSWD` rules for the MCP runtime user
  - `sudo -n` must succeed for configured commands

## Scope and non-goals

- **Included (Phase 1)**:
  - `generate_sosreport` and `fetch_sosreport` MCP tools
  - local-only execution
  - `/tmp` copied archive output for downstream attachment flow
- **Excluded (deferred Phase 2)**:
  - SSH/remote execution support
  - connection lifecycle for remote hosts
  - host trust and secret management
  - multi-tenant hardening and rate limits

## Implementation steps

1. Add sosreport module files under `src/sosreport/`:
   - schemas, error mapping, command runner, path helpers, handlers
2. Register tools in `server.ts` using existing `registerAppTool` metadata conventions.
3. Ensure both tools return:
   - `structuredContent` for machine use
   - `content` text fallback for non-UI clients
4. Verify `fetch_sosreport` writes copied output to `/tmp` and returns that path.
5. Update docs in `README.md` and `docs/operator-guide.md`.

## Verification steps

### Tool behavior

- Generate success with valid options and output metadata/fetch reference.
- Generate rejects invalid plugin names, invalid `log_size`, and option conflicts.
- Generate maps privilege and timeout failures into actionable categories.
- Generate fallback archive discovery resolves latest matching file when output parse is missing.
- Fetch validates `fetch_reference` path safety and naming.
- Fetch returns `/tmp` archive path, `size_bytes`, and `sha256`.

### Integration and regression

- Verify returned `/tmp` archive path is accepted by `jira_attach_artifact`.
- Verify existing Jira tool names/metadata remain unchanged.
- Verify skill discovery behavior remains unchanged.

### Test commands

```bash
npm run test:unit
npm run test:contract
npm run test:integration
npm run test:regression
npm run test:jira
```

### Targeted sosreport test files

- `tests/unit/sosreport-tool-schemas.test.ts`
- `tests/unit/sosreport-command.test.ts`
- `tests/unit/sosreport-paths.test.ts`
- `tests/contract/sosreport-tools.contract.test.ts`
- `tests/integration/sosreport-generate.success.test.ts`
- `tests/integration/sosreport-generate.failures.test.ts`
- `tests/integration/sosreport-fetch.success.test.ts`
- `tests/regression/mcp-tool-surface-preservation.test.ts`
- `tests/regression/skill-resource-preservation.test.ts`

## Operational note: `/tmp` cleanup

- Fetched archives are copied to `/tmp` for easier local handling.
- Operators should periodically remove stale copied archives according to local retention policy.
- This feature does not implement automatic cleanup scheduling in Phase 1.
