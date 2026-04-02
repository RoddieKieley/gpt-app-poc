# Tasks: RHDS Final Migration (Step 2) - Step 1 Hybrid Execution Tasks

**Input**: Design documents from `/wip/src/github.com/roddiekieley/gpt-app-poc/specs/019-rhds-final-migration/`  
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: Regression evidence tasks are included because parity verification is an explicit acceptance requirement.

**Organization**: Tasks are grouped by user story and executed in strict component-family batches: B1 (status) -> B2 (buttons) -> B3 (navigation/progress).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on incomplete tasks)
- **[Story]**: Maps to user story (`US1`, `US2`, `US3`)
- Each task includes: task id, purpose, files, implementation notes, regression checks, rollback note

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare execution artifacts and baseline parity references before any UI family migration.

- [ ] T001 Create Step 1 hybrid execution workspace in `specs/019-rhds-final-migration/validation/` and `tests/mcp-app/regression/step1-hybrid/` (Purpose: organize batch evidence; Files: `specs/019-rhds-final-migration/validation/README.md`, `tests/mcp-app/regression/step1-hybrid/README.md`; Implementation notes: define B1/B2/B3 evidence naming conventions; Regression checks: both directories exist and are referenced by later tasks; Rollback note: remove scaffolding only if Step 1 hybrid work is canceled before code edits)
- [ ] T002 Capture baseline parity snapshot in `tests/mcp-app/regression/step1-hybrid/baseline-parity.md` (Purpose: lock pre-change behavior reference; Files: `tests/mcp-app/regression/step1-hybrid/baseline-parity.md`; Implementation notes: record step gating, hash routing, status semantics, and tool call order observations; Regression checks: includes happy/blocked/error/loading paths; Rollback note: baseline file remains authoritative even if implementation is rolled back)
- [ ] T003 [P] Create Step 1 hybrid batch tracker in `specs/019-rhds-final-migration/validation/step1-hybrid-batch-tracker.md` (Purpose: enforce one-family-per-batch rule; Files: `specs/019-rhds-final-migration/validation/step1-hybrid-batch-tracker.md`; Implementation notes: add explicit "B2 blocked on B1 checkpoint" and "B3 blocked on B2 checkpoint" gates; Regression checks: tracker includes pass/fail/blocked state for each batch; Rollback note: mark current batch as rolled_back if checkpoint fails)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Define shared mapping/contracts and invariant checks that block all component-family substitutions until complete.

**⚠️ CRITICAL**: No batch implementation may begin until this phase is complete.

- [ ] T004 Define Step 1 hybrid mapping schema in `specs/019-rhds-final-migration/validation/step1-hybrid-component-map.md` (Purpose: inventory PF surfaces and RHDS targets per batch; Files: `specs/019-rhds-final-migration/validation/step1-hybrid-component-map.md`; Implementation notes: include status/buttons/navigation family ownership and risk notes; Regression checks: every in-scope PF usage from plan inventory is mapped; Rollback note: if a family rolls back, set mapping state to rolled_back and retain evidence links)
- [ ] T005 [P] Add batch-checkpoint contract extension in `specs/019-rhds-final-migration/contracts/rhds-pf-retirement-contract.v1.json` (Purpose: represent B1/B2/B3 checkpoint outcomes in contract data; Files: `specs/019-rhds-final-migration/contracts/rhds-pf-retirement-contract.v1.json`; Implementation notes: add batch status and evidence reference keys without altering existing invariants; Regression checks: JSON remains valid and references all three component families; Rollback note: preserve checkpoint history with failed/rolled_back status instead of deleting entries)
- [ ] T006 Add regression matrix run template in `specs/019-rhds-final-migration/validation/step1-regression-matrix.md` (Purpose: standardize pass/fail capture for each path category; Files: `specs/019-rhds-final-migration/validation/step1-regression-matrix.md`; Implementation notes: include happy, blocked, error/recovery, loading/polling, and a11y/visual sections; Regression checks: template includes acceptance criteria and evidence slots; Rollback note: include dedicated rollback verification row per batch)

**Checkpoint**: Foundational artifacts complete and reviewed; B1 status batch may start.

---

## Phase 3: User Story 1 - Preserve Existing Workflow Behavior (Priority: P1) 🎯 MVP (B1 Status Family)

**Goal**: Migrate status family first using RHDS-first rendering while preserving behavior invariants.

**Independent Test**: Status behavior and semantics remain unchanged across success/failure paths after B1.

### Implementation for User Story 1 (B1 only: Status)

