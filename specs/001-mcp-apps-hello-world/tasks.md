# Tasks: MCP Apps Hello World

**Input**: Design documents from `/specs/001-mcp-apps-hello-world/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/, quickstart.md

**Tests**: Not requested in the specification (manual validation only).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Minimal runnable skeleton and build tooling

- [x] T001 Create root project scaffolding files in `package.json`, `tsconfig.json`, `vite.config.ts`
- [x] T002 [P] Add UI entry point scaffold in `mcp-app.html`
- [x] T003 [P] Add UI script scaffold in `src/mcp-app.ts`
- [x] T004 [P] Add MCP server scaffold in `server.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core wiring for build + serve + MCP transport

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 Configure Vite single-file build to output `dist/mcp-app.html` in `vite.config.ts`
- [x] T006 Wire npm scripts for build and serve in `package.json`
- [x] T007 Implement HTTP MCP transport skeleton and Express server boot in `server.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Verify MCP Apps Hello World (Priority: P1) 🎯 MVP

**Goal**: Tool call renders UI and supports a UI-triggered round-trip.

**Independent Test**: Call `hello-world` from an MCP Apps-capable host and confirm UI renders and updates after interaction.

### Implementation for User Story 1

- [x] T008 [US1] Define `hello-world` tool contract and ui:// resource registration in `server.ts`
- [x] T009 [US1] Serve the bundled UI resource from `dist/mcp-app.html` in `server.ts`
- [x] T010 [US1] Implement Hello World UI rendering and tool-result handling in `src/mcp-app.ts`
- [x] T011 [US1] Implement UI-triggered tool call and updated greeting in `src/mcp-app.ts`
- [x] T012 [US1] Ensure initial greeting appears in `mcp-app.html` and is updated by UI logic

**Checkpoint**: User Story 1 is functional and independently testable

---

## Phase 4: User Story 2 - Text-Only Host Fallback (Priority: P2)

**Goal**: Text-only hosts receive a complete fallback response.

**Independent Test**: Call `hello-world` in a text-only host and confirm the fallback text is sufficient and readable.

### Implementation for User Story 2

- [x] T013 [US2] Ensure `hello-world` tool response includes a complete text fallback in `server.ts`
- [x] T014 [US2] Add fallback/error messaging for failed UI interactions in `server.ts` and `src/mcp-app.ts`

**Checkpoint**: User Story 2 is functional and independently testable

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Quality checks and documentation alignment

- [x] T015 [P] Validate quickstart steps and update `specs/001-mcp-apps-hello-world/quickstart.md` if needed
- [x] T016 [P] Review constitution compliance for MCP Apps strictness and text fallback behavior

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: Depend on Foundational phase completion
- **Polish (Final Phase)**: Depends on desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - no dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - complements US1 but independently testable

### Within Each User Story

- Tool/resource registration before UI calls
- UI logic before validation steps
- Story complete before moving to next priority

### Parallel Opportunities

- Phase 1 tasks marked [P] can run in parallel
- Phase 5 tasks marked [P] can run in parallel

---

## Parallel Example: User Story 1

```bash
# Parallel UI setup tasks:
Task: "Implement Hello World UI rendering and tool-result handling in src/mcp-app.ts"
Task: "Implement UI-triggered tool call and updated greeting in src/mcp-app.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Demo
3. Add User Story 2 → Test independently → Demo

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Avoid host-specific runtime APIs
