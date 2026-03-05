# Tasks: Headless Consent Compatibility and Parsing Guarantees

**Input**: Design documents from `/specs/014-headless-consent-compat/`  
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: Include targeted and full-suite validation tasks because the feature requires explicit compatibility and no-regression verification.

**Organization**: Tasks are grouped by user story and include a verify-only bucket so existing implementation can be retained when already compliant.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no unresolved dependencies)
- **[Story]**: User story label (`US1`, `US2`, `US3`) for story-phase tasks only
- Every task includes explicit Definition of Done (DoD)

## Phase 1: Setup (Shared Planning Artifacts)

**Purpose**: Finalize additive 014 planning artifacts without touching historical specs.

- [X] T001 Refresh scope and architecture impact details in `specs/014-headless-consent-compat/plan.md` to match current code baseline; DoD: plan explicitly states additive-only approach, no historical spec edits, and preserved web UI compatibility.
- [X] T002 [P] Reconcile decision log entries in `specs/014-headless-consent-compat/research.md` with no-op-first strategy; DoD: all decisions include rationale and alternatives with zero unresolved clarifications.
- [X] T003 [P] Validate entity definitions and state transitions in `specs/014-headless-consent-compat/data-model.md`; DoD: entities cover permission signal, parsing envelope, sequence enforcement, and web compatibility boundary.
- [X] T004 [P] Align execution and rollout guidance in `specs/014-headless-consent-compat/quickstart.md`; DoD: targeted validation, full-suite validation, and compatibility-first rollout notes are complete.

---

## Phase 2: Foundational (Already Done / Verify Only)

**Purpose**: Prove what is already implemented and only open code deltas where true gaps remain.

**⚠️ CRITICAL**: Complete this phase before story implementation tasks; it controls no-op vs code-change path.

- [X] T005 Build a gap-verification checklist in `specs/014-headless-consent-compat/checklists/requirements.md` mapping FR/AC to existing tests and files; DoD: each FR/AC has pass/fail status and evidence links.
- [X] T006 [P] Verify explicit headless permission behavior evidence in `server.ts` and `tests/integration/sosreport-generate.failures.test.ts`; DoD: checklist records pass with code path and test references or opens concrete delta note.
- [X] T007 [P] Verify structuredContent-first plus text fallback evidence in `README.md`, `docs/operator-guide.md`, `skills/engage-red-hat-support/SKILL.md`, and `tests/integration/sosreport-generate.success.test.ts`; DoD: checklist records pass with source references or opens concrete delta note.
- [X] T008 [P] Verify web/UI no-regression evidence in `tests/integration/engage-red-hat-support.workflow.test.ts`; DoD: checklist records pass for unchanged web consent flow semantics or opens concrete delta note.
- [X] T009 Record no-op decision outcome in `specs/014-headless-consent-compat/plan.md`; DoD: plan contains explicit branch: "no code delta required" or "code deltas required" with reasons.

**Checkpoint**: Verification complete, and required deltas are bounded before user-story execution.

---

## Phase 3: User Story 1 - Explicit Headless Permission Gate (Priority: P1) 🎯 MVP

**Goal**: Ensure invasive diagnostics consent minting in headless/text flows always requires explicit permission and fails closed otherwise.

**Independent Test**: `mint_engage_consent_token` denies without explicit permission, succeeds with explicit permission, and still preserves downstream consent-gated generation behavior.

### Tests for User Story 1

- [X] T010 [P] [US1] Add/adjust explicit permission denial and success assertions in `tests/integration/sosreport-generate.failures.test.ts` and `tests/integration/sosreport-generate.success.test.ts`; DoD: tests cover missing/false permission denial and true permission mint success.
- [X] T011 [P] [US1] Add/adjust contract assertions for explicit permission requirement in `tests/contract/engage-red-hat-support.contract.test.ts`; DoD: contract tests assert required permission semantics and expected denial code behavior.

### Implementation for User Story 1

- [X] T012 [US1] If checklist shows a gap, harden permission gate behavior in `server.ts` for `mint_engage_consent_token`; DoD: mint fails closed when permission is not explicitly true and returns actionable next-step guidance.
- [X] T013 [US1] If checklist shows schema drift, update mint schema constraints in `src/sosreport/sosreport-tool-schemas.ts`; DoD: schema and runtime behavior align with explicit permission contract and existing clients remain compatible.
- [X] T014 [US1] Update 014 permission contract details in `specs/014-headless-consent-compat/contracts/headless-consent-permission.contract.v1.json` to match validated behavior; DoD: contract fields and test assertions are consistent and versioned in 014 only.

**Checkpoint**: US1 is independently testable and passes explicit permission safety expectations.

---

## Phase 4: User Story 2 - Structured-First Parsing with Text Fallback (Priority: P2)

**Goal**: Guarantee bridge/client compatibility for mint output parsing order while preserving current behavior.

**Independent Test**: clients can extract mint fields from `structuredContent` first and still proceed using text fallback parsing when structured fields are unavailable.

### Tests for User Story 2

- [X] T015 [P] [US2] Add/adjust parsing compatibility assertions in `tests/integration/sosreport-generate.success.test.ts`; DoD: tests confirm structured extraction path and text fallback token extraction path.
- [X] T016 [P] [US2] Add/adjust tool-surface contract assertions in `tests/contract/sosreport-tools.contract.test.ts`; DoD: contract tests validate mint output fields and compatibility-related input/output expectations.

### Implementation for User Story 2

