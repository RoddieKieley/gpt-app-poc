# Tasks: PatternFly Increment 1 - Minimal Like-for-Like UI Swap

**Input**: Design documents from `/specs/012-patternfly-ui-swap/`  
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: Included, because this increment requires explicit parity verification and regression checks for contracts, routing, PAT handling, and fallback behavior.

**Organization**: Tasks are grouped by setup/foundation and then by user story priority, with additional step-focused phases for US1 to keep work small and executable.

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup and Dependency Tasks

**Purpose**: Add required UI dependencies and lock baseline before migration.

- [X] T001 Capture pre-migration baseline behavior notes for step gates/routes/contracts in `specs/012-patternfly-ui-swap/quickstart.md`
- [X] T002 Add React and PatternFly dependencies in `package.json`
- [X] T003 [P] Add TypeScript React types in `package.json`
- [X] T004 [P] Verify Vite TSX build support and keep single-file behavior in `vite.config.ts`
- [X] T005 Run install and produce lockfile updates in `package-lock.json`
- [X] T006 Run baseline build before UI migration in `package.json` scripts (`npm run build`) and record result in `specs/012-patternfly-ui-swap/quickstart.md`
- [X] T007 Run baseline contract/integration/regression suites (`npm run test:contract`, `npm run test:integration`, `npm run test:regression`) and record result in `specs/012-patternfly-ui-swap/quickstart.md`

**Checkpoint (behavior parity)**: Baseline behavior and test/build status are documented before any rendering changes.

**Verification tasks (phase exit)**:

- [X] T008 Verify no pre-migration contract drift by reviewing `specs/012-patternfly-ui-swap/contracts/engage-patternfly-migration.contract.v1.json` against current behavior

---

## Phase 2: Foundational - React Bootstrap and Shell Tasks

**Purpose**: Introduce React mount shell and shared UI scaffolding without changing workflow behavior.

**⚠️ CRITICAL**: No step-specific porting starts before this phase is complete.

- [X] T009 Create React app shell component skeleton with Wizard container in `src/mcp-app/App.tsx`
- [X] T010 [P] Create step presentational component stubs in `src/mcp-app/step-content.tsx`
- [X] T011 [P] Define parity-safe UI state/types in `src/mcp-app/state.ts`
- [X] T012 Replace raw HTML controls with React mount container in `mcp-app.html`
- [X] T013 Bootstrap React render root while preserving existing workflow logic entrypoint in `src/mcp-app.ts`
- [X] T014 Wire status presentation model (Alert placeholder, no behavior changes) in `src/mcp-app/App.tsx`

**Checkpoint (behavior parity)**: App loads through the same entry resource with React shell and no functional step flow changes.

**Verification tasks (phase exit)**:

- [X] T015 Build and smoke-serve the shell migration (`npm run build`, `npm run serve`) and record results in `specs/012-patternfly-ui-swap/quickstart.md`
- [X] T016 Verify entrypoint and step URI compatibility still resolves (`ui://engage-red-hat-support/app.html` and step URIs) via checks documented in `specs/012-patternfly-ui-swap/quickstart.md`

---

## Phase 3: User Story 1 - Step 1 Port (Priority: P1) 🎯 MVP start

**Goal**: Port Step 1 to PatternFly while preserving Linux selection gate and transition behavior.

**Independent Test**: Selecting Linux and continuing produces the same Step 1 gate outcomes and transition to Step 2 as baseline.

### Tests for User Story 1 (Step 1 slice)

- [X] T017 [P] [US1] Add Step 1 gate/continue parity integration assertions in `tests/integration/engage-red-hat-support.workflow.test.ts`
- [X] T018 [P] [US1] Add Step 1 contract-preservation assertions for unchanged tool surface in `tests/contract/engage-red-hat-support.contract.test.ts`

### Implementation for User Story 1 (Step 1 slice)

