# Tasks: RHDS Visual Alignment Step 0

**Input**: Design documents from `/wip/src/github.com/roddiekieley/gpt-app-poc/specs/017-rhds-visual-alignment/`  
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: Existing test suites and manual workflow checks are required by the feature spec.  
**Organization**: Tasks are grouped by user story to preserve independent implementation and verification.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on incomplete tasks)
- **[Story]**: User story mapping (`US1`, `US2`, `US3`)
- **Type tags**: `design`, `ui-polish`, `safety`, `validation`, `docs`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish Step 0 execution workspace and validation scaffolding.

- [ ] T001 Objective: create Step 0 baseline log shell | Files: `specs/017-rhds-visual-alignment/validation/baseline.md` | Done: baseline doc scaffold exists with sections for tests/manual/risk notes | Verify: `test -f specs/017-rhds-visual-alignment/validation/baseline.md` | Type: docs
- [ ] T002 [P] Objective: create visual mapping record shell | Files: `specs/017-rhds-visual-alignment/validation/rhds-mapping.md` | Done: RHDS token mapping template created for typography/spacing/color/status/loading/fallback | Verify: `test -f specs/017-rhds-visual-alignment/validation/rhds-mapping.md` | Type: design
- [ ] T003 [P] Objective: create no-behavior-delta check sheet | Files: `specs/017-rhds-visual-alignment/validation/no-behavior-delta.md` | Done: checklist includes hash routing, gating, tool-call ordering, IDs, and build/serve parity checks | Verify: `test -f specs/017-rhds-visual-alignment/validation/no-behavior-delta.md` | Type: safety

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Capture safety baseline before any UI edits.

**⚠️ CRITICAL**: No UI styling edits start before this phase completes.

- [ ] T004 Objective: run automated baseline suite and record results | Files: `specs/017-rhds-visual-alignment/validation/baseline.md` | Done: unit/contract/integration/regression outcomes captured with timestamp | Verify: `npm run test:unit && npm run test:contract && npm run test:integration && npm run test:regression` | Type: validation
- [ ] T005 Objective: execute baseline manual check for step gating/hash routing | Files: `specs/017-rhds-visual-alignment/validation/baseline.md` | Done: outcomes recorded for `#step-1`, `#step-2`, `#step-3` allow/block behavior and progression hash updates | Verify: Manual check in running app, then confirm notes saved in `baseline.md` | Type: safety
- [ ] T006 Objective: execute baseline manual check for generate/fetch flow | Files: `specs/017-rhds-visual-alignment/validation/baseline.md` | Done: notes captured for generate state, fetch gating, and artifact handoff behavior | Verify: Manual Step 2 run in app, then confirm notes saved in `baseline.md` | Type: safety
- [ ] T007 Objective: execute baseline manual check for Jira connect/verify/list/attach/disconnect flow | Files: `specs/017-rhds-visual-alignment/validation/baseline.md` | Done: notes captured for full Step 3 lifecycle and prerequisite gating | Verify: Manual Step 3 run in app, then confirm notes saved in `baseline.md` | Type: safety
- [ ] T008 Objective: freeze UI behavior contracts before edits | Files: `src/mcp-app.ts`, `src/mcp-app/App.tsx`, `src/mcp-app/step-content.tsx`, `specs/017-rhds-visual-alignment/validation/no-behavior-delta.md` | Done: contract invariants copied into no-delta checklist with file-level checkpoints | Verify: `rg "VG-00[1-7]" specs/017-rhds-visual-alignment/contracts/step0-visual-regression-gates.contract.v1.json specs/017-rhds-visual-alignment/validation/no-behavior-delta.md` | Type: design

**Checkpoint**: Baseline and safety gates complete; user story work may begin.

---

## Phase 3: User Story 1 - Preserve Existing Workflow Behavior While Refreshing Visual Design (Priority: P1) 🎯 MVP

