# Tasks: Engage Troubleshooting Step Insertion

**Input**: Design documents from `/specs/021-cpu-info-ui-step/`  
**Prerequisites**: `plan.md` (required), `spec.md` (required for user stories), `research.md`, `data-model.md`, `contracts/`

**Tests**: Tests are explicitly required by the feature spec (`FR-008`), so contract/integration/regression test tasks are included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (for example, `US1`, `US2`, `US3`)
- Every task includes an exact file path

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create shared test and UI scaffolding needed before step-flow implementation.

- [X] T001 Create 4-step navigation regression test scaffold in `tests/regression/engage-four-step-navigation.test.ts`
- [X] T002 [P] Add troubleshooting-step style scaffold blocks in `src/mcp-app/rhds-step0.css`
- [X] T003 [P] Add troubleshooting static CPU-row constants scaffold in `src/mcp-app/step-content.tsx`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Implement shared workflow primitives and navigation routing that block all user stories.

**⚠️ CRITICAL**: No user story work should begin until this phase is complete.

- [X] T004 Update workflow step union and troubleshooting state fields in `src/mcp-app/state.ts`
- [X] T005 Update step-id navigation resolver for 4-step routing in `src/mcp-app/ui/adapter-contract.ts`
- [X] T006 Update progress adapter props/content map for four step panels in `src/mcp-app/ui/progress-affordance-adapter.tsx`
- [X] T007 Update step index mapping and navigation callback shape for four steps in `src/mcp-app/App.tsx`
- [X] T008 Update hash bootstrap and `setCurrentStep` mapping to `step-1`..`step-4` in `src/mcp-app.ts`

**Checkpoint**: 4-step workflow primitives are in place and user-story implementation can proceed.

---

## Phase 3: User Story 1 - Review CPU Information During Guided Troubleshooting (Priority: P1) 🎯 MVP

**Goal**: Show a dedicated troubleshooting step after product selection with an RHDS-consistent static CPU table row.

**Independent Test**: Complete product selection and confirm troubleshooting appears as step 2 with a single CPU-info table row before sos.

### Tests for User Story 1

- [X] T009 [P] [US1] Add integration assertion for troubleshooting as post-select step in `tests/integration/engage-red-hat-support.workflow.test.ts`
- [X] T010 [P] [US1] Add regression assertion for `#step-2` troubleshooting route and active nav state in `tests/regression/engage-four-step-navigation.test.ts`

### Implementation for User Story 1

- [X] T011 [US1] Implement troubleshooting step component with one static CPU row in `src/mcp-app/step-content.tsx`
- [X] T012 [US1] Apply RHDS-consistent table layout and spacing styles for troubleshooting content in `src/mcp-app/rhds-step0.css`
- [X] T013 [US1] Wire troubleshooting as rendered step-2 content and shift sos/jira content slots in `src/mcp-app/App.tsx`
- [X] T014 [US1] Update progress navigation labels to include troubleshooting as step 2 in `src/mcp-app/ui/progress-affordance-adapter.tsx`

**Checkpoint**: User Story 1 is independently functional and testable as MVP.

---

## Phase 4: User Story 2 - Continue Workflow from CPU Information Step (Priority: P2)

**Goal**: Ensure Next from troubleshooting advances to sos and maintain UI compatibility/resource registration patterns.

**Independent Test**: From troubleshooting step, select Next and confirm transition to sos while preserving resource discovery compatibility.

### Tests for User Story 2

- [X] T015 [P] [US2] Add integration test coverage for troubleshooting Next -> sos transition and step-gate messaging in `tests/integration/engage-red-hat-support.workflow.test.ts`
- [X] T016 [P] [US2] Add contract assertions for troubleshooting URI discoverability and step ordering in `tests/contract/engage-red-hat-support.contract.test.ts`

### Implementation for User Story 2

- [X] T017 [US2] Implement troubleshooting completion gating and updated step transitions in `src/mcp-app.ts`
- [X] T018 [US2] Register troubleshooting step resource URI with existing registration pattern in `server.ts`
- [X] T019 [US2] Update troubleshooting workflow contract mapping in `specs/021-cpu-info-ui-step/contracts/engage-workflow-troubleshooting.contract.v1.json`
- [X] T020 [US2] Update UI resource map contract for 4-step resource registration in `specs/021-cpu-info-ui-step/contracts/engage-ui-resource-map.v3.json`

**Checkpoint**: User Stories 1 and 2 are independently testable with step sequencing and compatibility requirements satisfied.

---

## Phase 5: User Story 3 - Receive Readable Output When Rich Rendering Is Unavailable (Priority: P3)

**Goal**: Preserve text-first guidance by adding troubleshooting to skill and fallback contract sequencing before sos generation.

**Independent Test**: In text/headless guidance, verify troubleshooting appears before consent/generate/fetch sos and includes CPU-field review context.

### Tests for User Story 3

- [X] T021 [P] [US3] Add contract assertions that skill instructions include troubleshooting before sos generation in `tests/contract/engage-red-hat-support.contract.test.ts`
- [X] T022 [P] [US3] Extend regression surface assertions for 4-step navigation compatibility in `tests/regression/engage-four-step-navigation.test.ts`

