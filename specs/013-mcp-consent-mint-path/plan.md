# Implementation Plan: MCP Consent Mint Tool for Headless Clients

**Branch**: `013-mcp-consent-mint-path` | **Date**: 2026-03-03 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `/specs/013-mcp-consent-mint-path/spec.md`

## Summary

Add a dedicated MCP consent-mint tool for headless/text clients while preserving the existing web consent endpoint and UX. The implementation reuses existing consent token validation semantics, introduces strict optional `workflow_session_id` validation for minting, and keeps `generate_sosreport` fail-closed with explicit consent and existing replay/user/session/scope/step protections.

## Technical Context

**Language/Version**: TypeScript (Node.js, ESM)  
**Primary Dependencies**: `@modelcontextprotocol/sdk`, `@modelcontextprotocol/ext-apps`, `express`, `zod`, `node:crypto`, `tsx`  
**Storage**: Existing in-memory workflow/session and consent single-use state  
**Testing**: `tsx --test` suites in `tests/unit`, `tests/integration`, `tests/contract`, and `tests/regression`  
**Target Platform**: Linux-hosted MCP server with web UI + text/headless MCP clients  
**Project Type**: Single-project backend + MCP app resource  
**Performance Goals**: Consent mint and validation remain near-immediate for user workflows; no added asynchronous hops for web flow  
**Constraints**: Keep `POST /api/engage/consent-tokens` unchanged for web; no implicit consent minting; no automatic diagnostics generation; preserve token security invariants  
**Scale/Scope**: New MCP tool registration, shared schema extraction, workflow/session validation reuse, new versioned contracts in this feature package, integration/contract/regression test additions

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **1. Support-Workflow Fidelity**: Preserves Step 1 -> consent -> diagnostics workflow and keeps sosreport as primary artifact path. **Pass.**
- **2. Human-Authorized Diagnostics**: `generate_sosreport` remains explicitly consent-gated; no implicit diagnostics start. **Pass.**
- **3. Privacy-First Diagnostics**: No expansion of diagnostic scope; denied flows remain safe-text only. **Pass.**
- **4. Strict MCP Apps Compliance**: Additive MCP tool only; no host-specific runtime dependencies. **Pass.**
- **5. Graceful Degradation**: Adds full text/headless parity for consent minting while preserving web UX. **Pass.**
- **6. Portability and Interop**: Tool behavior is host-agnostic and JSON-RPC based. **Pass.**
- **7. Incremental Spec-Driven Delivery**: Plan/research/data model/contracts/quickstart produced in `specs/013-...`. **Pass.**
- **8. Secret Boundary**: No PAT or credential boundary changes; consent token semantics unchanged. **Pass.**
- **9. Non-Retroactive Specification Integrity**: New versioned contracts created only in this feature directory. **Pass.**

**Post-Design Re-check**: Pass. Design artifacts keep web path unchanged, add explicit MCP mint path, and avoid retroactive modifications to older spec packages.

## Ordered Phases

### Phase 0 - Research and final decisions

1. Confirm where consent minting logic currently lives (`server.ts` REST endpoint + `ConsentTokenService` + workflow state helpers).
2. Decide validation reuse shape: extract mint request schema and session validation checks into shared backend module used by both REST and MCP tool paths.
3. Confirm backward compatibility boundaries for web endpoint and tool surface assertions.
4. Define versioned contract naming in `specs/013-mcp-consent-mint-path/contracts/`.

**Exit criteria**:
- `research.md` contains final decisions with rationale and alternatives.
- No unresolved clarifications remain.

### Phase 1 - Design and contracts

1. Produce `data-model.md` for consent mint request, workflow session binding, and generation authorization entities.
2. Produce new versioned contracts for MCP mint tool and workflow sequencing.
3. Produce `quickstart.md` with implementation order, test execution, and rollout verification commands.
4. Run `.specify/scripts/bash/update-agent-context.sh cursor-agent`.
5. Re-check constitution and compatibility gates.

**Exit criteria**:
- `data-model.md`, `contracts/*`, and `quickstart.md` are internally consistent.
- Test matrix fully covers required headless/security/web regression scenarios.

### Phase 2 - Implementation sequencing (for `/speckit.tasks`)

