# Tasks: Jira Cloud Minimal-Auth Migration

**Input**: Design documents from `/specs/016-jira-cloud-auth/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/jira-cloud-auth-minimal-openapi.yaml

**Tests**: Tests are required by the spec for targeted updates and security/non-regression checks.

**Organization**: Tasks are grouped by user story to preserve independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story label (`[US1]`, `[US2]`, `[US3]`) for story-phase tasks only

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare implementation artifacts and test baseline for smallest-change migration.

- [ ] T001 Capture current failing Cloud baseline and expected behavior notes in `specs/016-jira-cloud-auth/quickstart.md`
- [ ] T002 Verify target file list and smallest-change scope notes in `specs/016-jira-cloud-auth/plan.md`
- [ ] T003 [P] Confirm contract assumptions for connect/status/list/attach in `specs/016-jira-cloud-auth/contracts/jira-cloud-auth-minimal-openapi.yaml`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared auth/context primitives that all user stories depend on.

**⚠️ CRITICAL**: No user story implementation starts until this phase is complete.

- [ ] T004 Add Jira auth context type and header builder utilities in `src/jira/jira-client.ts`
- [ ] T005 Extend connect input schema with additive auth mode/email/token fields in `src/jira/jira-tool-schemas.ts`
- [ ] T006 Add optional auth metadata fields with backward-compatible defaults in `src/security/connection-lifecycle.ts`
- [ ] T007 Thread auth metadata through secure connection creation path in `server.ts`
- [ ] T008 Update Jira tool handler credential resolution to produce auth context in `src/jira/jira-tool-handlers.ts`
- [ ] T009 [P] Add/adjust common fixtures for Cloud and legacy connect payloads in `tests/contract/jira-connections.contract.test.ts`

**Checkpoint**: Foundation ready for user-story implementation.

---

## Phase 3: User Story 1 - Restore Cloud connection and listing (Priority: P1) 🎯 MVP

**Goal**: Make connect and list succeed against Jira Cloud without changing workflow or response shape.

**Independent Test**: Connect with Cloud credentials, verify status, list attachments for `APPENG-999999`, and confirm unchanged response envelopes.

### Tests for User Story 1

- [ ] T010 [P] [US1] Add unit tests for Basic-vs-Bearer auth header construction in `tests/unit/jira-client.test.ts`
- [ ] T011 [P] [US1] Add contract tests for additive connect payload variants in `tests/contract/jira-connections.contract.test.ts`
- [ ] T012 [P] [US1] Add integration coverage for Cloud connect -> list flow in `tests/integration/jira-attachments.success.test.ts`
- [ ] T013 [P] [US1] Add explicit do-not-break response-shape assertions for connect/status/list in `tests/contract/jira-connections.contract.test.ts`

### Implementation for User Story 1

- [ ] T014 [US1] Implement Cloud Basic authorization header usage in `src/jira/jira-client.ts`
- [ ] T015 [US1] Update secure connect intake parsing and auth-mode mapping in `server.ts`
- [ ] T016 [US1] Persist and read auth metadata during connection lifecycle operations in `src/security/connection-lifecycle.ts`
- [ ] T017 [US1] Wire auth context through status/list code paths in `src/jira/jira-tool-handlers.ts`
- [ ] T018 [US1] Add validation/error mapping for Cloud auth input edge cases in `src/jira/jira-tool-schemas.ts`

**Checkpoint**: US1 should connect and list against Cloud independently.

---

## Phase 4: User Story 2 - Preserve attachment upload behavior (Priority: P2)

**Goal**: Keep attachment upload behavior unchanged while using Cloud-compatible auth path.

**Independent Test**: With a valid Cloud connection, attach local artifact to `APPENG-999999` and verify file appears in subsequent list.

### Tests for User Story 2

- [ ] T019 [P] [US2] Extend integration test for connect -> list -> attach success path in `tests/integration/jira-attachments.success.test.ts`
- [ ] T020 [P] [US2] Add do-not-break response-shape assertions for attach response in `tests/integration/jira-attachments.success.test.ts`

### Implementation for User Story 2

- [ ] T021 [US2] Ensure attach path uses shared auth context without endpoint/route changes in `src/jira/jira-client.ts`
- [ ] T022 [US2] Keep server attachment endpoint behavior stable while consuming auth metadata in `server.ts`
- [ ] T023 [US2] Verify handler attach path remains `connection_id`-driven only in `src/jira/jira-tool-handlers.ts`

**Checkpoint**: US2 should upload artifacts without contract or workflow changes.

---

## Phase 5: User Story 3 - Maintain auth boundary and backward compatibility (Priority: P3)

**Goal**: Preserve security boundary and validate legacy bearer-compatible behavior.

**Independent Test**: Confirm no secret leakage in MCP/log outputs and validate legacy bearer-compatible path behavior (or explicitly document constraints).

### Tests for User Story 3

- [ ] T024 [P] [US3] Add or update no-secret-leakage assertions for new Cloud fields in `tests/regression/no-pat-leakage-mcp.test.ts`
- [ ] T025 [P] [US3] Add or update log redaction assertions for Cloud auth inputs in `tests/regression/no-pat-leakage-logs.test.ts`
- [ ] T026 [P] [US3] Add backward compatibility verification test for legacy bearer records in `tests/integration/jira-connection.lifecycle.test.ts`

### Implementation for User Story 3

- [ ] T027 [US3] Enforce backend-intake-only secret handling for Cloud/Bearer connect inputs in `server.ts`
- [ ] T028 [US3] Ensure vault usage remains secret-only and non-MCP-visible in `src/security/token-vault.ts`
- [ ] T029 [US3] Keep deterministic secret-safe fallback text and `connection_id`-only tool behavior in `src/jira/jira-tool-handlers.ts`

**Checkpoint**: US3 should pass security-boundary and backward-compatibility checks.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Docs alignment, full validation, and manual completion record.

- [ ] T030 [P] Update Cloud auth operator instructions and base URL expectations in `docs/operator-guide.md`
- [ ] T031 [P] Update security boundary documentation for Cloud auth semantics in `docs/security-model.md`
- [ ] T032 [P] Update Jira connect step wording for Cloud credentials in `skills/engage-red-hat-support/SKILL.md`
- [ ] T033 Run targeted test suite and record results in `specs/016-jira-cloud-auth/quickstart.md`
- [ ] T034 Execute final manual verification against Jira Cloud issue `APPENG-999999` and record checklist outcomes in `specs/016-jira-cloud-auth/quickstart.md`
- [ ] T035 Document legacy-path validation outcome (pass or explicit constraint note) in `specs/016-jira-cloud-auth/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: starts immediately.
- **Phase 2 (Foundational)**: depends on Phase 1; blocks all story work.
- **Phase 3 (US1)**: depends on Phase 2; defines MVP.
- **Phase 4 (US2)**: depends on US1 auth/context completion.
- **Phase 5 (US3)**: depends on US1/US2 runtime paths being in place.
- **Phase 6 (Polish)**: depends on all targeted story phases.