- [X] T019 [US1] Implement PatternFly Step 1 form (`Form`, `FormGroup`, `Select`, `ActionGroup`, `Button`) in `src/mcp-app/step-content.tsx`
- [X] T020 [US1] Bind Step 1 PatternFly controls to existing `ensureLinuxSelection` and continue handlers in `src/mcp-app.ts`
- [X] T021 [US1] Preserve Step 1 status/error messaging semantics in `src/mcp-app/App.tsx`

**Checkpoint (behavior parity)**: Step 1 UX is PatternFly-based and Step 1 gate behavior remains unchanged.

**Verification tasks (phase exit)**:

- [X] T022 [US1] Run targeted Step 1 parity checks (`tsx --test tests/integration/engage-red-hat-support.workflow.test.ts`) and log outcome in `specs/012-patternfly-ui-swap/quickstart.md`

---

## Phase 4: User Story 1 - Step 2 Port (Priority: P1) 🎯

**Goal**: Port Step 2 to PatternFly while preserving explicit consent, generate/fetch sequence, and polling behavior.

**Independent Test**: Generate/fetch flow, consent gate handling, and Step 2 -> Step 3 readiness behavior match baseline.

### Tests for User Story 1 (Step 2 slice)

- [X] T023 [P] [US1] Add Step 2 generate/fetch and gating parity integration assertions in `tests/integration/engage-red-hat-support.workflow.test.ts`
- [X] T024 [P] [US1] Add Step 2 tool argument parity assertions for `generate_sosreport` and `fetch_sosreport` in `tests/contract/sosreport-tools.contract.test.ts`

### Implementation for User Story 1 (Step 2 slice)

- [X] T025 [US1] Implement PatternFly Step 2 controls (`Form`, `FormGroup`, `TextInput`, `ActionGroup`, `Button`) in `src/mcp-app/step-content.tsx`
- [X] T026 [US1] Bind Step 2 PatternFly controls to existing consent/generate/fetch/polling handlers in `src/mcp-app.ts`
- [X] T027 [US1] Preserve Step 2 continue gate (`artifact_ref`) behavior in `src/mcp-app.ts`

**Checkpoint (behavior parity)**: Step 2 remains explicit-action driven with unchanged gate success/failure outcomes.

**Verification tasks (phase exit)**:

- [X] T028 [US1] Run targeted Step 2 integration and contract checks (`tsx --test tests/integration/engage-red-hat-support.workflow.test.ts` and `tsx --test tests/contract/sosreport-tools.contract.test.ts`) and record in `specs/012-patternfly-ui-swap/quickstart.md`

---

## Phase 5: User Story 1 - Step 3 Port (Priority: P1) 🎯 MVP complete

**Goal**: Port Step 3 to PatternFly while preserving connect/verify/list/attach/disconnect behavior and attach preconditions.

**Independent Test**: Step 3 action availability, failure states, and successful attach flow behavior match baseline.

### Tests for User Story 1 (Step 3 slice)

- [X] T029 [P] [US1] Add Step 3 action-sequence parity integration assertions in `tests/integration/engage-red-hat-support.workflow.test.ts`
- [X] T030 [P] [US1] Add Jira workflow contract parity assertions for unchanged tool names/args in `tests/contract/engage-red-hat-support.contract.test.ts`

### Implementation for User Story 1 (Step 3 slice)

- [X] T031 [US1] Implement PatternFly Step 3 controls (`Form`, `FormGroup`, `TextInput`, `ActionGroup`, `Button`) in `src/mcp-app/step-content.tsx`
- [X] T032 [US1] Bind Step 3 PatternFly actions to existing connect/verify/list/attach/disconnect handlers in `src/mcp-app.ts`
- [X] T033 [US1] Preserve Step 3 attach precondition gates and completion state behavior in `src/mcp-app.ts`

**Checkpoint (behavior parity)**: Full 3-step workflow is PatternFly-rendered and independently functional.

**Verification tasks (phase exit)**:

