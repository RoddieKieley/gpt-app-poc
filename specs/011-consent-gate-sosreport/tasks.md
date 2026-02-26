# Tasks: Backend Human-Consent Gate for `generate_sosreport`

**Input**: Design documents from `/specs/011-consent-gate-sosreport/`  
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`

**Tests**: Included because the feature spec explicitly requires contract, integration, and regression coverage.

**Organization**: Tasks are grouped by user story priority and aligned to required task groupings:
1) Consent token backend + storage primitives  
2) Policy middleware + `generate_sosreport` enforcement  
3) UI Step 2 explicit consent flow + non-UI fallback text updates  
4) Contracts/skill/docs alignment  
5) Contract/integration/regression tests + full verification run

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare repo for consent-gate implementation and deterministic tests.

- [X] T001 Add consent-gate configuration defaults and test-safe overrides in `server.ts`
  - Expected output: Server reads `CONSENT_TOKEN_SIGNING_KEY` and `CONSENT_TOKEN_TTL_SECONDS` with safe fallback for tests only.
  - Acceptance checks: Server starts in test mode without missing env crashes; non-test path requires explicit signing key.
- [X] T002 [P] Add reusable consent test fixtures/helpers in `tests/integration/sosreport-generate.failures.test.ts` and `tests/integration/sosreport-generate.success.test.ts`
  - Expected output: Shared helper code for minting/using consent tokens and setting user/session headers in tests.
  - Acceptance checks: Integration test files compile and can reuse helper paths without duplicating setup logic.
- [X] T003 [P] Add baseline no-secret-log assertions for consent token flows in `tests/regression/no-pat-leakage-mcp.test.ts`
  - Expected output: Regression harness checks that PAT/raw token values never appear in MCP-visible/log-safe text.
  - Acceptance checks: Test explicitly scans denial/success text paths for prohibited secret-bearing fields.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared security primitives required before user stories.

**⚠️ CRITICAL**: No user story implementation starts before this phase is complete.

- [X] T004 Create consent token primitives (mint/verify/consume interfaces and claim types) in `src/security/consent-token-service.ts`
  - Expected output: Service API supporting signed token mint, claim verification, and one-time consume with `jti`.
  - Acceptance checks: Type definitions include user/session/scope/step/exp/jti; service returns structured deny reasons.
- [X] T005 [P] Create centralized sensitive-tool policy decision layer in `src/security/sensitive-tool-policy.ts`
  - Expected output: Policy function that can authorize/deny sensitive tool calls using consent evidence.
  - Acceptance checks: Policy contract includes fail-closed deny responses and safe actionable text.
- [X] T006 [P] Extend security event/redaction surfaces for consent-denial logging in `src/security/security-events.ts` and `src/security/redaction.ts`
  - Expected output: Consent-related events and redaction helpers for token-safe logging.
  - Acceptance checks: No raw consent token or PAT content is emitted by event payload helpers.
- [X] T007 Add foundational unit coverage for token service and policy module in `tests/unit/consent-token-service.test.ts` and `tests/unit/sensitive-tool-policy.test.ts`
  - Expected output: Unit tests for signature checks, expiry, binding, single-use consume, replay denial, and safe denial text.
  - Acceptance checks: Tests fail before implementation and pass after; all required reason codes are asserted.

**Checkpoint**: Consent/token/policy foundation is ready for story-level integration.

---

## Phase 3: User Story 1 - Explicit Human Consent Before Diagnostics (Priority: P1) 🎯 MVP

**Goal**: Ensure `generate_sosreport` cannot execute without a valid one-time consent token from explicit human action.

**Independent Test**: `generate_sosreport` is denied for missing/invalid/expired/replayed consent and succeeds once for a valid token.

### Tests for User Story 1

- [X] T008 [P] [US1] Add contract assertions for required `consent_token` input on `generate_sosreport` in `tests/contract/sosreport-tools.contract.test.ts`
  - Expected output: Contract test checks tool schema includes required consent evidence while keeping tool name stable.
  - Acceptance checks: Test fails if `consent_token` is missing or if tool name/metadata drift unexpectedly.
- [X] T009 [P] [US1] Add integration denial matrix (missing, invalid, expired, replay, wrong-user, wrong-scope) in `tests/integration/sosreport-generate.failures.test.ts`
  - Expected output: Explicit negative-path cases mapped to safe actionable denial text.
  - Acceptance checks: Every case asserts no diagnostics execution and appropriate denial reason handling.
- [X] T010 [P] [US1] Add integration happy path for single valid token use in `tests/integration/sosreport-generate.success.test.ts`
  - Expected output: Test proves one successful generation call with valid consent followed by replay denial.
  - Acceptance checks: First call succeeds with expected structured content; second call with same token fails.

### Implementation for User Story 1 (Task Group 1)

- [X] T011 [US1] Implement secure consent mint endpoint for explicit Step 2 action in `server.ts`
  - Expected output: New backend endpoint returns signed short-lived token with required claims.
  - Acceptance checks: Endpoint binds token to request user/session and only issues for `scope=generate_sosreport`, `step=2`.
- [X] T012 [US1] Implement signed claim verification and one-time consume semantics in `src/security/consent-token-service.ts`
  - Expected output: Verification pipeline rejects tampering, expiry, wrong binding/scope/step, and consumed `jti`.
  - Acceptance checks: Service returns deterministic deny codes and marks `jti` consumed on first successful authorization.
- [X] T013 [US1] Require `consent_token` in `generate_sosreport` schema in `src/sosreport/sosreport-tool-schemas.ts`
  - Expected output: Updated schema includes required consent token while preserving existing sosreport option validation.
  - Acceptance checks: Schema rejects calls missing `consent_token`; existing plugin/log-size validation still passes.
- [X] T014 [US1] Wire consent authorization before diagnostics execution in `server.ts` and `src/sosreport/sosreport-tool-handlers.ts`
  - Expected output: Tool call path fails closed before command execution when consent is invalid.
  - Acceptance checks: No call to diagnostics runner occurs on deny; allow path proceeds exactly once per token.

**Checkpoint**: User Story 1 is independently functional and testable (MVP).

---

## Phase 4: User Story 2 - Consistent Policy Enforcement on Sensitive Tools (Priority: P2)

**Goal**: Centralize sensitive-tool authorization so consent validation cannot be bypassed.

**Independent Test**: Policy module is the single gate for sensitive tool calls, and all invalid evidence conditions are denied with safe text.

### Tests for User Story 2

- [X] T015 [P] [US2] Add policy-focused contract checks in `tests/contract/engage-red-hat-support.contract.test.ts`
  - Expected output: Contract verifies consent gate requirement and stable entry/tool/resource compatibility constraints.
  - Acceptance checks: Test fails if consent gate contract is removed, bypassed, or conflicts with compatibility rules.
- [X] T016 [P] [US2] Add integration test that policy denial blocks diagnostics start in `tests/integration/sosreport-generate.failures.test.ts`
  - Expected output: Negative cases assert policy deny precedes handler execution.
  - Acceptance checks: Assertions confirm diagnostics command path is not reached when denied.

### Implementation for User Story 2 (Task Group 2)

- [X] T017 [US2] Integrate centralized policy middleware into `generate_sosreport` MCP registration in `server.ts`
  - Expected output: `generate_sosreport` calls policy validator before invoking handler logic.
  - Acceptance checks: Any missing/invalid/replayed token path returns safe denial text and `isError` response.
- [X] T018 [US2] Implement standardized safe deny response mapping in `src/security/sensitive-tool-policy.ts` and `src/security/redaction.ts`
  - Expected output: Consistent actionable denial messages without secret-bearing internals.
  - Acceptance checks: Denial text includes remediation guidance and excludes raw token/PAT values.
- [X] T019 [US2] Emit policy decision telemetry for allow/deny/replay outcomes in `src/security/security-events.ts` and `server.ts`
  - Expected output: Security events capture non-secret reason codes for operator troubleshooting.
  - Acceptance checks: Events include tool name and outcome, but redact or omit token material.

**Checkpoint**: User Story 2 is independently functional and testable.

---

## Phase 5: User Story 3 - Compatible UI and Non-UI Paths (Priority: P3)

**Goal**: Preserve compatibility entrypoint and text fallback while enforcing explicit Step 2 human consent flow.

**Independent Test**: UI Step 2 click mints token then generates; no automatic diagnostics at load/navigation; non-UI flow remains explicit and usable.

### Tests for User Story 3

- [X] T020 [P] [US3] Add UI workflow integration assertions for explicit Step 2 click behavior in `tests/integration/engage-red-hat-support.workflow.test.ts`
  - Expected output: Test proves token mint + generate occur only on Step 2 button click.
  - Acceptance checks: No mint/generate calls occur during bootstrap route handling or step navigation.
- [X] T021 [P] [US3] Add regression checks for unchanged unrelated tools/resources and entrypoint stability in `tests/regression/mcp-tool-surface-preservation.test.ts` and `tests/regression/skill-resource-preservation.test.ts`
  - Expected output: Regression coverage for unchanged non-consent surfaces and stable `ui://engage-red-hat-support/app.html`.
  - Acceptance checks: Tests fail if unrelated tool/resource names or required URIs drift.