### User Story Dependencies

- **US1 (P1)**: starts first after Foundational and is independently testable.
- **US2 (P2)**: depends on US1 auth/connect path but remains independently testable for attach behavior.
- **US3 (P3)**: depends on implemented runtime paths to validate security/backward compatibility independently.

### Within-Story Order

- Write tests for each story first and confirm they fail.
- Implement runtime changes.
- Re-run story tests to green.
- Keep response-shape and security checks passing.

### Dependency Graph

- `US1 -> US2 -> US3`
- Cross-cutting docs/manual validation run after all stories.

---

## Parallel Opportunities

- **Setup**: `T003` can run while `T001`/`T002` are in progress.
- **Foundational**: `T009` can run in parallel with `T004`-`T008`.
- **US1**: `T010`-`T013` are parallelizable test authoring tasks.
- **US2**: `T019` and `T020` can run in parallel.
- **US3**: `T024`-`T026` can run in parallel.
- **Polish**: `T030`-`T032` can run in parallel.

## Parallel Example: User Story 1

```bash
Task: "T010 [US1] Add unit tests for Basic-vs-Bearer auth header construction in tests/unit/jira-client.test.ts"
Task: "T011 [US1] Add contract tests for additive connect payload variants in tests/contract/jira-connections.contract.test.ts"
Task: "T012 [US1] Add integration coverage for Cloud connect -> list flow in tests/integration/jira-attachments.success.test.ts"
Task: "T013 [US1] Add do-not-break response-shape assertions for connect/status/list in tests/contract/jira-connections.contract.test.ts"
```

## Parallel Example: User Story 2

```bash
Task: "T019 [US2] Extend integration test for connect -> list -> attach success path in tests/integration/jira-attachments.success.test.ts"
Task: "T020 [US2] Add do-not-break response-shape assertions for attach response in tests/integration/jira-attachments.success.test.ts"
```

## Parallel Example: User Story 3

```bash
Task: "T024 [US3] Add or update no-secret-leakage assertions for new Cloud fields in tests/regression/no-pat-leakage-mcp.test.ts"
Task: "T025 [US3] Add or update log redaction assertions for Cloud auth inputs in tests/regression/no-pat-leakage-logs.test.ts"
Task: "T026 [US3] Add backward compatibility verification test for legacy bearer records in tests/integration/jira-connection.lifecycle.test.ts"
```

---

## Implementation Strategy

### MVP First (US1 only)

1. Complete Phases 1-2.
2. Complete US1 (Phase 3) to restore Cloud connect/list.
3. Validate response-shape non-regression and Cloud issue listing.

### Incremental Delivery

1. Add US2 to restore and verify attach behavior.
2. Add US3 to lock security boundary and backward compatibility.
3. Finish docs, full tests, and manual verification record.

### Definition of Done Alignment

- Cloud auth path works end-to-end.
- Legacy path behavior validated (or explicitly documented if constrained).
- Tests pass.
- Docs updated.
- Manual checklist completed and recorded.