- [X] T034 [US1] Run end-to-end workflow parity integration test (`tsx --test tests/integration/engage-red-hat-support.workflow.test.ts`) and record in `specs/012-patternfly-ui-swap/quickstart.md`

---

## Phase 6: User Story 2 - Hash Routing Compatibility (Priority: P2)

**Goal**: Preserve `#step-1`, `#step-2`, and `#step-3` deep-link behavior with unchanged gate outcomes.

**Independent Test**: Direct hash navigation yields identical allowed/blocked behavior to baseline.

### Tests for User Story 2

- [X] T035 [P] [US2] Add explicit hash-route parity integration cases for valid/invalid gate states in `tests/integration/engage-red-hat-support.workflow.test.ts`

### Implementation for User Story 2

- [X] T036 [US2] Bind PatternFly Wizard navigation to existing hash/step resolution logic in `src/mcp-app.ts`
- [X] T037 [US2] Ensure route bootstrap semantics remain unchanged after PatternFly migration in `src/mcp-app.ts`

**Checkpoint (behavior parity)**: Hash routing and gate-block behavior are unchanged from baseline.

**Verification tasks (phase exit)**:

- [X] T038 [US2] Run hash-routing parity checks (`tsx --test tests/integration/engage-red-hat-support.workflow.test.ts`) and record in `specs/012-patternfly-ui-swap/quickstart.md`

---

## Phase 7: User Story 3 - Contracts, Security Boundary, and Fallback (Priority: P3)

**Goal**: Preserve MCP/tool/metadata contracts, PAT boundary, and fallback behavior while using PatternFly UI.

**Independent Test**: Tool signatures and metadata remain stable, PAT clearing behavior is unchanged, and fallback remains available when UI is unavailable.

### Tests for User Story 3

- [X] T039 [P] [US3] Add PAT clearing parity assertions after connect flow in `tests/integration/engage-red-hat-support.workflow.test.ts`
- [X] T040 [P] [US3] Add regression assertions for URI and metadata compatibility in `tests/regression/mcp-tool-surface-preservation.test.ts`
- [X] T041 [P] [US3] Add fallback-preservation regression assertions in `tests/regression/skill-resource-preservation.test.ts`

### Implementation for User Story 3

- [X] T042 [US3] Replace status text line with inline PatternFly `Alert` while preserving message semantics in `src/mcp-app/App.tsx`
- [X] T043 [US3] Add PatternFly `Spinner` only for generate polling/in-flight states in `src/mcp-app/App.tsx` and `src/mcp-app.ts`
- [X] T044 [US3] Verify and preserve PAT clearing immediately after connect in `src/mcp-app.ts`
- [X] T045 [US3] Validate server-side resource URI and `openai/outputTemplate` wiring remain unchanged in `server.ts`

**Checkpoint (behavior parity)**: Contracts/security/fallback boundaries are preserved after UI migration.

**Verification tasks (phase exit)**:

- [X] T046 [US3] Run targeted contract and regression suites (`npm run test:contract` and `npm run test:regression`) and log results in `specs/012-patternfly-ui-swap/quickstart.md`

---

## Phase 8: Polish and Build/Lint/Test/Regression Tasks

**Purpose**: Final cross-cutting validation and release readiness.

