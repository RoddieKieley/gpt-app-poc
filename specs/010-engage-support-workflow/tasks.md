# Tasks: Engage Support Workflow Multi-Resource Refactor

**Input**: Design documents from `/specs/010-engage-support-workflow/`  
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`

**Tests**: Tests are required by the feature spec and are included below.  
**Organization**: Tasks are grouped into the 4 approved implementation phases with strict ordering and explicit dependencies.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Task can run in parallel (different files, non-blocking dependency path)
- **[Story]**: User story label (`[US1]`, `[US2]`, `[US3]`) for story-specific work
- Every task includes exact file path(s), expected output, and acceptance checks

---

## Phase 1: UI Resource Split + Shared Client Logic

**Goal**: Refactor the monolithic UI into a 3-step conversational flow with explicit state handoff and gating.

- [X] T001 [US1] Add workflow session state model and step enums in `src/mcp-app.ts`; expected output: typed state fields (`selected_product`, `fetch_reference`, `artifact_ref`, `connection_id`, `issue_key`, `issue_access_verified`, `current_step`); acceptance: state compiles and step transitions are represented in code.
- [X] T002 [P] [US1] Restructure `mcp-app.html` into entry shell plus step-specific sections/routes for select-product, sos-report, jira-attach; expected output: dedicated DOM containers/controls per step and compatibility entry rendering; acceptance: `app.html` still loads and step containers are discoverable by IDs used in client code.
- [X] T003 [US1] Implement compatibility router/navigation in `src/mcp-app.ts` for `ui://engage-red-hat-support/app.html` -> step views; expected output: controlled step navigation API; acceptance: cannot navigate to step 2 before step 1 completion.
- [X] T004 [US1] Enforce Linux-only product gate in `src/mcp-app.ts` and `mcp-app.html`; expected output: explicit rejection path for non-linux selection; acceptance: step 1 blocks continuation unless product is `linux` and shows actionable status text.
- [X] T005 [US2] Implement step-2 gating and state handoff in `src/mcp-app.ts` (`generate_sosreport` then `fetch_sosreport`); expected output: `fetch_reference` and `artifact_ref` persisted in workflow state; acceptance: step 2 fails closed when required outputs are missing.
- [X] T006 [US3] Implement step-3 preconditions in `src/mcp-app.ts` requiring `artifact_ref`, non-empty `issue_key`, and active `connection_id`; expected output: attach path blocked until prerequisites are met; acceptance: attach action is refused with retry guidance when prerequisites are absent.
- [X] T007 [US3] Add issue-read verification before attach in `src/mcp-app.ts` using existing Jira surface (`jira_list_attachments` or equivalent read verification) before `jira_attach_artifact`; expected output: explicit `issue_access_verified=true` state set only on successful verification; acceptance: attach never runs when issue-read verification fails.
- [X] T008 [US3] Harden client-side PAT secrecy handling in `src/mcp-app.ts`; expected output: PAT cleared immediately after secure intake call and never added to status/error text; acceptance: UI-visible messages and stored workflow state contain no PAT value.

---

## Phase 2: Server Resource Registration / Metadata Wiring

**Goal**: Register step-specific UI resources while preserving existing MCP tool behavior and compatibility entrypoint.

- [X] T009 Update resource registration in `server.ts` to preserve `ui://engage-red-hat-support/app.html` and add step URIs (`ui://engage-red-hat-support/steps/select-product.html`, `ui://engage-red-hat-support/steps/sos-report.html`, `ui://engage-red-hat-support/steps/jira-attach.html`); expected output: resources/list exposes all four URIs; acceptance: entry URI remains stable and readable.
- [X] T010 Keep tool metadata wiring stable in `server.ts` (`ui.resourceUri`, `openai/outputTemplate`, `openai/widgetAccessible`) while binding step resources as needed; expected output: existing tool names/schemas unchanged and metadata complete; acceptance: tools/list matches pre-refactor names and schemas.
- [X] T011 Strengthen non-UI fallback messaging in `server.ts` resource content for all workflow steps; expected output: fallback text describes equivalent 3-step flow and retry guidance; acceptance: non-UI host receives actionable text for product select, sos generation/fetch, and Jira attach flow.
- [X] T012 [P] Add/adjust UI-resource wiring notes in `specs/010-engage-support-workflow/contracts/engage-ui-resource-map.v2.json`; expected output: contract reflects actual registered URIs and state prerequisites; acceptance: contract entries match server registration and step sequence.