- [ ] T007 [US1] Replace PF status fallback with RHDS-first status implementation in `src/mcp-app/ui/status-display-adapter.tsx` (Purpose: complete status-family substitution; Files: `src/mcp-app/ui/status-display-adapter.tsx`; Implementation notes: preserve message and variant contract exactly; Regression checks: info/success/warning/danger semantics match baseline; Rollback note: retain reversible PF branch strategy until B1 checkpoint passes)
- [ ] T008 [US1] Verify status integration wiring in `src/mcp-app/App.tsx` (Purpose: ensure status substitution does not alter workflow orchestration; Files: `src/mcp-app/App.tsx`; Implementation notes: do not change step navigation callbacks or status-setting callsites; Regression checks: step transitions and status updates match baseline trace; Rollback note: restore prior status rendering path if B1 gate fails)
- [ ] T009 [P] [US1] Record B1 behavior parity evidence in `tests/mcp-app/regression/step1-hybrid/b1-status-parity.md` (Purpose: prove no behavior drift; Files: `tests/mcp-app/regression/step1-hybrid/b1-status-parity.md`; Implementation notes: capture before/after status transitions for happy + error paths; Regression checks: no delta in status semantics or route/hash interactions; Rollback note: include post-rollback parity confirmation section)
- [ ] T010 [P] [US1] Record B1 accessibility and visual evidence in `tests/mcp-app/regression/step1-hybrid/b1-status-a11y-visual.md` (Purpose: verify announceability and RHDS visual compliance; Files: `tests/mcp-app/regression/step1-hybrid/b1-status-a11y-visual.md`; Implementation notes: capture keyboard and screen-reader sanity plus visual hierarchy notes; Regression checks: status remains perceivable and non-misleading; Rollback note: rerun evidence capture after rollback if triggered)
- [ ] T011 [US1] Update mapping documents after B1 in `specs/019-rhds-final-migration/validation/step1-hybrid-component-map.md` and `specs/019-rhds-final-migration/contracts/rhds-pf-retirement-contract.v1.json` (Purpose: persist B1 migration state; Files: `specs/019-rhds-final-migration/validation/step1-hybrid-component-map.md`, `specs/019-rhds-final-migration/contracts/rhds-pf-retirement-contract.v1.json`; Implementation notes: set status family to validated and attach evidence refs; Regression checks: mapping and contract stay consistent; Rollback note: if B1 rolls back, update state to rolled_back with reason)
- [ ] T012 [US1] Execute B1 checkpoint in `specs/019-rhds-final-migration/validation/step1-hybrid-batch-tracker.md` (Purpose: gate progression to B2; Files: `specs/019-rhds-final-migration/validation/step1-hybrid-batch-tracker.md`, `specs/019-rhds-final-migration/validation/step1-regression-matrix.md`; Implementation notes: mark PASS only if behavior+a11y+visual evidence is complete; Regression checks: B1 rows are all pass; Rollback note: if any row fails, block B2 and run status rollback steps before retry)

**Checkpoint (B1 Go/No-Go)**: T007-T012 must pass before B2 starts.

---

## Phase 4: User Story 2 - Deliver RHDS-First Visual Compliance (Priority: P2) (B2 Button Family, then B3 Navigation Family)

**Goal**: Complete RHDS-first visual migration for interactive controls in controlled family batches without changing workflow behavior.

**Independent Test**: Users can complete workflows with unchanged interaction outcomes and RHDS-compliant visuals after B2/B3.

### Batch B2 Implementation for User Story 2 (Buttons only)

