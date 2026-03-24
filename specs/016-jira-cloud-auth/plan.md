# Implementation Plan: Jira Cloud Minimal-Auth Migration

**Branch**: `016-jira-cloud-auth` | **Date**: 2026-03-24 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `/specs/016-jira-cloud-auth/spec.md`

## Summary

Implement a smallest-change migration so existing Jira attachment workflow works against Atlassian Cloud by adding Cloud-compatible Basic auth support while preserving existing bearer-compatible behavior and external workflow/response contracts.

## Technical Context

**Language/Version**: TypeScript (Node.js ESM) + Markdown/YAML/JSON planning artifacts  
**Primary Dependencies**: `express`, `zod`, `@modelcontextprotocol/sdk`, `tsx --test`  
**Storage**: Existing file-backed connection lifecycle store and encrypted token vault under `.data/`  
**Testing**: Existing `tsx --test` suites in `tests/unit`, `tests/contract`, `tests/integration`, `tests/regression`  
**Target Platform**: Linux-hosted backend/MCP server integrating with Atlassian Cloud Jira  
**Project Type**: Single backend project with MCP tool surface + HTTP endpoints  
**Performance Goals**: No material latency regression in connect/list/attach workflow compared to current baseline; no extra workflow steps for operators  
**Constraints**: Localized edits only, preserve endpoint/response compatibility, preserve secret boundary (`connection_id` only outside backend), docs updated only where behavior changes  
**Scale/Scope**: Focused edits in Jira auth construction, connection metadata/schema, targeted tests/docs; no workflow redesign and no auth-provider refactor

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **1. Support-Workflow Fidelity**: Keep connect -> verify -> list -> attach sequence unchanged. **Pass.**
- **2. Human-Authorized Diagnostics**: No changes to consent/diagnostic execution model. **Pass.**
- **3. Privacy-First Diagnostics**: No additional sensitive data exposed; redaction and least-scope rules unchanged. **Pass.**
- **4. Strict MCP Apps Compliance**: No host-specific runtime changes introduced. **Pass.**
- **5. Graceful Degradation**: Existing text fallback behavior remains; only auth compatibility changes. **Pass.**
- **6. Portability and Interop**: Backend-mediated auth remains host-agnostic with opaque references. **Pass.**
- **7. Incremental Spec-Driven Delivery**: Plan/research/data-model/contracts/quickstart produced in this feature package. **Pass.**
- **8. Secret Boundary for Tokens/Credentials**: Secrets remain backend-intake-only; MCP stays `connection_id`-only. **Pass.**
- **9. Non-Retroactive Specification Integrity**: All new design artifacts live under `specs/016-jira-cloud-auth/`. **Pass.**

**Post-Design Re-check**: Pass. Phase 1 artifacts preserve secret boundaries and avoid retroactive edits to prior spec packages.

## Phase 0 Research Output Summary

- Cloud Jira requires Basic authentication semantics using account identity plus API token; current bearer-only header causes 403/error state.
- Smallest-change strategy is to centralize auth header construction and keep existing Jira REST endpoint paths unless strictly required.
- Backward compatibility is maintained by introducing explicit auth mode metadata with a default preserving existing behavior for legacy bearer records.
- Security boundary remains unchanged: backend-only secret intake and storage, no secret-bearing MCP args/results/log output.

## Phase 1 Design Decisions

1. **Localized auth construction**: Update `src/jira/jira-client.ts` to build `Authorization` header from connection auth context (Cloud Basic vs bearer-compatible).
2. **Minimal schema expansion**: Extend connect input metadata only as needed to carry `auth_mode` and Cloud account email, while preserving existing request/response shapes.
3. **Connection metadata compatibility**: Add optional auth metadata in lifecycle records with safe defaults for old records (treat missing mode as bearer-compatible).
4. **Vault reuse**: Continue using existing token vault for secret material; no new secret persistence subsystem.
5. **Contract stability**: Keep connect/status/list/attach endpoints and MCP tool names unchanged; only additive/optional input fields where needed.

## File-by-File Change List

### Core runtime edits (localized)

- `src/jira/jira-client.ts`
  - Add auth header builder that supports Basic auth (`email` + `api_token`) and bearer-compatible mode.
  - Thread auth context through `verifyConnection`, `listAttachments`, and `attachArtifact` with minimal signature changes.
- `src/jira/jira-tool-schemas.ts`
  - Expand connect schema with minimal additive fields for auth mode/email while preserving current required fields for legacy bearer path.
  - Keep all non-connect schemas unchanged to preserve MCP and HTTP downstream contracts.
- `src/jira/jira-tool-handlers.ts`
  - Resolve auth metadata from connection lifecycle + vault secret and pass auth context to Jira client.
  - Preserve existing tool output structure and fallback text keys.
- `server.ts`
  - Update secure connect intake parsing and `createSecureJiraConnection` to persist auth metadata with smallest payload delta.
  - Keep endpoint routes and response shapes stable; no new external workflow steps.
- `src/security/connection-lifecycle.ts`
  - Add optional connection metadata fields for auth mode/email with backward-compatible defaults for existing records.
  - Keep existing owner checks, lifecycle status transitions, and TTL behavior.
- `src/security/token-vault.ts`
  - No schema redesign; continue storing secret material by `connection_id`. Update only if minimal metadata wrapper is required.

### Tests (targeted updates)

- `tests/unit/jira-client.test.ts`
  - Add targeted unit coverage for Basic auth header construction and retained bearer behavior.
