# Implementation Plan: Get Skill Tool Fallback

**Branch**: `009-get-skill-tool` | **Date**: 2026-02-18 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `/specs/009-get-skill-tool/spec.md`

## Summary

Add a read-only MCP tool named `get_skill` so hosts that cannot execute `resources/read` can still retrieve skill markdown by URI. Implementation is intentionally minimal and centered in `server.ts`, reusing existing skill constants and markdown loader patterns, while preserving all existing Jira/sosreport tools and skill resource behavior. Validation expands contract, regression, and smoke checks for `tools/list`, `tools/call get_skill`, and resource parity.

## Technical Context

**Language/Version**: TypeScript (Node.js 18+)  
**Primary Dependencies**: `@modelcontextprotocol/sdk`, `@modelcontextprotocol/ext-apps`, `express`, `zod`, Node built-ins  
**Storage**: Existing filesystem-based skill markdown loading; no new persistence  
**Testing**: `tsx --test` for contract/regression suites plus `npm run test:mcp` smoke checks  
**Target Platform**: Linux-hosted MCP server runtime with mixed UI/non-UI client sessions  
**Project Type**: Single MCP server project with ext-apps registration helpers  
**Performance Goals**: Valid `get_skill` responses return markdown within existing MCP tool-call expectations (same order of magnitude as current `resources/read` path)  
**Constraints**: Read-only, side-effect free tool; strict URI validation; text fallback required; no secret leakage; no regressions to existing tools/resources/tests  
**Scale/Scope**: One new tool registration and handler path in `server.ts`, plus targeted test/smoke and optional contract artifact updates

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **1. Support-Workflow Fidelity**: Skill retrieval improves workflow continuity for support operators in hosts without resource read support. **Pass.**
- **2. Human-Authorized Diagnostics**: No new diagnostic execution path is introduced; tool is read-only markdown retrieval. **Pass.**
- **3. Privacy-First Diagnostics**: Output is documentation markdown only; no credential-bearing fields included. **Pass.**
- **4. Strict MCP Apps Compliance**: Tool uses existing MCP/ext-apps registration patterns and metadata conventions; no host-specific API branching. **Pass.**
- **5. Graceful Degradation**: Tool explicitly returns text fallback for non-UI hosts. **Pass.**
- **6. Portability and Interop**: `get_skill` enables interoperability where `resources/read` is unavailable. **Pass.**
- **7. Incremental Spec-Driven Delivery**: Scope is a small additive increment with spec, plan, model, contracts, and quickstart artifacts. **Pass.**
- **8. Secret Boundary for Tokens and Credentials**: Tool takes URI only and returns markdown; no PAT/token fields in args/results/errors/logs. **Pass.**

**Post-Design Re-check**: Pass. Phase 1 artifacts preserve existing surfaces, enforce read-only URI-scoped behavior, and include explicit secret-boundary and regression verification.

## Project Structure

### Documentation (this feature)

```text
specs/009-get-skill-tool/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── get-skill-contract.json
└── tasks.md
```

### Source Code (repository root)

```text
server.ts                                             # add get_skill registration/handler reusing skill loaders
skills/engage-red-hat-support/SKILL.md               # existing markdown source (no behavior change)

scripts/
└── mcp-smoke-tests.ts                               # add tools/list + tools/call get_skill + parity checks

tests/
├── contract/
│   └── engage-red-hat-support.contract.test.ts       # get_skill contract and parity assertions
└── regression/
    ├── mcp-tool-surface-preservation.test.ts         # ensure get_skill appears and existing tools persist
    └── skill-resource-preservation.test.ts           # resources/read preserved and parity with get_skill
```

**Structure Decision**: Keep the existing single-project MCP server architecture and implement additive, localized changes in server/tool registration and existing test suites. No new service, endpoint family, or orchestration layer is introduced.

## Phase Plan

### Phase 0 - Research and decisions