1. Backend code changes (schema/module extraction + MCP tool + validation wiring).
2. Contract/spec updates with new versioned files only.
3. Integration/contract/regression tests.
4. Rollout verification and release notes updates.

## Project Structure

### Documentation (this feature)

```text
specs/013-mcp-consent-mint-path/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── engage-consent-mint-mcp.contract.v1.json
│   ├── engage-workflow-headless-sequence.contract.v1.json
│   └── consent-mint-parity.openapi.v1.yaml
└── tasks.md
```

### Source Code (repository root)

```text
server.ts
src/security/consent-token-service.ts
src/security/sensitive-tool-policy.ts
src/sosreport/sosreport-tool-schemas.ts
src/sosreport/sosreport-tool-handlers.ts
tests/integration/consent-test-helpers.ts
tests/integration/sosreport-generate.failures.test.ts
tests/integration/sosreport-generate.success.test.ts
tests/contract/sosreport-tools.contract.test.ts
tests/contract/engage-red-hat-support.contract.test.ts
tests/regression/mcp-tool-surface-preservation.test.ts
```

**Structure Decision**: Keep the existing single-project architecture and implement additive backend changes centered on `server.ts` plus focused schema/contract/test updates.

## File-by-File Change List

### `server.ts`

- Register new MCP tool `mint_engage_consent_token` with input schema that allows optional `workflow_session_id`.
- Reuse existing workflow/session lookup and Step 1 completion checks to deny mint attempts before product selection.
- Reuse consent mint service path currently used by `POST /api/engage/consent-tokens` to ensure token semantics are unchanged.
- Keep existing web endpoint handler (`POST /api/engage/consent-tokens`) behavior unchanged, including response fields and status codes.
- Ensure MCP mint tool response includes exactly: `consent_token`, `expires_at`, `workflow_session_id`.
- Keep `generate_sosreport` authorization path unchanged except optional alignment check when caller supplies `workflow_session_id`.

### `src/sosreport/sosreport-tool-schemas.ts`

- Add a new exported zod schema for `mint_engage_consent_token` input (optional `workflow_session_id`, strict non-empty validation).
- Add exported TypeScript type for the mint input.
- Keep `generateSosreportSchema` fields stable to avoid web/text compatibility regressions.

### `src/security/sensitive-tool-policy.ts`

- Preserve existing replay/wrong-user/wrong-session/wrong-scope/wrong-step enforcement unchanged.
- Add/confirm helper support for explicit safe deny text when workflow session binding mismatches.

### `src/security/consent-token-service.ts`

- No cryptographic model changes expected; confirm interfaces are sufficient for MCP mint reuse.
- If needed, add non-breaking helper(s) for shared mint response formatting (`expiresAt`, claims) used by both REST and MCP paths.

### `src/sosreport/sosreport-tool-handlers.ts`

- No functional behavior change expected; keep generation/fetch flow unchanged.
- Only adjust typing surface if new shared schema/type exports are consumed.

### `tests/integration/consent-test-helpers.ts`

- Add helper for invoking MCP `mint_engage_consent_token` and returning parsed structured content.
- Keep existing REST mint helper for web regression comparisons.

### `tests/integration/sosreport-generate.success.test.ts`

- Add headless happy-path sequence using tools only:
  `start_engage_red_hat_support` -> `select_engage_product` -> `mint_engage_consent_token` -> `generate_sosreport` -> `fetch_sosreport`.

### `tests/integration/sosreport-generate.failures.test.ts`

- Add/extend cases:
  - mint-before-step1 denied
  - invalid `workflow_session_id` denied in mint
  - replay/wrong-user/wrong-session/wrong-scope/wrong-step still denied for generate
  - generate denied when mint token omitted or invalid

### `tests/contract/sosreport-tools.contract.test.ts`

- Assert new tool name `mint_engage_consent_token` is present with expected schema properties.
- Assert output template and annotations remain consistent with existing tool metadata conventions.

### `tests/contract/engage-red-hat-support.contract.test.ts`

- Add assertions for new versioned contracts under `specs/013-mcp-consent-mint-path/contracts/`.
- Keep previous contract assertions unchanged to prevent retroactive contract drift.

### `tests/regression/mcp-tool-surface-preservation.test.ts`

