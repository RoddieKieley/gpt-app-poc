# Implementation Plan: Engage Support Workflow Multi-Resource Refactor

**Branch**: `010-engage-support-workflow` | **Date**: 2026-02-26 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `/specs/010-engage-support-workflow/spec.md`

## Summary

Refactor the current single-page Engage support UI into a three-step conversational workflow with step-specific UI resources while preserving `ui://engage-red-hat-support/app.html` as the compatibility entry point, keeping MCP tool names/schemas unchanged, preserving text fallback behavior, and enforcing PAT secrecy (PAT accepted only at secure HTTP intake and never exposed in MCP args/results/prompts/log-safe text).

## Technical Context

**Language/Version**: TypeScript (Node.js 18+)  
**Primary Dependencies**: `@modelcontextprotocol/sdk`, `@modelcontextprotocol/ext-apps`, `express`, `zod`, `vite`  
**Storage**: Existing token vault and lifecycle store for opaque `connection_id`; filesystem-based sos artifacts  
**Testing**: `tsx --test` suites (`tests/contract`, `tests/integration`, `tests/regression`, `tests/unit`)  
**Target Platform**: Linux runtime for sosreport generation and MCP server  
**Project Type**: Single-project MCP server + app UI bundle  
**Performance Goals**: Preserve existing end-to-end flow completion envelope (operator completes valid run within 10 minutes)  
**Constraints**: Maintain existing tool/resource contracts outside this workflow; no PAT in MCP-visible surfaces; keep non-UI text parity  
**Scale/Scope**: UI resource decomposition, state orchestration updates, contract updates, skill/docs updates, test expansion

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **1. Support-Workflow Fidelity**: Three-step workflow preserves diagnostic-first support lifecycle. **Pass.**
- **2. Human-Authorized Diagnostics**: sosreport and Jira operations remain explicitly user-triggered. **Pass.**
- **3. Privacy-First Diagnostics**: PAT remains backend-only intake; redaction boundaries remain intact. **Pass.**
- **4. Strict MCP Apps Compliance**: Use `ui://` resources + MCP Apps bridge only; no host-specific runtime branching. **Pass.**
- **5. Graceful Degradation**: Text fallback remains complete for non-UI hosts. **Pass.**
- **6. Portability and Interop**: Workflow remains host-agnostic and MCP-contract driven. **Pass.**
- **7. Incremental Spec-Driven Delivery**: Plan/research/model/contracts/quickstart generated under feature spec folder. **Pass.**
- **8. Secret Boundary for Tokens and Credentials**: Explicit PAT-boundary validation included in contracts and regression tests. **Pass.**

**Post-Design Re-check**: Pass. Phase 1 artifacts include explicit resource URI strategy, state-handoff model, and PAT non-leak assertions across contracts and tests.

## Project Structure

### Documentation (this feature)

```text
specs/010-engage-support-workflow/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── engage-workflow-contract.v2.json
│   ├── engage-ui-resource-map.v2.json
│   └── pat-secrecy-validation.v2.json
└── tasks.md
```

### Source Code (repository root)

```text
server.ts
src/mcp-app.ts
mcp-app.html
skills/engage-red-hat-support/SKILL.md
specs/007-engage-red-hat-support/contracts/engage-workflow-contract.json
README.md
docs/operator-guide.md
tests/contract/engage-red-hat-support.contract.test.ts
tests/integration/engage-red-hat-support.workflow.test.ts
tests/regression/mcp-tool-surface-preservation.test.ts
tests/regression/no-pat-leakage-mcp.test.ts
tests/regression/skill-resource-preservation.test.ts
tests/regression/jira-surface-preservation.test.ts
```

**Structure Decision**: Keep the existing single-project architecture and implement this as an in-place refactor of resource registration and UI flow logic. No new MCP orchestration tool or service boundary is introduced.

## Phase Plan

### Phase 0 - Research and decisions

1. Confirm resource URI decomposition strategy for step pages while retaining `ui://engage-red-hat-support/app.html`.
2. Define shared state handoff model between step pages (product selection -> sos references -> Jira connection/issue context).
3. Validate PAT secrecy boundary controls across UI, HTTP intake, MCP tool calls, and log-safe error text.
4. Define compatibility contract updates required in `specs/007-engage-red-hat-support/contracts/engage-workflow-contract.json`.
5. Confirm regression boundaries so existing tools/resources outside this workflow remain stable.

**Exit criteria**:
- `research.md` documents final decisions and alternatives.
- No unresolved clarification markers remain.

### Phase 1 - Design and contracts

