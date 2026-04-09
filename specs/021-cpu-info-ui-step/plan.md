# Implementation Plan: Engage Troubleshooting Step Insertion

**Branch**: `021-cpu-info-ui-step` | **Date**: 2026-04-09 | **Spec**: `/wip/src/github.com/roddiekieley/gpt-app-poc/specs/021-cpu-info-ui-step/spec.md`  
**Input**: Feature specification from `/wip/src/github.com/roddiekieley/gpt-app-poc/specs/021-cpu-info-ui-step/spec.md`

## Summary

Insert a new troubleshooting step as workflow step 2 in the engage support UI, positioned between product selection and sos generation/fetch. The implementation updates workflow state and hash routing semantics, progress navigation labels/indices, and step content rendering to show an RHDS-consistent static CPU-information table with a Next action to the sos step, while preserving compatibility entry URI patterns, step resource registration conventions, and text fallback behavior. Contracts/spec mappings and skill sequencing are updated so troubleshooting appears before sos generation in both UI and headless guidance.

## Technical Context

**Language/Version**: TypeScript 5.x (ESM), React 19.x, Node.js runtime  
**Primary Dependencies**: `@modelcontextprotocol/sdk`, `@modelcontextprotocol/ext-apps`, `react`, `react-dom`, `zod`, `express`  
**Storage**: N/A (workflow state is in-memory/session-scoped)  
**Testing**: `tsx --test` suites (`test:unit`, `test:contract`, `test:integration`, `test:regression`)  
**Target Platform**: Linux-hosted MCP server + MCP Apps-compatible UI clients  
**Project Type**: Single MCP server project with embedded React UI bundle  
**Performance Goals**: Added step transition and rendering complete without perceptible delay (<1s interactive transition target)  
**Constraints**: Preserve compatibility entry URI, preserve existing resource registration pattern, keep non-UI text fallback complete, avoid retroactive edits to historical spec packages  
**Scale/Scope**: One workflow step insertion affecting UI navigation/state/routing, server UI step resource URI registration, skill instruction ordering, and related contract/test mappings

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Diagnostics execution model remains unchanged; no implicit diagnostic collection is added in the new UI step. **PASS**
- MCP Apps compliance preserved via `ui://` resources and existing JSON-RPC bridge model. **PASS**
- Text fallback obligations remain intact through unchanged tool-response fallback requirements and updated skill sequencing docs. **PASS**
- Data minimization is preserved because step 2 uses a static single-row CPU display with no new credential or secret pathways. **PASS**
- Non-retroactive spec integrity preserved by adding new mappings/contracts only under `specs/021-cpu-info-ui-step/`. **PASS**

## Project Structure

### Documentation (this feature)

```text
specs/021-cpu-info-ui-step/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── engage-workflow-troubleshooting.contract.v1.json
│   ├── engage-ui-resource-map.v3.json
│   ├── engage-skill-sequence.contract.v1.json
│   └── engage-troubleshooting-step.openapi.yaml
└── tasks.md
```

### Source Code (repository root)

```text
server.ts
skills/engage-red-hat-support/SKILL.md

src/
├── mcp-app.ts
└── mcp-app/
    ├── App.tsx
    ├── state.ts
    ├── step-content.tsx
    └── ui/
        ├── adapter-contract.ts
        └── progress-affordance-adapter.tsx

tests/
├── contract/
│   └── engage-red-hat-support.contract.test.ts
├── integration/
│   └── engage-red-hat-support.workflow.test.ts
└── regression/
    └── mcp-tool-surface-preservation.test.ts
```

**Structure Decision**: Keep the existing single-project MCP server + React widget structure and implement the new step by extending the current workflow state/routing/component pipeline in place, while introducing only new documentation contracts inside the active `specs/021-cpu-info-ui-step/` package.

## Implementation Strategy

1. Extend workflow step enum and step-index mapping to support four workflow stages with troubleshooting as step 2.
2. Update hash routing (`step-1`..`step-4`) and navigation gates so troubleshooting becomes mandatory before sos generation/fetch.
3. Add a dedicated troubleshooting step content component that renders an RHDS-consistent static table with one CPU row and a Next control to sos.
4. Update progress affordance adapter and adapter-contract navigation resolver to handle four-step navigation labels and callbacks.
5. Register a new troubleshooting UI resource URI in `server.ts` using the same `registerEngageUiResource` pattern as existing step URIs.
6. Update engage skill instructions to insert troubleshooting guidance before sos generation in the deterministic sequence.
7. Update/create contract and mapping artifacts in this feature package to reflect new step ordering and resource list.
8. Extend contract/integration/regression tests for hash routing, resources/list expectations, and sequence assertions.

## Phase 0: Research Plan

- Confirm current step-gating invariants in `src/mcp-app.ts` so insertion preserves existing failure handling and prevents step skipping.
- Confirm progress adapter and step-content decomposition boundaries to minimize churn while adding a fourth step.
- Confirm `server.ts` resource-registration conventions and compatibility metadata behavior for adding one more step URI.
- Confirm contract test patterns that validate skill ordering and workflow step sequence without modifying historical spec artifacts.

## Phase 1: Design & Contracts Plan

- Create `data-model.md` describing updated workflow step state, route/hash mapping, progress navigation model, troubleshooting table row model, and skill sequence model.
- Create contracts:
  - `engage-workflow-troubleshooting.contract.v1.json`
  - `engage-ui-resource-map.v3.json`
  - `engage-skill-sequence.contract.v1.json`
  - `engage-troubleshooting-step.openapi.yaml`
- Create `quickstart.md` with implementation sequence and verification commands for updated routing/UI/resources/contracts/skill docs.
- Run `.specify/scripts/bash/update-agent-context.sh cursor-agent` and capture output in this feature branch.

## Post-Design Constitution Re-Check

- New troubleshooting step does not auto-trigger diagnostics; explicit user action remains required for generate/fetch. **PASS**
- UI continues to use MCP Apps resource model and tool bridge without host-specific runtime APIs. **PASS**
- Text fallback remains represented in skill/contract guidance and tool contracts. **PASS**
- No credential scope expansion or secret-bearing parameters are introduced. **PASS**
- All new contracts and mappings are confined to `specs/021-cpu-info-ui-step/`. **PASS**

## Complexity Tracking

No constitution violations identified; complexity justification table is not required.