- [X] T047 [P] Refresh migration contract evidence if needed in `specs/012-patternfly-ui-swap/contracts/engage-patternfly-migration.contract.v1.json`
- [X] T048 [P] Refresh UI mapping evidence if needed in `specs/012-patternfly-ui-swap/contracts/engage-ui-component-map.v1.json`
- [X] T049 [P] Refresh verification checklist evidence if needed in `specs/012-patternfly-ui-swap/contracts/engage-verification-regression-checklist.v1.json`
- [X] T050 Run final build and full test matrix (`npm run build`, `npm run test:unit`, `npm run test:contract`, `npm run test:integration`, `npm run test:regression`) and record in `specs/012-patternfly-ui-swap/quickstart.md`
- [X] T051 Run final MCP URI/meta contract compatibility regression check against `ui://engage-red-hat-support/*` and `openai/outputTemplate` references in `tests/regression/mcp-tool-surface-preservation.test.ts` and `server.ts`
- [X] T052 Update final implementation verification notes and parity sign-off in `specs/012-patternfly-ui-swap/plan.md` and `specs/012-patternfly-ui-swap/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup and Dependency Tasks)**: Starts immediately.
- **Phase 2 (React Bootstrap and Shell Tasks)**: Depends on Phase 1; blocks all step ports.
- **Phase 3-5 (US1 Step 1/2/3 ports)**: Depend on Phase 2 and proceed in sequence for smallest-safe migration.
- **Phase 6 (US2 Hash Routing)**: Depends on US1 step ports to validate routed UI parity on migrated views.
- **Phase 7 (US3 Contracts/Security/Fallback)**: Depends on Phases 3-6 for complete UI surface.
- **Phase 8 (Polish)**: Depends on all story phases.

### User Story Dependencies

- **US1 (P1)**: Starts after Phase 2 and delivers MVP (full 3-step workflow parity).
- **US2 (P2)**: Starts after US1 port completion; focuses only on route-compatibility parity.
- **US3 (P3)**: Starts after US1/US2 to validate contract/security/fallback boundaries across final migrated UI.

### Within Each User Story

- Add/adjust tests first, then implement, then run phase verification checkpoint tasks.
- Keep handlers/tool calls unchanged; only migrate UI rendering and event binding.

### Parallel Opportunities

- Phase 1: T003 and T004 can run in parallel after T002.
- Phase 2: T010 and T011 can run in parallel after T009.
- US1 phases: each pair of `[P]` test tasks can run in parallel.
- US3: T039, T040, and T041 can run in parallel.
- Phase 8: T047, T048, and T049 can run in parallel before T050.

---

## Parallel Example: User Story 1

```bash
Task: "T023 [US1] Add Step 2 integration parity assertions in tests/integration/engage-red-hat-support.workflow.test.ts"
Task: "T024 [US1] Add Step 2 contract parity assertions in tests/contract/sosreport-tools.contract.test.ts"
```

## Parallel Example: User Story 2

```bash
Task: "T035 [US2] Add hash-route parity integration cases in tests/integration/engage-red-hat-support.workflow.test.ts"
Task: "T038 [US2] Run hash-routing parity checks and record results in specs/012-patternfly-ui-swap/quickstart.md"
```

## Parallel Example: User Story 3

```bash
Task: "T039 [US3] Add PAT clearing parity assertions in tests/integration/engage-red-hat-support.workflow.test.ts"
Task: "T040 [US3] Add URI/metadata regression assertions in tests/regression/mcp-tool-surface-preservation.test.ts"
Task: "T041 [US3] Add fallback regression assertions in tests/regression/skill-resource-preservation.test.ts"
```

---

## Implementation Strategy

### MVP First (US1)

1. Complete Phase 1 and Phase 2.
2. Complete Phases 3-5 (US1 Step 1 -> Step 2 -> Step 3).
3. Stop and validate full workflow parity before moving on.

### Incremental Delivery

1. Ship US1 (full workflow parity on PatternFly).
2. Add US2 hash-route compatibility parity checks/fixes.
3. Add US3 contract/security/fallback parity hardening.
4. Finish with full build/test/regression verification.

### Parallel Team Strategy

1. One engineer handles shell/bootstrap (Phase 2) while another prepares parity tests for US1.
2. After US1 is stable, route-compatibility (US2) and contract/security regressions (US3) can progress concurrently.

---

## Notes

- `[P]` tasks are parallelizable by file independence and dependency order.
- Every phase includes a parity checkpoint plus verification tasks.
- Final release gate requires the explicit MCP URI/meta contract compatibility regression task (`T051`).
