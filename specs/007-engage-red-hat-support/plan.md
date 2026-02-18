# Implementation Plan: Engage Red Hat Support (Option A)

**Branch**: `007-engage-red-hat-support` | **Date**: 2026-02-18 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `/specs/007-engage-red-hat-support/spec.md`

## Summary

Implement an "Engage Red Hat Support" feature that orchestrates existing tools (no new MCP orchestration tool) through a dedicated UI resource and skill resource. The flow is Linux-only and enforces this sequence: secure Jira PAT intake to obtain/verify `connection_id`, then `generate_sosreport`, `fetch_sosreport`, and `jira_attach_artifact` with issue key plus `connection_id`. The design preserves existing tools/resources behavior, keeps OpenAI widget metadata plus MCP Apps `ui://` patterns, and guarantees text fallback for non-UI hosts.

## Technical Context

**Language/Version**: TypeScript (Node.js 18+)  
**Primary Dependencies**: `@modelcontextprotocol/sdk`, `@modelcontextprotocol/ext-apps`, `express`, `zod`, `vite`, Node built-ins  
**Storage**: Existing local filesystem artifact flow (`/tmp`) and existing encrypted token vault/lifecycle store; no new persistence layer  
**Testing**: `tsx --test` suites across `tests/unit`, `tests/contract`, `tests/integration`, `tests/regression` plus MCP smoke checks  
**Target Platform**: Linux host for local sosreport generation and MCP server runtime  
**Project Type**: Single Node MCP server with bundled widget UI (`server.ts`, `mcp-app.html`, `src/`)  
**Performance Goals**: End-to-end valid flow completion in operator workflow under 8 minutes (matches spec SC-003 target)  
**Constraints**: Option A orchestration only; Linux-only product gate; strict PAT secret boundary; preserve current tool/resource contracts and tests; maintain MCP Apps + OpenAI widget metadata compatibility  
**Scale/Scope**: One new skill resource, one new UI route/experience, orchestration updates, regression/contract test expansion, docs updates

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **1. Support-Workflow Fidelity**: Sequence models support workflow from diagnostics to Jira attachment. **Pass.**
- **2. Human-Authorized Diagnostics**: Execution remains explicit via user-driven tools/UI; no implicit diagnostics. **Pass.**
- **3. Privacy-First Diagnostics**: Existing redaction and least-scope boundaries retained; no secret echo in outputs. **Pass.**
- **4. Strict MCP Apps Compliance**: Keep `ui://` resources and JSON-RPC App bridge; retain only required OpenAI widget metadata. **Pass.**
- **5. Graceful Degradation**: All tool responses retain text fallback; non-UI hosts get complete textual workflow guidance. **Pass.**
- **6. Portability and Interop**: Server logic remains host-agnostic, no host-specific runtime branching. **Pass.**
- **7. Incremental Spec-Driven Delivery**: This plan and generated artifacts continue spec-driven lifecycle. **Pass.**
- **8. Secret Boundary for Tokens and Credentials**: PAT remains backend-only intake; only opaque `connection_id` in MCP interfaces. **Pass.**

**Post-Design Re-check**: Pass. Phase 1 artifacts define contracts and tests that maintain PAT isolation, preserve MCP Apps metadata and text fallback requirements, and avoid introducing a new orchestration tool.

## Project Structure

### Documentation (this feature)

```text
specs/007-engage-red-hat-support/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── engage-workflow-contract.json
│   ├── engage-ui-resource.json
│   └── engage-skill-resource.json
└── tasks.md
```

### Source Code (repository root)

```text
server.ts                                      # register ui://engage-red-hat-support + skill://engage-red-hat-support
mcp-app.html                                   # add Engage Red Hat Support UI view/controls
src/mcp-app.ts                                 # Option A orchestration logic and Linux-only gating
skills/
├── hello-world/SKILL.md
└── engage-red-hat-support/SKILL.md            # new skill resource

src/
├── jira/                                      # existing jira handlers/schemas; preserve behavior
├── security/                                  # existing PAT boundary controls; preserve behavior
└── sosreport/                                 # existing generate/fetch flow; reused as-is

tests/
├── contract/
│   └── engage-red-hat-support.contract.test.ts      # new contract and metadata assertions
├── integration/
│   └── engage-red-hat-support.workflow.test.ts      # new end-to-end sequence coverage
└── regression/
    ├── mcp-tool-surface-preservation.test.ts        # update allowed tool/resource surface assertions
    ├── skill-resource-preservation.test.ts          # include new skill URI
    └── no-pat-leakage-mcp.test.ts                  # extend for new workflow assertions

docs/
└── operator-guide.md                         # add Engage Red Hat Support operation notes
```

**Structure Decision**: Keep the current single-project architecture and add targeted changes to existing MCP server/widget entry points (`server.ts`, `mcp-app.html`, `src/mcp-app.ts`) plus a new skill markdown file. No new service or orchestration layer is introduced.

