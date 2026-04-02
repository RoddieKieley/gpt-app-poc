# Implementation Plan: RHDS Step 1 Hybrid Migration

**Branch**: `018-rhds-hybrid-migration` | **Date**: 2026-04-02 | **Spec**: `/wip/src/github.com/roddiekieley/gpt-app-poc/specs/018-rhds-hybrid-migration/spec.md`  
**Input**: Feature specification from `/wip/src/github.com/roddiekieley/gpt-app-poc/specs/018-rhds-hybrid-migration/spec.md`

## Summary

Deliver Step 1 of the migration as a hybrid PatternFly + RHDS implementation, moving the smallest-risk UI surfaces first behind wrapper/adapter boundaries so event contracts and workflow semantics remain unchanged. Execute substitutions in three gated milestones (B1/B2/B3), each with explicit go/no-go criteria for behavior parity, accessibility sanity, visual consistency, and rollback readiness.

## Technical Context

**Language/Version**: TypeScript + React (existing project baseline)  
**Primary Dependencies**: `@patternfly/react-core`, RHDS component library (incremental hybrid usage), existing app state/types in `src/mcp-app`  
**Storage**: N/A (UI migration only; no data model persistence change)  
**Testing**: Existing project test harness + targeted regression checks for substituted surfaces (manual and automated where available)  
**Target Platform**: Browser-hosted MCP app UI with existing build/serve path  
**Project Type**: Single project web application  
**Performance Goals**: No user-visible regression in interaction responsiveness for substituted components  
**Constraints**: Preserve contracts in `src/mcp-app.ts`; preserve callback signatures in `src/mcp-app/App.tsx` and `src/mcp-app/step-content.tsx`; preserve build/serve behavior; no workflow logic changes  
**Scale/Scope**: Step 1 only; selective low-risk substitutions and hybrid mapping/documentation updates

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Diagnostics execution behavior is unchanged; this plan does not introduce new diagnostic sources or permissions. **PASS**
- MCP Apps compliance remains unchanged; this plan is UI component substitution only. **PASS**
- Text fallback behavior remains unchanged because tool response and workflow contracts are untouched. **PASS**
- Redaction and least-scope handling remain unchanged because no diagnostics or secret flow behavior is modified. **PASS**
- Historical specification immutability is preserved: `specs/012-patternfly-ui-swap/contracts/engage-ui-component-map.v1.json` is reference-only and MUST NOT be modified in this feature. **PASS**

## Project Structure

### Documentation (this feature)

```text
specs/018-rhds-hybrid-migration/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── engage-ui-component-map.step1.v1.json
│   └── ui-adapter-event-contract.v1.json
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── mcp-app/
│   ├── App.tsx
│   ├── step-content.tsx
│   ├── state.ts
│   └── ui/
│       ├── status-display-adapter.tsx
│       ├── action-button-adapter.tsx
│       └── progress-affordance-adapter.tsx
└── mcp-app.ts

specs/
├── 012-patternfly-ui-swap/
│   └── contracts/
│       └── engage-ui-component-map.v1.json   # read-only reference
└── 018-rhds-hybrid-migration/
    └── contracts/
```

**Structure Decision**: Keep existing `src/mcp-app` structure and introduce wrapper/adapter files under `src/mcp-app/ui/` to isolate PF vs RHDS details from workflow consumers.

## Candidate Migration Sequence (Step 1 Only)

### B1 - Status Display Adapter (lowest risk)

- **Candidate**: Status display path currently rendered via inline alert in `src/mcp-app/App.tsx`.
- **Implementation slice**: Introduce `status-display-adapter.tsx` that accepts existing status message + variant contract and renders PF or RHDS implementation behind a stable props interface.
- **Risk level**: Low (display-only surface, no workflow decisions).
- **Rollback mechanism**: Adapter-level switch returns rendering to current PF status display without changing parent props or event handlers.
- **Go/No-Go gate (B1)**:
  - **Behavior parity**: status text and severity mapping are unchanged across success/warning/error/info paths.
  - **Accessibility sanity**: status remains announced/readable and visible with equivalent semantic emphasis.
  - **Visual consistency**: status placement, spacing, and inline behavior remain consistent with current workflow layout.
  - **Rollback readiness**: one-step revert documented and verified.

### B2 - Low-Coupling Action Buttons Adapter

- **Candidate**: Action buttons in step content areas where click handlers are already passed as callbacks.
- **Implementation slice**: Introduce `action-button-adapter.tsx` to render button variants while preserving IDs, disabled logic, and callback invocation order.
- **Risk level**: Medium-low (interactive surface, but callback contracts are already explicit).
- **Rollback mechanism**: Adapter selection switches back to PF buttons per button group while retaining same handlers.
- **Go/No-Go gate (B2)**:
  - **Behavior parity**: every button invokes the same callback and preserves enable/disable behavior.
  - **Accessibility sanity**: labels, focus order, keyboard activation, and disabled semantics remain valid.
  - **Visual consistency**: hierarchy of primary/secondary/link actions stays recognizable.
  - **Rollback readiness**: per-group rollback path validated.

