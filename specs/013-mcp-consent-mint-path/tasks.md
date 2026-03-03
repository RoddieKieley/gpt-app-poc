# Tasks: MCP Consent Mint Tool for Headless Clients

**Input**: Design documents from `/specs/013-mcp-consent-mint-path/`  
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

## Format: `[ID] [P?] [Story] Description with file path`

- **[P]**: Can run in parallel (different files, no blocking dependency)
- **[Story]**: User story mapping (`[US1]`, `[US2]`, `[US3]`)

---

## Phase 1: Backend

- [ ] T001 [US1] Add mint tool input schema/type for optional validated workflow session in `src/sosreport/sosreport-tool-schemas.ts`
  - **Title**: Add `mint_engage_consent_token` schema exports
  - **Objective**: Define strict optional `workflow_session_id` validation and reusable typing.
  - **Target files**: `src/sosreport/sosreport-tool-schemas.ts`
  - **Dependencies**: None
  - **Done criteria**: Schema/type exported; optional field rejects empty/invalid values; no regressions to existing generate schema.

- [ ] T002 [US1] Register `mint_engage_consent_token` MCP tool with standard response shape in `server.ts`
  - **Title**: Add Option A dedicated mint tool
  - **Objective**: Provide explicit headless consent action returning `consent_token`, `expires_at`, `workflow_session_id`.
  - **Target files**: `server.ts`
  - **Dependencies**: T001
  - **Done criteria**: Tool is discoverable via `tools/list`; response fields exactly match required shape.

- [ ] T003 [US3] Enforce optional `workflow_session_id` strict ownership/session validation in mint path in `server.ts`
  - **Title**: Add strict session validation for optional workflow session
  - **Objective**: Deny malformed/mismatched workflow session values while supporting omission.
  - **Target files**: `server.ts`
  - **Dependencies**: T002
  - **Done criteria**: Invalid provided values fail closed; omitted field continues to work via default session context.

- [ ] T004 [US1] Enforce mint-after-step1 precondition in MCP path using existing workflow state helpers in `server.ts`
  - **Title**: Gate mint by Step 1 selection
  - **Objective**: Ensure explicit flow ordering (`start` -> `select` -> `mint` -> `generate`).
  - **Target files**: `server.ts`
  - **Dependencies**: T002
  - **Done criteria**: Mint attempts before Step 1 return deterministic denial with actionable next-step guidance.

- [ ] T005 [US1] Preserve existing generate consent policy and add optional session-alignment check in `server.ts` and `src/security/sensitive-tool-policy.ts`
  - **Title**: Keep generate security model intact
  - **Objective**: Maintain replay/wrong-user/wrong-session/wrong-scope/wrong-step protections while aligning optional workflow session handling.
  - **Target files**: `server.ts`, `src/security/sensitive-tool-policy.ts`
  - **Dependencies**: T003, T004
  - **Done criteria**: Existing denial codes/semantics unchanged; optional workflow session mismatches are denied safely.

- [ ] T006 [US2] Verify web endpoint behavior remains unchanged for `POST /api/engage/consent-tokens` in `server.ts`
  - **Title**: Freeze web consent endpoint behavior
  - **Objective**: Guarantee compatibility for web UX and existing clients.
  - **Target files**: `server.ts`
  - **Dependencies**: T002, T003, T004, T005
  - **Done criteria**: No request/response contract drift for web endpoint; existing web flow remains functional.

---

## Phase 2: Contracts/Specs

- [ ] T007 [P] [US1] Update MCP/tool contract assertions for new mint tool in `tests/contract/sosreport-tools.contract.test.ts`
  - **Title**: Add contract coverage for mint tool surface
  - **Objective**: Validate tool presence, schema shape, and metadata conventions.
  - **Target files**: `tests/contract/sosreport-tools.contract.test.ts`
  - **Dependencies**: T002
  - **Done criteria**: Contract test asserts `mint_engage_consent_token` and required response/schema expectations.

- [ ] T008 [P] [US2] Update MCP surface regression baseline to include additive tool only in `tests/regression/mcp-tool-surface-preservation.test.ts`
  - **Title**: Preserve tool/resource compatibility baseline
  - **Objective**: Ensure existing tools/resources stay unchanged with additive mint tool.
  - **Target files**: `tests/regression/mcp-tool-surface-preservation.test.ts`
  - **Dependencies**: T002
  - **Done criteria**: Regression test requires old set + new tool; no unrelated surface drift.

