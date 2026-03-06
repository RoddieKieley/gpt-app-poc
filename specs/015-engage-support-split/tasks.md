# Tasks: UI-First Split Readiness Updates

**Input**: Design documents from `/specs/015-engage-support-split/`  
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`

**Tests**: Required for this feature to prove text-only bridge compatibility and web/UI non-regression.

**Organization**: Tasks are grouped by user-story style phases to keep each increment independently testable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on incomplete tasks)
- **[Story]**: User-story phase label (`[US1]`, `[US2]`, `[US3]`, `[US4]`)

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare implementation scaffolding and guardrails for targeted split-readiness changes.

- [X] T001 Validate baseline artifacts in `specs/015-engage-support-split/plan.md`, `specs/015-engage-support-split/spec.md`, and `specs/015-engage-support-split/quickstart.md` before code/doc changes
- [X] T002 [P] Add a migration-note checklist section in `specs/015-engage-support-split/quickstart.md` that explicitly excludes new headless skill creation in this feature
- [X] T003 [P] Add a read-only baseline reference table in `specs/015-engage-support-split/research.md` for `specs/014-headless-consent-compat/contracts/headless-consent-permission.contract.v1.json`, `specs/014-headless-consent-compat/contracts/mint-output-parsing-compat.contract.v1.json`, and `specs/014-headless-consent-compat/contracts/web-consent-regression-compat.contract.v1.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish shared constraints that all story phases depend on.

**⚠️ CRITICAL**: No user-story work should start until this phase is complete.

- [X] T004 Add explicit scope guardrails in `specs/015-engage-support-split/plan.md` stating "no new headless skill implementation or registration in this feature"
- [X] T005 [P] Add deterministic key-format guidance (`key: value`) for `job_id`, `fetch_reference`, and `connection_id` in `specs/015-engage-support-split/data-model.md`
- [X] T006 [P] Add compatibility invariants section in `specs/015-engage-support-split/contracts/web-ui-split-readiness-regression.contract.v1.json` that preserves existing web/UI behavior and forbids retroactive edits to `specs/014-headless-consent-compat/contracts/*`

**Checkpoint**: Shared constraints and compatibility baselines are documented.

---

## Phase 3: User Story 1 - UI-vs-headless assumption mapping artifacts (Priority: P1) 🎯 MVP

**Goal**: Produce explicit, consumable mapping artifacts for host capability assumptions and routing decisions.

**Independent Test**: A reviewer can read only `specs/015-engage-support-split/data-model.md` and `specs/015-engage-support-split/research.md` and identify deterministic routing behavior for UI-capable vs text-only hosts without ambiguity.

### Implementation for User Story 1

- [X] T007 [US1] Create `specs/015-engage-support-split/ui-headless-assumption-map.md` with host capability matrix, blocking handoffs, and workaround inventory for text-only bridges
- [X] T008 [P] [US1] Add routing decision examples for UI-capable and text-only hosts in `specs/015-engage-support-split/ui-headless-assumption-map.md`
- [X] T009 [P] [US1] Add explicit mapping from blocking handoffs to critical keys (`job_id`, `fetch_reference`, `connection_id`) in `specs/015-engage-support-split/ui-headless-assumption-map.md`
- [X] T010 [US1] Link `specs/015-engage-support-split/ui-headless-assumption-map.md` from `specs/015-engage-support-split/quickstart.md` and `specs/015-engage-support-split/plan.md`

**Checkpoint**: Assumption mapping artifacts are complete and independently reviewable.

---

## Phase 4: User Story 2 - Skill/doc wording updates for fallback routing (Priority: P1)

**Goal**: Make the main skill explicitly UI-first and document alternate headless fallback routing semantics for non-UI hosts.

**Independent Test**: Reading `skills/engage-red-hat-support/SKILL.md`, `docs/operator-guide.md`, and `docs/security-model.md` clearly shows UI-first behavior, fallback URI placeholder behavior, and unchanged PAT/consent boundaries.

### Implementation for User Story 2