- `tests/contract/jira-connections.contract.test.ts`
  - Add/adjust connect input contract assertions for additive auth fields and backward compatibility.
- `tests/integration/jira-attachments.success.test.ts`
  - Cover Cloud-style connect/list/attach happy path while keeping existing flow unchanged.
- Related regression/security tests (as needed with minimal touch):
  - `tests/regression/no-pat-leakage-mcp.test.ts`
  - `tests/regression/no-pat-leakage-logs.test.ts`

### Documentation updates

- `docs/operator-guide.md`
  - Update Jira connect instructions for Cloud base URL and auth expectations.
  - Keep operational flow documentation unchanged apart from auth input details.
- `docs/security-model.md`
  - Reflect Cloud auth input semantics while preserving secret-boundary rules.
- `skills/engage-red-hat-support/SKILL.md`
  - Update Step 3 Jira connection guidance to note Cloud credentials expectations and preserve `connection_id` workflow.

## Data Model and Input Contract Changes

### Connection metadata (backward-compatible)

- Add optional auth metadata on connection record:
  - `auth_mode`: enum-like value (`basic_cloud` or `bearer_pat`), default inferred as `bearer_pat` for pre-existing records.
  - `account_email`: optional string for Cloud Basic mode.
- Existing records without new fields remain valid and usable.

### Connect intake contract (additive, minimal)

- Existing accepted payload remains valid: `{ jira_base_url, pat }`.
- Additive Cloud-capable payload support:
  - include mode/email metadata plus secret token at backend intake.
- Response contract remains stable:
  - `connection_id`, `jira_base_url`, `status`, `expires_at`, `last_verified_at`, `text`.

### MCP-facing contract

- No secret-bearing fields added to MCP tools.
- Downstream tools continue to require only `connection_id` plus existing non-secret arguments.

## Test Strategy

### Unit tests

- `tests/unit/jira-client.test.ts`
  - Verify Basic header format for Cloud mode.
  - Verify bearer header still produced for legacy mode.
  - Verify no credential leak in thrown error messages.

### Contract tests

- `tests/contract/jira-connections.contract.test.ts`
  - Assert connect schema accepts legacy payload.
  - Assert connect schema accepts Cloud payload.
  - Assert status schema/shape remains unchanged.

### Integration tests

- `tests/integration/jira-attachments.success.test.ts`
  - Happy path for connect -> list -> attach using Cloud-compatible auth inputs.
- Optional targeted negative coverage (minimal additions in existing files):
  - invalid Cloud credentials produce error status without secret leakage.
  - legacy bearer path continues to behave as before.

### Security regression tests

- `tests/regression/no-pat-leakage-mcp.test.ts`
- `tests/regression/no-pat-leakage-logs.test.ts`
  - Ensure additive Cloud fields do not introduce secret leakage in MCP payloads/logs/fallback text.

## Manual Verification Runbook

### Happy path (Cloud canonical issue: `APPENG-999999`)

1. Connect via `POST /api/jira/connections` with Cloud base URL `https://redhat.atlassian.net` and Cloud credentials.
2. Verify `GET /api/jira/connections/{connection_id}` reports active or non-error state.
3. List via `jira_list_attachments(connection_id, "APPENG-999999")` (or HTTP equivalent) and confirm attachment metadata returns.
4. Attach local artifact via `jira_attach_artifact(connection_id, "APPENG-999999", artifact_ref)`.
5. Re-list attachments and confirm newly attached file is present.

### Negative cases

1. Invalid Cloud token/email -> connect verification does not become healthy; no secret values in output text/logs.
2. Wrong issue key or inaccessible issue -> list fails with mapped error and existing response format.
3. Unknown `connection_id` -> list/attach deny with current not-found semantics.
4. Revoke/expired connection -> list/attach deny and prompt reconnect semantics stay unchanged.
5. Bearer-compatible existing record -> list/attach still works in supported bearer environments.

## Risks and Rollback Strategy

### Risks

- Auth-mode detection mistakes could break legacy bearer records.
- Additive schema fields could accidentally change validation behavior for existing clients.
- Secret leakage regressions if new auth inputs are logged unsafely.

### Mitigations

- Default missing auth metadata to legacy bearer-compatible behavior.
- Keep connect changes additive and preserve current response shape exactly.
- Run targeted leakage regressions and review fallback text for secret-safe wording.

### Rollback

- Revert localized auth-mode and metadata changes in Jira/auth files.
- Keep persisted legacy connection behavior by continuing bearer-compatible path.
- If Cloud mode fails in production, temporarily operate with known-good legacy behavior while patching Cloud mode in a follow-up feature branch.

## Project Structure

### Documentation (this feature)

```text
specs/016-jira-cloud-auth/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── jira-cloud-auth-minimal-openapi.yaml
└── tasks.md
```

### Source Code (repository root)

```text
src/jira/jira-client.ts
src/jira/jira-tool-schemas.ts
src/jira/jira-tool-handlers.ts
server.ts
src/security/connection-lifecycle.ts
src/security/token-vault.ts
tests/unit/jira-client.test.ts
tests/contract/jira-connections.contract.test.ts
tests/integration/jira-attachments.success.test.ts
docs/operator-guide.md
docs/security-model.md
skills/engage-red-hat-support/SKILL.md
```

**Structure Decision**: Keep single-project architecture and apply localized edits only in existing Jira/auth/security/docs/tests paths to minimize migration risk.

## Complexity Tracking

No constitution violations require justification.
