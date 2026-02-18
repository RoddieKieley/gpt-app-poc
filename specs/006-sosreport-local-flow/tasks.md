# Tasks: Local-First Sosreport MCP Tools (Phase 1)

**Input**: Design documents from `/specs/006-sosreport-local-flow/`  
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: Included because the feature spec explicitly requires automated coverage for happy paths, validation logic, and key failure categories.

**Organization**: Tasks are dependency-ordered by phase and user story to keep implementation incremental and testable.

## Phase 1: Setup

**Purpose**: Prepare source/test/docs scaffolding for sosreport feature work.

- [X] T001 Create sosreport module directory and placeholder files in `src/sosreport/sosreport-tool-schemas.ts`, `src/sosreport/sosreport-errors.ts`, `src/sosreport/sosreport-command.ts`, `src/sosreport/sosreport-paths.ts`, `src/sosreport/sosreport-tool-handlers.ts`
- [X] T002 Create sosreport test file scaffolding in `tests/unit/sosreport-tool-schemas.test.ts`, `tests/unit/sosreport-paths.test.ts`, `tests/unit/sosreport-command.test.ts`, `tests/contract/sosreport-tools.contract.test.ts`, `tests/integration/sosreport-generate.success.test.ts`, `tests/integration/sosreport-generate.failures.test.ts`, `tests/integration/sosreport-fetch.success.test.ts`
- [X] T003 [P] Create regression test scaffolding for existing surfaces in `tests/regression/mcp-tool-surface-preservation.test.ts` and `tests/regression/skill-resource-preservation.test.ts`
- [X] T004 [P] Add feature task references and verification command notes in `specs/006-sosreport-local-flow/quickstart.md`

---

## Phase 2: Foundational Validation and Execution (Blocking)

**Purpose**: Build shared validation/execution primitives required by both user stories.

**⚠️ CRITICAL**: User story work starts only after this phase completes.

- [X] T005 Implement shared schema primitives and exported types in `src/sosreport/sosreport-tool-schemas.ts`
- [X] T006 [P] Implement plugin token and `log_size` validators in `src/sosreport/sosreport-tool-schemas.ts`
- [X] T007 Implement option conflict validation (`only_plugins` vs `enable_plugins`/`disable_plugins`) in `src/sosreport/sosreport-tool-schemas.ts`
- [X] T008 [P] Implement categorized sosreport error types and fallback text mapping in `src/sosreport/sosreport-errors.ts`
- [X] T009 Implement local `sos` availability check and command execution wrapper with default timeout 600000 ms in `src/sosreport/sosreport-command.ts`
- [X] T010 Implement non-interactive privilege execution (`sudo -n`) and stderr-to-error-category mapping in `src/sosreport/sosreport-command.ts`
- [X] T011 Implement archive path parsing and fallback latest-match lookup in `src/sosreport/sosreport-paths.ts`
- [X] T012 Implement fetch reference path safety and sosreport filename checks in `src/sosreport/sosreport-paths.ts`
- [X] T013 [P] Add foundational unit tests for validation and conflicts in `tests/unit/sosreport-tool-schemas.test.ts`
- [X] T014 [P] Add foundational unit tests for command timeout and privilege error mapping in `tests/unit/sosreport-command.test.ts`
- [X] T015 [P] Add foundational unit tests for archive parse fallback and path safety rules in `tests/unit/sosreport-paths.test.ts`

**Checkpoint**: Shared validators, command runner, and path safety logic are ready for story-specific handlers.

---

## Phase 3: User Story 1 - Generate Local Diagnostic Archive (Priority: P1) 🎯 MVP

**Goal**: Deliver `generate_sosreport` with validated options, local privileged execution, archive resolution, and fetch reference output.

**Independent Test**: Calling `generate_sosreport` with valid input returns structured metadata plus fetch reference; invalid combinations and privilege issues return actionable failures with text fallback.

### Tests for User Story 1