---

## Phase 3: Skill + Contract + Documentation Alignment

**Goal**: Align skill guidance and canonical contracts/docs with final 3-step workflow and secrecy boundaries.

- [X] T013 [US3] Update workflow guidance in `skills/engage-red-hat-support/SKILL.md` to the 3-step conversational model; expected output: explicit Linux-only step 1, sos step 2, Jira connect/verify/attach step 3 instructions; acceptance: skill text documents secure PAT intake boundary and text fallback behavior.
- [X] T014 [US3] Update canonical workflow contract in `specs/007-engage-red-hat-support/contracts/engage-workflow-contract.json`; expected output: contract sequence and requirements reflect 3-step flow, compatibility entrypoint, state handoff, and PAT boundary fields; acceptance: contract forbids PAT/token in step inputs and asserts issue-read verification before attach.
- [X] T015 [P] Sync feature-level v2 contracts in `specs/010-engage-support-workflow/contracts/engage-workflow-contract.v2.json` and `specs/010-engage-support-workflow/contracts/pat-secrecy-validation.v2.json`; expected output: v2 artifacts mirror implemented behavior; acceptance: v2 contracts remain consistent with updated canonical `007` contract.
- [X] T016 [P] Update workflow documentation in `README.md`; expected output: section describes multi-resource 3-step flow, compatibility entrypoint, and unchanged tool schema surface; acceptance: docs explicitly state no PAT in MCP-visible channels.
- [X] T017 [P] Update operator runbook in `docs/operator-guide.md`; expected output: operator troubleshooting for Linux gate, step gating failures, connection verification, issue-read verification before attach, and secret handling; acceptance: runbook includes recovery steps for verification failure and revoked/expired connections.

---

## Phase 4: Tests and Regression Verification

**Goal**: Prove behavior, compatibility, and secrecy constraints with contract/integration/regression suites.

- [X] T018 [P] [US1] Update `tests/contract/engage-red-hat-support.contract.test.ts` for new step resources and compatibility entrypoint assertions; expected output: contract test validates resource discovery and metadata for entry + step URIs; acceptance: test fails if `app.html` entrypoint or required metadata is removed.
- [X] T019 [P] [US2] Update `tests/integration/engage-red-hat-support.workflow.test.ts` for step-2 gating and state handoff (`fetch_reference` -> `artifact_ref`); expected output: integration test verifies generate/fetch ordering and fail-closed behavior; acceptance: test fails when fetch runs without generate outputs.
- [X] T020 [US3] Extend `tests/integration/engage-red-hat-support.workflow.test.ts` with connection verification and issue-read verification gate before attach; expected output: integration cases cover attach success only after verification and denial path when issue access fails; acceptance: attach call is blocked unless verification state is true.
- [X] T021 [P] Update `tests/regression/no-pat-leakage-mcp.test.ts` with multi-step UI flow secrecy assertions; expected output: regression checks PAT/token absence in MCP args/results/status/log-safe text paths; acceptance: test fails on any PAT/token leakage surface.
- [X] T022 [P] Update `tests/regression/mcp-tool-surface-preservation.test.ts` and `tests/regression/skill-resource-preservation.test.ts`; expected output: existing tool names/schemas unchanged and skill URI behavior preserved while new step resources are added; acceptance: regression fails if pre-existing tool/resource surface regresses.
- [X] T023 [P] Update `tests/regression/jira-surface-preservation.test.ts` for unchanged Jira tool contracts outside workflow wiring; expected output: Jira surface invariants remain stable; acceptance: regression fails on schema/name drift not explicitly permitted.
- [X] T024 Run focused validation commands from `specs/010-engage-support-workflow/quickstart.md` and record pass/fail notes in `specs/010-engage-support-workflow/quickstart.md`; expected output: execution evidence for contract/integration/regression suites; acceptance: all targeted suites pass or failures are documented with actionable follow-ups.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1**: Starts immediately.
- **Phase 2**: Depends on completion of T001-T008 (UI contracts/state model defined).
- **Phase 3**: Depends on completion of T009-T012 (resource and metadata wiring finalized).
- **Phase 4**: Depends on completion of T013-T017 (contracts/docs/skill aligned with implementation).