- Update required tool set to include `mint_engage_consent_token`.
- Verify existing required tools/resources remain present and unchanged.

## Contract/Spec Version Bump Strategy

- Do not modify prior versioned contracts in older spec directories.
- Add only new files under `specs/013-mcp-consent-mint-path/contracts/`:
  - `engage-consent-mint-mcp.contract.v1.json` (tool request/response and validation semantics)
  - `engage-workflow-headless-sequence.contract.v1.json` (explicit text/headless sequence and preconditions)
  - `consent-mint-parity.openapi.v1.yaml` (REST parity and response field consistency reference)
- Versioning rule: first contract generation for feature `013` starts at `v1`; future changes in same feature increment `v2+` instead of overwriting.

## Test Matrix

| Test Area | Scenario | File(s) | Expected Result |
|-----------|----------|---------|-----------------|
| Integration | Headless happy path | `tests/integration/sosreport-generate.success.test.ts` | End-to-end sequence succeeds and returns fetchable archive |
| Integration | Mint before Step 1 denied | `tests/integration/sosreport-generate.failures.test.ts` | `mint_engage_consent_token` returns denied error with step guidance |
| Integration | Invalid `workflow_session_id` denied | `tests/integration/sosreport-generate.failures.test.ts` | Mint request rejected; no token issued |
| Integration | Replay denied | `tests/integration/sosreport-generate.failures.test.ts` | First use allowed, second use denied with replay code |
| Integration | Wrong user/session denied | `tests/integration/sosreport-generate.failures.test.ts` | Generate call denied with matching reason code |
| Integration | Wrong scope/step denied | `tests/integration/sosreport-generate.failures.test.ts` | Generate call denied with matching reason code |
| Contract | New tool surface | `tests/contract/sosreport-tools.contract.test.ts` | Tool appears with expected schema/metadata |
| Regression | Web endpoint unchanged | `tests/integration/consent-test-helpers.ts`, existing web flow tests | `POST /api/engage/consent-tokens` still passes existing checks |
| Regression | MCP surface stability | `tests/regression/mcp-tool-surface-preservation.test.ts` | Existing tools/resources preserved with additive new tool |

## Rollout and Verification Steps

1. Implement behind additive tool registration; do not gate or alter existing web endpoint route.
2. Run targeted tests first:
   - `tsx --test tests/integration/sosreport-generate.failures.test.ts`
   - `tsx --test tests/integration/sosreport-generate.success.test.ts`
3. Run full quality gates:
   - `npm run test:unit`
   - `npm run test:contract`
   - `npm run test:integration`
   - `npm run test:regression`
4. Manual verification:
   - Web UI flow still mints via `POST /api/engage/consent-tokens`.
   - Headless MCP flow works with explicit `mint_engage_consent_token`.
5. Release notes:
   - Document additive MCP tool and unchanged web behavior.
   - Document that consent remains explicit, short-lived, and single-use.

## Risk / Mitigation Notes

- **Risk**: Divergent validation logic between REST and MCP mint paths.  
  **Mitigation**: Extract and reuse shared schema/validation helpers.
- **Risk**: Accidental web regression while wiring new tool.  
  **Mitigation**: Keep endpoint handler untouched and enforce regression tests for web consent route.
- **Risk**: Security drift (implicit minting or weakened checks).  
  **Mitigation**: Preserve `authorizeSensitiveToolCall` path and add explicit negative tests for all mismatch classes.
- **Risk**: Contract drift across specs.  
  **Mitigation**: Add new versioned contracts only in `specs/013-.../contracts/` and keep old files immutable.

## Definition of Done

- New MCP tool `mint_engage_consent_token` exists and returns `consent_token`, `expires_at`, and `workflow_session_id`.
- Optional `workflow_session_id` is strictly validated when provided.
- Web route `POST /api/engage/consent-tokens` remains behaviorally unchanged.
- `generate_sosreport` still requires valid consent and preserves single-use/user/session/scope/step enforcement.
- New versioned contracts are added with exact planned filenames in `specs/013-mcp-consent-mint-path/contracts/`.
- Required integration/contract/regression scenarios pass, including all denial-path assertions.

## Complexity Tracking

No constitution violations to justify.