- [X] T017 [US2] If checklist shows doc gap, update parsing guidance in `README.md`, `docs/operator-guide.md`, and `skills/engage-red-hat-support/SKILL.md`; DoD: all guidance consistently states structured-first parsing with text fallback.
- [X] T018 [US2] Update parsing compatibility contract in `specs/014-headless-consent-compat/contracts/mint-output-parsing-compat.contract.v1.json`; DoD: contract captures parsing priority, required fields, and failure behavior in sync with tests.
- [X] T019 [US2] If checklist shows runtime output gap, adjust mint response consistency in `server.ts`; DoD: mint responses include canonical fields in structured output and compatible text fallback lines.

**Checkpoint**: US2 is independently testable and confirms bridge/client parsing compatibility.

---

## Phase 5: User Story 3 - Web/UI No-Regression Compatibility (Priority: P3)

**Goal**: Preserve existing web consent flow semantics while formalizing headless compatibility requirements.

**Independent Test**: existing web consent route and UI step behavior remain unchanged with headless compatibility updates in place.

### Tests for User Story 3

- [X] T020 [P] [US3] Add/adjust no-regression checks in `tests/integration/engage-red-hat-support.workflow.test.ts`; DoD: tests verify unchanged web consent semantics and no automatic diagnostics collection.
- [X] T021 [P] [US3] Add/adjust 014 compatibility contract assertions in `tests/contract/engage-red-hat-support.contract.test.ts`; DoD: tests validate web no-regression contract and historical-spec immutability expectations.

### Implementation for User Story 3

- [X] T022 [US3] Update web compatibility contract in `specs/014-headless-consent-compat/contracts/web-consent-regression-compat.contract.v1.json`; DoD: contract explicitly protects existing web route semantics and no additional web user steps.
- [X] T023 [US3] If checklist shows runtime regression risk, apply minimal additive guard in `server.ts` without changing web flow semantics; DoD: web regression tests pass and no UI workflow behavior changes.

**Checkpoint**: US3 is independently testable and confirms unchanged web UX behavior.

---

## Phase 6: Polish, Validation Runs, and Release Readiness

**Purpose**: Final verification, compatibility signaling, and release-readiness closure.

- [X] T024 [P] Run targeted validation commands documented in `specs/014-headless-consent-compat/quickstart.md`; DoD: targeted integration and contract commands complete successfully and results are recorded in quickstart notes.
- [X] T025 Run full suites from `specs/014-headless-consent-compat/quickstart.md` (`test:unit`, `test:contract`, `test:integration`, `test:regression`); DoD: full-suite status recorded and failures triaged or resolved.
- [X] T026 [P] Finalize release-readiness checklist in `specs/014-headless-consent-compat/checklists/requirements.md` for bridge/client compatibility guidance; DoD: checklist confirms explicit permission gate, parsing compatibility, web no-regression, and additive-only spec integrity.
- [X] T027 [P] Update release and operator guidance wording in `README.md` and `docs/operator-guide.md`; DoD: notes clearly state compatibility-hardening scope and "no web flow behavior changes."
- [X] T028 Close out implementation outcomes and no-op/code-delta decision in `specs/014-headless-consent-compat/plan.md` and `specs/014-headless-consent-compat/quickstart.md`; DoD: final documents specify what changed, what was verify-only, and how bridge clients remain backward compatible.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: starts immediately.
- **Phase 2 (Verify-only foundation)**: depends on Phase 1; blocks all story phases.
- **Phase 3 (US1)**: depends on Phase 2 completion.
- **Phase 4 (US2)**: depends on Phase 2 completion; can run parallel with US3 after Phase 2 if staffed.
- **Phase 5 (US3)**: depends on Phase 2 completion; can run parallel with US2 after Phase 2 if staffed.
- **Phase 6 (Polish/validation/release)**: depends on completion of selected story phases.

### User Story Dependencies

- **US1 (P1)**: no dependency on other user stories after foundational verification.
- **US2 (P2)**: no strict dependency on US1; integrates with shared mint output behavior.
- **US3 (P3)**: independent story focused on web no-regression guarantees.

### Within Each User Story

- Prefer tests and contract assertions first.
- Apply implementation/doc/contract deltas only where foundational verification found gaps.
- Re-run story-specific tests before moving to next phase.

### Parallel Opportunities

- Foundational evidence tasks `T006`, `T007`, and `T008`.
- US1 test and contract tasks `T010` and `T011`.
- US2 test and contract tasks `T015` and `T016`.
- US3 test and contract tasks `T020` and `T021`.
- Polish tasks `T024`, `T026`, and `T027`.

---

## Parallel Example: User Story 2

```bash
Task: "T015 [US2] Add/adjust parsing compatibility assertions in tests/integration/sosreport-generate.success.test.ts"
Task: "T016 [US2] Add/adjust tool-surface contract assertions in tests/contract/sosreport-tools.contract.test.ts"
Task: "T018 [US2] Update parsing compatibility contract in specs/014-headless-consent-compat/contracts/mint-output-parsing-compat.contract.v1.json"
```

---

## Implementation Strategy

### MVP First (US1 only)

1. Complete Setup + Foundational verify-only phases.
2. Complete US1 tasks to lock explicit permission gate guarantees.
3. Validate US1 independently with targeted tests.
4. Stop and confirm no web regressions before expanding scope.

### Incremental Delivery

1. Finish verify-only foundation and no-op/code-delta decision.
2. Deliver US1 safety guarantees.
3. Deliver US2 parsing compatibility guarantees.
4. Deliver US3 web compatibility guarantees.
5. Execute final validation and release-readiness tasks.

### Retain Existing Implementation

- Prefer verify-only completion where behavior is already compliant.
- Apply code changes only for gaps proven by Phase 2 evidence tasks.
- Keep all changes additive and limited to active feature package + targeted docs/tests/code deltas.
