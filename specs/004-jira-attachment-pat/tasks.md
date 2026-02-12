# Tasks: Jira Attachment via User PAT Secret Boundary

**Input**: Design documents from `/specs/004-jira-attachment-pat/`  
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`

**Tests**: Include contract, integration, and regression tests as explicitly requested.  
**Organization**: Tasks are grouped by user story to keep each slice independently testable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: User story label (`[US1]`, `[US2]`, `[US3]`) for story-phase tasks only
- Every task includes explicit FR/SC coverage mapping

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare repository scaffolding, test harness, and baseline docs for secure Jira feature work.

- [ ] T001 Create Jira/security module and test directory scaffolding in `src/jira/`, `src/security/`, `tests/contract/`, `tests/integration/`, `tests/regression/`, and `tests/unit/` (FR: FR-012; SC: SC-001)
- [ ] T002 Add test scripts for contract/integration/regression suites in `package.json` (FR: FR-012; SC: SC-001, SC-006)
- [ ] T003 [P] Add Jira feature environment variable template and TTL config guidance in `.env.example` (FR: FR-009; SC: SC-004)
- [ ] T004 [P] Add developer test fixture documentation for Jira sandbox assumptions in `specs/004-jira-attachment-pat/quickstart.md` (FR: FR-010; SC: SC-006)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Implement security-critical foundations that all user stories depend on.

**⚠️ CRITICAL**: No story implementation begins until this phase is complete.

- [ ] T005 Implement PAT intake input validation schema (HTTPS URL, PAT presence, no echo fields) in `src/jira/jira-tool-schemas.ts` (FR: FR-001, FR-011; SC: SC-001, SC-006)
- [ ] T006 Implement encrypted token vault persistence interface and storage adapter in `src/security/token-vault.ts` (FR: FR-002, FR-003; SC: SC-001)
- [ ] T007 [P] Implement credential lifecycle state logic (connected/expired/revoked + TTL checks) in `src/security/connection-lifecycle.ts` (FR: FR-004, FR-008, FR-009; SC: SC-004)
- [ ] T008 [P] Implement log/payload redaction utility for PAT-like strings and auth headers in `src/security/redaction.ts` (FR: FR-002, FR-012; SC: SC-001)
- [ ] T009 Implement Jira error normalization map for 401/403/404/413/network failures in `src/jira/jira-error-mapping.ts` (FR: FR-010; SC: SC-006)
- [ ] T010 Implement user-scope authorization guard for `connection_id` ownership checks in `src/security/connection-lifecycle.ts` (FR: FR-007; SC: SC-005)
- [ ] T011 Wire security middleware and sanitized logging hooks into API/MCP request pipeline in `server.ts` (FR: FR-002, FR-011, FR-012; SC: SC-001)
- [ ] T012 Add foundational unit tests for vault encryption contract, redaction behavior, and lifecycle transitions in `tests/unit/token-vault.test.ts`, `tests/unit/redaction.test.ts`, and `tests/unit/connection-lifecycle.test.ts` (FR: FR-002, FR-003, FR-008, FR-009; SC: SC-001, SC-004)

**Checkpoint**: Token boundary, encrypted persistence, lifecycle enforcement, and redaction protections are in place.

---

## Phase 3: User Story 1 - Connect Jira Securely (Priority: P1) 🎯 MVP

**Goal**: User can connect Jira with base URL + PAT, receive opaque `connection_id`, and verify non-sensitive connection status.

**Independent Test**: Submit valid Jira base URL + PAT via backend-only connect path, verify returned `connection_id`, then check status returns non-secret fields; confirm no PAT appears in MCP payloads/results/logs.

### Tests for User Story 1

- [ ] T013 [P] [US1] Add contract tests for `POST /api/jira/connections` and `GET /api/jira/connections/{connection_id}` in `tests/contract/jira-connections.contract.test.ts` (FR: FR-001, FR-004, FR-011; SC: SC-001, SC-002)
- [ ] T014 [P] [US1] Add regression tests asserting PAT never appears in MCP tool args/results/transcript-safe outputs in `tests/regression/no-pat-leakage-mcp.test.ts` (FR: FR-002; SC: SC-001)
- [ ] T015 [P] [US1] Add regression tests asserting PAT/auth headers never appear in logs and error payloads in `tests/regression/no-pat-leakage-logs.test.ts` (FR: FR-002, FR-012; SC: SC-001)
- [ ] T016 [P] [US1] Add integration test for connect success + status verification + TTL-expired status behavior in `tests/integration/jira-connection.lifecycle.test.ts` (FR: FR-001, FR-004, FR-009; SC: SC-002, SC-004)

### Implementation for User Story 1

- [ ] T017 [US1] Implement backend connect endpoint for Jira base URL + PAT intake and immediate vault write in `server.ts` (FR: FR-001, FR-002, FR-003; SC: SC-001, SC-002)
- [ ] T018 [US1] Implement connection status endpoint returning non-sensitive metadata only in `server.ts` (FR: FR-004, FR-010; SC: SC-006)
- [ ] T019 [US1] Implement MCP tool schema/handler for `jira_connection_status` with opaque `connection_id` only in `src/jira/jira-tool-schemas.ts` and `src/jira/jira-tool-handlers.ts` (FR: FR-004, FR-011; SC: SC-001)
- [ ] T020 [US1] Add UI bridge flow for secure connect/status interactions with text fallback rendering in `src/mcp-app.ts` and `mcp-app.html` (FR: FR-001, FR-004, FR-011; SC: SC-001, SC-006)
- [ ] T021 [US1] Emit sanitized security events for connect/status operations in `src/security/security-events.ts` and `server.ts` (FR: FR-012; SC: SC-001)

**Checkpoint**: US1 is independently functional and demonstrable as MVP.

---

## Phase 4: User Story 2 - Attach Local Artifact to Jira Issue (Priority: P2)

**Goal**: Connected user can list Jira issue attachments and upload a selected local artifact with robust non-sensitive error handling.

**Independent Test**: With valid `connection_id`, list attachments for a known issue and upload a selected artifact; verify success path and 401/403/404/413 failures map to actionable non-secret errors.

### Tests for User Story 2

- [ ] T022 [P] [US2] Add contract tests for `GET /api/jira/issues/{issue_key}/attachments` and `POST /api/jira/issues/{issue_key}/attachments` in `tests/contract/jira-attachments.contract.test.ts` (FR: FR-005, FR-006, FR-010; SC: SC-003, SC-006)
- [ ] T023 [P] [US2] Add integration tests for list/upload success against Jira test fixture in `tests/integration/jira-attachments.success.test.ts` (FR: FR-005, FR-006; SC: SC-003)
- [ ] T024 [P] [US2] Add integration tests for 401/403/404/size-limit failure mapping in `tests/integration/jira-attachments.failures.test.ts` (FR: FR-010; SC: SC-006)
- [ ] T025 [P] [US2] Add regression tests proving MCP tools for list/upload reject secret fields and accept only opaque refs in `tests/regression/mcp-opaque-reference-enforcement.test.ts` (FR: FR-011; SC: SC-001)

### Implementation for User Story 2

- [ ] T026 [US2] Implement Jira API client operations for list and upload with sanitized request/response handling in `src/jira/jira-client.ts` (FR: FR-005, FR-006, FR-010; SC: SC-003, SC-006)
- [ ] T027 [US2] Implement artifact reference validation (exists/readable/size boundary) in `src/jira/artifact-selection.ts` (FR: FR-006, FR-010; SC: SC-006)
- [ ] T028 [US2] Implement server endpoints for list and attach using `connection_id` vault resolution in `server.ts` (FR: FR-005, FR-006, FR-011; SC: SC-001, SC-003)
- [ ] T029 [US2] Implement MCP tools `jira_list_attachments` and `jira_attach_artifact` with text fallbacks in `src/jira/jira-tool-schemas.ts` and `src/jira/jira-tool-handlers.ts` (FR: FR-005, FR-006, FR-011; SC: SC-001, SC-006)
- [ ] T030 [US2] Add UI workflow for issue key/artifact selection and action feedback in `src/mcp-app.ts` and `mcp-app.html` (FR: FR-005, FR-006, FR-010; SC: SC-003, SC-006)
- [ ] T031 [US2] Emit sanitized security events for list/upload outcomes (success and failures) in `src/security/security-events.ts` and `server.ts` (FR: FR-012; SC: SC-001)

**Checkpoint**: US2 works independently using an existing connection.

---

## Phase 5: User Story 3 - Revoke Jira Access (Priority: P3)

**Goal**: User can disconnect/revoke a Jira connection; revoked or expired connections are blocked immediately for protected operations.

**Independent Test**: Revoke an active connection and verify list/upload/status flows reflect revoked/expired behavior and require reconnect.

### Tests for User Story 3

- [ ] T032 [P] [US3] Add contract tests for `DELETE /api/jira/connections/{connection_id}` and revoked-state status responses in `tests/contract/jira-disconnect.contract.test.ts` (FR: FR-008, FR-009; SC: SC-004)
- [ ] T033 [P] [US3] Add integration tests for disconnect + immediate operation denial + reconnect recovery in `tests/integration/jira-disconnect.lifecycle.test.ts` (FR: FR-008, FR-009, FR-010; SC: SC-004, SC-006)
- [ ] T034 [P] [US3] Add regression test for cross-user `connection_id` misuse denial post-revoke and pre-revoke in `tests/regression/connection-isolation.test.ts` (FR: FR-007; SC: SC-005)

### Implementation for User Story 3

- [ ] T035 [US3] Implement revoke/disconnect endpoint and immediate credential invalidation in `server.ts` and `src/security/connection-lifecycle.ts` (FR: FR-008, FR-009; SC: SC-004)
- [ ] T036 [US3] Implement MCP tool `jira_disconnect` with opaque reference handling and text fallback in `src/jira/jira-tool-schemas.ts` and `src/jira/jira-tool-handlers.ts` (FR: FR-008, FR-011; SC: SC-001, SC-004)
- [ ] T037 [US3] Enforce revoked/expired guards in list/upload/connect-status code paths in `server.ts` and `src/jira/jira-tool-handlers.ts` (FR: FR-009, FR-010; SC: SC-004, SC-006)
- [ ] T038 [US3] Add UI disconnect action and revoked-state guidance in `src/mcp-app.ts` and `mcp-app.html` (FR: FR-008, FR-010; SC: SC-006)
- [ ] T039 [US3] Emit sanitized revoke/expiry security events in `src/security/security-events.ts` and `server.ts` (FR: FR-012; SC: SC-001, SC-004)

**Checkpoint**: US3 independently enforces revoke and TTL boundaries.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final hardening, docs, and operational guidance across all stories.

- [ ] T040 [P] Add end-to-end script covering connect/status/list/attach/disconnect happy path and failure path checks in `scripts/jira-token-boundary-tests.ts` (FR: FR-001, FR-005, FR-006, FR-008, FR-010; SC: SC-001, SC-003, SC-004, SC-006)
- [ ] T041 [P] Update MCP smoke tests to include Jira tool discovery and text fallback assertions in `scripts/mcp-smoke-tests.ts` (FR: FR-011, FR-012; SC: SC-001, SC-006)
- [ ] T042 Add security model documentation (secret boundary, allowed secret ingress, forbidden surfaces, threat notes) in `docs/security-model.md` (FR: FR-002, FR-003, FR-011; SC: SC-001)
- [ ] T043 Add operator guidance for key management, TTL/revocation operations, and incident response in `docs/operator-guide.md` (FR: FR-008, FR-009, FR-012; SC: SC-004, SC-006)
- [ ] T044 Update feature usage and developer workflow documentation in `README.md` and `specs/004-jira-attachment-pat/quickstart.md` (FR: FR-010; SC: SC-006)
- [ ] T045 Run full validation pass and record results for contract/integration/regression suites in `specs/004-jira-attachment-pat/quickstart.md` (FR: FR-012; SC: SC-001, SC-006)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: Start immediately.
- **Phase 2 (Foundational)**: Depends on Phase 1 and blocks all user stories.
- **Phase 3 (US1)**: Depends on Phase 2; MVP slice.
- **Phase 4 (US2)**: Depends on Phase 2 and a usable US1 connection flow.
- **Phase 5 (US3)**: Depends on Phase 2 and integrates with US1/US2 lifecycle checks.
- **Phase 6 (Polish)**: Depends on completion of target user stories.

### User Story Dependency Graph

- **US1 (P1)** -> **US2 (P2)** -> **US3 (P3)**
- Rationale: US2 and US3 both rely on connection lifecycle introduced in US1, while each remains independently testable after prerequisites.

### Within-Story Ordering

- Tests first (contract/integration/regression), then handlers/services/endpoints, then UI updates and event logging.

---

## Parallel Opportunities

- **Setup**: `T003` and `T004` can run in parallel after `T001`/`T002`.
- **Foundational**: `T007`, `T008`, and `T009` can run in parallel after `T005`/`T006`.
- **US1**: `T013`-`T016` can run in parallel; `T020` can proceed after core handlers (`T017`-`T019`) are stable.
- **US2**: `T022`-`T025` can run in parallel; `T030` can proceed after API/tool contracts stabilize (`T028`/`T029`).
- **US3**: `T032`-`T034` can run in parallel; `T038` can proceed after revoke handler (`T035`-`T037`) lands.
- **Polish**: `T040`-`T044` can run in parallel, then `T045` consolidates.

---

## Parallel Example: User Story 1

```bash
Task: "T013 [US1] Contract tests in tests/contract/jira-connections.contract.test.ts"
Task: "T014 [US1] MCP no-PAT regression in tests/regression/no-pat-leakage-mcp.test.ts"
Task: "T015 [US1] Log no-PAT regression in tests/regression/no-pat-leakage-logs.test.ts"
Task: "T016 [US1] Integration lifecycle test in tests/integration/jira-connection.lifecycle.test.ts"
```

## Parallel Example: User Story 2

```bash
Task: "T022 [US2] Contract tests in tests/contract/jira-attachments.contract.test.ts"
Task: "T023 [US2] Success integration tests in tests/integration/jira-attachments.success.test.ts"
Task: "T024 [US2] Failure integration tests in tests/integration/jira-attachments.failures.test.ts"
Task: "T025 [US2] Opaque-reference regression in tests/regression/mcp-opaque-reference-enforcement.test.ts"
```

## Parallel Example: User Story 3

```bash
Task: "T032 [US3] Disconnect contract tests in tests/contract/jira-disconnect.contract.test.ts"
Task: "T033 [US3] Disconnect lifecycle integration in tests/integration/jira-disconnect.lifecycle.test.ts"
Task: "T034 [US3] Isolation regression in tests/regression/connection-isolation.test.ts"
```

---

## Implementation Strategy

### MVP First (US1)

1. Complete Phase 1 and Phase 2.
2. Complete US1 tests and implementation (Phase 3).
3. Validate secret-boundary guarantees before expanding scope.

### Incremental Delivery

1. Deliver US1 (secure connection + status) as MVP.
2. Add US2 (list/upload attachments) with expanded failure handling.
3. Add US3 (revoke/TTL enforcement) and finalize lifecycle hardening.
4. Execute Phase 6 docs + full regression validation.

### Format Validation

- All tasks use required checklist format: `- [ ] T### [P?] [Story?] Description with file path`.
- User story tasks include `[US1]`, `[US2]`, or `[US3]`.
- Setup/foundational/polish tasks intentionally omit story labels.