- [X] T016 [P] [US1] Add contract coverage for `generate_sosreport` schema and annotations in `tests/contract/sosreport-tools.contract.test.ts`
- [X] T017 [P] [US1] Add integration happy-path test for generation option propagation and structured output in `tests/integration/sosreport-generate.success.test.ts`
- [X] T018 [P] [US1] Add integration negative tests for invalid plugin/log_size/conflict combinations in `tests/integration/sosreport-generate.failures.test.ts`
- [X] T019 [P] [US1] Add integration negative tests for timeout and sudo password-required mapping in `tests/integration/sosreport-generate.failures.test.ts`
- [X] T020 [P] [US1] Add integration negative test for archive parse fallback failure when no matching archive exists in `tests/integration/sosreport-generate.failures.test.ts`

### Implementation for User Story 1

- [X] T021 [US1] Implement `handleGenerateSosreport` request validation, command invocation, and archive path resolution in `src/sosreport/sosreport-tool-handlers.ts`
- [X] T022 [US1] Implement `generate_sosreport` structured content payload (`archive_path`, `archive_name`, `generated_at`, `fetch_reference`, `execution_mode`, `timeout_ms`) in `src/sosreport/sosreport-tool-handlers.ts`
- [X] T023 [US1] Implement plain-text fallback success and actionable error messages for `generate_sosreport` in `src/sosreport/sosreport-tool-handlers.ts`
- [X] T024 [US1] Register `generate_sosreport` MCP tool with correct annotations and schema in `server.ts`

**Checkpoint**: `generate_sosreport` is independently functional and testable.

---

## Phase 4: User Story 2 - Fetch Generated Archive for Reuse (Priority: P2)

**Goal**: Deliver `fetch_sosreport` with fetch reference validation, `/tmp` copy behavior, checksum metadata, and compatibility with artifact workflows.

**Independent Test**: Calling `fetch_sosreport` with a valid generate-produced reference returns `/tmp` `archive_path`, `size_bytes`, and `sha256`; invalid references fail safely with actionable text.

### Tests for User Story 2

- [X] T025 [P] [US2] Add contract coverage for `fetch_sosreport` schema and annotations in `tests/contract/sosreport-tools.contract.test.ts`
- [X] T026 [P] [US2] Add integration happy-path fetch test covering `/tmp` copy path and checksum output in `tests/integration/sosreport-fetch.success.test.ts`
- [X] T027 [P] [US2] Add integration negative tests for invalid/non-absolute/unsafe fetch references in `tests/integration/sosreport-generate.failures.test.ts`
- [X] T028 [P] [US2] Add integration negative tests for read/copy failures and missing source archive in `tests/integration/sosreport-generate.failures.test.ts`

### Implementation for User Story 2

- [X] T029 [US2] Implement `handleFetchSosreport` validation and source archive read flow in `src/sosreport/sosreport-tool-handlers.ts`
- [X] T030 [US2] Implement `/tmp` copy output, size calculation, and SHA-256 generation in `src/sosreport/sosreport-tool-handlers.ts`
- [X] T031 [US2] Implement plain-text fallback success and actionable error messages for `fetch_sosreport` in `src/sosreport/sosreport-tool-handlers.ts`
- [X] T032 [US2] Register `fetch_sosreport` MCP tool with correct annotations and schema in `server.ts`

**Checkpoint**: `fetch_sosreport` is independently functional and returns artifact-compatible output.

---

## Phase 5: Integration and Regression

**Purpose**: Validate end-to-end interoperability and prevent regressions in existing tool surfaces.

- [X] T033 Add integration test for generate-to-fetch workflow and fetch reference handoff in `tests/integration/sosreport-fetch.success.test.ts`
- [X] T034 Add integration test confirming fetched `/tmp` archive path is accepted by artifact selection constraints in `tests/integration/sosreport-fetch.success.test.ts`
- [X] T035 [P] Update MCP tool surface regression assertions to include new tools without changing existing metadata expectations in `tests/regression/mcp-tool-surface-preservation.test.ts`
- [X] T036 [P] Verify existing Jira tool surface remains unchanged in `tests/regression/jira-surface-preservation.test.ts`
- [X] T037 [P] Verify `list_skills` and `skill://hello-world/SKILL.md` discovery behavior remains unchanged in `tests/regression/skill-resource-preservation.test.ts`
- [X] T038 Run full validation suite for sosreport + existing Jira/skill surfaces using `package.json` scripts in `package.json`