### Implementation for User Story 3

- [X] T023 [US3] Update skill workflow sequence to insert troubleshooting before sos generation in `skills/engage-red-hat-support/SKILL.md`
- [X] T024 [US3] Update skill-sequence contract mapping for troubleshooting-before-sos ordering in `specs/021-cpu-info-ui-step/contracts/engage-skill-sequence.contract.v1.json`
- [X] T025 [US3] Update troubleshooting-step OpenAPI mapping for current-step and CPU response shape in `specs/021-cpu-info-ui-step/contracts/engage-troubleshooting-step.openapi.yaml`
- [X] T026 [US3] Update fallback `current_step` progression text from product-selection responses to troubleshooting in `server.ts`

**Checkpoint**: All user stories are independently functional, including non-UI fallback guidance.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, consistency, and release readiness checks across all stories.

- [X] T027 [P] Run targeted validation suite (`npm run test:contract && npm run test:integration && npm run test:regression`) and fix failures in `tests/contract/engage-red-hat-support.contract.test.ts`, `tests/integration/engage-red-hat-support.workflow.test.ts`, and `tests/regression/engage-four-step-navigation.test.ts`
- [X] T028 Validate contract/spec consistency notes in `specs/021-cpu-info-ui-step/quickstart.md`
- [X] T029 Run full confidence suite (`npm run test:unit && npm run test:contract && npm run test:integration && npm run test:regression`) and record readiness updates in `specs/021-cpu-info-ui-step/plan.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies; starts immediately.
- **Phase 2 (Foundational)**: Depends on Phase 1; blocks all user stories.
- **Phase 3 (US1)**: Depends on Phase 2.
- **Phase 4 (US2)**: Depends on US1 rendering baseline and Phase 2 routing primitives.
- **Phase 5 (US3)**: Depends on US2 step ordering finalization for fallback sequence accuracy.
- **Phase 6 (Polish)**: Depends on completion of all targeted user stories.

### User Story Dependencies

- **US1 (P1)**: First deliverable; no dependency on other stories after foundational work.
- **US2 (P2)**: Builds on US1 step rendering and adds transition/resource compatibility behavior.
- **US3 (P3)**: Builds on US2 ordering to align text fallback and skill sequencing.

### Within Each User Story

- Add/extend tests before implementation completion and verify failing expectations first.
- Update state and routing before step-component wiring when both are touched.
- Complete server resource registration before final contract assertions for URI surfaces.

### Parallel Opportunities

- Phase 1 tasks marked `[P]` (`T002`, `T003`) can run in parallel after `T001`.
- US1 tests (`T009`, `T010`) can run in parallel.
- US2 tests (`T015`, `T016`) can run in parallel.
- US3 tests (`T021`, `T022`) can run in parallel.
- Polish validation docs/update tasks (`T027`, `T028`) can overlap before final full-suite run (`T029`).

---

## Parallel Example: User Story 1

```bash
# Parallel US1 verification tasks:
Task: "T009 [US1] Add integration assertion for troubleshooting as post-select step in tests/integration/engage-red-hat-support.workflow.test.ts"
Task: "T010 [US1] Add regression assertion for #step-2 troubleshooting route in tests/regression/engage-four-step-navigation.test.ts"
```

## Parallel Example: User Story 2

```bash
# Parallel US2 compatibility checks:
Task: "T015 [US2] Add integration test for troubleshooting Next -> sos transition in tests/integration/engage-red-hat-support.workflow.test.ts"
Task: "T016 [US2] Add contract assertions for troubleshooting URI discoverability in tests/contract/engage-red-hat-support.contract.test.ts"
```

## Parallel Example: User Story 3

```bash
# Parallel US3 fallback/surface validation:
Task: "T021 [US3] Add skill-sequence contract assertions in tests/contract/engage-red-hat-support.contract.test.ts"
Task: "T022 [US3] Extend 4-step navigation regression assertions in tests/regression/engage-four-step-navigation.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 and Phase 2.
2. Deliver Phase 3 (US1) to show troubleshooting step and static CPU table.
3. Validate US1 independent test criteria and demo as MVP.

### Incremental Delivery

1. Add US2 transition + server resource compatibility.
2. Add US3 fallback skill/contract sequence updates.
3. Finish with cross-suite validation in Phase 6.

### Parallel Team Strategy

1. One developer handles state/routing/progress foundations (`state.ts`, `mcp-app.ts`, adapter files).
2. One developer handles UI troubleshooting content and RHDS styling.
3. One developer handles contract/skill/test updates once step ordering is stable.

---

## Notes

- All tasks follow strict checklist format: checkbox, Task ID, optional `[P]`, required `[USx]` in story phases, and explicit file path.
- Suggested MVP scope: **User Story 1** after foundational phases complete.
- This task list includes requested work areas: state union updates, mcp-app transitions/gating, App/step-content/progress updates, RHDS table styling, server resource registration, contract updates, skill markdown updates, and 4-step navigation regression coverage.
