# Tasks: Dynamic CPU Resource UI

**Input**: Design documents from `/specs/022-cpu-resource-ui/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Include unit, contract, integration, and regression tasks as required by the feature spec and user request.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story label (`[US1]`, `[US2]`, `[US3]`)
- Each task includes an exact file path.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare shared contracts and fixture scaffolding used by all telemetry stories.

- [X] T001 Align telemetry contract artifacts with implementation task scope in `specs/022-cpu-resource-ui/contracts/engage-cpu-telemetry-resource.contract.v1.json`
- [X] T002 [P] Add MCP subscription/read telemetry examples for implementers in `specs/022-cpu-resource-ui/contracts/engage-cpu-telemetry-subscription.openapi.yaml`
- [X] T003 [P] Capture workflow lifecycle expectations for troubleshooting telemetry in `specs/022-cpu-resource-ui/contracts/engage-troubleshooting-live-workflow.contract.v1.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core telemetry infrastructure that MUST exist before user-story behavior can be implemented.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T004 Add telemetry resource URI constants and session key helpers in `server.ts`
- [X] T005 Implement server-side telemetry type aliases/interfaces (sample, buffer, job state) in `server.ts`
- [X] T006 Implement shared widget telemetry state shape (`telemetry_resource_uri`, `telemetry_subscribed`, `telemetry_rows`) in `src/mcp-app/state.ts`
- [X] T007 Add troubleshooting step props contract for dynamic row input in `src/mcp-app/step-content.tsx`

**Checkpoint**: Foundation ready - telemetry user stories can now begin.

---

## Phase 3: User Story 1 - Observe live CPU trend during troubleshooting (Priority: P1) 🎯 MVP

**Goal**: Subscribe/read telemetry resource on troubleshooting entry and render live rolling rows without manual refresh.

**Independent Test**: Enter troubleshooting step, observe row growth over multiple seconds, and confirm UI updates without manual action.

### Tests for User Story 1

- [X] T008 [P] [US1] Add integration test for telemetry subscribe/read/live-update flow in `tests/integration/sosreport-generate.resource-subscribe.test.ts`
- [X] T009 [P] [US1] Add contract assertions for telemetry resource URI shape and subscription semantics in `tests/contract/engage-red-hat-support.contract.test.ts`

### Implementation for User Story 1

- [X] T010 [US1] Register CPU telemetry `ResourceTemplate` read handler in `server.ts`
- [X] T011 [US1] Implement telemetry notification dispatcher using `sendResourceUpdated` for subscribed URIs in `server.ts`
- [X] T012 [US1] Extend MCP subscribe/unsubscribe handlers to track telemetry resource subscriptions in `server.ts`
- [X] T013 [US1] Implement widget subscribe/read handlers for troubleshooting mount in `src/mcp-app.ts`
- [X] T014 [US1] Implement widget resource-update handling and table rerender state updates in `src/mcp-app.ts`
- [X] T015 [US1] Render dynamic troubleshooting CPU rows from widget telemetry state in `src/mcp-app/step-content.tsx`
- [X] T016 [US1] Wire telemetry rows and lifecycle callbacks into step composition in `src/mcp-app/App.tsx`

**Checkpoint**: User Story 1 is independently functional with live row updates.

---

## Phase 4: User Story 2 - Keep the table focused on recent values (Priority: P2)

**Goal**: Enforce 1Hz append behavior with rolling cap of 10 rows and drop-oldest policy.

**Independent Test**: Keep troubleshooting active for >10 ticks and verify exactly 10 newest rows remain.

### Tests for User Story 2

- [ ] T017 [P] [US2] Add unit tests for 1Hz append + rolling cap/drop-oldest buffer behavior in `tests/unit/cpu-info-tool-handler.test.ts`
- [ ] T018 [P] [US2] Add integration assertion for row-cap behavior after sustained updates in `tests/integration/engage-red-hat-support.workflow.test.ts`

### Implementation for User Story 2

- [X] T019 [US2] Implement in-memory buffer manager (append, trim to latest 10) in `server.ts`
- [X] T020 [US2] Implement per-session 1-second telemetry job runner calling `get_cpu_information` path in `server.ts`
- [X] T021 [US2] Add transient tick failure handling that preserves subsequent update ticks in `server.ts`
- [X] T022 [US2] Update troubleshooting table presentation for readable rolling rows and RHDS-consistent formatting in `src/mcp-app/rhds-step0.css`

**Checkpoint**: User Story 2 is independently functional with stable rolling-window behavior.

---

## Phase 5: User Story 3 - Maintain session isolation and predictable behavior (Priority: P3)

**Goal**: Prevent cross-session telemetry leakage and cleanly stop updates when troubleshooting subscription ends.