- [ ] T013 [US2] Replace PF button fallback path with RHDS-first rendering in `src/mcp-app/ui/action-button-adapter.tsx` (Purpose: migrate button family safely; Files: `src/mcp-app/ui/action-button-adapter.tsx`; Implementation notes: preserve `id`, `variant`, `isDisabled`, and callback invocation semantics; Regression checks: button enable/disable and click outcomes unchanged; Rollback note: keep controlled fallback switch until B2 checkpoint passes)
- [ ] T014 [US2] Validate button-family usage in `src/mcp-app/step-content.tsx` (Purpose: ensure wiring parity for all step actions; Files: `src/mcp-app/step-content.tsx`; Implementation notes: do not alter action order or handler references; Regression checks: generate/fetch/connect/verify/status/list/attach/disconnect behavior parity holds; Rollback note: revert button family changes only if B2 fails)
- [ ] T015 [P] [US2] Record B2 behavior parity evidence in `tests/mcp-app/regression/step1-hybrid/b2-buttons-parity.md` (Purpose: prove unchanged action behavior; Files: `tests/mcp-app/regression/step1-hybrid/b2-buttons-parity.md`; Implementation notes: compare callback order and gated behavior against baseline; Regression checks: no invocation-order or disabled-state regression; Rollback note: include verification after B2 rollback drill)
- [ ] T016 [P] [US2] Record B2 accessibility and visual evidence in `tests/mcp-app/regression/step1-hybrid/b2-buttons-a11y-visual.md` (Purpose: confirm keyboard operability and action hierarchy; Files: `tests/mcp-app/regression/step1-hybrid/b2-buttons-a11y-visual.md`; Implementation notes: capture focus order, button semantics, and RHDS hierarchy checks; Regression checks: no loss of operability/discoverability; Rollback note: rerun checks if B2 rollback is executed)
- [ ] T017 [US2] Update mapping documents after B2 in `specs/019-rhds-final-migration/validation/step1-hybrid-component-map.md` and `specs/019-rhds-final-migration/contracts/rhds-pf-retirement-contract.v1.json` (Purpose: persist B2 migration evidence; Files: `specs/019-rhds-final-migration/validation/step1-hybrid-component-map.md`, `specs/019-rhds-final-migration/contracts/rhds-pf-retirement-contract.v1.json`; Implementation notes: mark button family validated with evidence pointers; Regression checks: mapping doc and contract checkpoint fields align; Rollback note: if B2 rolls back, mark B2 status rolled_back and block B3)
- [ ] T018 [US2] Execute B2 checkpoint in `specs/019-rhds-final-migration/validation/step1-hybrid-batch-tracker.md` (Purpose: gate progression to B3 navigation family; Files: `specs/019-rhds-final-migration/validation/step1-hybrid-batch-tracker.md`, `specs/019-rhds-final-migration/validation/step1-regression-matrix.md`; Implementation notes: require all B2 evidence before pass; Regression checks: B2 rows all pass; Rollback note: B3 cannot start until B2 rollback (if needed) is resolved)

### Batch B3 Implementation for User Story 2 (Navigation/Progress only)

- [ ] T019 [US2] Replace PF wizard/progress fallback with RHDS-first navigation affordance in `src/mcp-app/ui/progress-affordance-adapter.tsx` (Purpose: migrate navigation family; Files: `src/mcp-app/ui/progress-affordance-adapter.tsx`; Implementation notes: preserve `onNavigateStep1/2/3` callback semantics and step index behavior; Regression checks: no change to gating/route transitions; Rollback note: maintain family-scoped rollback path until B3 passes)
- [ ] T020 [US2] Validate progress integration in `src/mcp-app/App.tsx` and mode handling in `src/mcp-app/ui/adapter-mode.ts` (Purpose: finalize B3 wiring without behavior drift; Files: `src/mcp-app/App.tsx`, `src/mcp-app/ui/adapter-mode.ts`; Implementation notes: keep existing navigation semantics and hash routing unchanged; Regression checks: step transitions and gating outcomes are identical to baseline; Rollback note: revert B3 integration only if checkpoint fails)
- [ ] T021 [P] [US2] Record B3 behavior parity evidence in `tests/mcp-app/regression/step1-hybrid/b3-navigation-parity.md` (Purpose: prove no step navigation semantic drift; Files: `tests/mcp-app/regression/step1-hybrid/b3-navigation-parity.md`; Implementation notes: include blocked-path checks in addition to happy-path traversal; Regression checks: same gating + route/hash behavior as baseline; Rollback note: verify parity restoration post-B3 rollback)
- [ ] T022 [P] [US2] Record B3 accessibility and visual evidence in `tests/mcp-app/regression/step1-hybrid/b3-navigation-a11y-visual.md` (Purpose: verify RHDS progress affordance clarity; Files: `tests/mcp-app/regression/step1-hybrid/b3-navigation-a11y-visual.md`; Implementation notes: capture keyboard flow, focus behavior, and progression cues; Regression checks: no misleading step affordances introduced; Rollback note: rerun evidence capture if rollback occurs)
- [ ] T023 [US2] Update mapping documents after B3 in `specs/019-rhds-final-migration/validation/step1-hybrid-component-map.md` and `specs/019-rhds-final-migration/contracts/rhds-pf-retirement-contract.v1.json` (Purpose: close visual migration mapping for Step 1 hybrid; Files: `specs/019-rhds-final-migration/validation/step1-hybrid-component-map.md`, `specs/019-rhds-final-migration/contracts/rhds-pf-retirement-contract.v1.json`; Implementation notes: mark navigation family validated or deferred with explicit reason; Regression checks: mapping and contract references are complete; Rollback note: if deferred/rolled_back, document residual risk and owner)
- [ ] T024 [US2] Execute B3 checkpoint in `specs/019-rhds-final-migration/validation/step1-hybrid-batch-tracker.md` (Purpose: close US2 visual batch sequence; Files: `specs/019-rhds-final-migration/validation/step1-hybrid-batch-tracker.md`, `specs/019-rhds-final-migration/validation/step1-regression-matrix.md`; Implementation notes: mark pass only with complete B3 evidence set; Regression checks: B3 matrix rows all pass or explicitly deferred with signoff; Rollback note: if failed, execute B3 rollback and keep B1/B2 intact)

