# Implementation Plan: Development Endpoint Switch

**Branch**: `008-switch-app-endpoint` | **Date**: 2026-02-18 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `/specs/008-switch-app-endpoint/spec.md`

## Summary

Switch the active development endpoint from `https://gptapppoc.kieley.io` to `https://leisured-carina-unpromotable.ngrok-free.dev` using minimal-risk string replacements in `server.ts`, `scripts/mcp-smoke-tests.ts`, `tests/contract/engage-red-hat-support.contract.test.ts`, and `README.md`. Preserve existing tool/resource behavior, keep non-UI text fallback behavior unchanged, run `test:contract` and `test:mcp`, and verify no non-spec references to the legacy endpoint remain.

## Technical Context

**Language/Version**: TypeScript on Node.js (current repo baseline)  
**Primary Dependencies**: `@modelcontextprotocol/sdk`, `@modelcontextprotocol/ext-apps`, `express`, `tsx`, `vite`  
**Storage**: N/A for this change (no data model persistence changes)  
**Testing**: `npm run test:contract` and `npm run test:mcp`  
**Target Platform**: Linux development runtime and local MCP smoke test environment  
**Project Type**: Single-project MCP server + bundled UI resource  
**Performance Goals**: No measurable runtime regression from baseline; endpoint metadata updates must not add execution steps  
**Constraints**: In-scope file edits only; do not modify historical `specs/**`; keep MCP Apps metadata/text fallbacks behaviorally compatible  
**Scale/Scope**: Four direct file updates plus design artifacts under `specs/008-switch-app-endpoint/`

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **1. Support-Workflow Fidelity**: Endpoint metadata remains aligned with support workflow entry points. **Pass.**
- **2. Human-Authorized Diagnostics**: No new diagnostics behavior added or automated. **Pass.**
- **3. Privacy-First Diagnostics**: Change is URL metadata only; no new sensitive data handling introduced. **Pass.**
- **4. Strict MCP Apps Compliance**: `ui://` resources and JSON-RPC bridge behavior remain unchanged; only endpoint host changes in allowed widget metadata fields. **Pass.**
- **5. Graceful Degradation**: Text fallback behavior remains unchanged and validated by smoke/contract checks. **Pass.**
- **6. Portability and Interop**: No host-specific branching introduced. **Pass.**
- **7. Incremental Spec-Driven Delivery**: Plan and artifacts are produced before implementation tasks. **Pass.**
- **8. Secret Boundary for Tokens and Credentials**: No secret handling surface change; PAT boundary remains unchanged. **Pass.**

**Post-Design Re-check**: Pass. Phase 1 artifacts keep the change as a constrained endpoint substitution with explicit regression checks for metadata, tests, and fallback behavior.

## Project Structure

### Documentation (this feature)

```text
specs/008-switch-app-endpoint/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── endpoint-migration-contract.yaml
└── tasks.md
```

### Source Code (repository root)

```text
server.ts                                              # runtime endpoint metadata references
scripts/mcp-smoke-tests.ts                             # smoke assertions for widget endpoint metadata
tests/contract/engage-red-hat-support.contract.test.ts # contract assertions for widget endpoint metadata
README.md                                              # top-level endpoint guidance

specs/                                                 # historical artifacts; out of scope for edits
```

**Structure Decision**: Keep the existing single-project structure and perform narrow file edits in the four explicitly scoped files. No new modules, routes, tools, or resource contracts are introduced.

## Phase Plan

### Phase 0 - Research and decisions

1. Confirm lowest-risk replacement strategy for endpoint literals in scoped files.
2. Confirm validation order and failure diagnostics for `test:contract` and `test:mcp`.
3. Confirm repository-wide verification pattern that excludes `specs/**` from legacy-endpoint checks.
4. Document explicit risks and mitigation.

**Exit criteria**:
- `research.md` records decisions, rationale, and alternatives.
- No unresolved clarifications remain.

### Phase 1 - Design and contracts

1. Define artifact/entity relationships and validation rules in `data-model.md`.
2. Define endpoint migration acceptance contract in `contracts/endpoint-migration-contract.yaml`.
3. Create `quickstart.md` with implementation/validation steps and evidence capture.
4. Run `.specify/scripts/bash/update-agent-context.sh cursor-agent`.
5. Re-check constitution alignment post-design.

**Exit criteria**:
- `data-model.md`, `contracts/*`, and `quickstart.md` align to spec FR-001..FR-008 and SC-001..SC-004.
- Risk mitigation and verification steps are explicit and reproducible.

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Incomplete replacement leaves legacy endpoint in runtime/test paths | High | Restrict edits to explicit file list and run targeted legacy-reference scan excluding `specs/**` |
| Contract/smoke tests diverge from runtime metadata | High | Update runtime + contract + smoke assertions together; run `test:contract` then `test:mcp` |
| Historical specs accidentally changed during search/replace | Medium | Avoid global replace; verify changed files list does not include pre-existing `specs/**` history |
| ngrok development endpoint rotates over time | Medium | Document endpoint in README as current development default and keep replacement process repeatable |
| Hidden fallback behavior regression | Medium | Validate text fallback checks in existing smoke/contract suites remain green |

## Acceptance Criteria for Plan Execution

- Plan defines minimal-risk endpoint substitution limited to scoped files.
- Design artifacts include explicit constitution checks and risk mitigation.
- Validation flow includes both `test:contract` and `test:mcp`.
- Verification step proves no non-spec references to legacy endpoint remain.

## Complexity Tracking

No constitution violations to justify.