**Goal**: Apply Step 0 edits without changing workflow/tool behavior.

**Independent Test**: Re-run baseline manual gates and confirm no functional deltas in step gating, hash routing, generate/fetch, and Jira lifecycle.

### Implementation for User Story 1

- [ ] T009 [US1] Objective: add RHDS styling entrypoint import only (no logic edits) | Files: `src/mcp-app.ts`, `src/mcp-app/rhds-step0.css` | Done: CSS file imported and workflow state/tool-call logic remains unchanged | Verify: `rg "workflowState|callTool|navigateToStep|onGenerate|onAttach" src/mcp-app.ts` | Type: safety
- [ ] T010 [P] [US1] Objective: create Step 0 token CSS foundation | Files: `src/mcp-app/rhds-step0.css` | Done: typography/spacing/color/status/loading/fallback token variables and shell-safe utility classes defined | Verify: `rg "--rhds|token|status|spacing|typography" src/mcp-app/rhds-step0.css` | Type: design
- [ ] T011 [US1] Objective: wire shell-level styling hooks for app root | Files: `mcp-app.html` | Done: non-invasive shell classes/hooks added without changing script mount, fallback text semantics, or structure needed by runtime | Verify: `rg "app-root|script type=\"module\" src=\"/src/mcp-app.ts\"" mcp-app.html` | Type: ui-polish
- [ ] T012 [US1] Objective: apply app container/status class hooks only | Files: `src/mcp-app/App.tsx` | Done: classNames/wrappers added for title/alert/wizard polish with existing handlers/IDs/props untouched | Verify: `rg "onNavigateStep1|onNavigateStep2|onNavigateStep3|WizardStep id=\\{1\\}|WizardStep id=\\{2\\}|WizardStep id=\\{3\\}" src/mcp-app/App.tsx` | Type: ui-polish
- [ ] T013 [US1] Objective: no behavior delta check after shell/App edit cluster | Files: `src/mcp-app.ts`, `src/mcp-app/App.tsx`, `mcp-app.html`, `specs/017-rhds-visual-alignment/validation/no-behavior-delta.md` | Done: no-delta checklist updated and confirms no route/gating/tool sequence drift after T009-T012 | Verify: `npm run test:integration && npm run test:regression` | Type: safety

**Checkpoint**: US1 complete when behavior parity remains intact after first UI cluster.

---

## Phase 4: User Story 2 - Achieve Clear Red Hat Visual Alignment (Priority: P2)

**Goal**: Align typography, spacing, color hierarchy, and status/loading styling to RHDS guidance.

**Independent Test**: UI review confirms RHDS-aligned presentation with no behavior changes from baseline.

### Implementation for User Story 2