---

## Phase 6: Docs and Polish

**Purpose**: Finalize operator guidance, scope boundaries, and implementation quality checks.

- [X] T039 Update local prerequisites, `sudo -n` behavior, local-only limitations, and deferred SSH scope in `README.md`
- [X] T040 [P] Update operational guidance for `/etc/sudoers.d/mcp-sos`, `/tmp` cleanup, and failure remediation in `docs/operator-guide.md`
- [X] T041 [P] Align feature contracts and quickstart verification notes with final implementation behavior in `specs/006-sosreport-local-flow/contracts/mcp-tools-sosreport.json` and `specs/006-sosreport-local-flow/quickstart.md`
- [X] T042 Perform final constitution-aligned fallback/error wording review for both tools in `src/sosreport/sosreport-tool-handlers.ts`

---

## Dependencies and Execution Order

### Phase Dependencies

- Setup (Phase 1): no dependencies.
- Foundational validation/execution (Phase 2): depends on Setup and blocks all user stories.
- User Story 1 (Phase 3): depends on Foundational completion; MVP target.
- User Story 2 (Phase 4): depends on Foundational completion; end-to-end flow depends on US1 fetch reference production.
- Integration/regression (Phase 5): depends on US1 and US2 completion.
- Docs/polish (Phase 6): depends on implementation completion; can start drafting earlier but finalize after Phase 5.

### User Story Dependencies

- **US1 (P1)**: no dependency on other stories after Foundational.
- **US2 (P2)**: core handler work can proceed after Foundational; end-to-end validation depends on US1 output contract.

### Within-Story Ordering

- Tests for each story should be authored first and observed failing before implementation tasks.
- Handler implementation precedes tool registration in `server.ts`.
- Tool registration precedes integration and regression verification.

## Parallel Opportunities

- Foundational tasks marked `[P]` (T006, T008, T013, T014, T015) can run concurrently after T005.
- US1 tests marked `[P]` (T016-T020) can run in parallel before US1 implementation tasks.
- US2 tests marked `[P]` (T025-T028) can run in parallel before US2 implementation tasks.
- Regression and docs tasks marked `[P]` (T035-T037, T040-T041) can run concurrently.

## Parallel Example: User Story 1

```bash
Task: "T016 [US1] Add contract coverage in tests/contract/sosreport-tools.contract.test.ts"
Task: "T017 [US1] Add generate happy-path integration test in tests/integration/sosreport-generate.success.test.ts"
Task: "T018 [US1] Add validation negative tests in tests/integration/sosreport-generate.failures.test.ts"
Task: "T019 [US1] Add timeout/sudo negative tests in tests/integration/sosreport-generate.failures.test.ts"
```

## Parallel Example: User Story 2

```bash
Task: "T025 [US2] Add contract coverage in tests/contract/sosreport-tools.contract.test.ts"
Task: "T026 [US2] Add fetch happy-path integration test in tests/integration/sosreport-fetch.success.test.ts"
Task: "T027 [US2] Add invalid fetch path tests in tests/integration/sosreport-generate.failures.test.ts"
Task: "T028 [US2] Add read/copy failure tests in tests/integration/sosreport-generate.failures.test.ts"
```

## Implementation Strategy

### MVP First (US1)

1. Complete Setup and Foundational phases.
2. Complete US1 tasks and verify `generate_sosreport` independently.
3. Validate error mapping and fallback text behavior before adding fetch flow.

### Incremental Delivery

1. Deliver US1 (`generate_sosreport`) as first usable slice.
2. Deliver US2 (`fetch_sosreport`) and `/tmp` artifact output.
3. Complete integration/regression checks to protect Jira and skill discovery surfaces.
4. Finalize docs and polish with explicit Phase 2 SSH deferral.

### Notes

- This task set explicitly excludes SSH implementation work.
- Validation-focused negative tests are included for both tools.
- Existing `jira_*`, `list_skills`, and skill resource behavior are protected by dedicated regression tasks.
