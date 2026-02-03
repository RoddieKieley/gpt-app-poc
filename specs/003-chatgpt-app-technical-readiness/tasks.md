---
description: "Tasks for ChatGPT Apps Technical Readiness"
---

# Tasks: ChatGPT Apps Technical Readiness

**Input**: Design documents from `/specs/003-chatgpt-app-technical-readiness/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/, quickstart.md

**Tests**: No new tests requested in the spec. Update existing smoke tests only where required by FR/SC.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Verify existing server/UI build pipeline in `package.json` supports planned changes

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T002 Create checklist directory in `specs/003-chatgpt-app-technical-readiness/checklists/`
- [X] T003 Define technical readiness checklist in `specs/003-chatgpt-app-technical-readiness/checklists/technical-readiness.md`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Marketplace-compliant MCP metadata (Priority: P1) 🎯 MVP

**Goal**: Add widgetDomain/CSP metadata, tool annotations, and widget-initiated tool access.

**Independent Test**: Run `npm run test:mcp` and confirm tool metadata and UI resource fields are present; manually load UI in Developer Mode.

### Implementation for User Story 1

- [X] T004 [US1] Add tool annotations (`readOnlyHint`, `openWorldHint`, `destructiveHint`) in `server.ts`
- [X] T005 [US1] Add widget-access metadata (`openai/widgetAccessible`) in `server.ts` tool definition
- [X] T006 [US1] Add widget metadata (`openai/widgetDomain`, `openai/widgetCSP.connect_domains`) in `server.ts` UI resource registration
- [X] T007 [US1] Align UI resource output template/metadata with `specs/003-chatgpt-app-technical-readiness/contracts/mcp-tools.json`
- [X] T008 [US1] Ensure text fallback remains intact in `server.ts` tool response
- [X] T009 [US1] Update `scripts/mcp-smoke-tests.ts` to validate tool annotations and UI resource metadata keys

**Checkpoint**: User Story 1 fully functional and independently testable

---

## Phase 4: User Story 2 - Technical policy artifacts (Priority: P2)

**Goal**: Expose privacy policy and support contact URLs on the app domain.

**Independent Test**: Fetch `https://gptapppoc.kieley.io/privacy` and `/support` from the running server and confirm content is returned.

### Implementation for User Story 2

- [X] T010 [US2] Add privacy policy endpoint/route in `server.ts` (or static file served by Express)
- [X] T011 [US2] Add support contact endpoint/route in `server.ts` (or static file served by Express)
- [X] T012 [US2] Document the endpoints in `specs/003-chatgpt-app-technical-readiness/quickstart.md`

**Checkpoint**: User Story 2 independently functional

---

## Phase 5: User Story 3 - Validate technical readiness (Priority: P3)

**Goal**: Provide a checklist and validation steps for readiness.

**Independent Test**: Follow the checklist and ensure each item is verifiable.

### Implementation for User Story 3

- [X] T013 [US3] Populate `specs/003-chatgpt-app-technical-readiness/checklists/technical-readiness.md` with steps for metadata, CSP, UI rendering, and policy endpoints
- [X] T014 [US3] Add checklist reference in `specs/003-chatgpt-app-technical-readiness/quickstart.md`

**Checkpoint**: User Story 3 independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T015 [P] Run `npm run test:mcp` and confirm updated checks pass
- [ ] T016 Update `README.md` with technical readiness notes and URLs (optional but recommended)
- [ ] T017 Validate constitution compliance for MCP Apps bridge and text fallbacks

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Independent of US1
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Independent of US1/US2

### Within Each User Story

- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- T004 and T005 can be parallel once Phase 2 completes
- T010 and T011 can be parallel once Phase 2 completes
- T013 and T014 can be parallel once Phase 2 completes

---

## Parallel Example: User Story 1

```bash
Task: "Add tool annotations + widget-access metadata in server.ts"
Task: "Add widget metadata (widgetDomain/widgetCSP) in server.ts UI resource registration"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Run smoke tests and confirm metadata + UI resource behavior

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Validate
3. Add User Story 2 → Test independently → Validate
4. Add User Story 3 → Test independently → Validate
5. Polish tasks as needed