- [X] T011 [US2] Update UI-first and non-UI fallback routing wording in `skills/engage-red-hat-support/SKILL.md` with alternate headless skill URI placeholder text
- [X] T012 [P] [US2] Add operator environment-selection guidance (UI-capable vs text-only) and fallback parsing expectations in `docs/operator-guide.md`
- [X] T013 [P] [US2] Add migration note section in `docs/operator-guide.md` describing "UI-first skill + alternate headless skill route" semantics without creating new skill files
- [X] T014 [US2] Update `docs/security-model.md` with text fallback parsing guarantees for critical keys while preserving PAT secure-intake and explicit-consent constraints
- [X] T015 [US2] Add explicit "out of scope" statement to `skills/engage-red-hat-support/SKILL.md` and `docs/operator-guide.md` that new headless skill implementation is excluded from this feature

**Checkpoint**: Skill and operator/security docs are aligned and unambiguous.

---

## Phase 5: User Story 3 - Contract hardening for critical key parity (Priority: P2)

**Goal**: Harden contracts so text fallback remains deterministic and value-parity-safe with `structuredContent`.

**Independent Test**: Contract files in `specs/015-engage-support-split/contracts/` explicitly require deterministic parsing and parity for `job_id`, `fetch_reference`, and `connection_id`, while `specs/014-headless-consent-compat/contracts/*` remain unchanged.

### Implementation for User Story 3

- [X] T016 [US3] Extend `specs/015-engage-support-split/contracts/handoff-text-structured-parity.contract.v1.json` with explicit pass/fail rules for missing, duplicate, and mismatched critical keys
- [X] T017 [P] [US3] Extend `specs/015-engage-support-split/contracts/ui-headless-routing-semantics.contract.v1.json` to require alternate headless URI placeholder guidance only (no registration/implementation)
- [X] T018 [P] [US3] Extend `specs/015-engage-support-split/contracts/web-ui-split-readiness-regression.contract.v1.json` with explicit web/UI non-regression matrix and baseline references to `specs/014-headless-consent-compat/contracts/*`
- [X] T019 [US3] Add contract linkage notes in `specs/015-engage-support-split/quickstart.md` describing how 015 contracts augment (not replace) 014 compatibility baselines
- [X] T020 [US3] Verify and document that no files under `specs/014-headless-consent-compat/contracts/` were modified in this feature by adding a check item to `specs/015-engage-support-split/checklists/requirements.md`

**Checkpoint**: Contract hardening is complete with non-retroactive compatibility preserved.

---

## Phase 6: User Story 4 - Tests for text-only bridge compatibility and web non-regression (Priority: P2)

**Goal**: Add automated proof for deterministic text-only completion and unchanged web/UI behavior.

**Independent Test**: Running targeted contract/integration tests proves (1) text-only progression across critical handoffs and (2) no regression in existing web/UI flow semantics.

### Tests for User Story 4

- [X] T021 [P] [US4] Add contract assertions for 015 split-readiness contracts in `tests/contract/engage-red-hat-support.contract.test.ts`
- [X] T022 [P] [US4] Add integration assertions for text-only parsing parity of `job_id` and `fetch_reference` in `tests/integration/sosreport-generate.success.test.ts`
- [X] T023 [P] [US4] Add integration assertions for deterministic `connection_id` text+structured parity in `tests/integration/jira-connection.lifecycle.test.ts`
- [X] T024 [US4] Add web/UI non-regression assertions for fallback-routing additions in `tests/integration/engage-red-hat-support.workflow.test.ts`
- [X] T025 [US4] Add/extend text-only bridge harness helper in `tests/integration/consent-test-helpers.ts` to simulate clients that ignore `structuredContent`
- [X] T026 [US4] Ensure targeted tests execute with deterministic commands documented in `specs/015-engage-support-split/quickstart.md`

### Implementation for User Story 4

- [X] T027 [US4] Update `specs/015-engage-support-split/quickstart.md` with final expected test command set for contract/integration/regression validation

**Checkpoint**: Automated checks cover text-only compatibility and web non-regression.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final consistency pass, documentation alignment, and full validation run.