**Independent Test**: Run two sessions concurrently, verify isolation, then exit troubleshooting and confirm unsubscribe cleanup halts updates for that session.

### Tests for User Story 3

- [ ] T023 [P] [US3] Add integration test for session isolation across concurrent telemetry resources in `tests/integration/engage-red-hat-support.workflow.test.ts`
- [X] T024 [P] [US3] Add regression coverage for four-step navigation with troubleshooting cleanup behavior in `tests/regression/engage-four-step-navigation.test.ts`

### Implementation for User Story 3

- [ ] T025 [US3] Enforce session ownership lookup for telemetry resource reads and updates in `server.ts`
- [X] T026 [US3] Stop and dispose per-session telemetry interval jobs when last telemetry subscriber unsubscribes in `server.ts`
- [X] T027 [US3] Implement widget unsubscribe cleanup on troubleshooting step exit/unmount in `src/mcp-app.ts`
- [X] T028 [US3] Guard step transition/gating to avoid stale telemetry updates outside troubleshooting in `src/mcp-app.ts`

**Checkpoint**: User Story 3 is independently functional with strict isolation and deterministic cleanup.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final compatibility checks, documentation sync, and full-surface regression confidence.

- [X] T029 [P] Update skill sequence language to reflect live troubleshooting telemetry before sos generation in `skills/engage-red-hat-support/SKILL.md`
- [ ] T030 [P] Update contract-test expectations for tools/list and schema-shape compatibility in `tests/contract/cpu-information-tools.contract.test.ts`
- [X] T031 [P] Update MCP surface regression expectations for new telemetry resource behavior without breaking existing tools in `tests/regression/mcp-tool-surface-preservation.test.ts`
- [ ] T032 Run full verification commands and record outcomes in `specs/022-cpu-resource-ui/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: no dependencies
- **Phase 2 (Foundational)**: depends on Phase 1; blocks all user stories
- **Phase 3 (US1)**: depends on Phase 2; MVP
- **Phase 4 (US2)**: depends on Phase 3 telemetry pipeline being present
- **Phase 5 (US3)**: depends on Phase 3 and Phase 4 completion
- **Phase 6 (Polish)**: depends on completion of desired user stories

### User Story Dependencies

- **US1 (P1)**: no dependency on other stories once foundational work is complete
- **US2 (P2)**: builds on US1 live resource flow to enforce rolling-window policy
- **US3 (P3)**: builds on US1/US2 to enforce isolation and teardown guarantees

### Within Each User Story

- Tests first (and failing), then implementation, then integration/regression confirmation.
- Server resource lifecycle before widget lifecycle wiring.
- Rendering updates after state and data contracts are in place.

### Parallel Opportunities

- Phase 1 contract-document edits (`T002`, `T003`) can run in parallel.
- US1 tests (`T008`, `T009`) can run in parallel.
- US2 tests (`T017`, `T018`) can run in parallel.
- US3 tests (`T023`, `T024`) can run in parallel.
- Polish tasks (`T029`, `T030`, `T031`) can run in parallel.

---

## Parallel Example: User Story 1

```bash
Task: "Add integration test for telemetry subscribe/read/live-update flow in tests/integration/sosreport-generate.resource-subscribe.test.ts"
Task: "Add contract assertions for telemetry resource URI shape and subscription semantics in tests/contract/engage-red-hat-support.contract.test.ts"
```

## Parallel Example: User Story 2

```bash
Task: "Add unit tests for 1Hz append + rolling cap/drop-oldest buffer behavior in tests/unit/cpu-info-tool-handler.test.ts"
Task: "Add integration assertion for row-cap behavior after sustained updates in tests/integration/engage-red-hat-support.workflow.test.ts"
```

## Parallel Example: User Story 3

```bash
Task: "Add integration test for session isolation across concurrent telemetry resources in tests/integration/engage-red-hat-support.workflow.test.ts"
Task: "Add regression coverage for four-step navigation with troubleshooting cleanup behavior in tests/regression/engage-four-step-navigation.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Setup + Foundational phases.
2. Complete US1 telemetry subscribe/read/notify/render loop.
3. Validate US1 independent test before progressing.

### Incremental Delivery

1. Deliver US1 for live telemetry visibility.
2. Add US2 rolling-window controls (10-row cap/drop-oldest).
3. Add US3 isolation and unsubscribe cleanup guarantees.
4. Finish with polish/regression compatibility tasks.

### Parallel Team Strategy

1. One engineer owns server resource lifecycle tasks.
2. One engineer owns widget lifecycle/render tasks.
3. One engineer owns test/contract/regression updates.
4. Merge per story checkpoint to keep each increment independently testable.