- [ ] T009 [P] [US1] Add new versioned tool contract file `specs/013-mcp-consent-mint-path/contracts/engage-consent-mint-mcp.contract.v1.json`
  - **Title**: Publish mint tool contract v1
  - **Objective**: Capture Option A semantics and standard response shape.
  - **Target files**: `specs/013-mcp-consent-mint-path/contracts/engage-consent-mint-mcp.contract.v1.json`
  - **Dependencies**: T002, T003, T004, T005
  - **Done criteria**: Contract reflects explicit mint invocation, optional validated `workflow_session_id`, and unchanged security model.

- [ ] T010 [P] [US1] Add new versioned headless workflow sequence contract in `specs/013-mcp-consent-mint-path/contracts/engage-workflow-headless-sequence.contract.v1.json`
  - **Title**: Publish headless sequence contract v1
  - **Objective**: Encode required non-web sequence and denial conditions.
  - **Target files**: `specs/013-mcp-consent-mint-path/contracts/engage-workflow-headless-sequence.contract.v1.json`
  - **Dependencies**: T004, T005
  - **Done criteria**: Contract requires explicit sequence and denies out-of-order/invalid consent paths.

- [ ] T011 [P] [US2] Add parity contract for unchanged web endpoint + mint response shape in `specs/013-mcp-consent-mint-path/contracts/consent-mint-parity.openapi.v1.yaml`
  - **Title**: Publish REST/MCP parity reference contract v1
  - **Objective**: Record unchanged web endpoint and common response expectations.
  - **Target files**: `specs/013-mcp-consent-mint-path/contracts/consent-mint-parity.openapi.v1.yaml`
  - **Dependencies**: T006
  - **Done criteria**: OpenAPI parity contract confirms web endpoint unchanged and response fields aligned.

---

## Phase 3: Docs/Skill

- [ ] T012 [P] [US1] Update headless/text guidance with explicit mint invocation in `specs/013-mcp-consent-mint-path/quickstart.md`
  - **Title**: Document explicit headless consent workflow
  - **Objective**: Ensure operators follow explicit mint-before-generate sequence.
  - **Target files**: `specs/013-mcp-consent-mint-path/quickstart.md`
  - **Dependencies**: T002, T004, T005
  - **Done criteria**: Quickstart includes required sequence and denial expectations.

- [ ] T013 [P] [US2] Update regression expectations for unchanged web behavior in `specs/013-mcp-consent-mint-path/plan.md` and `specs/013-mcp-consent-mint-path/spec.md` (if clarifying notes needed)
  - **Title**: Lock web compatibility documentation
  - **Objective**: Keep release-facing docs explicit about unchanged REST/web UX behavior.
  - **Target files**: `specs/013-mcp-consent-mint-path/plan.md`, `specs/013-mcp-consent-mint-path/spec.md`
  - **Dependencies**: T006
  - **Done criteria**: Docs clearly state web endpoint/UX unchanged and additive tool rollout only.

---

## Phase 4: Tests

- [ ] T014 [P] [US1] Add helper for MCP mint tool invocation in `tests/integration/consent-test-helpers.ts`
  - **Title**: Extend integration helper surface
  - **Objective**: Reuse canonical helper for mint tool setup in multiple integration tests.
  - **Target files**: `tests/integration/consent-test-helpers.ts`
  - **Dependencies**: T002, T003
  - **Done criteria**: Helper supports mint tool call + structured response parsing.

- [ ] T015 [US1] Add headless happy-path integration sequence in `tests/integration/sosreport-generate.success.test.ts`
  - **Title**: Validate explicit non-web success flow
  - **Objective**: Confirm `start -> select -> mint -> generate -> fetch` works end-to-end.
  - **Target files**: `tests/integration/sosreport-generate.success.test.ts`
  - **Dependencies**: T014, T005
  - **Done criteria**: Integration test passes and verifies returned fetchable archive path.

- [ ] T016 [US1] Add denial tests for mint-before-step1 and missing/invalid consent in `tests/integration/sosreport-generate.failures.test.ts`
  - **Title**: Validate explicit precondition and consent gating
  - **Objective**: Ensure out-of-order and missing-consent flows fail closed.
  - **Target files**: `tests/integration/sosreport-generate.failures.test.ts`
  - **Dependencies**: T004, T005, T014
  - **Done criteria**: Denials assert stable reason codes and guidance text.

- [ ] T017 [US3] Add invalid `workflow_session_id` denial and mismatch scenarios in `tests/integration/sosreport-generate.failures.test.ts`
  - **Title**: Validate strict optional workflow session checks
  - **Objective**: Prove strict validation when optional session is provided.
  - **Target files**: `tests/integration/sosreport-generate.failures.test.ts`
  - **Dependencies**: T003, T014
  - **Done criteria**: Invalid/mismatched workflow session paths are denied with deterministic codes.

