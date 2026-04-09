# Tasks: Local CPU Information MCP Tool

**Input**: Design documents from `/specs/020-cpu-information-mcp/`  
**Prerequisites**: `plan.md` (required), `spec.md` (required for user stories), `research.md`, `data-model.md`, `contracts/`

**Tests**: Tests are explicitly required by the feature spec (`FR-007`, `FR-008`, `FR-009`) and user request, so unit/contract/regression test tasks are included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., `US1`, `US2`, `US3`)
- Every task includes an exact file path

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare feature scaffolding and test placeholders without changing runtime behavior.

- [X] T001 Create Linux system-info module directory scaffolding in `src/linux/system-info/` (`cpu-info-model.ts`, `cpu-info-tool-schema.ts`, `cpu-info-parser.ts`, `cpu-info-tool-handler.ts`)
- [X] T002 [P] Create unit test files for CPU parser/handler in `tests/unit/cpu-info-parser.test.ts` and `tests/unit/cpu-info-tool-handler.test.ts`
- [X] T003 [P] Create contract and regression test placeholders in `tests/contract/cpu-information-tools.contract.test.ts` and `tests/regression/mcp-tool-surface-preservation.test.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Implement core CPU schema/model/parser contracts required by all user stories.

**⚠️ CRITICAL**: No user story work should begin until this phase is complete.

- [X] T004 Implement `CpuInfo` and parser result types in `src/linux/system-info/cpu-info-model.ts`
- [X] T005 Implement local-only tool input schema and exported types in `src/linux/system-info/cpu-info-tool-schema.ts`
- [X] T006 Implement raw CPU text normalization helpers and field extractors in `src/linux/system-info/cpu-info-parser.ts`
- [X] T007 [P] Add unit tests for complete parse success cases in `tests/unit/cpu-info-parser.test.ts`
- [X] T008 [P] Add unit tests for parse edge cases (missing physical cores, missing frequency, malformed load avg line) in `tests/unit/cpu-info-parser.test.ts`

**Checkpoint**: CPU model/schema/parser foundation is ready for handler and registration work.

---

## Phase 3: User Story 1 - Retrieve local CPU details (Priority: P1) 🎯 MVP

**Goal**: Provide `get_cpu_information` tool responses with full `CpuInfo` structured output for normal local conditions.

**Independent Test**: Call `get_cpu_information` through MCP and verify all required fields are returned in `structuredContent` with expected data types.

### Tests for User Story 1

- [X] T009 [P] [US1] Add handler unit test for fully-parseable local CPU output in `tests/unit/cpu-info-tool-handler.test.ts`
- [X] T010 [P] [US1] Add contract test asserting `get_cpu_information` appears in `tools/list` with expected annotations and metadata in `tests/contract/cpu-information-tools.contract.test.ts`

### Implementation for User Story 1

- [X] T011 [US1] Implement CPU handler success path with `structuredContent` + text summary in `src/linux/system-info/cpu-info-tool-handler.ts`
- [X] T012 [US1] Register `get_cpu_information` tool in `server.ts` with engage-compatible `_meta` and read-only annotations
- [X] T013 [US1] Wire schema/handler exports and imports in `server.ts` and `src/linux/system-info/*.ts` to compile cleanly

**Checkpoint**: User Story 1 is independently functional and testable as MVP.

---

## Phase 4: User Story 2 - Receive useful output when full parsing is not possible (Priority: P2)

**Goal**: Ensure robust fallback behavior when one or more CPU fields cannot be parsed.

**Independent Test**: Simulate partial/malformed CPU source output and verify tool returns meaningful text fallback while remaining stable.

### Tests for User Story 2

- [X] T014 [P] [US2] Add unit tests for partial parse fallback behavior in `tests/unit/cpu-info-tool-handler.test.ts`
- [X] T015 [P] [US2] Add unit tests for parser warning/missing-field reporting in `tests/unit/cpu-info-parser.test.ts`

### Implementation for User Story 2

- [X] T016 [US2] Implement fallback text assembly for partial parse paths in `src/linux/system-info/cpu-info-tool-handler.ts`
- [X] T017 [US2] Ensure parser preserves `cpu_line` and best-available values for degraded input in `src/linux/system-info/cpu-info-parser.ts`
- [X] T018 [US2] Implement safe error mapping for terminal parse/collection failures in `src/linux/system-info/cpu-info-tool-handler.ts`

**Checkpoint**: User Stories 1 and 2 are independently testable with normal and degraded parsing scenarios.

---

## Phase 5: User Story 3 - Discover tool through MCP listing (Priority: P3)

**Goal**: Keep MCP tool discovery and global surface compatibility stable with `get_cpu_information` added.

**Independent Test**: Run `tools/list` + regression suites and verify new tool inclusion does not break required existing tool/resource surface expectations.

### Tests for User Story 3

- [X] T019 [P] [US3] Extend MCP surface regression required-tools list to include `get_cpu_information` in `tests/regression/mcp-tool-surface-preservation.test.ts`
- [X] T020 [P] [US3] Add contract assertion for local-only schema shape (no `host` property) in `tests/contract/cpu-information-tools.contract.test.ts`

### Implementation for User Story 3

- [X] T021 [US3] Align tool description/title text and metadata conventions with existing engage patterns in `server.ts`
- [ ] T022 [US3] Verify and adjust contract fixture expectations in `specs/020-cpu-information-mcp/contracts/get-cpu-information-tool-surface.contract.v1.json`

**Checkpoint**: User Stories 1-3 are complete with compatibility-guarded discovery behavior.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final consistency pass and full-suite validation before handoff.

- [ ] T023 [P] Run targeted validation suite (`npm run test:unit && npm run test:contract && npm run test:regression`) and capture outcomes in `specs/020-cpu-information-mcp/quickstart.md`
- [ ] T024 Review and tighten CPU tool docs/assumptions for local-only scope in `specs/020-cpu-information-mcp/spec.md` and `specs/020-cpu-information-mcp/quickstart.md`
- [ ] T025 Run full confidence suite (`npm run test:unit && npm run test:contract && npm run test:integration && npm run test:regression`) and record readiness notes in `specs/020-cpu-information-mcp/plan.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies; start immediately.
- **Phase 2 (Foundational)**: Depends on Phase 1; blocks all user stories.
- **Phase 3 (US1)**: Depends on Phase 2.
- **Phase 4 (US2)**: Depends on Phase 2 and reuses US1 handler/parser baseline.
- **Phase 5 (US3)**: Depends on US1 registration being complete.
- **Phase 6 (Polish)**: Depends on all targeted user stories complete.

### User Story Dependencies

- **US1 (P1)**: Can start after foundational tasks complete; delivers MVP.
- **US2 (P2)**: Builds on parser/handler baseline from US1 for robust fallback.
- **US3 (P3)**: Depends on tool registration and metadata from US1; regression/contract hardening can run alongside late US2 work.

### Within Each User Story

- Write or extend tests for that story first and confirm they fail before implementation completion.
- Complete parser/model updates before handler wiring when both are touched.
- Complete registration updates before contract/regression assertions that depend on discovery output.

### Parallel Opportunities

- Setup tasks marked `[P]` can run in parallel (`T002`, `T003`).
- Foundational parser tests (`T007`, `T008`) can run in parallel after parser scaffolding exists.
- US1 tests (`T009`, `T010`) can run in parallel.
- US2 tests (`T014`, `T015`) can run in parallel.
- US3 test tasks (`T019`, `T020`) can run in parallel.
- Polish validation and doc updates can partially overlap (`T023`, `T024`) before final full-suite run (`T025`).

---

## Parallel Example: User Story 1

```bash
# Parallel test authoring for US1:
Task: "T009 [US1] Add handler unit test for fully-parseable local CPU output in tests/unit/cpu-info-tool-handler.test.ts"
Task: "T010 [US1] Add contract test asserting get_cpu_information appears in tools/list in tests/contract/cpu-information-tools.contract.test.ts"
```

## Parallel Example: User Story 2

```bash
# Parallel edge-case coverage for US2:
Task: "T014 [US2] Add unit tests for partial parse fallback behavior in tests/unit/cpu-info-tool-handler.test.ts"
Task: "T015 [US2] Add unit tests for parser warning/missing-field reporting in tests/unit/cpu-info-parser.test.ts"
```

## Parallel Example: User Story 3

```bash
# Parallel compatibility hardening for US3:
Task: "T019 [US3] Extend required tools list in tests/regression/mcp-tool-surface-preservation.test.ts"
Task: "T020 [US3] Add local-only schema assertion in tests/contract/cpu-information-tools.contract.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Setup and Foundational phases.
2. Deliver US1 (`T009`-`T013`) and validate independent test criteria.
3. Demo local `get_cpu_information` structured response as MVP.

### Incremental Delivery

1. Add US2 fallback robustness after MVP.
2. Add US3 discovery and surface regression guarantees.
3. Finish with polish/full-suite validation.

### Parallel Team Strategy

1. One developer completes foundational parser/schema/model baseline.
2. Second developer drafts contract/regression tests in parallel once registration shape is known.
3. Merge on handler + registration completion, then run shared validation gates.

---

## Notes

- All tasks follow strict checklist format: checkbox, Task ID, optional `[P]`, required `[USx]` for story phases, and explicit file path.
- Suggested MVP scope is **User Story 1 only** after foundational work.
- Keep local-only semantics strict for this phase; no `host` argument should be introduced.