1. Confirm URI validation and supported-skill binding strategy using existing constants.
2. Confirm response contract structure for both plain text fallback and structured content.
3. Confirm error messaging standards for invalid/unsupported URIs with actionable remediation.
4. Confirm regression boundaries so existing tool/resource surfaces remain unchanged.

**Exit criteria**:
- `research.md` records decisions, rationales, and alternatives with no unresolved clarifications.
- Secret-boundary and backward-compatibility risks have explicit mitigations.

### Phase 1 - Design and contracts

1. Define request/response and validation entities in `data-model.md`.
2. Define `get_skill` input/output and error expectations in `contracts/get-skill-contract.json`.
3. Capture implementation and validation commands in `quickstart.md`.
4. Run `.specify/scripts/bash/update-agent-context.sh cursor-agent`.
5. Re-check constitution alignment after design artifacts are complete.

**Exit criteria**:
- `data-model.md`, `contracts/*`, and `quickstart.md` align with `spec.md` FR-001 to FR-015.
- Contract/regression/smoke coverage plan explicitly includes `tools/list`, `tools/call get_skill`, and `resources/read` parity.

## File-by-File Change Plan

### `server.ts`

- Register `get_skill` via `registerAppTool(server, "get_skill", ...)`.
- Use `z.object({ uri: z.string().min(1, "skill URI is required") })`.
- Set annotations to `readOnlyHint: true`, `openWorldHint: false`, `destructiveHint: false`.
- Reuse existing skill constants and loader pattern (`ENGAGE_SKILL_RESOURCE_URI`, `SKILL_RESOURCE_MIME_TYPE`, `loadEngageSkillMarkdown`).
- Validate URI scheme and supported identity; return:
  - text fallback in `content`,
  - structured payload with `{ uri, mimeType, text }` for valid calls,
  - `isError: true` plus actionable text for invalid/unsupported URIs.
- Preserve all existing tool/resource registrations unchanged.

### `tests/contract/engage-red-hat-support.contract.test.ts`

- Assert `tools/list` includes `get_skill` with read-only metadata.
- Add `tools/call get_skill` success case for `skill://engage-red-hat-support/SKILL.md`.
- Assert returned markdown parity with `resources/read` for same URI.

### `tests/regression/mcp-tool-surface-preservation.test.ts`

- Add `get_skill` to required tool list while preserving existing tool expectations.

### `tests/regression/skill-resource-preservation.test.ts`

- Keep `resources/list` and `resources/read` assertions unchanged.
- Add regression assertion that `get_skill` returns equivalent markdown for engage skill URI.

### `scripts/mcp-smoke-tests.ts`

- Add smoke check for `tools/list` metadata of `get_skill`.
- Add smoke check for `tools/call get_skill` success and text fallback.
- Add parity check against `resources/read` content for engage skill URI.

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| `get_skill` breaks existing tool/resource surface | High | Additive registration only; preserve existing handlers; strengthen contract/regression checks |
| Invalid URI handling leaks internals or secrets | High | Strict validation with sanitized, user-actionable messages; no token-bearing fields accepted or returned |
| Divergence between `resources/read` and `get_skill` output | Medium | Reuse existing markdown loader/constants and add parity assertions in contract + smoke tests |
| Non-UI hosts cannot use structured content | Medium | Always include text fallback in `content` for every response path |

## Acceptance Criteria for Plan Execution

- Plan keeps changes minimal and centered in `server.ts` with no behavioral regressions.
- `get_skill` is read-only, validates required URI input, and supports engage skill URI.
- Valid responses include plain text fallback and structured `{ uri, mimeType, text }` data.
- Invalid/unsupported URIs fail safely with actionable remediation text.
- Validation scope covers contract, regression, and smoke parity against `resources/read`.

## Non-Goals (Explicitly Deferred)

- Introducing new orchestration tools or workflow sequencing changes.
- Expanding skill registry beyond currently registered repository skill URIs.
- Changing Jira/sosreport tool contracts, auth flows, or resource behavior.
- Broader refactors outside targeted tool registration and tests.

## Complexity Tracking

No constitution violations to justify.