**Checkpoint (B2/B3 Go/No-Go)**: T013-T024 complete; B3 pass (or formally deferred) required before dependency retirement work.

---

## Phase 5: User Story 3 - Retire PatternFly Dependencies Safely (Priority: P3)

**Goal**: Remove PF stylesheet/dependencies when safe, or document residuals with risk and ownership.

**Independent Test**: Build/serve and full regression matrix remain green after PF retirement changes.

### Implementation for User Story 3

- [ ] T025 [US3] Remove PF base stylesheet import from `src/mcp-app.ts` and adjust RHDS-related style assets in `src/mcp-app/*.css` (Purpose: complete stylesheet retirement target; Files: `src/mcp-app.ts`, `src/mcp-app/rhds-step0.css`; Implementation notes: keep visual parity and focus visibility intact under RHDS styles; Regression checks: no layout/a11y regression across steps; Rollback note: reintroduce PF base import only if blocker is confirmed)
- [ ] T026 [US3] Retire PF dependencies in `package.json` and lockfile (`package-lock.json`) (Purpose: remove stale PF package dependencies; Files: `package.json`, `package-lock.json`; Implementation notes: remove `@patternfly/react-core` and `@patternfly/react-icons` only after import cleanup; Regression checks: build and regression matrix pass without PF packages; Rollback note: restore dependency entries if build/runtime regression occurs)
- [ ] T027 [P] [US3] Run and document regression matrix sweep in `tests/mcp-app/regression/step1-hybrid/final-matrix-results.md` (Purpose: validate post-retirement parity; Files: `tests/mcp-app/regression/step1-hybrid/final-matrix-results.md`; Implementation notes: include happy, blocked, error/recovery, loading/polling, and a11y/visual outcomes; Regression checks: all required categories pass; Rollback note: if any critical category fails, roll back latest family/dependency change and re-run)
- [ ] T028 [US3] Publish dependency retirement decisions and residual risks in `specs/019-rhds-final-migration/validation/dependency-retirement-log.md` and `specs/019-rhds-final-migration/validation/residual-risk-list.md` (Purpose: complete retirement auditability; Files: `specs/019-rhds-final-migration/validation/dependency-retirement-log.md`, `specs/019-rhds-final-migration/validation/residual-risk-list.md`; Implementation notes: include remove/retain decision, justification, risk, owner, follow-up phase; Regression checks: every PF candidate has a recorded decision; Rollback note: append rollback incident outcomes if retirement is reversed)
- [ ] T029 [US3] Update final migration report and quickstart closeout in `specs/019-rhds-final-migration/quickstart.md` and `specs/019-rhds-final-migration/validation/final-migration-report.md` (Purpose: complete signoff package and closure artifacts; Files: `specs/019-rhds-final-migration/quickstart.md`, `specs/019-rhds-final-migration/validation/final-migration-report.md`; Implementation notes: include signoff gates A-E and evidence links; Regression checks: report references all checkpoint outputs and matrix evidence; Rollback note: report must include rollback summary if any gate failed then recovered)

**Checkpoint (US3 Go/No-Go)**: T025-T029 complete; dependency retirement + signoff evidence complete.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final consistency checks across all stories and readiness declaration.