- [ ] T014 [US2] Objective: add Step 1 visual refinements without interaction changes | Files: `src/mcp-app/step-content.tsx`, `src/mcp-app/rhds-step0.css` | Done: Step 1 form/select/button visuals refined via classes; event handlers and IDs unchanged | Verify: `rg "step-1-continue-btn|onProductChange|onContinue" src/mcp-app/step-content.tsx` | Type: ui-polish
- [ ] T015 [US2] Objective: add Step 2 visual refinements and loading polish | Files: `src/mcp-app/step-content.tsx`, `src/mcp-app/rhds-step0.css` | Done: Step 2 spacing/button/spinner styling improved; generate/fetch gating logic unchanged | Verify: `rg "generate-btn|fetch-btn|isGenerating|canFetch|onGenerate|onFetch" src/mcp-app/step-content.tsx` | Type: ui-polish
- [ ] T016 [US2] Objective: add Step 3 visual refinements for Jira controls/status hierarchy | Files: `src/mcp-app/step-content.tsx`, `src/mcp-app/rhds-step0.css` | Done: Step 3 field/action styling refined while connect/verify/list/attach/disconnect wiring unchanged | Verify: `rg "connect-btn|verify-btn|status-btn|list-btn|attach-btn|disconnect-btn|onConnect|onVerify|onList|onAttach|onDisconnect" src/mcp-app/step-content.tsx` | Type: ui-polish
- [ ] T017 [US2] Objective: no behavior delta check after step-content edit cluster | Files: `src/mcp-app/step-content.tsx`, `src/mcp-app.ts`, `specs/017-rhds-visual-alignment/validation/no-behavior-delta.md` | Done: no-delta checklist confirms Step 1/2/3 gating and action sequencing unchanged after T014-T016 | Verify: `npm run test:integration` | Type: safety
- [ ] T018 [P] [US2] Objective: document RHDS mapping for each visual choice | Files: `specs/017-rhds-visual-alignment/validation/rhds-mapping.md` | Done: each changed token/class decision mapped to RHDS guidance category | Verify: `rg "typography|spacing|color|status|loading|fallback" specs/017-rhds-visual-alignment/validation/rhds-mapping.md` | Type: docs
- [ ] T019 [US2] Objective: visual alignment review pass for all primary surfaces | Files: `specs/017-rhds-visual-alignment/validation/rhds-mapping.md`, `specs/017-rhds-visual-alignment/validation/no-behavior-delta.md` | Done: reviewer notes confirm Red Hat-aligned visual hierarchy and acceptable readability/contrast/focus visibility | Verify: Manual review against RHDS guidance and saved sign-off notes | Type: validation

**Checkpoint**: US2 complete when RHDS visual alignment is documented and behavior parity still holds.

---

## Phase 5: User Story 3 - Keep Current Build and Serving Experience Stable (Priority: P3)

**Goal**: Ensure fallback shell polish and build/serve behavior remain stable.

**Independent Test**: Build and serve flows succeed with unchanged runtime behavior contracts.

### Implementation for User Story 3

- [ ] T020 [US3] Objective: refine static fallback shell presentation only | Files: `mcp-app.html`, `src/mcp-app/rhds-step0.css` | Done: fallback shell readability polished with no semantic copy changes affecting guidance meaning | Verify: `rg "Loading support workflow UI|text fallbacks" mcp-app.html` | Type: ui-polish
- [ ] T021 [US3] Objective: optionally refine server fallback inline shell styling only if needed | Files: `server.ts` | Done: optional fallback style injection updated without changing fallback instruction sequence or tool guidance content | Verify: `rg "UI bundle unavailable|Follow text fallback steps|Step 1|Step 2|Step 3" server.ts` | Type: ui-polish
- [ ] T022 [US3] Objective: no behavior delta check after fallback/loading cluster | Files: `mcp-app.html`, `server.ts`, `specs/017-rhds-visual-alignment/validation/no-behavior-delta.md` | Done: no-delta checklist confirms fallback continuity and unchanged flow instructions post-polish | Verify: `npm run test:regression` | Type: safety
- [ ] T023 [US3] Objective: confirm build and serve parity | Files: `vite.config.ts`, `server.ts`, `specs/017-rhds-visual-alignment/validation/no-behavior-delta.md` | Done: build/serve commands run successfully with no command or contract changes | Verify: `npm run build && npm run serve` | Type: validation

**Checkpoint**: US3 complete when fallback polish is stable and build/serve behavior is unchanged.

---

## Phase 6: Polish & Cross-Cutting Validation

**Purpose**: Full regression pass, rollback readiness, and Step 0 closure.

