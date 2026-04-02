# Tasks: RHDS Step 1 Hybrid Migration

**Input**: Design documents from `/wip/src/github.com/roddiekieley/gpt-app-poc/specs/018-rhds-hybrid-migration/`  
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: Targeted regression checks are required by the feature spec and are included in each batch.

**Organization**: Tasks are grouped by user story and executed in strict batch order: B1 (status) -> B2 (buttons) -> B3 (navigation/progress).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Maps to user story (`US1`, `US2`, `US3`)
- Each task line includes: task id, purpose, files, implementation notes, regression checks, rollback note

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish Step 1 hybrid scaffolding and baseline evidence before component substitutions.

- [x] T001 Create Step 1 task and evidence folders in `specs/018-rhds-hybrid-migration/` and `tests/mcp-app/regression/` (Purpose: organize execution artifacts; Files: `specs/018-rhds-hybrid-migration/tasks.md`, `tests/mcp-app/regression/README.md`; Implementation notes: add folder conventions for B1/B2/B3 evidence; Regression checks: verify paths exist and are referenced by later tasks; Rollback note: remove added scaffolding files if Step 1 is paused before implementation)
- [x] T002 Capture baseline workflow evidence for parity in `tests/mcp-app/regression/baseline-workflow.md` (Purpose: baseline for all parity checks; Files: `tests/mcp-app/regression/baseline-workflow.md`; Implementation notes: record callback flow, status semantics, and step gating observations before any substitution; Regression checks: baseline includes step 1->3 path and status variants; Rollback note: baseline is retained even if implementation is rolled back)
- [x] T003 [P] Document Step 1 execution policy in `specs/018-rhds-hybrid-migration/quickstart.md` (Purpose: lock one-family-per-batch rule; Files: `specs/018-rhds-hybrid-migration/quickstart.md`; Implementation notes: add explicit note that B2 cannot start until B1 checkpoint passes and same for B3; Regression checks: quickstart reflects go/no-go gating language; Rollback note: revert quickstart additions if policy text conflicts with approved process)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Define shared adapter contract and mapping artifacts that every batch depends on.

**⚠️ CRITICAL**: No component family substitution can begin until this phase is complete.

- [x] T004 Define adapter fallback conventions in `specs/018-rhds-hybrid-migration/contracts/ui-adapter-event-contract.v1.json` (Purpose: standardize rollback hooks; Files: `specs/018-rhds-hybrid-migration/contracts/ui-adapter-event-contract.v1.json`; Implementation notes: ensure each adapter has explicit PF fallback mode and invariant statements; Regression checks: contract has entries for status/button/navigation adapters; Rollback note: revert to prior contract file if conventions break compatibility)
- [x] T005 [P] Initialize Step 1 hybrid mapping state in `specs/018-rhds-hybrid-migration/contracts/engage-ui-component-map.step1.v1.json` (Purpose: track ownership per batch; Files: `specs/018-rhds-hybrid-migration/contracts/engage-ui-component-map.step1.v1.json`; Implementation notes: mark B1/B2/B3 planned and reference immutable `specs/012-patternfly-ui-swap/contracts/engage-ui-component-map.v1.json`; Regression checks: schema fields cover risk level and rollback; Rollback note: keep mapping in planned state if implementation is halted)
- [x] T006 Create shared adapter mode utility in `src/mcp-app/ui/adapter-mode.ts` (Purpose: centralize PF vs RHDS selection and fallback; Files: `src/mcp-app/ui/adapter-mode.ts`; Implementation notes: expose deterministic mode resolution with safe default to PatternFly; Regression checks: utility defaults to PF mode when unknown; Rollback note: force utility to PF-only mode to disable hybrid rendering quickly)

**Checkpoint**: Foundational artifacts complete and reviewed; B1 status batch may begin.

---

## Phase 3: User Story 1 - Preserve workflow behavior with low-risk RHDS substitution (Priority: P1) 🎯 MVP (B1 Status Family)

**Goal**: Substitute status display path through adapter while preserving behavior and contracts.