- [ ] T030 Validate contract + mapping consistency in `specs/019-rhds-final-migration/contracts/rhds-final-cutover.openapi.yaml` and `specs/019-rhds-final-migration/contracts/rhds-pf-retirement-contract.v1.json` (Purpose: ensure plan artifacts match executed work; Files: `specs/019-rhds-final-migration/contracts/rhds-final-cutover.openapi.yaml`, `specs/019-rhds-final-migration/contracts/rhds-pf-retirement-contract.v1.json`; Implementation notes: align final gate states and retirement decisions; Regression checks: artifact fields align with final report values; Rollback note: maintain historical trace rather than deleting failed-attempt data)
- [ ] T031 [P] Run final build/serve sanity validation and capture results in `tests/mcp-app/regression/step1-hybrid/build-serve-sanity.md` (Purpose: confirm MCP UI resource mechanics are unchanged; Files: `tests/mcp-app/regression/step1-hybrid/build-serve-sanity.md`, `package.json`; Implementation notes: execute existing `build` and `serve` flows without script changes; Regression checks: no regression in UI resource build/serve mechanics; Rollback note: revert latest migration batch if build/serve parity fails)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: no dependencies
- **Phase 2 (Foundational)**: depends on Phase 1; blocks all user story work
- **Phase 3 (US1 / B1 Status)**: depends on Phase 2 checkpoint
- **Phase 4 (US2 / B2 then B3)**: B2 depends on B1 checkpoint; B3 depends on B2 checkpoint
- **Phase 5 (US3 Retirement)**: depends on B3 checkpoint completion (or explicit defer decision)
- **Phase 6 (Polish)**: depends on completion of US1-US3

### User Story Dependencies

- **US1 (P1)**: starts first after foundational tasks; MVP scope
- **US2 (P2)**: sequentially gated by B1 then B2 checkpoints due to one-family-per-batch rule
- **US3 (P3)**: starts after component-family batches complete and checkpointed

### Parallel Opportunities

- T003 can run in parallel with T001-T002
- T005 can run in parallel with T004/T006
- T009 and T010 can run in parallel after T008
- T015 and T016 can run in parallel after T014
- T021 and T022 can run in parallel after T020
- T027 can run in parallel with documentation tasks T028-T029 once T026 completes
- T031 can run in parallel with T030 in final phase

---

## Parallel Example: User Story 1 (B1 Status)

```bash
Task: "T009 [US1] Record B1 behavior parity evidence in tests/mcp-app/regression/step1-hybrid/b1-status-parity.md"
Task: "T010 [US1] Record B1 accessibility and visual evidence in tests/mcp-app/regression/step1-hybrid/b1-status-a11y-visual.md"
```

## Parallel Example: User Story 2 (B2 Buttons)

```bash
Task: "T015 [US2] Record B2 behavior parity evidence in tests/mcp-app/regression/step1-hybrid/b2-buttons-parity.md"
Task: "T016 [US2] Record B2 accessibility and visual evidence in tests/mcp-app/regression/step1-hybrid/b2-buttons-a11y-visual.md"
```

## Parallel Example: User Story 3 (Dependency Retirement)

```bash
Task: "T027 [US3] Run and document regression matrix sweep in tests/mcp-app/regression/step1-hybrid/final-matrix-results.md"
Task: "T028 [US3] Publish dependency retirement decisions in specs/019-rhds-final-migration/validation/dependency-retirement-log.md"
```

---

## Implementation Strategy

### MVP First (US1 only)

1. Complete Phase 1 and Phase 2.
2. Complete B1 status batch (T007-T012).
3. Stop and validate B1 checkpoint before any additional family migration.

### Incremental Delivery

1. Deliver B1 status with checkpoint evidence.
2. Deliver B2 buttons with checkpoint evidence.
3. Deliver B3 navigation/progress with checkpoint evidence (or defer with explicit rationale).
4. Deliver US3 dependency retirement + final report.

### Suggested MVP Scope

- **MVP**: US1 (B1 status family) only.
- **Post-MVP**: US2 B2/B3 visual family migrations.
- **Closure**: US3 dependency retirement and signoff artifacts.

---

## Step 1 Completion Checklist

- [ ] B1 checkpoint passed (behavior + a11y/visual + rollback readiness)
- [ ] B2 checkpoint passed (behavior + a11y/visual + rollback readiness)
- [ ] B3 checkpoint passed or explicitly deferred with accepted rationale
- [ ] Mapping documents updated for all families in `specs/019-rhds-final-migration/validation/step1-hybrid-component-map.md`
- [ ] Contract mapping updated in `specs/019-rhds-final-migration/contracts/rhds-pf-retirement-contract.v1.json`
- [ ] Regression matrix complete with evidence in `tests/mcp-app/regression/step1-hybrid/final-matrix-results.md`
- [ ] Build/serve parity confirmed in `tests/mcp-app/regression/step1-hybrid/build-serve-sanity.md`

## Explicit Prerequisites to Begin Step 2

- [ ] All Step 1 batch checkpoints (B1/B2/B3) are resolved as pass or formally deferred
- [ ] No unresolved critical regressions in behavior, security boundaries, accessibility, or visual flows
- [ ] Step 1 mapping and retirement logs are current and approved
- [ ] Rollback instructions have been rehearsed and documented for each completed batch
- [ ] Stakeholder signoff confirms readiness for Step 2 final migration cutover