### B3 - Optional Progress/Navigation Affordance Alignment

- **Candidate**: Wizard/progress affordance styling/alignment only, with no change to gating semantics.
- **Implementation slice**: Introduce `progress-affordance-adapter.tsx` and wire only presentation-level substitution where direct RHDS mapping is safe.
- **Risk level**: Medium (navigation visuals can imply semantic changes).
- **Rollback mechanism**: Revert adapter to PF navigation/progress presentation immediately if any mismatch is observed.
- **Go/No-Go gate (B3)**:
  - **Behavior parity**: step transitions and route/gate semantics remain unchanged.
  - **Accessibility sanity**: step indicators remain understandable and keyboard/screen-reader friendly.
  - **Visual consistency**: progression cues are coherent and do not suggest unsupported step activation.
  - **Rollback readiness**: full B3 revert path tested without affecting B1/B2 substitutions.

## Wrapper/Adapter Architecture

- Define stable adapter prop contracts that mirror current usage in `App.tsx` and `step-content.tsx`.
- Keep event signatures identical; adapters accept callbacks as-is and do not transform payloads.
- Separate rendering strategy from behavior logic:
  - Parent components own state and workflow decisions.
  - Adapters own only presentation component choice (PF vs RHDS).
- Maintain explicit fallback mode per adapter so rollback can be executed independently per substituted surface.

## File-Level Impact Map

- `src/mcp-app/App.tsx`
  - Replace direct status display rendering with `status-display-adapter`.
  - Optionally route wizard/progress presentation through `progress-affordance-adapter`.
  - Keep `onNavigateStep*` and other callback signatures unchanged.
- `src/mcp-app/step-content.tsx`
  - Replace direct button usage in low-coupling groups with `action-button-adapter`.
  - Preserve all existing input and callback props.
  - Keep step-level workflow logic and handler invocation order unchanged.
- `src/mcp-app/ui/status-display-adapter.tsx` (new)
  - Stable status props contract.
  - PF and RHDS render paths with explicit fallback selection.
- `src/mcp-app/ui/action-button-adapter.tsx` (new)
  - Stable button props contract for ID, label, disabled state, variant, and click callback.
  - PF and RHDS render paths with explicit fallback selection.
- `src/mcp-app/ui/progress-affordance-adapter.tsx` (new, optional in Step 1)
  - Stable navigation/progress props contract preserving current gating semantics.
  - Presentation-only substitution and independent fallback.
- `specs/012-patternfly-ui-swap/contracts/engage-ui-component-map.v1.json`
  - **No modification** in this feature (historical artifact, read-only reference).
  - New Step 1 mapping contract is created under current spec package.

## Validation Strategy Per Substitution

- **Behavior parity checks**
  - Verify unchanged callback invocation for all substituted controls.
  - Verify unchanged gating and step progression outcomes.
  - Verify unchanged status message semantics.
- **Accessibility sanity checks**
  - Keyboard navigation and activation for all substituted controls.
  - Focus visibility and logical tab order in each step.
  - Screen-reader meaningful labels and status communication.
- **Visual consistency checks**
  - Side-by-side baseline comparison for spacing, alignment, and action hierarchy.
  - Confirm no misleading affordance cues for unavailable workflow states.
- **Rollback verification**
  - Simulate rollback of each substituted surface independently.
  - Confirm rollback does not force other milestone reverts.

## Phase 0: Research Plan

- Resolve substitution ordering rationale and adapter boundary best practices for hybrid PF+RHDS component coexistence.
- Confirm approach for preserving callback contracts while enabling per-candidate rollback.
- Document decisions in `research.md` with alternatives considered.

## Phase 1: Design & Contracts Plan

- Produce `data-model.md` for substitution candidate, adapter contract, regression check set, and rollback plan entities.
- Produce contract artifacts under `contracts/` for:
  - Hybrid mapping state (`engage-ui-component-map.step1.v1.json`)
  - Adapter event contract (`ui-adapter-event-contract.v1.json`)
- Produce `quickstart.md` with milestone-by-milestone execution, validation, and rollback drills.
- Run `.specify/scripts/bash/update-agent-context.sh cursor-agent` after artifact creation.

## Post-Design Constitution Re-Check

- No new diagnostics permissions introduced. **PASS**
- MCP Apps and text fallback behavior unaffected by presentation-layer migration. **PASS**
- No secret-handling surface changes introduced. **PASS**
- Historical specs remain unmodified; all new contracts placed under `specs/018-rhds-hybrid-migration/`. **PASS**

## Complexity Tracking

No constitution violations identified; complexity justification table not required.
