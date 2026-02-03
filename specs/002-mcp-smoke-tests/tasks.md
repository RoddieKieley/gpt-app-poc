# Tasks: Automated MCP Smoke Tests

**Input**: Design documents from `/specs/002-mcp-smoke-tests/`  
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/, quickstart.md

**Tests**: Tests are included because the user requested test-first delivery.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create `scripts/mcp-smoke-tests.ts` with a minimal CLI entry and TODO markers for checks
- [x] T002 [P] Add `test:mcp` npm script in `package.json` to invoke `scripts/mcp-smoke-tests.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 Define shared constants (host, port 3000, timeouts, tool name) in `scripts/mcp-smoke-tests.ts`
- [x] T004 Implement a JSON-RPC HTTP request helper in `scripts/mcp-smoke-tests.ts`
- [x] T005 Implement server process lifecycle helpers (start/stop, stdout/stderr capture) in `scripts/mcp-smoke-tests.ts`
- [x] T006 Add a preflight check for built output (`dist/mcp-app.html`) in `scripts/mcp-smoke-tests.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Run automated MCP checks after build (Priority: P1) 🎯 MVP

**Goal**: Provide a single automated command that validates MCP initialization, tools, tool call, and UI resource retrieval against built output.

**Independent Test**: Run `npm run build` then `npm run test:mcp`; it starts the server, performs checks, and exits 0 on success.

### Tests for User Story 1 (TEST-FIRST) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T007 [US1] Add a check list stub with failing assertions in `scripts/mcp-smoke-tests.ts` for init, tools/list, tool call, and UI resource fetch
- [x] T008 [US1] Add a timeout test stub (10 seconds) in `scripts/mcp-smoke-tests.ts` for MCP initialization

### Implementation for User Story 1

- [x] T009 [US1] Implement MCP initialize request with 10s timeout in `scripts/mcp-smoke-tests.ts`
- [x] T010 [US1] Implement `tools/list` validation for `hello-world` in `scripts/mcp-smoke-tests.ts`
- [x] T011 [US1] Implement `tools/call` for `hello-world` and validate text fallback in `scripts/mcp-smoke-tests.ts`
- [x] T012 [US1] Implement UI resource retrieval and content check in `scripts/mcp-smoke-tests.ts`
- [x] T013 [US1] Wire exit codes and success summary output in `scripts/mcp-smoke-tests.ts`

**Checkpoint**: User Story 1 smoke tests pass against built output with a single command.

---

## Phase 4: User Story 2 - Diagnose failing checks (Priority: P2)

**Goal**: Ensure failures clearly identify which check failed and surface server stdout/stderr.

**Independent Test**: Intentionally break a check (e.g., rename tool) and confirm the output reports the specific failing check and exits non-zero.

### Tests for User Story 2 (TEST-FIRST) ⚠️

- [x] T014 [US2] Add failing-output assertions for labeled checks in `scripts/mcp-smoke-tests.ts`
- [x] T015 [US2] Add a failure-path assertion that includes captured server stdout/stderr in `scripts/mcp-smoke-tests.ts`

### Implementation for User Story 2

- [x] T016 [US2] Implement per-check labeling and structured failure reporting in `scripts/mcp-smoke-tests.ts`
- [x] T017 [US2] Surface captured server stdout/stderr on failures in `scripts/mcp-smoke-tests.ts`

**Checkpoint**: Failures clearly name the check and include server output.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T018 [P] Update `README.md` Testing section with `npm run test:mcp` usage
- [x] T019 Run `specs/002-mcp-smoke-tests/quickstart.md` steps to confirm accuracy

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: Depend on Foundational phase completion
  - User stories can proceed sequentially in priority order (P1 → P2)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Builds on US1 outputs but is independently testable

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Core request/validation steps before integration and output wiring
- Story complete before moving to the next priority

### Parallel Opportunities

- Setup task T002 can run in parallel with T001 (different files)
- Polish task T017 can run in parallel with T018

---

## Parallel Example

```bash
# Setup tasks that can run together:
Task: "Create scripts/mcp-smoke-tests.ts with a minimal CLI entry and TODO markers for checks"
Task: "Add test:mcp npm script in package.json to invoke scripts/mcp-smoke-tests.ts"

# Polish tasks that can run together:
Task: "Update README.md Testing section with npm run test:mcp usage"
Task: "Run specs/002-mcp-smoke-tests/quickstart.md steps to confirm accuracy"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Run `npm run build` then `npm run test:mcp`

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Demo
3. Add User Story 2 → Test independently → Demo
4. Each story adds value without breaking previous stories

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Avoid vague tasks or cross-story coupling