### Implementation for User Story 3 (Task Groups 3 + 4)

- [X] T022 [US3] Update Step 2 Generate UI handler to mint consent then call `generate_sosreport(consent_token)` in `src/mcp-app.ts`
  - Expected output: Explicit click-driven flow requests token from backend endpoint before generation.
  - Acceptance checks: Generate path requires newly minted token; click is the only trigger for generation.
- [X] T023 [US3] Enforce no automatic diagnostics collection during load/navigation in `src/mcp-app.ts`
  - Expected output: Bootstrap and step transition logic never calls token mint or `generate_sosreport`.
  - Acceptance checks: Route/step actions only adjust UI state; diagnostics are triggered only by explicit Step 2 button.
- [X] T024 [US3] Update non-UI fallback and operator guidance in `skills/engage-red-hat-support/SKILL.md`, `README.md`, and `docs/operator-guide.md`
  - Expected output: Text guidance documents explicit token mint + tool call sequence for non-UI hosts.
  - Acceptance checks: Docs clearly instruct retry flow for expired/replayed tokens and preserve PAT boundary guidance.
- [X] T025 [US3] Update security and workflow contracts/docs in `specs/007-engage-red-hat-support/contracts/engage-workflow-contract.json`, `specs/010-engage-support-workflow/contracts/engage-workflow-contract.v2.json`, `docs/security-model.md`, and `specs/011-consent-gate-sosreport/contracts/engage-consent-workflow.contract.v3.json`
  - Expected output: Canonical and feature contracts align on consent gate, compatibility entrypoint, and stable tool names.
  - Acceptance checks: Contracts encode explicit Step 2 consent requirement, PAT boundary unchanged, and non-regression expectations.

