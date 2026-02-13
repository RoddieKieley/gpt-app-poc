# Tasks: MCP Runtime Skill Discovery (Hello World Skill)

**Input**: Design documents from `/specs/005-mcp-skill-discovery/`  
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`

**Tests**: Include MCP smoke and regression-safety tasks to protect existing Jira behavior.  
**Organization**: Tasks are grouped by user story; execute US1 fully before starting US2.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on incomplete tasks)
- **[Story]**: User story label (`[US1]`, `[US2]`) for story-phase tasks only
- Every task includes exact file path(s)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare minimal scaffolding for skill resource work and test coverage.

- [ ] T001 Create skill directory scaffolding at `skills/hello-world/` for repo-local skill content
- [ ] T002 Create initial skill document at `skills/hello-world/SKILL.md` with Hello World skill metadata and instructions
- [ ] T003 [P] Add feature-specific test notes for manual verification steps in `specs/005-mcp-skill-discovery/quickstart.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish canonical identifiers and guardrails shared by both user stories.

**⚠️ CRITICAL**: No user story implementation begins until this phase is complete.

- [ ] T004 Add canonical constants for skill URI (`skill://hello-world/SKILL.md`) and source path (`skills/hello-world/SKILL.md`) in `server.ts`
- [ ] T005 [P] Add helper logic for markdown skill content loading and text fallback messaging in `server.ts`
- [ ] T006 [P] Add regression-safety assertions baseline for existing Jira tools presence/metadata in `scripts/mcp-smoke-tests.ts`

**Checkpoint**: Canonical URI/path and shared safety checks are ready.

---

## Phase 3: User Story 1 - Expose Hello World skill as MCP resource (Priority: P1) 🎯 MVP

**Goal**: Expose repo-local `SKILL.md` as a canonical `skill://` MCP resource with markdown read/list support.

**Independent Test**: Start server, call MCP `resources/list` and `resources/read` for `skill://hello-world/SKILL.md`, confirm markdown content is returned and resource is discoverable.

### Tests for User Story 1

- [ ] T007 [P] [US1] Extend resource discovery checks for `resources/list` to include `skill://hello-world/SKILL.md` in `scripts/mcp-smoke-tests.ts`
- [ ] T008 [P] [US1] Extend resource read checks to validate markdown payload and expected content from `skills/hello-world/SKILL.md` in `scripts/mcp-smoke-tests.ts`
- [ ] T009 [P] [US1] Add regression test asserting Jira tool contracts remain intact after resource addition in `tests/regression/jira-surface-preservation.test.ts`

### Implementation for User Story 1

- [ ] T010 [US1] Register canonical skill resource with markdown MIME in `server.ts`
- [ ] T011 [US1] Implement skill resource read handler that loads `skills/hello-world/SKILL.md` and returns safe fallback text if unavailable in `server.ts`
- [ ] T012 [US1] Verify existing UI resources remain unchanged while adding skill resource registration in `server.ts`

**Checkpoint**: US1 is fully functional and independently testable (MVP complete).

---

## Phase 4: User Story 2 - Add read-only discovery tool referencing canonical URI (Priority: P2)

**Goal**: Add a tiny read-only tool that returns text fallback and references the same canonical skill URI.

**Independent Test**: List tools, call discovery tool with no arguments, verify response includes user-actionable text and `skill://hello-world/SKILL.md`, and confirm no side effects.

### Tests for User Story 2

- [ ] T013 [P] [US2] Extend tool list checks to verify discovery tool registration and read-only annotations in `scripts/mcp-smoke-tests.ts`
- [ ] T014 [P] [US2] Extend tool call checks to validate text fallback and canonical URI reference in `scripts/mcp-smoke-tests.ts`
- [ ] T015 [P] [US2] Add regression test confirming Jira tool names and metadata are unchanged after discovery tool addition in `tests/regression/jira-surface-preservation.test.ts`

### Implementation for User Story 2

- [ ] T016 [US2] Register `list_skills` read-only MCP tool schema/metadata in `server.ts`
- [ ] T017 [US2] Implement `list_skills` handler returning plain-text fallback plus canonical URI reference in `server.ts`
- [ ] T018 [US2] Ensure discovery tool response remains host-agnostic and does not alter Jira logic paths in `server.ts`

**Checkpoint**: US2 works independently and preserves US1 behavior.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, documentation sync, and regression safety confirmation.

- [ ] T019 [P] Update feature validation steps/results for resource + discovery tool in `specs/005-mcp-skill-discovery/quickstart.md`
- [ ] T020 Run `npm run test:mcp` and record pass/fail output in `specs/005-mcp-skill-discovery/quickstart.md`
- [ ] T021 Run `npm run test:jira` to verify no Jira behavior changes and record summary in `specs/005-mcp-skill-discovery/quickstart.md`
- [ ] T022 [P] Update feature overview and usage notes in `README.md` (skill resource URI + discovery tool, explicitly no Jira flow changes)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: Start immediately.
- **Phase 2 (Foundational)**: Depends on Phase 1 and blocks all story work.
- **Phase 3 (US1)**: Depends on Phase 2; must be completed fully before US2.
- **Phase 4 (US2)**: Depends on complete US1 (strict sequencing requested).
- **Phase 5 (Polish)**: Depends on completion of US1 and US2.

### User Story Dependency Graph

- **US1 (P1)** -> **US2 (P2)**
- Rationale: US2 discovery tool must reference the canonical URI/resource implemented in US1.

### Within-Story Ordering

- Story tests first, then implementation, then story checkpoint validation.
- Keep `server.ts` edits sequential to avoid merge conflicts and behavior drift.

---

## Parallel Opportunities

- **Setup**: `T003` can run in parallel with `T001`/`T002` once scaffolding exists.
- **Foundational**: `T005` and `T006` can run in parallel after `T004`.
- **US1**: `T007`, `T008`, and `T009` can run in parallel before implementation tasks `T010`-`T012`.
- **US2**: `T013`, `T014`, and `T015` can run in parallel before implementation tasks `T016`-`T018`.
- **Polish**: `T019` and `T022` can run in parallel; `T020` and `T021` follow code-complete state.

---

## Parallel Example: User Story 1

```bash
Task: "T007 [US1] Add resources/list skill URI check in scripts/mcp-smoke-tests.ts"
Task: "T008 [US1] Add resources/read markdown check in scripts/mcp-smoke-tests.ts"
Task: "T009 [US1] Add Jira surface regression test in tests/regression/jira-surface-preservation.test.ts"
```

## Parallel Example: User Story 2

```bash
Task: "T013 [US2] Add discovery tool listing assertions in scripts/mcp-smoke-tests.ts"
Task: "T014 [US2] Add discovery tool call assertions in scripts/mcp-smoke-tests.ts"
Task: "T015 [US2] Preserve Jira surface assertions in tests/regression/jira-surface-preservation.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 and Phase 2.
2. Complete all US1 tests and implementation tasks.
3. Validate US1 independently (`resources/list` + `resources/read`).
4. Proceed to US2 only after US1 is complete and stable.

### Incremental Delivery

1. Deliver US1 (canonical skill resource) as MVP.
2. Deliver US2 (read-only discovery tool referencing same URI).
3. Finish polish + regression safety validation (`test:mcp` and `test:jira`).

### Format Validation

- All tasks use required checklist format: `- [ ] T### [P?] [Story?] Description with file path`.
- User story tasks include `[US1]` or `[US2]`.
- Setup/foundational/polish tasks intentionally omit story labels.