### Strict Task Dependencies

- T003 depends on T001 and T002.
- T004 depends on T003.
- T005 depends on T004.
- T006 depends on T005.
- T007 depends on T006.
- T008 depends on T007.
- T010 depends on T009.
- T011 depends on T010.
- T012 depends on T009 and T011.
- T014 depends on T007, T008, and T011.
- T015 depends on T014.
- T018 depends on T009-T012.
- T019 depends on T005.
- T020 depends on T007 and T014.
- T021 depends on T008 and T014.
- T022 depends on T010 and T013.
- T023 depends on T010.
- T024 depends on T018-T023.

### User Story Completion Order

1. **US1 (Select Supported Product)**: T001-T004, T018
2. **US2 (Produce sos Artifact)**: T005, T019
3. **US3 (Connect Jira and Attach Evidence)**: T006-T008, T013-T015, T020-T021

US3 intentionally depends on US2 artifact outputs (`artifact_ref`), and US2 depends on US1 Linux gating.

---

## Parallel Opportunities

- **Phase 1**: T002 can run in parallel with T001; later tasks are ordered due to state/gating dependencies.
- **Phase 2**: T012 can run in parallel after T009/T011.
- **Phase 3**: T015-T017 can run in parallel after T014.
- **Phase 4**: T018, T019, T021, T022, and T023 can run in parallel once prerequisites are met; T020 depends on US3 verification behavior and runs after T007/T014.

---

## Parallel Example: User Story Execution

### US1

```bash
Task: "T001 [US1] Add workflow session state model in src/mcp-app.ts"
Task: "T002 [US1] Restructure UI shell/step sections in mcp-app.html"
```

### US2

```bash
Task: "T019 [US2] Update integration gating for generate/fetch in tests/integration/engage-red-hat-support.workflow.test.ts"
Task: "T021 Update PAT leakage regression in tests/regression/no-pat-leakage-mcp.test.ts"
```

### US3

```bash
Task: "T013 [US3] Update skill flow in skills/engage-red-hat-support/SKILL.md"
Task: "T017 Update operator verification/attach troubleshooting in docs/operator-guide.md"
```

---

## Independent Test Criteria by User Story

- **US1**: From `ui://engage-red-hat-support/app.html`, user can only progress with Linux selection; non-UI fallback provides equivalent step-1 behavior.
- **US2**: With Linux selected, user can generate and fetch sos artifact; missing `fetch_reference` or `artifact_ref` blocks progression with retry guidance.
- **US3**: With artifact available, PAT intake returns `connection_id`, connection and issue-read verification pass before attach, and no PAT is exposed in MCP-visible channels.

---

## Implementation Strategy

### MVP Scope

- Suggested MVP: **US1 only** (T001-T004 + T018) to prove compatibility entrypoint and Linux-only gate before downstream integrations.

### Incremental Delivery

1. Deliver Phase 1 (UI/state/gating baseline).
2. Deliver Phase 2 (resource registration and metadata stability).
3. Deliver Phase 3 (skill/contract/docs alignment).
4. Deliver Phase 4 (tests/regressions and final verification).

Each increment preserves existing tool behavior while adding constrained workflow-specific behavior.
