# Implementation Plan: RHDS Visual Alignment Step 0

**Branch**: `017-rhds-visual-alignment` | **Date**: 2026-04-02 | **Spec**: `/wip/src/github.com/roddiekieley/gpt-app-poc/specs/017-rhds-visual-alignment/spec.md`  
**Input**: Feature specification from `/specs/017-rhds-visual-alignment/spec.md`

## Summary

Apply a Step 0 presentational-only styling layer to align the current PatternFly-based UI with RHDS visual guidance, while preserving workflow behavior, tool-call sequencing, and build/serve operation exactly. The implementation is file-targeted, low-risk, and explicitly isolated from any hybrid or RHDS component replacement work.

## Technical Context

**Language/Version**: TypeScript 5.9 + React 19  
**Primary Dependencies**: `@patternfly/react-core`, `@patternfly/react-icons`, `@modelcontextprotocol/ext-apps`, `vite`  
**Storage**: N/A for Step 0 (no new persistence)  
**Testing**: `tsx --test` suites (`tests/unit`, `tests/contract`, `tests/integration`, `tests/regression`) and manual workflow checks  
**Target Platform**: Browser widget UI served via MCP app resource + local Node/Express runtime  
**Project Type**: Single web app + MCP server in one repository  
**Performance Goals**: No measurable UI latency regression in Step 1/2/3 interactions during manual checks  
**Constraints**: Presentational updates only; no behavior changes in `src/mcp-app.ts`, `src/mcp-app/App.tsx`, `src/mcp-app/step-content.tsx`; keep build/serve flow unchanged  
**Scale/Scope**: Step 0 only; five file targets (`src/mcp-app.ts`, `src/mcp-app/App.tsx`, `src/mcp-app/step-content.tsx`, `mcp-app.html`, optional fallback style touch in `server.ts`)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- PASS: No new diagnostics behavior or permission path changes; read-only/consent patterns remain untouched.
- PASS: MCP Apps compliance unchanged (existing ui:// resources and JSON-RPC bridge remain as-is).
- PASS: Text fallback behavior remains intact (`mcp-app.html` and server fallback HTML retained, style-only adjustments allowed).
- PASS: No new data handling, secret handling, or credential-flow logic introduced.
- PASS: Non-retroactive spec integrity upheld (changes contained in `specs/017-rhds-visual-alignment/` only).

## Phase Plan (Step 0 Only)

### Phase A — Baseline Verification (Sequence 1)

**Goal**: Freeze current behavior expectations before any styling edits.

**File focus**:
- `src/mcp-app.ts` behavior checkpoints (step gating, hash routing, generate/fetch flow, Jira flow handlers)
- `src/mcp-app/App.tsx` and `src/mcp-app/step-content.tsx` props/handler wiring checkpoints
- `mcp-app.html` fallback text checkpoints

**Deliverables**:
- Baseline verification record (test pass/fail + manual checklist results)
- Hash routing and step-gate baseline matrix (`step-1`, `step-2`, `step-3`)

**Risks**:
- Missing a pre-existing behavior edge case and attributing it to Step 0 edits.

**Validation gate**:
- Must capture baseline results for all required manual flows before proceeding.

### Phase B — Add Styling Layer (Sequence 2)

**Goal**: Introduce RHDS-informed token layer without changing runtime logic.

**File-targeted plan**:
- `mcp-app.html`: add shell-level styling hooks/token variables and non-invasive wrapper classes.
- `src/mcp-app/App.tsx`: apply style classNames/layout wrappers around existing PatternFly structure only.
- `src/mcp-app/step-content.tsx`: apply presentational classNames, spacing, and status polish hooks without changing events/props.
- `src/mcp-app.ts`: optional import/wiring for style layer only; no changes to workflow/tool logic.
- `server.ts` (optional): style-safe fallback shell improvements only if required to keep fallback visual parity.

**Deliverables**:
- RHDS-informed style token map (typography, spacing, color hierarchy, status treatments)
- Updated shell/presentational hooks in target files

**Risks**:
- Style wrappers unintentionally alter control affordance or disabled-state perception.

**Validation gate**:
- No control IDs, handler signatures, navigation logic, or tool-call argument construction changed.

### Phase C — Apply Low-Risk Presentational Tweaks (Sequence 3)

**Goal**: Polish status/loading/fallback surfaces while retaining behavior contracts.

**File-targeted plan**:
- `src/mcp-app/App.tsx`: alert/title/wizard visual refinements through class and spacing adjustments.
- `src/mcp-app/step-content.tsx`: button grouping, form spacing, spinner/status emphasis visuals only.
- `mcp-app.html`: improved fallback shell readability and RHDS-aligned default typography.
- `server.ts` (if touched): fallback HTML appearance only, no text-flow or instruction semantics changes.

**Deliverables**:
- Final presentational diff with RHDS rationale notes for each design choice category

**Risks**:
- Over-polish leading to contrast/accessibility regressions.

**Validation gate**:
- Visual review confirms RHDS alignment and accessibility sanity checks (contrast/readability/focus visibility).

### Phase D — Regression Validation (Sequence 4)

**Goal**: Prove zero behavior drift and complete Step 0 acceptance.

**Deliverables**:
- Automated test run results (existing suites)
- Manual workflow validation record for required flows
- Final go/no-go checklist against spec success criteria

**Risks**:
- Manual pass but hidden edge-case regression in sequencing.

**Validation gate**:
- All existing tests pass + all required manual flows pass with no functional variance.

## Test and Manual Validation Plan

### Automated Tests

- Run existing workflow and regression suites:
  - `npm run test:unit`
  - `npm run test:contract`
  - `npm run test:integration`
  - `npm run test:regression`

### Manual Validation Gates (Required)

- **Step gating and hash routing**
  - Verify `#step-1` loads/selects step 1.
  - Verify direct `#step-2` navigation is blocked until Step 1 completion.
  - Verify direct `#step-3` navigation is blocked until Step 2 artifact is available.
  - Verify successful progression updates hash (`step-1` -> `step-2` -> `step-3`) exactly as baseline.

- **Generate/fetch flow**
  - Complete Step 1 (linux), then trigger Step 2 generate.
  - Confirm generating state indicator appears/disappears correctly.
  - Confirm fetch remains gated until fetch reference/job terminal success.
  - Confirm fetch success sets artifact and enables Step 3 continuation.

- **Jira connect/verify/list/attach/disconnect flow**
  - Connect with valid inputs; verify `connection_id` stored and status messaging.
  - Run verify and status check actions.
  - Run list attachments to verify read access gate.
  - Attach artifact only after verify + list prerequisites are satisfied.
  - Disconnect and confirm follow-up actions require reconnect.

## Rollback Strategy

- Keep all Step 0 changes isolated to presentational diffs in the five targeted files.
- If regression is detected, revert only Step 0 styling commits/files while preserving baseline logic files unchanged.
- Rollback trigger conditions:
  - Any deviation in step gating/hash routing outcomes.
  - Any tool-call sequence/argument/output behavior change.
  - Any break in build/serve flow.
- Rollback validation:
  - Re-run automated suites and core manual flows to confirm baseline restoration.

## Isolation from Future Hybrid/RHDS Component Swap

- Do not replace PatternFly components in Step 0.
- Do not introduce RHDS component package runtime usage in Step 0.
- Constrain this plan to token-aligned styling hooks and wrappers only.
- Defer component-level migration and hybrid architecture decisions to later spec phases.

## Post-Design Constitution Re-Check

- PASS: Step 0 artifacts preserve support-workflow fidelity by explicitly freezing behavior contracts.
- PASS: No new diagnostics execution paths, permissions, or credential handling changes are introduced.
- PASS: MCP Apps and text fallback requirements remain intact and explicitly validated.
- PASS: Scope remains incremental/spec-driven and isolated to active spec package `017-rhds-visual-alignment`.

## Project Structure

### Documentation (this feature)

```text
specs/017-rhds-visual-alignment/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── mcp-app.ts
└── mcp-app/
    ├── App.tsx
    ├── step-content.tsx
    └── state.ts

mcp-app.html
server.ts
vite.config.ts
tests/
├── unit/
├── contract/
├── integration/
└── regression/
```

**Structure Decision**: Single-project web + server structure retained; Step 0 limits edits to existing UI shell and presentational surfaces.

## Complexity Tracking

No constitution violations requiring justification.