- [X] T028 [P] Run docs consistency pass across `skills/engage-red-hat-support/SKILL.md`, `docs/operator-guide.md`, and `docs/security-model.md` for shared routing/security wording
- [X] T029 [P] Verify contract/docs consistency across `specs/015-engage-support-split/contracts/*.json`, `specs/015-engage-support-split/spec.md`, and `specs/015-engage-support-split/plan.md`
- [X] T030 Execute targeted suites `tests/contract/engage-red-hat-support.contract.test.ts`, `tests/integration/engage-red-hat-support.workflow.test.ts`, `tests/integration/sosreport-generate.success.test.ts`, and `tests/integration/jira-connection.lifecycle.test.ts`
- [X] T031 Execute broader non-regression suites via `npm run test:contract`, `npm run test:integration`, and `npm run test:regression`
- [X] T032 Update `specs/015-engage-support-split/quickstart.md` with final validation outcomes and explicit statement that no new headless skill implementation was added

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: Starts immediately.
- **Phase 2 (Foundational)**: Depends on Phase 1; blocks all user-story phases.
- **Phase 3 (US1)**: Depends on Phase 2.
- **Phase 4 (US2)**: Depends on Phase 3 assumption mapping outputs.
- **Phase 5 (US3)**: Depends on Phases 3-4 for final wording and routing semantics.
- **Phase 6 (US4)**: Depends on Phase 5 contract hardening and Phase 4 wording updates.
- **Phase 7 (Polish)**: Depends on all prior phases.

### User Story Dependencies

- **US1**: No story dependency after foundational phase.
- **US2**: Depends on US1 artifact clarity.
- **US3**: Depends on US1 mapping and US2 wording alignment.
- **US4**: Depends on US3 contracts and US2 wording behavior.

### Within Each User Story

- Mapping/docs/contracts tasks complete before phase-specific verification tasks.
- Contract updates complete before contract/integration test updates.
- Test execution tasks complete before final polish closure.

### Parallel Opportunities

- Setup tasks marked `[P]` can run concurrently.
- In US2, doc updates to `docs/operator-guide.md` and `docs/security-model.md` are parallelizable.
- In US3, contract-file updates are parallelizable across the three 015 contract files.
- In US4, contract/integration test file updates are parallelizable across separate test files.
- In Polish, consistency checks can run in parallel before test execution tasks.

---

## Parallel Example: User Story 1

```bash
Task: "Add routing decision examples in specs/015-engage-support-split/ui-headless-assumption-map.md"
Task: "Add critical-key handoff mapping in specs/015-engage-support-split/ui-headless-assumption-map.md"
```

## Parallel Example: User Story 2

```bash
Task: "Add environment-selection and migration guidance in docs/operator-guide.md"
Task: "Add fallback security guarantees in docs/security-model.md"
```

## Parallel Example: User Story 3

```bash
Task: "Harden handoff parity rules in specs/015-engage-support-split/contracts/handoff-text-structured-parity.contract.v1.json"
Task: "Harden routing semantics in specs/015-engage-support-split/contracts/ui-headless-routing-semantics.contract.v1.json"
Task: "Harden non-regression matrix in specs/015-engage-support-split/contracts/web-ui-split-readiness-regression.contract.v1.json"
```

## Parallel Example: User Story 4

```bash
Task: "Add 015 contract assertions in tests/contract/engage-red-hat-support.contract.test.ts"
Task: "Add job_id/fetch_reference parity checks in tests/integration/sosreport-generate.success.test.ts"
Task: "Add connection_id parity checks in tests/integration/jira-connection.lifecycle.test.ts"
```

---

## Implementation Strategy

### MVP First (US1)

1. Complete Phases 1-2.
2. Complete Phase 3 (US1 mapping artifacts).
3. Validate US1 independently using phase checkpoint criteria.

### Incremental Delivery

1. Deliver US1 mapping artifacts.
2. Deliver US2 wording updates.
3. Deliver US3 contract hardening.
4. Deliver US4 automated verification.
5. Finish with Phase 7 polish and full validation run.

### Explicit Exclusion

- This task plan explicitly excludes creating or registering a new headless skill implementation file in this feature package.
