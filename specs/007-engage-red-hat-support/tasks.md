# Tasks: Engage Red Hat Support

**Input**: Design documents from `/specs/007-engage-red-hat-support/`  
**Prerequisites**: `plan.md` (required), `spec.md` (required), `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: Included because the request explicitly requires regression/contract coverage and lifecycle/non-leakage guarantees.  
**Organization**: Tasks are grouped by independently testable user stories and ordered to match required sequencing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story label (`[US1]`, `[US2]`, `[US3]`)
- All descriptions include exact repository file paths

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare task scaffolding and feature-specific test/docs placeholders.

- [ ] T001 Create task scaffolding for feature artifacts in `specs/007-engage-red-hat-support/tasks.md`
- [ ] T002 [P] Create new skill file scaffold in `skills/engage-red-hat-support/SKILL.md`
- [ ] T003 [P] Create contract test scaffold in `tests/contract/engage-red-hat-support.contract.test.ts`
- [ ] T004 [P] Create integration test scaffold in `tests/integration/engage-red-hat-support.workflow.test.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Foundational resource registration and routing required before user story work.

**⚠️ CRITICAL**: No US1/US2/US3 implementation starts until this phase is complete.

- [ ] T005 Register `ui://engage-red-hat-support/app.html` and `skill://engage-red-hat-support/SKILL.md` resources in `server.ts`
- [ ] T006 Preserve required widget metadata (`openai/outputTemplate`, `openai/widgetAccessible`, `openai/widgetDomain`, `openai/widgetCSP`) for new Engage resource in `server.ts`
- [ ] T007 Add Engage view container and workflow controls to widget markup in `mcp-app.html`
- [ ] T008 Add Engage workflow state model and URI-aware UI initialization in `src/mcp-app.ts`
- [ ] T009 [P] Add contract assertions for Engage UI/skill resource discovery in `tests/contract/engage-red-hat-support.contract.test.ts`
- [ ] T010 [P] Extend skill discovery preservation checks for new skill URI in `tests/regression/skill-resource-preservation.test.ts`
- [ ] T011 [P] Extend MCP surface preservation assertions for newly registered Engage resources/tools in `tests/regression/mcp-tool-surface-preservation.test.ts`

**Checkpoint**: Resource registration and discovery guarantees are in place; user story implementation can begin.

---

## Phase 3: User Story 1 - Jira PAT connect/verify and connection_id flow (Priority: P1) 🎯 MVP

**Goal**: Establish secure PAT intake and verified `connection_id` lifecycle flow for Engage orchestration.

**Independent Test**: PAT intake succeeds via secure backend endpoint, verification returns active status, and expired/revoked states block continuation with actionable messages.

### Tests for User Story 1

- [ ] T012 [P] [US1] Add connection lifecycle gating scenarios (`connected`/`expired`/`revoked`) to `tests/integration/engage-red-hat-support.workflow.test.ts`
- [ ] T013 [P] [US1] Add contract checks that Engage orchestration uses only `connection_id` (no PAT fields in tool payload expectations) in `tests/contract/engage-red-hat-support.contract.test.ts`
- [ ] T014 [P] [US1] Extend PAT non-leakage regression coverage for Engage flow payloads/results in `tests/regression/no-pat-leakage-mcp.test.ts`

### Implementation for User Story 1

- [ ] T015 [US1] Implement secure PAT intake call path (`POST /api/jira/connections`) and clear PAT after submission in `src/mcp-app.ts`
- [ ] T016 [US1] Implement connection verification step using `jira_connection_status` and/or `GET /api/jira/connections/{connection_id}` in `src/mcp-app.ts`
- [ ] T017 [US1] Implement lifecycle status gating (`connected` pass, `expired`/`revoked` fail-stop) with retry guidance in `src/mcp-app.ts`
- [ ] T018 [US1] Add UI status rendering for connection step results and sanitized failure messages in `mcp-app.html`

**Checkpoint**: US1 is independently functional (secure connect + verify + lifecycle gating).

---

## Phase 4: User Story 2 - Linux generate/fetch sosreport flow (Priority: P1)

**Goal**: Execute Linux-only diagnostic generation and fetch sequence after verified connection.

**Independent Test**: From a verified `connection_id`, Linux gate passes, `generate_sosreport` yields `fetch_reference`, `fetch_sosreport` yields `archive_path` metadata, and non-Linux selection is blocked.

### Tests for User Story 2

- [ ] T019 [P] [US2] Add integration scenarios for Linux-only gate and generate->fetch stop-on-failure behavior in `tests/integration/engage-red-hat-support.workflow.test.ts`
- [ ] T020 [P] [US2] Add contract assertions for required orchestration step order in `tests/contract/engage-red-hat-support.contract.test.ts`

### Implementation for User Story 2

- [ ] T021 [US2] Implement Linux-only product gate and rejection messaging before diagnostics in `src/mcp-app.ts`
- [ ] T022 [US2] Implement `generate_sosreport` orchestration step and persist `fetch_reference` in workflow state in `src/mcp-app.ts`
- [ ] T023 [US2] Implement `fetch_sosreport` orchestration step and persist `archive_path`/`sha256`/`size_bytes` in workflow state in `src/mcp-app.ts`
- [ ] T024 [US2] Add UI progress and failure-stop presentation for generating/fetching states in `mcp-app.html`

**Checkpoint**: US2 is independently functional (Linux gate + generate/fetch workflow).

---

## Phase 5: User Story 3 - Attach fetched archive to Jira issue (Priority: P2)

**Goal**: Attach fetched artifact to Jira using `connection_id` + `issue_key` with step-specific failure handling.

