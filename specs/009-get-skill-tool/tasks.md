# Tasks: Get Skill Tool Fallback

**Input**: Design documents from `/wip/src/github.com/roddiekieley/gpt-app-poc/specs/009-get-skill-tool/`  
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/get-skill-contract.json`

**Tests**: Required by spec/plan for contract, regression, and smoke coverage.

**Organization**: Tasks are grouped into dependency-ordered phases with independently testable user stories.

## Format: `[ID] [P?] [Story] Description`

- `[P]` marks tasks that are safe to run in parallel (different files, no dependency on incomplete tasks).
- `[US1]` and `[US2]` map to user-story phases.
- Every task includes an explicit file path.

---

## Phase 1: Setup

**Purpose**: Align implementation artifacts and test intent before runtime changes.

- [ ] T001 Reconcile implementation constraints and acceptance checks in `/wip/src/github.com/roddiekieley/gpt-app-poc/specs/009-get-skill-tool/plan.md`
- [ ] T002 Confirm request/response validation contract details in `/wip/src/github.com/roddiekieley/gpt-app-poc/specs/009-get-skill-tool/contracts/get-skill-contract.json`
- [ ] T003 Define executable validation flow and commands in `/wip/src/github.com/roddiekieley/gpt-app-poc/specs/009-get-skill-tool/quickstart.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish baseline regression safety checks before `get_skill` implementation.

**⚠️ CRITICAL**: No user-story implementation starts until this phase is complete.

- [ ] T004 Add baseline tool-surface guardrails for existing Jira/sosreport/list_skills entries in `/wip/src/github.com/roddiekieley/gpt-app-poc/tests/regression/mcp-tool-surface-preservation.test.ts`
- [ ] T005 [P] Add baseline skill resource preservation assertions for `resources/list` and `resources/read` in `/wip/src/github.com/roddiekieley/gpt-app-poc/tests/regression/skill-resource-preservation.test.ts`
- [ ] T006 [P] Add baseline contract assertions for engage skill discovery/resource-read behavior in `/wip/src/github.com/roddiekieley/gpt-app-poc/tests/contract/engage-red-hat-support.contract.test.ts`

**Checkpoint**: Existing surfaces are explicitly guarded before new tool logic is added.

---

## Phase 3: User Story 1 - Add `get_skill` Tool (Priority: P1) 🎯 MVP

**Goal**: Provide functional `get_skill` for the engage skill URI with text fallback and structured content.

**Independent Test**: `tools/list` shows `get_skill`; `tools/call get_skill` with `skill://engage-red-hat-support/SKILL.md` succeeds; response parity with `resources/read` passes.

### Tests for User Story 1

- [ ] T007 [P] [US1] Add `tools/list` metadata assertions for `get_skill` in `/wip/src/github.com/roddiekieley/gpt-app-poc/tests/contract/engage-red-hat-support.contract.test.ts`
- [ ] T008 [P] [US1] Add smoke checks for `tools/list` and valid `tools/call get_skill` in `/wip/src/github.com/roddiekieley/gpt-app-poc/scripts/mcp-smoke-tests.ts`

### Implementation for User Story 1

- [ ] T009 [US1] Register `get_skill` via `registerAppTool` with required annotations/metadata in `/wip/src/github.com/roddiekieley/gpt-app-poc/server.ts`
- [ ] T010 [US1] Add `get_skill` input schema `z.object({ uri: z.string().min(1, "skill URI is required") })` in `/wip/src/github.com/roddiekieley/gpt-app-poc/server.ts`
- [ ] T011 [US1] Implement valid-URI success path reusing `ENGAGE_SKILL_RESOURCE_URI`, `SKILL_RESOURCE_MIME_TYPE`, and `loadEngageSkillMarkdown` in `/wip/src/github.com/roddiekieley/gpt-app-poc/server.ts`
- [ ] T012 [US1] Implement success response shape with text fallback in `content` plus `structuredContent { uri, mimeType, text }` in `/wip/src/github.com/roddiekieley/gpt-app-poc/server.ts`
- [ ] T013 [US1] Add parity assertions between `tools/call get_skill` and `resources/read` in `/wip/src/github.com/roddiekieley/gpt-app-poc/tests/contract/engage-red-hat-support.contract.test.ts`
- [ ] T014 [US1] Add regression requirement for `get_skill` presence while keeping existing tools intact in `/wip/src/github.com/roddiekieley/gpt-app-poc/tests/regression/mcp-tool-surface-preservation.test.ts`

**Checkpoint**: MVP behavior is implemented and independently verifiable for valid engage skill URI retrieval.

---

## Phase 4: User Story 2 - Validation and Safe Error Handling (Priority: P2)

**Goal**: Enforce strict URI validation and actionable, non-secret error handling.

**Independent Test**: `tools/call get_skill` invalid/unsupported URI fails safely with actionable text; no secrets appear in outputs; valid behavior from US1 remains intact.

### Tests for User Story 2

- [ ] T015 [P] [US2] Add invalid and unsupported URI contract cases for `get_skill` in `/wip/src/github.com/roddiekieley/gpt-app-poc/tests/contract/engage-red-hat-support.contract.test.ts`
- [ ] T016 [P] [US2] Add invalid URI smoke checks and remediation-text assertions in `/wip/src/github.com/roddiekieley/gpt-app-poc/scripts/mcp-smoke-tests.ts`

