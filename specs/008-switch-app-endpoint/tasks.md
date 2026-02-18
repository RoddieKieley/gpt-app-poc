# Tasks: Development Endpoint Switch

**Input**: Design documents from `/specs/008-switch-app-endpoint/`  
**Prerequisites**: `plan.md` (required), `spec.md` (required), `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: Validation is explicitly required (`npm run test:contract`, `npm run test:mcp`, and legacy-reference scan excluding `specs/**`).  
**Organization**: Tasks are grouped by user story so each story can be implemented and tested independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story label (`[US1]`, `[US2]`, `[US3]`)
- Every task includes an exact file path

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish safe migration boundaries and baseline evidence before edits.

- [X] T001 Capture baseline legacy endpoint matches for in-scope files (`/wip/src/github.com/roddiekieley/gpt-app-poc/server.ts`, `/wip/src/github.com/roddiekieley/gpt-app-poc/scripts/mcp-smoke-tests.ts`, `/wip/src/github.com/roddiekieley/gpt-app-poc/tests/contract/engage-red-hat-support.contract.test.ts`, `/wip/src/github.com/roddiekieley/gpt-app-poc/README.md`) using `rg "gptapppoc\\.kieley\\.io"`.
- [X] T002 Confirm out-of-scope historical specs remain untouched by recording current matches in `/wip/src/github.com/roddiekieley/gpt-app-poc/specs/**` as reference-only evidence before implementation.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Apply the runtime-first replacement and enforce no-global-replace guardrails.

**⚠️ CRITICAL**: No user-story validation work begins until this phase is complete.

- [X] T003 Replace `https://gptapppoc.kieley.io` with `https://leisured-carina-unpromotable.ngrok-free.dev` in `/wip/src/github.com/roddiekieley/gpt-app-poc/server.ts` using minimal-risk literal edits only.
- [X] T004 Verify no unintended non-endpoint behavior changes in `/wip/src/github.com/roddiekieley/gpt-app-poc/server.ts` (resource/tool shapes, text fallbacks, and metadata keys unchanged except endpoint value).

**Checkpoint**: Runtime default endpoint is migrated in `server.ts`; scoped test/doc updates can proceed.

---

## Phase 3: User Story 1 - Run against development endpoint (Priority: P1) 🎯 MVP

**Goal**: Ensure runtime paths resolve to the new development endpoint.

**Independent Test**: Runtime metadata and endpoint-bearing responses from `server.ts` reference only `https://leisured-carina-unpromotable.ngrok-free.dev`.

### Tests for User Story 1

- [X] T005 [US1] Run runtime-focused contract coverage in `/wip/src/github.com/roddiekieley/gpt-app-poc/tests/contract/engage-red-hat-support.contract.test.ts` to confirm runtime endpoint assertions align with `/wip/src/github.com/roddiekieley/gpt-app-poc/server.ts`.

### Implementation for User Story 1

- [X] T006 [US1] Update runtime endpoint assertions/fixtures in `/wip/src/github.com/roddiekieley/gpt-app-poc/tests/contract/engage-red-hat-support.contract.test.ts` to match the migrated endpoint in `/wip/src/github.com/roddiekieley/gpt-app-poc/server.ts`.
- [X] T007 [US1] Run `npm run test:contract` with focus on `/wip/src/github.com/roddiekieley/gpt-app-poc/tests/contract/engage-red-hat-support.contract.test.ts` and capture pass/fail evidence.

**Checkpoint**: US1 is complete when runtime and contract checks agree on the new endpoint.

---

## Phase 4: User Story 2 - Keep tests aligned with active endpoint (Priority: P2)

**Goal**: Keep smoke and contract verification aligned with the runtime endpoint.

**Independent Test**: Smoke tests and contract tests pass while validating only the new endpoint domain.

### Tests for User Story 2

- [X] T008 [P] [US2] Update smoke test endpoint assertions in `/wip/src/github.com/roddiekieley/gpt-app-poc/scripts/mcp-smoke-tests.ts` to the new development endpoint.
- [X] T009 [US2] Run `npm run build` for `/wip/src/github.com/roddiekieley/gpt-app-poc/mcp-app.html` bundle readiness required by `/wip/src/github.com/roddiekieley/gpt-app-poc/scripts/mcp-smoke-tests.ts`.

### Implementation for User Story 2

- [X] T010 [US2] Execute `npm run test:mcp` to validate `/wip/src/github.com/roddiekieley/gpt-app-poc/scripts/mcp-smoke-tests.ts` against migrated runtime endpoint behavior in `/wip/src/github.com/roddiekieley/gpt-app-poc/server.ts`.
- [X] T011 [US2] Re-run `npm run test:contract` for `/wip/src/github.com/roddiekieley/gpt-app-poc/tests/contract/engage-red-hat-support.contract.test.ts` after smoke alignment to prove no regression.

**Checkpoint**: US2 is complete when both validation suites pass with endpoint alignment.

---

## Phase 5: User Story 3 - Keep operator guidance accurate (Priority: P3)

**Goal**: Update top-level documentation and prove no non-spec legacy references remain.

**Independent Test**: A user reading `README.md` gets only the new endpoint, and non-spec scans find no legacy endpoint references.

### Tests for User Story 3

- [X] T012 [US3] Replace top-level endpoint references in `/wip/src/github.com/roddiekieley/gpt-app-poc/README.md` with `https://leisured-carina-unpromotable.ngrok-free.dev` while preserving existing guidance structure.
- [X] T013 [US3] Run `rg "gptapppoc\\.kieley\\.io" --glob '!specs/**' /wip/src/github.com/roddiekieley/gpt-app-poc` and confirm zero non-spec matches.

### Implementation for User Story 3

- [X] T014 [US3] Run `rg "leisured-carina-unpromotable\\.ngrok-free\\.dev" /wip/src/github.com/roddiekieley/gpt-app-poc/server.ts /wip/src/github.com/roddiekieley/gpt-app-poc/scripts/mcp-smoke-tests.ts /wip/src/github.com/roddiekieley/gpt-app-poc/tests/contract/engage-red-hat-support.contract.test.ts /wip/src/github.com/roddiekieley/gpt-app-poc/README.md` to confirm expected in-scope coverage.
- [X] T015 [US3] Verify unchanged historical specs by confirming legacy references may still exist only in `/wip/src/github.com/roddiekieley/gpt-app-poc/specs/**` and are not part of implementation edits.

**Checkpoint**: US3 is complete when docs are updated and scans prove migration completeness in non-spec scope.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final verification and release-readiness checks across all stories.

- [X] T016 Run final scoped diff review for `/wip/src/github.com/roddiekieley/gpt-app-poc/server.ts`, `/wip/src/github.com/roddiekieley/gpt-app-poc/scripts/mcp-smoke-tests.ts`, `/wip/src/github.com/roddiekieley/gpt-app-poc/tests/contract/engage-red-hat-support.contract.test.ts`, and `/wip/src/github.com/roddiekieley/gpt-app-poc/README.md` to confirm minimal-risk literal-only endpoint edits.
- [X] T017 [P] Re-run full required validation sequence from `/wip/src/github.com/roddiekieley/gpt-app-poc/package.json` scripts: `npm run build`, `npm run test:contract`, `npm run test:mcp`.
- [X] T018 [P] Produce final migration evidence summary referencing `/wip/src/github.com/roddiekieley/gpt-app-poc/specs/008-switch-app-endpoint/quickstart.md` acceptance checks and command outputs.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: starts immediately.
- **Phase 2 (Foundational)**: depends on Phase 1; blocks all story work.
- **US1 (Phase 3)**: depends on Phase 2 completion.
- **US2 (Phase 4)**: depends on US1 runtime/contract alignment.
- **US3 (Phase 5)**: depends on US2 test/smoke alignment.
- **Phase 6 (Polish)**: depends on completion of US1, US2, and US3.

### User Story Dependencies

- **US1 (P1)**: foundational runtime endpoint migration.
- **US2 (P2)**: requires migrated runtime endpoint from US1.
- **US3 (P3)**: requires runtime + test alignment from US1/US2 for final scan confidence.

### Within Each User Story

- Update assertions/docs first, then run required validation commands.
- Keep changes limited to specified in-scope file paths.

### Parallel Opportunities

- `T008` can run in parallel with non-conflicting review work after `T006`.
- `T017` and `T018` can run in parallel after all implementation tasks complete.

---

## Parallel Example: User Story 2

```bash
# After US1 tasks complete:
Task: "T008 [US2] Update smoke endpoint assertions in /wip/src/github.com/roddiekieley/gpt-app-poc/scripts/mcp-smoke-tests.ts"
Task: "Prepare build/test execution context for /wip/src/github.com/roddiekieley/gpt-app-poc/mcp-app.html and /wip/src/github.com/roddiekieley/gpt-app-poc/scripts/mcp-smoke-tests.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 and Phase 2.
2. Complete US1 tasks (`T005`-`T007`).
3. Validate runtime + contract endpoint alignment before expanding scope.

### Incremental Delivery

1. Deliver runtime migration (US1).
2. Deliver smoke/contract alignment (US2).
3. Deliver docs + scan proof (US3).
4. Finish with final full-sequence validation (Phase 6).

### Scope Guardrail

- Implementation edits are restricted to:
  - `/wip/src/github.com/roddiekieley/gpt-app-poc/server.ts`
  - `/wip/src/github.com/roddiekieley/gpt-app-poc/scripts/mcp-smoke-tests.ts`
  - `/wip/src/github.com/roddiekieley/gpt-app-poc/tests/contract/engage-red-hat-support.contract.test.ts`
  - `/wip/src/github.com/roddiekieley/gpt-app-poc/README.md`
- Historical `/wip/src/github.com/roddiekieley/gpt-app-poc/specs/**` remains excluded from implementation edits.