**Independent Test**: Status messages and severity semantics remain unchanged in end-to-end workflows after B1.

### Implementation for User Story 1 (B1 only: Status)

- [x] T007 [US1] Implement status adapter in `src/mcp-app/ui/status-display-adapter.tsx` (Purpose: isolate status rendering implementation choice; Files: `src/mcp-app/ui/status-display-adapter.tsx`; Implementation notes: accept existing status message and status variant props and render PF/RHDS paths behind stable interface; Regression checks: adapter emits same message content and severity semantics; Rollback note: adapter supports immediate PF fallback mode)
- [x] T008 [US1] Wire status adapter into `src/mcp-app/App.tsx` (Purpose: replace direct inline status component usage with adapter; Files: `src/mcp-app/App.tsx`; Implementation notes: keep `statusToVariant` and all callback signatures unchanged; Regression checks: no changes to navigation or step callbacks; Rollback note: revert import/wiring to previous inline PF status rendering if gate fails)
- [x] T009 [P] [US1] Add B1 behavior parity check in `tests/mcp-app/regression/b1-status-parity.test.ts` (Purpose: prove unchanged status semantics; Files: `tests/mcp-app/regression/b1-status-parity.test.ts`; Implementation notes: validate info/success/warning/danger mapping and displayed message stability; Regression checks: compare against `baseline-workflow.md` expectations; Rollback note: keep test to verify PF fallback behavior after rollback)
- [x] T010 [P] [US1] Add B1 accessibility sanity check in `tests/mcp-app/regression/b1-status-a11y.md` (Purpose: verify status readability and semantic announcement; Files: `tests/mcp-app/regression/b1-status-a11y.md`; Implementation notes: capture keyboard/screen-reader sanity checklist and outcomes; Regression checks: status remains perceivable and semantically meaningful; Rollback note: re-run checklist after PF fallback to confirm recovery)
- [x] T011 [P] [US1] Add B1 visual consistency check in `tests/mcp-app/regression/b1-status-visual.md` (Purpose: verify layout and emphasis consistency; Files: `tests/mcp-app/regression/b1-status-visual.md`; Implementation notes: capture baseline vs hybrid screenshots/notes for status placement and spacing; Regression checks: no visual drift impacting workflow clarity; Rollback note: attach post-rollback visual comparison)
- [x] T012 [US1] Execute B1 rollback drill in `tests/mcp-app/regression/b1-status-rollback.md` (Purpose: validate one-step fallback for status path; Files: `tests/mcp-app/regression/b1-status-rollback.md`, `src/mcp-app/ui/adapter-mode.ts`; Implementation notes: force PF mode and verify parity restoration; Regression checks: behavior and visuals match baseline after rollback; Rollback note: this drill itself documents exact rollback command/steps)
- [x] T013 [US1] Update B1 mapping state in `specs/018-rhds-hybrid-migration/contracts/engage-ui-component-map.step1.v1.json` (Purpose: mark status family migrated/validated; Files: `specs/018-rhds-hybrid-migration/contracts/engage-ui-component-map.step1.v1.json`; Implementation notes: change B1 status to validated with risk and rollback evidence references; Regression checks: mapping stays schema-consistent; Rollback note: set B1 status back to rolled_back if issues discovered)

**Checkpoint (B1 Go/No-Go)**: T007-T013 complete and B1 parity + accessibility + visual + rollback evidence all pass before starting B2.

---

## Phase 4: User Story 2 - Safely substitute low-coupling action buttons with rollback support (Priority: P2) (B2 Button Family)

**Goal**: Migrate low-coupling action buttons through adapter while preserving IDs, callback signatures, and disabled behavior.

**Independent Test**: All adapted button interactions in affected steps produce unchanged callback invocation behavior and workflow outcomes.

### Implementation for User Story 2 (B2 only: Buttons)