- [ ] T018 [US1] Extend existing denial matrix to reassert replay/wrong-user/wrong-session/wrong-scope/wrong-step in `tests/integration/sosreport-generate.failures.test.ts`
  - **Title**: Reconfirm unchanged security denials
  - **Objective**: Prevent security regression while adding mint tool.
  - **Target files**: `tests/integration/sosreport-generate.failures.test.ts`
  - **Dependencies**: T005
  - **Done criteria**: All mismatch/replay denial tests pass unchanged or with approved additive assertions only.

- [ ] T019 [US2] Add web regression assertion coverage for unchanged consent endpoint behavior in `tests/integration/engage-red-hat-support.workflow.test.ts`
  - **Title**: Guard web flow compatibility
  - **Objective**: Confirm web Step 2 mint path still uses unchanged REST endpoint and behavior.
  - **Target files**: `tests/integration/engage-red-hat-support.workflow.test.ts`
  - **Dependencies**: T006
  - **Done criteria**: Regression test confirms unchanged web mint + generate behavior.

---

## Phase 5: Validation

- [ ] T020 Run targeted verification suite for mint flow and denial matrix using `tsx --test` on integration/contract/regression files
  - **Title**: Execute focused test gate
  - **Objective**: Fast validation of critical path before full suite.
  - **Target files**: `tests/integration/sosreport-generate.success.test.ts`, `tests/integration/sosreport-generate.failures.test.ts`, `tests/contract/sosreport-tools.contract.test.ts`, `tests/regression/mcp-tool-surface-preservation.test.ts`
  - **Dependencies**: T007, T008, T015, T016, T017, T018, T019
  - **Done criteria**: All targeted tests pass locally with no flaky failures.

- [ ] T021 Run full regression verification and record results via `npm run test:unit && npm run test:contract && npm run test:integration && npm run test:regression`
  - **Title**: Final regression verification
  - **Objective**: Validate no regressions across unit, contract, integration, and regression suites.
  - **Target files**: `tests/unit/`, `tests/contract/`, `tests/integration/`, `tests/regression/`
  - **Dependencies**: T020
  - **Done criteria**: All suites pass; failures triaged and resolved before merge.

- [ ] T022 Release-readiness check and rollout sign-off in `specs/013-mcp-consent-mint-path/quickstart.md` and release notes/PR description
  - **Title**: Release-readiness gate
  - **Objective**: Confirm locked decisions are met: Option A, standard mint response, optional validated `workflow_session_id`, unchanged REST endpoint, explicit mint consent action, new versioned contracts/specs.
  - **Target files**: `specs/013-mcp-consent-mint-path/quickstart.md`, `specs/013-mcp-consent-mint-path/plan.md`
  - **Dependencies**: T009, T010, T011, T021
  - **Done criteria**: Checklist complete, rollout notes updated, feature approved for implementation/merge.

---

## Dependencies & Execution Order

### Story Completion Order

1. **US1 (P1)**: Headless explicit consent mint + generate/fetch happy path
2. **US2 (P2)**: Web flow remains unchanged
3. **US3 (P3)**: Optional `workflow_session_id` strict validation

### Cross-Phase Dependencies

- Backend phase (T001-T006) blocks Contracts/Specs and Tests.
- Contracts/Specs (T007-T011) and Docs/Skill (T012-T013) can run in parallel after backend readiness.
- Tests (T014-T019) require backend readiness; several can run in parallel by file split.
- Validation (T020-T022) runs last.

---

## Parallel Execution Examples

### US1 Parallel set

- T007, T009, T010 can run together after T002/T004/T005.
- T014 can run in parallel with T007-T013.
- T015 and T016 can run concurrently after T014 + backend dependencies.

### US2 Parallel set

- T008 and T011 can run in parallel after T002/T006.
- T013 and T019 can run in parallel after T006.

### US3 Parallel set

- T003 backend validation and T017 test authoring can be split after helper T014 is available.

---

## Implementation Strategy

### MVP first (US1 only)

1. Complete Backend tasks T001-T005.
2. Complete Contracts/Specs tasks T007, T009, T010.
3. Complete Tests tasks T014-T016, T018.
4. Run T020 and validate headless flow independently.

### Incremental delivery

1. Add US2 compatibility tasks (T006, T008, T011, T013, T019).
2. Add US3 strict optional session validation tasks (T003, T017).
3. Run full regression and release-readiness checks (T021-T022).