**Independent Test**: With verified connection and fetched artifact path, attach succeeds for valid issue key; missing/invalid issue key or inaccessible issue returns actionable failure and no PAT leakage.

### Tests for User Story 3

- [ ] T025 [P] [US3] Add integration scenarios for attach success/failure and issue-key validation in `tests/integration/engage-red-hat-support.workflow.test.ts`
- [ ] T026 [P] [US3] Add contract assertions for `jira_attach_artifact(connection_id, issue_key, artifact_ref)` mapping from fetched archive path in `tests/contract/engage-red-hat-support.contract.test.ts`
- [ ] T027 [P] [US3] Extend PAT non-leakage regression checks for attach-step errors/statuses in `tests/regression/no-pat-leakage-logs.test.ts`

### Implementation for User Story 3

- [ ] T028 [US3] Implement issue key validation and required-field gating for attach step in `src/mcp-app.ts`
- [ ] T029 [US3] Implement `jira_attach_artifact` step using `connection_id`, `issue_key`, and fetched `archive_path` as `artifact_ref` in `src/mcp-app.ts`
- [ ] T030 [US3] Add attach-step UI states (attaching/completed/failed) and retry guidance in `mcp-app.html`
- [ ] T031 [US3] Author final Engage skill workflow instructions (including non-UI fallback and exact step order) in `skills/engage-red-hat-support/SKILL.md`

**Checkpoint**: US3 is independently functional (attach flow with validated issue key and opaque connection usage).

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final hardening, docs, and full-suite verification across stories.

- [ ] T032 [P] Update operator runbook for Engage flow prerequisites, lifecycle handling, and incident response in `docs/operator-guide.md`
- [ ] T033 [P] Align and finalize feature contracts with implemented behavior in `specs/007-engage-red-hat-support/contracts/engage-workflow-contract.json`
- [ ] T034 [P] Align and finalize UI metadata/security contract in `specs/007-engage-red-hat-support/contracts/engage-ui-resource.json`
- [ ] T035 [P] Align and finalize skill contract requirements in `specs/007-engage-red-hat-support/contracts/engage-skill-resource.json`
- [ ] T036 Execute full verification commands and record outcomes in `specs/007-engage-red-hat-support/quickstart.md`
- [ ] T037 Perform constitution compliance and risk-mitigation verification checklist update in `specs/007-engage-red-hat-support/plan.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies.
- **Phase 2 (Foundational)**: Depends on Phase 1; blocks all user stories.
- **Phase 3 (US1)**: Depends on Phase 2 completion.
- **Phase 4 (US2)**: Depends on Phase 3 completion (verified connection flow prerequisite).
- **Phase 5 (US3)**: Depends on Phase 4 completion (requires fetched artifact path).
- **Phase 6 (Polish)**: Depends on all user story phases.

### User Story Dependencies

- **US1**: Starts after foundational registration and establishes `connection_id` lifecycle controls.
- **US2**: Depends on US1 for verified connection precondition.
- **US3**: Depends on US2 output (`archive_path`) and US1 output (`connection_id`).

### Within Each User Story

- Test tasks first (must fail before implementation).
- Orchestration logic before UI polishing.
- Story checkpoint must pass before next story phase.

### Parallel Opportunities

- Setup file scaffolds (`T002`-`T004`) can run in parallel.
- Foundational test/regression updates (`T009`-`T011`) can run in parallel after resource registration starts.
- US1 tests (`T012`-`T014`) can run in parallel.
- US2 tests (`T019`-`T020`) can run in parallel.
- US3 tests (`T025`-`T027`) can run in parallel.
- Polish contract/doc updates (`T032`-`T035`) can run in parallel.

---

## Parallel Example: User Story 1

```bash
# Parallel test authoring for US1:
Task: "T012 Add lifecycle gating scenarios in tests/integration/engage-red-hat-support.workflow.test.ts"
Task: "T013 Add connection_id-only contract checks in tests/contract/engage-red-hat-support.contract.test.ts"
Task: "T014 Extend PAT non-leakage checks in tests/regression/no-pat-leakage-mcp.test.ts"
```

## Parallel Example: User Story 2

```bash
# Parallel test authoring for US2:
Task: "T019 Add Linux gate and generate/fetch fail-stop scenarios in tests/integration/engage-red-hat-support.workflow.test.ts"
Task: "T020 Add step-order contract assertions in tests/contract/engage-red-hat-support.contract.test.ts"
```

## Parallel Example: User Story 3

```bash
# Parallel test authoring for US3:
Task: "T025 Add attach success/failure scenarios in tests/integration/engage-red-hat-support.workflow.test.ts"
Task: "T026 Add attach input-mapping contract assertions in tests/contract/engage-red-hat-support.contract.test.ts"
Task: "T027 Extend attach-step non-leakage checks in tests/regression/no-pat-leakage-logs.test.ts"
```

---

## Implementation Strategy

### MVP First (US1)

1. Complete Phase 1 and Phase 2.
2. Deliver US1 connect/verify lifecycle gating.
3. Validate US1 independently before diagnostics and attach steps.

### Incremental Delivery

1. Add US1 (`connection_id` flow) and validate.
2. Add US2 (Linux generate/fetch) and validate.
3. Add US3 (issue attach) and validate.
4. Complete polish/docs and final full-suite verification.

### Execution Notes

- Preserve existing `jira_*`, `generate_sosreport`, and `fetch_sosreport` contracts while adding orchestration behavior.
- Never pass PAT in MCP tool arguments, tool results, prompts, or logs.
- Keep text fallback behavior complete for non-UI hosts.