- [x] T014 [US2] Implement button adapter in `src/mcp-app/ui/action-button-adapter.tsx` (Purpose: isolate button rendering while keeping event contracts stable; Files: `src/mcp-app/ui/action-button-adapter.tsx`; Implementation notes: preserve id/variant/isDisabled/onClick props and render PF/RHDS options; Regression checks: callback signature remains `() => void`; Rollback note: adapter supports PF fallback mode per button group)
- [x] T015 [US2] Wire button adapter into low-coupling groups in `src/mcp-app/step-content.tsx` (Purpose: substitute selected button surfaces only; Files: `src/mcp-app/step-content.tsx`; Implementation notes: keep existing handlers and call order unchanged for continue/generate/fetch/connect/verify/status/list/attach/disconnect as applicable to low-risk groups; Regression checks: no input handler or workflow logic changes; Rollback note: restore direct PF button rendering for impacted groups if gate fails)
- [x] T016 [P] [US2] Add B2 behavior parity check in `tests/mcp-app/regression/b2-buttons-parity.test.ts` (Purpose: verify unchanged callback and disabled semantics; Files: `tests/mcp-app/regression/b2-buttons-parity.test.ts`; Implementation notes: assert each adapted button triggers expected callback and disabled behavior; Regression checks: compare callback order against baseline evidence; Rollback note: include fallback-mode assertions)
- [x] T017 [P] [US2] Add B2 accessibility sanity check in `tests/mcp-app/regression/b2-buttons-a11y.md` (Purpose: verify focus order and keyboard activation; Files: `tests/mcp-app/regression/b2-buttons-a11y.md`; Implementation notes: include tab order, focus visibility, and activation behavior checklist; Regression checks: no loss of button operability; Rollback note: run checklist post-fallback)
- [x] T018 [P] [US2] Add B2 visual consistency check in `tests/mcp-app/regression/b2-buttons-visual.md` (Purpose: maintain action hierarchy clarity; Files: `tests/mcp-app/regression/b2-buttons-visual.md`; Implementation notes: compare baseline/hybrid for primary-secondary-link emphasis; Regression checks: hierarchy remains intuitive and unchanged in meaning; Rollback note: include post-rollback visual delta note)
- [x] T019 [US2] Execute B2 rollback drill in `tests/mcp-app/regression/b2-buttons-rollback.md` (Purpose: verify per-group button rollback; Files: `tests/mcp-app/regression/b2-buttons-rollback.md`, `src/mcp-app/ui/adapter-mode.ts`; Implementation notes: rollback adapted groups without touching B1 status; Regression checks: B1 remains stable during B2 rollback; Rollback note: this drill is the operational rollback runbook for B2)
- [x] T020 [US2] Update B2 mapping state in `specs/018-rhds-hybrid-migration/contracts/engage-ui-component-map.step1.v1.json` (Purpose: mark button family migration state; Files: `specs/018-rhds-hybrid-migration/contracts/engage-ui-component-map.step1.v1.json`; Implementation notes: set B2 validated and attach evidence refs; Regression checks: mapping integrity and milestone traceability maintained; Rollback note: set B2 to rolled_back if post-gate regressions emerge)

**Checkpoint (B2 Go/No-Go)**: T014-T020 complete and all B2 checks pass with successful rollback drill before starting B3.

---

## Phase 5: User Story 3 - Keep migration ownership clear with optional navigation/progress alignment (Priority: P3) (B3 Navigation Family)

**Goal**: Optionally align navigation/progress affordances via adapter with zero change to gating semantics and complete hybrid mapping documentation.

**Independent Test**: Navigation/progress visual alignment does not change step gating behavior, and documentation clearly reflects hybrid ownership state.

### Implementation for User Story 3 (B3 only: Navigation/Progress + Mapping Docs)