## Phase Plan

### Phase 0 - Research and decisions

1. Confirm hybrid standards profile for ext-apps SDK + required OpenAI widget metadata + MCP Apps `ui://` semantics.
2. Confirm PAT secret boundary controls and risk points across endpoint, tool surfaces, and logs.
3. Confirm workflow ordering and failure-stop behavior for Option A orchestration.
4. Confirm backward compatibility assertions for existing Jira/sosreport/skill surfaces.
5. Consolidate risk and mitigation mapping.

**Exit criteria**:
- `research.md` resolves all decision points with no unresolved clarifications.
- Explicit security and compatibility guardrails are documented.

### Phase 1 - Design and contracts

1. Model session, connection reference, issue target, artifact reference, and step state in `data-model.md`.
2. Define workflow, UI resource, and skill resource contracts under `contracts/`.
3. Produce implementation and validation procedure in `quickstart.md`.
4. Run `.specify/scripts/bash/update-agent-context.sh cursor-agent`.
5. Re-check constitution alignment after design.

**Exit criteria**:
- `data-model.md`, `contracts/*`, and `quickstart.md` are complete and aligned with spec requirements.
- Risks include explicit mitigation and validation coverage mapping.

## File-by-File Change Plan

### `server.ts`

- Register `ui://engage-red-hat-support/app.html` resource while preserving existing widget metadata keys.
- Register new skill resource `skill://engage-red-hat-support/SKILL.md`.
- Keep existing `jira_*`, `generate_sosreport`, and `fetch_sosreport` tool contracts unchanged.
- Ensure tool responses remain text-fallback friendly for non-UI hosts.

### `mcp-app.html`

- Add a dedicated Engage Red Hat Support UI path and controls for:
  - Linux-only product selection/confirmation
  - Jira URL + PAT intake
  - issue key input
  - progress and status display for generate -> fetch -> attach steps

### `src/mcp-app.ts`

- Implement Option A orchestration sequence in UI logic only:
  - secure PAT intake endpoint call
  - connection verification
  - `generate_sosreport`
  - `fetch_sosreport`
  - `jira_attach_artifact`
- Enforce Linux-only gate before flow continuation.
- Enforce hard stop on failed steps with actionable retry guidance.
- Guarantee PAT is never included in MCP tool calls and clear PAT field immediately after intake.

### `skills/engage-red-hat-support/SKILL.md` (new)

- Document intended workflow, Linux-only scope, required inputs, and text fallback instructions for non-UI hosts.
- Emphasize secret boundary: PAT via secure endpoint only; MCP calls use `connection_id`.

### Tests

- Add contract tests for:
  - presence of new `ui://` and `skill://` resources
  - preserved metadata fields (`openai/outputTemplate`, widget metadata, `widgetAccessible`)
  - forbidden PAT/token fields in tool surfaces
- Add integration test for happy-path sequence and step failure-stop behavior.
- Extend regression tests to preserve existing tool/resource behavior and ensure PAT non-leakage guarantees remain intact.

### Docs

- Update `docs/operator-guide.md` with Engage flow prerequisites and runtime usage.
- Optionally update README references if workflow discovery documentation needs cross-links.

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| PAT leaks into MCP payloads/results/logs | Critical | Preserve backend-only PAT intake, assert forbidden fields in contracts/tests, reuse redaction utilities for error/log surfaces |
| Existing tool/resource behavior regresses | High | Add regression assertions for tool names/metadata and existing skills/resources |
| Shared UI bundle changes break existing flows | Medium | Keep URI-based flow routing explicit and add integration tests for both old and new paths |
| Connection expires/revokes mid-flow | Medium | Stop flow at verification/operation boundaries and show reconnect guidance |
| Non-UI hosts miss workflow parity | Medium | Ensure text fallback narrative includes full input/step sequence and error guidance |
| Linux-only scope accidentally broadens | Medium | Add explicit product gate in UI + tests validating non-Linux rejection |

## Acceptance Criteria for Plan Execution

- Plan artifacts specify Option A UI/skill orchestration with no new MCP orchestration tool.
- Contracts and model enforce PAT boundary (`pat` backend-only, `connection_id` downstream only).
- Design keeps existing tool/resource behavior backward compatible.
- Validation strategy includes UI and non-UI workflow parity checks.
- Risk/mitigation and constitution checks are explicit and verifiable.

## Non-Goals (Explicitly Deferred)

- Introducing a new MCP orchestration tool for this feature.
- Supporting non-Linux products in the Engage flow.
- Changing existing Jira/sosreport tool request/response shapes beyond required compatibility checks.
- Broad architectural refactors outside files listed in scope.

## Complexity Tracking

No constitution violations to justify.