### Implementation for User Story 2

- [ ] T017 [US2] Harden URI normalization and `skill://` scheme validation in `/wip/src/github.com/roddiekieley/gpt-app-poc/server.ts`
- [ ] T018 [US2] Restrict resolution to supported registered skill identity and reject unknown URIs in `/wip/src/github.com/roddiekieley/gpt-app-poc/server.ts`
- [ ] T019 [US2] Return `isError: true` with actionable remediation text and no secret-bearing details for invalid/unsupported URI in `/wip/src/github.com/roddiekieley/gpt-app-poc/server.ts`
- [ ] T020 [US2] Add regression parity/error-safety checks for `get_skill` without changing `resources/read` behavior in `/wip/src/github.com/roddiekieley/gpt-app-poc/tests/regression/skill-resource-preservation.test.ts`

**Checkpoint**: Validation and error hardening are complete with safe, actionable failure behavior.

---

## Phase 5: Polish & Regression Confirmation

**Purpose**: Final regression safety confirmation and full validation runs.

- [ ] T021 [P] Confirm `list_skills` output remains unchanged while `get_skill` is additive in `/wip/src/github.com/roddiekieley/gpt-app-poc/tests/regression/skill-resource-preservation.test.ts`
- [ ] T022 [P] Confirm `resources/read` behavior for engage skill remains unchanged in `/wip/src/github.com/roddiekieley/gpt-app-poc/tests/contract/engage-red-hat-support.contract.test.ts`
- [ ] T023 [P] Confirm existing Jira/sosreport tool surfaces remain unchanged in `/wip/src/github.com/roddiekieley/gpt-app-poc/tests/regression/mcp-tool-surface-preservation.test.ts`
- [ ] T024 Run contract validation (`npm run test:contract`) using scripts defined in `/wip/src/github.com/roddiekieley/gpt-app-poc/package.json`
- [ ] T025 Run MCP smoke validation (`npm run test:mcp`) using scripts defined in `/wip/src/github.com/roddiekieley/gpt-app-poc/package.json`
- [ ] T026 Run regression validation (`npm run test:regression`) using scripts defined in `/wip/src/github.com/roddiekieley/gpt-app-poc/package.json`
- [ ] T027 Update final verification notes and execution evidence in `/wip/src/github.com/roddiekieley/gpt-app-poc/specs/009-get-skill-tool/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: Starts immediately.
- **Phase 2 (Foundational)**: Depends on Phase 1; blocks all user-story implementation.
- **Phase 3 (US1)**: Depends on Phase 2 completion.
- **Phase 4 (US2)**: Depends on US1 implementation completion.
- **Phase 5 (Polish/Regression)**: Depends on US1 and US2 completion.

### User Story Dependencies

- **US1 (P1)**: MVP; no dependency on other user stories once foundational tasks are complete.
- **US2 (P2)**: Builds directly on `get_skill` logic from US1 and extends validation/error safety.

### Task-Level Dependency Notes

- T009-T012 must complete before T013 and T020 parity checks.
- T017-T019 must complete before T015/T016 assertions can pass.
- T024-T026 run after all implementation and test updates are complete.

---

## Parallel Execution Examples

### Parallel Example: US1

```bash
Task: "T007 [US1] Add tools/list metadata assertions in /wip/src/github.com/roddiekieley/gpt-app-poc/tests/contract/engage-red-hat-support.contract.test.ts"
Task: "T008 [US1] Add smoke checks in /wip/src/github.com/roddiekieley/gpt-app-poc/scripts/mcp-smoke-tests.ts"
```

### Parallel Example: US2

```bash
Task: "T015 [US2] Add invalid URI contract cases in /wip/src/github.com/roddiekieley/gpt-app-poc/tests/contract/engage-red-hat-support.contract.test.ts"
Task: "T016 [US2] Add invalid URI smoke checks in /wip/src/github.com/roddiekieley/gpt-app-poc/scripts/mcp-smoke-tests.ts"
```

### Parallel Example: Polish

```bash
Task: "T021 Confirm list_skills unchanged in /wip/src/github.com/roddiekieley/gpt-app-poc/tests/regression/skill-resource-preservation.test.ts"
Task: "T023 Confirm Jira/sosreport surfaces unchanged in /wip/src/github.com/roddiekieley/gpt-app-poc/tests/regression/mcp-tool-surface-preservation.test.ts"
```

---

## Implementation Strategy

### MVP First (US1 Only)

1. Complete Phase 1 and Phase 2.
2. Complete Phase 3 (US1) to deliver functional `get_skill` for engage skill URI.
3. Validate US1 independently via `tools/list`, valid `tools/call`, and `resources/read` parity checks.

### Incremental Delivery

1. **MVP**: US1 functional `get_skill` for supported engage URI.
2. **Hardening**: US2 strict URI validation and robust safe errors.
3. **Confidence**: Polish/regression confirmation and full suite runs.

---

## Notes

- All tasks use strict checklist format with IDs and explicit file paths.
- `[P]` appears only where tasks touch different files and do not depend on incomplete code changes.
- Independent test criteria are embedded in US1 and US2 sections.