- [x] T021 [US3] Implement progress affordance adapter in `src/mcp-app/ui/progress-affordance-adapter.tsx` (Purpose: isolate navigation/progress presentation choice; Files: `src/mcp-app/ui/progress-affordance-adapter.tsx`; Implementation notes: preserve `onNavigateStep1/2/3` usage and step semantics; Regression checks: adapter does not add new gating logic; Rollback note: adapter supports immediate PF fallback)
- [x] T022 [US3] Wire optional progress adapter in `src/mcp-app/App.tsx` without changing gating logic (Purpose: apply B3 substitution safely; Files: `src/mcp-app/App.tsx`; Implementation notes: keep route/gate behavior exactly as current and use adapter for presentation only; Regression checks: step transitions unchanged; Rollback note: revert adapter wiring to prior Wizard presentation path)
- [x] T023 [P] [US3] Add B3 behavior parity check in `tests/mcp-app/regression/b3-navigation-parity.test.ts` (Purpose: verify step/gating semantics unchanged; Files: `tests/mcp-app/regression/b3-navigation-parity.test.ts`; Implementation notes: assert navigation callbacks and step index behavior match baseline; Regression checks: no new accessible/unavailable step activation; Rollback note: include parity assertion under PF fallback)
- [x] T024 [P] [US3] Add B3 accessibility sanity check in `tests/mcp-app/regression/b3-navigation-a11y.md` (Purpose: ensure understandable and operable step affordances; Files: `tests/mcp-app/regression/b3-navigation-a11y.md`; Implementation notes: verify keyboard flow and meaningful labels for navigation/progress UI; Regression checks: users can interpret progression correctly; Rollback note: verify accessibility restoration under fallback)
- [x] T025 [P] [US3] Add B3 visual consistency check in `tests/mcp-app/regression/b3-navigation-visual.md` (Purpose: verify non-misleading progression cues; Files: `tests/mcp-app/regression/b3-navigation-visual.md`; Implementation notes: compare baseline/hybrid navigation affordance clarity and alignment; Regression checks: no misleading cue implies altered gating; Rollback note: capture fallback visual confirmation)
- [x] T026 [US3] Execute B3 rollback drill in `tests/mcp-app/regression/b3-navigation-rollback.md` (Purpose: validate isolated rollback for navigation family; Files: `tests/mcp-app/regression/b3-navigation-rollback.md`, `src/mcp-app/ui/adapter-mode.ts`; Implementation notes: rollback B3 only and verify B1/B2 remain validated; Regression checks: full workflow still passes after rollback; Rollback note: this drill defines B3 incident response steps)
- [x] T027 [US3] Finalize Step 1 mapping and migration notes in `specs/018-rhds-hybrid-migration/contracts/engage-ui-component-map.step1.v1.json` and `specs/018-rhds-hybrid-migration/quickstart.md` (Purpose: complete hybrid ownership documentation; Files: `specs/018-rhds-hybrid-migration/contracts/engage-ui-component-map.step1.v1.json`, `specs/018-rhds-hybrid-migration/quickstart.md`; Implementation notes: mark B3 validated or deferred with rationale and Step 2 hints; Regression checks: docs clearly show ownership, risk, rollback state; Rollback note: if B3 is no-go, document deferred status and retain B1/B2 as complete)

**Checkpoint (B3 Go/No-Go)**: T021-T027 complete and B3 checks/rollback drill pass (or B3 explicitly deferred and documented) before closing Step 1.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final quality gate and readiness declaration for Step 1 closeout.