- [ ] T024 Objective: run full automated regression battery after all UI edits | Files: `specs/017-rhds-visual-alignment/validation/no-behavior-delta.md` | Done: all four test suites pass and results recorded | Verify: `npm run test:unit && npm run test:contract && npm run test:integration && npm run test:regression` | Type: validation
- [ ] T025 Objective: run full manual regression gates after all UI edits | Files: `specs/017-rhds-visual-alignment/validation/no-behavior-delta.md` | Done: manual checks passed for step gating/hash, generate/fetch, Jira lifecycle | Verify: Manual gate run + checklist marked pass in `no-behavior-delta.md` | Type: validation
- [ ] T026 Objective: validate rollback readiness and triggers | Files: `specs/017-rhds-visual-alignment/plan.md`, `specs/017-rhds-visual-alignment/validation/no-behavior-delta.md` | Done: rollback path, trigger criteria, and post-rollback verification steps explicitly confirmed | Verify: `rg "Rollback" specs/017-rhds-visual-alignment/plan.md specs/017-rhds-visual-alignment/validation/no-behavior-delta.md` | Type: safety
- [ ] T027 Objective: update quickstart with final executed verification notes | Files: `specs/017-rhds-visual-alignment/quickstart.md` | Done: quickstart reflects final Step 0 checks and operator notes for reproducible validation | Verify: `rg "Baseline Verification|Regression Validation|Rollback" specs/017-rhds-visual-alignment/quickstart.md` | Type: docs

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: starts immediately.
- **Phase 2 (Foundational)**: depends on Phase 1 and blocks user-story execution.
- **Phase 3 (US1)**: depends on Phase 2 completion.
- **Phase 4 (US2)**: depends on US1 checkpoint.
- **Phase 5 (US3)**: depends on US2 checkpoint.
- **Phase 6 (Polish/Validation)**: depends on US1+US2+US3 completion.

### User Story Dependencies

- **US1 (P1)**: baseline-safe style entry and first no-delta gate.
- **US2 (P2)**: token-driven/component-level visual refinements, depends on US1.
- **US3 (P3)**: fallback/build-serve stability, depends on US2.

### No-Behavior-Delta Checkpoints (Required)

- After shell/App edit cluster: **T013**
- After step-content edit cluster: **T017**
- After fallback/loading cluster: **T022**

### Parallel Opportunities

- **Setup parallel tasks**: T002 and T003.
- **US2 parallel tasks**: T018 can run while T014-T016 implementation is in progress.
- **Validation parallel preparation**: documentation updates (T027) can be prepared while final manual validation (T025) is in progress.

---

## Parallel Example: User Story 1

```bash
Task: "T010 [P] [US1] Create token CSS foundation in src/mcp-app/rhds-step0.css"
Task: "T011 [US1] Wire shell hooks in mcp-app.html after token names are agreed"
```

## Parallel Example: User Story 2

```bash
Task: "T014 [US2] Step 1 visual refinements in src/mcp-app/step-content.tsx"
Task: "T018 [P] [US2] RHDS mapping documentation in specs/017-rhds-visual-alignment/validation/rhds-mapping.md"
```

## Parallel Example: User Story 3

```bash
Task: "T020 [US3] Static fallback polish in mcp-app.html"
Task: "T021 [US3] Optional server fallback style polish in server.ts (only if needed)"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 + Phase 2 safety baseline.
2. Complete US1 token entry and shell/app cluster edits.
3. Pass mandatory no-behavior-delta gate (T013).
4. Stop and validate before broader visual polish.

### Incremental Delivery

1. **Safety and baseline** (Phase 1-2)
2. **Token-driven visual layer** (US1 + start of US2)
3. **Component-level visual refinements** (US2)
4. **Fallback/loading UI polish** (US3)
5. **Full regression validation** (Phase 6)

### Step 0 Exit Checklist (Must Pass Before Step 1)

- [ ] All tasks T001-T027 are complete.
- [ ] All explicit no-behavior-delta checks (T013, T017, T022) pass.
- [ ] Automated suites pass: `test:unit`, `test:contract`, `test:integration`, `test:regression`.
- [ ] Manual gates pass: step/hash routing, generate/fetch, Jira lifecycle.
- [ ] RHDS mapping evidence is complete and reviewed.
- [ ] Rollback readiness is confirmed and documented.