**Checkpoint**: User Story 3 is independently functional and testable.

---

## Phase 6: Polish & Cross-Cutting Concerns (Task Group 5)

**Purpose**: Complete full verification run and finalize cross-cutting security/compatibility guarantees.

- [X] T026 [P] Add/refresh consent policy contract artifacts in `specs/011-consent-gate-sosreport/contracts/consent-endpoint.openapi.yaml` and `specs/011-consent-gate-sosreport/contracts/sensitive-tool-policy.contract.json`
  - Expected output: Endpoint and policy contracts match implemented claim rules and denial semantics.
  - Acceptance checks: Contracts document user/session binding, scope/step binding, expiry, single-use, replay denial.
- [X] T027 Run full verification suite via `npm run test:unit`, `npm run test:contract`, `npm run test:integration`, and `npm run test:regression` from repo root
  - Expected output: End-to-end evidence that consent gate works and unrelated behavior remains stable.
  - Acceptance checks: All suites pass; failures are triaged and fixed before completion.
- [X] T028 Record verification outcomes and residual risk notes in `specs/011-consent-gate-sosreport/quickstart.md` and `specs/011-consent-gate-sosreport/plan.md`
  - Expected output: Documented pass/fail evidence plus residual-risk handling for multi-instance replay and clock-skew considerations.
  - Acceptance checks: Notes explicitly confirm: no generation without valid token, explicit Step 2 requirement, PAT boundary unchanged, no secret leakage, and compatibility entrypoint retained.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: Starts immediately.