- [x] T028 Run end-to-end Step 1 regression sweep using `tests/mcp-app/regression/` artifacts (Purpose: verify combined B1/B2/B3 outcomes; Files: `tests/mcp-app/regression/*.md`, `tests/mcp-app/regression/*.test.ts`; Implementation notes: execute all parity/a11y/visual checks and summarize final results; Regression checks: all required checks pass for completed batches; Rollback note: initiate affected batch rollback if any cross-batch regression is found)
- [x] T029 [P] Perform build/serve stability check for unchanged runtime behavior in project scripts (Purpose: prove FR-005 unchanged behavior; Files: `package.json`, `README.md` (if updated), validation log at `tests/mcp-app/regression/step1-build-serve.md`; Implementation notes: run existing build/serve commands without changing scripts; Regression checks: build and serve match baseline behavior; Rollback note: revert Step 1 wiring changes if build/serve regression appears)
- [x] T030 Publish Step 1 completion report in `specs/018-rhds-hybrid-migration/quickstart.md` and `specs/018-rhds-hybrid-migration/tasks.md` (Purpose: close task traceability loop and declare milestone outcomes; Files: `specs/018-rhds-hybrid-migration/quickstart.md`, `specs/018-rhds-hybrid-migration/tasks.md`; Implementation notes: record pass/fail per checkpoint and final Step 2 prerequisites status; Regression checks: report references evidence for each milestone; Rollback note: include unresolved rollback actions if any batch remained rolled back/deferred)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: no dependencies
- **Phase 2 (Foundational)**: depends on Phase 1; blocks all batch work
- **Phase 3 (US1/B1 Status)**: depends on Phase 2 completion
- **Phase 4 (US2/B2 Buttons)**: depends on successful B1 go/no-go checkpoint
- **Phase 5 (US3/B3 Navigation)**: depends on successful B2 go/no-go checkpoint
- **Phase 6 (Polish)**: depends on completion of targeted Step 1 batches and checkpoint outcomes

### User Story Dependencies

- **US1 (P1)**: independent after foundational tasks; defines MVP
- **US2 (P2)**: sequential after US1 checkpoint due to risk-batch constraint
- **US3 (P3)**: sequential after US2 checkpoint due to risk-batch constraint; may be deferred with documentation

### Parallel Opportunities

- **Setup**: T003 can run in parallel with T001/T002
- **Foundational**: T005 can run in parallel with T004/T006
- **US1**: T009/T010/T011 can run in parallel after T008
- **US2**: T016/T017/T018 can run in parallel after T015
- **US3**: T023/T024/T025 can run in parallel after T022
- **Polish**: T029 can run in parallel with T028 once all batches are complete

---

## Parallel Example: User Story 2 (B2 Buttons)

```bash
Task: "T016 [US2] behavior parity check in tests/mcp-app/regression/b2-buttons-parity.test.ts"
Task: "T017 [US2] accessibility sanity check in tests/mcp-app/regression/b2-buttons-a11y.md"
Task: "T018 [US2] visual consistency check in tests/mcp-app/regression/b2-buttons-visual.md"
```

---

## Implementation Strategy

### MVP First (US1 / B1 only)

1. Complete Phase 1 and Phase 2.
2. Complete B1 (T007-T013).
3. Stop at B1 checkpoint and validate go/no-go.
4. Demo stable hybrid status substitution as MVP.

### Incremental Delivery

1. Deliver B1 status substitution with full evidence and rollback drill.
2. Deliver B2 buttons only after B1 gate pass.
3. Deliver B3 navigation/progress only after B2 gate pass.
4. Close Step 1 with final sweep and completion report.

---

## Step 1 Completion Checklist

- [x] B1 checkpoint passed (behavior parity + accessibility sanity + visual consistency + rollback drill)
- [x] B2 checkpoint passed (behavior parity + accessibility sanity + visual consistency + rollback drill)
- [x] B3 checkpoint passed or explicitly deferred with rationale and mapping update
- [x] `src/mcp-app.ts` contracts unchanged
- [x] Callback signatures in `src/mcp-app/App.tsx` and `src/mcp-app/step-content.tsx` unchanged
- [x] Existing build/serve behavior confirmed unchanged
- [x] Step 1 mapping docs updated in `specs/018-rhds-hybrid-migration/contracts/engage-ui-component-map.step1.v1.json`
- [x] Historical contract `specs/012-patternfly-ui-swap/contracts/engage-ui-component-map.v1.json` remains unmodified

## Explicit Prerequisites to Begin Step 2

- [x] All Step 1 go/no-go checkpoints are resolved (passed or explicitly deferred with accepted rationale)
- [x] No unresolved critical regressions remain in behavior, accessibility, or visual checks
- [x] Rollback procedures for all substituted Step 1 surfaces are documented and validated
- [x] Hybrid ownership map is current and includes Step 2 candidate notes
- [ ] Stakeholder sign-off confirms readiness to expand scope from selective substitution to broader replacement