1. Produce `data-model.md` with step-state entities, transitions, and validation.
2. Produce v2 planning contracts under `specs/010-engage-support-workflow/contracts/`.
3. Define implementation + test execution in `quickstart.md`.
4. Run `.specify/scripts/bash/update-agent-context.sh cursor-agent`.
5. Re-check constitution alignment after design artifacts are complete.

**Exit criteria**:
- `data-model.md`, `quickstart.md`, and contracts exist and are internally consistent.
- PAT secrecy validations are explicit and test-mapped.

## File-by-File Change Plan

### `server.ts`

- Keep existing MCP tool names and schemas unchanged.
- Continue serving compatibility URI `ui://engage-red-hat-support/app.html`.
- Register additional step-specific UI resources (step 1/2/3) under the same namespace.
- Ensure all resources keep required metadata (`openai/outputTemplate`, widget metadata, text fallback behavior).

### `src/mcp-app.ts`

- Refactor monolithic workflow handlers into step-oriented controller functions.
- Add shared workflow state container keyed by session/context for handoff across steps.
- Enforce step order: product selection -> sos generate/fetch -> Jira verify/access/attach.
- Keep PAT usage limited to secure HTTP intake code path; clear PAT input immediately after intake.
- Preserve behavior of individual existing tools when used outside workflow orchestration.

### `mcp-app.html`

- Keep compatibility entry point and load a router shell.
- Introduce step-specific UI sections/pages for:
  - Step 1: Product selection (Linux-only gate)
  - Step 2: Generate/fetch sos report
  - Step 3: Connect Jira via intake, verify issue access, attach artifact
- Preserve text guidance and explicit non-UI fallback messaging.

### `skills/engage-red-hat-support/SKILL.md`

- Update skill guidance to reflect new three-step conversational flow.
- Document step transitions, required inputs per step, and retry semantics.
- Reiterate PAT boundary (secure intake only; no PAT in MCP-visible channels).

### `specs/007-engage-red-hat-support/contracts/engage-workflow-contract.json`

- Update canonical workflow sequence from 4-step Option A ordering to 3-step conversational model while preserving existing tool schema constraints.
- Add explicit compatibility clause for `ui://engage-red-hat-support/app.html` as entry URI.
- Add explicit state-handoff and PAT secrecy validation fields that tests can assert.

### `README.md` and `docs/operator-guide.md`

- Update workflow documentation to describe multi-resource three-step navigation.
- Add compatibility note that `app.html` remains stable entry point.
- Add operational troubleshooting for step handoff and issue-access verification failures.

### Contract, Integration, and Regression Tests

- **Contract**: Update `tests/contract/engage-red-hat-support.contract.test.ts` to assert step-specific resources and new sequence contract expectations.
- **Integration**: Update `tests/integration/engage-red-hat-support.workflow.test.ts` for shared-state handoff across step boundaries and issue-access gating before attach.
- **Regression**:
  - `tests/regression/mcp-tool-surface-preservation.test.ts`: assert unchanged tool/resource surface outside new step resources.
  - `tests/regression/no-pat-leakage-mcp.test.ts`: add assertions for step payload/result/status text secrecy.
  - `tests/regression/skill-resource-preservation.test.ts`: ensure skill URI behavior remains stable.
  - `tests/regression/jira-surface-preservation.test.ts`: ensure Jira integration contracts are unchanged except workflow wiring.

## Resource URI Strategy

- Preserve stable entry URI: `ui://engage-red-hat-support/app.html`.
- Add step resources:
  - `ui://engage-red-hat-support/steps/select-product.html`
  - `ui://engage-red-hat-support/steps/sos-report.html`
  - `ui://engage-red-hat-support/steps/jira-attach.html`
- Entry resource acts as compatibility router that can deep-link to step resources without requiring callers to change URIs.
- All step resources share metadata and fallback guarantees with the entry resource.

## Shared State Handoff Strategy

- Use a workflow session object with these required handoff fields:
  - `selected_product`
  - `fetch_reference`
  - `artifact_ref`
  - `connection_id`
  - `issue_key`
  - `issue_access_verified`
- Step transitions must fail closed:
  - Step 2 requires `selected_product=linux`.
  - Step 3 requires `artifact_ref` and active `connection_id`.
  - Attach requires `issue_access_verified=true`.

## PAT Secrecy Validation Strategy

- Assert PAT never appears in:
  - MCP tool input/output schemas,
  - MCP tool call arguments/results,
  - UI status text and error text,
  - log-safe text and security event payloads.
- Keep PAT accepted only by `POST /api/jira/connections`.
- Validate with contract checks + integration negative tests + regression grep-style assertions over emitted payloads/log-safe messages.

## Complexity Tracking

No constitution violations to justify.