- **Phase 2 (Foundational)**: Depends on Phase 1 and blocks all user stories.
- **Phase 3 (US1)**: Depends on Phase 2 completion; delivers MVP consent enforcement.
- **Phase 4 (US2)**: Depends on US1 integration points and Phase 2 policy primitives.
- **Phase 5 (US3)**: Depends on US1/US2 backend behavior for UI/fallback integration.
- **Phase 6 (Polish)**: Depends on all selected user stories being complete.

### User Story Dependencies

- **US1 (P1)**: Independent after foundational phase; recommended MVP scope.
- **US2 (P2)**: Builds on US1 enforcement path but remains independently testable as policy centralization.
- **US3 (P3)**: Builds on US1/US2 for UI + non-UI orchestration and compatibility guarantees.

### Within Each User Story

- Tests first (expected to fail), then implementation, then story checkpoint validation.
- Schema/policy gating before handler invocation before UI/docs wiring.

### Parallel Opportunities

- Setup and foundational tasks marked `[P]` can run in parallel.
- In each story, `[P]` test tasks can run concurrently with other `[P]` tasks in different files.
- Contract/docs updates can proceed in parallel with implementation once interfaces stabilize.

---

## Parallel Example: User Story 1

```bash
# Parallel test authoring
Task: "T008 [US1] Contract assertions in tests/contract/sosreport-tools.contract.test.ts"
Task: "T009 [US1] Denial matrix in tests/integration/sosreport-generate.failures.test.ts"
Task: "T010 [US1] Happy-path test in tests/integration/sosreport-generate.success.test.ts"

# Parallel implementation on separate files
Task: "T012 [US1] Implement token verification/consume in src/security/consent-token-service.ts"
Task: "T013 [US1] Require consent_token in src/sosreport/sosreport-tool-schemas.ts"
```

## Parallel Example: User Story 2

```bash
Task: "T015 [US2] Contract checks in tests/contract/engage-red-hat-support.contract.test.ts"
Task: "T016 [US2] Policy-deny integration checks in tests/integration/sosreport-generate.failures.test.ts"
Task: "T018 [US2] Deny response mapping in src/security/sensitive-tool-policy.ts and src/security/redaction.ts"
```

## Parallel Example: User Story 3

```bash
Task: "T020 [US3] UI click-flow integration test in tests/integration/engage-red-hat-support.workflow.test.ts"
Task: "T021 [US3] Surface regression checks in tests/regression/mcp-tool-surface-preservation.test.ts and tests/regression/skill-resource-preservation.test.ts"
Task: "T024 [US3] Non-UI fallback doc updates in skills/engage-red-hat-support/SKILL.md, README.md, docs/operator-guide.md"
```

---

## Implementation Strategy

### MVP First (US1)

1. Complete Phase 1 and Phase 2.
2. Deliver Phase 3 (US1) and validate independent tests.
3. Confirm hard gate: no `generate_sosreport` execution without valid one-time token.

### Incremental Delivery

1. Add US2 centralized policy enforcement and verify deterministic deny behavior.
2. Add US3 UI/non-UI compatibility and documentation alignment.
3. Finish with full verification run and residual-risk documentation.

### Full Verification Exit

- Explicit Step 2 click path succeeds.
- Automatic load/navigation collection is absent.
- Replay and mismatch attacks fail.
- Unrelated tools/resources remain unchanged.
- PAT boundary and secret-safety requirements remain intact.
