# Implementation Plan: RHDS Final Migration (Step 2)

**Branch**: `019-rhds-final-migration` | **Date**: 2026-04-02 | **Spec**: `/wip/src/github.com/roddiekieley/gpt-app-poc/specs/019-rhds-final-migration/spec.md`  
**Input**: Feature specification from `/wip/src/github.com/roddiekieley/gpt-app-poc/specs/019-rhds-final-migration/spec.md`

## Summary

Complete final-phase RHDS-first UI migration by removing remaining PatternFly render paths, retiring PatternFly dependencies and base stylesheet where safe, and proving full workflow parity against baseline for happy, blocked, error/recovery, loading/polling, accessibility, and visual paths. Delivery is gated by explicit cutover sequence, rollback option, and signoff criteria with evidence.

## Technical Context

**Language/Version**: TypeScript (ESM) + React 19 in existing Vite build pipeline  
**Primary Dependencies**: `react`, `react-dom`, `@modelcontextprotocol/ext-apps`, `@modelcontextprotocol/sdk`, current `@patternfly/react-core` and `@patternfly/react-icons` targeted for retirement  
**Storage**: N/A (UI migration only)  
**Testing**: Existing unit/contract/integration/regression suites plus migration-specific parity matrix evidence  
**Target Platform**: Browser-hosted MCP app UI resource served from existing app server flow  
**Project Type**: Single-project web app with MCP UI resource  
**Performance Goals**: Maintain current user-perceived responsiveness for step transitions, status updates, and generate polling interactions  
**Constraints**: Preserve exactly step gating, route/hash behavior, tool call order/arguments, status semantics, credential boundaries, and MCP UI build/serve mechanics  
**Scale/Scope**: Final phase only; all remaining PF usage in `src/mcp-app*`, package-level PF retirement decisions, and migration artifact updates

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Diagnostics execution boundaries are unchanged; no new diagnostics permissions or write operations are introduced. **PASS**
- MCP Apps compliance remains unchanged (`ui://` resource + JSON-RPC bridge only). **PASS**
- Text fallback behavior remains intact because tool response contracts are unchanged. **PASS**
- Redaction and least-scope handling remain intact; no secret-bearing payload expansion is planned. **PASS**
- Historical specification immutability is preserved; all new planning/contracts remain under `specs/019-rhds-final-migration/`. **PASS**

## Project Structure

### Documentation (this feature)

```text
specs/019-rhds-final-migration/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── rhds-final-cutover.openapi.yaml
│   └── rhds-pf-retirement-contract.v1.json
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── mcp-app.ts
└── mcp-app/
    ├── App.tsx
    ├── step-content.tsx
    └── ui/
        ├── action-button-adapter.tsx
        ├── progress-affordance-adapter.tsx
        ├── status-display-adapter.tsx
        └── adapter-mode.ts

tests/
├── contract/
├── integration/
└── regression/

package.json
```

**Structure Decision**: Retain existing structure and complete migration by replacing remaining PF usages in place, then retiring PF dependencies/imports without altering workflow logic ownership.

## Remaining PF Usage Inventory and Exact Replacement Strategy

### Inventory (current branch baseline)

1. `src/mcp-app.ts`
   - `@patternfly/react-core/dist/styles/base.css` import.
2. `src/mcp-app/App.tsx`
   - `PageSection`, `Title`, `WizardStep` from `@patternfly/react-core`.
3. `src/mcp-app/step-content.tsx`
   - `ActionGroup`, `Form`, `FormGroup`, `MenuToggle`, `Select`, `SelectList`, `SelectOption`, `Spinner`, `TextInput`.
4. `src/mcp-app/ui/action-button-adapter.tsx`
   - PF `Button` fallback path.
5. `src/mcp-app/ui/progress-affordance-adapter.tsx`
   - PF `Wizard` as active progress affordance implementation.
6. `src/mcp-app/ui/status-display-adapter.tsx`
   - PF `Alert` fallback path.
7. `src/mcp-app/ui/adapter-mode.ts`
   - `patternfly` mode defaults/aliases and env override support.

### Replacement strategy

- Replace PF shell/layout primitives in `App.tsx` with RHDS-compatible structure while preserving `WizardStep` logical equivalence via RHDS-first progress component contract.
- Replace PF form and input primitives in `step-content.tsx` with RHDS equivalents (or semantic HTML + RHDS classes where direct equivalents are unavailable), preserving IDs, labels, disabled states, and callback invocation signatures.
- Convert adapters to RHDS-only execution mode in Step 2:
  - Remove PF render branches in status/button/progress adapters after parity evidence confirms RHDS paths.
  - Simplify adapter mode resolver to RHDS-only defaults, retaining only rollback mechanism appropriate for final cutover window if required by release policy.
- Maintain exact behavior invariants:
  - step gating and hash route transitions,
  - tool call order/arguments and status updates,
  - credential intake boundaries and clearing behavior,
  - MCP build/serve mechanics.

## Dependency Retirement Plan (`package.json`)

- Candidate retirements:
  - `@patternfly/react-core`
  - `@patternfly/react-icons`
- Retirement rule:
  - Remove dependency only when code search confirms no runtime imports remain and parity matrix is complete.
- If dependency must remain temporarily:
  - Add explicit retention note in migration report (why retained, risk, owner, target removal follow-up).
- Lockfile update is part of same cutover batch after code import removal to avoid dependency drift.

## Stylesheet and Import Cleanup Plan

- Primary target: `src/mcp-app.ts`
  - Remove `@patternfly/react-core/dist/styles/base.css`.
  - Keep RHDS stylesheet imports and ordering stable.
- Related assets:
  - Verify no PF class assumptions remain in local CSS (`src/mcp-app/*.css`) that depend on PF base styles.
  - Normalize spacing/typography/focus visuals under RHDS styles only.
- Cleanup validation:
  - Build output remains healthy.
  - UI layout and a11y focus indicators remain acceptable across all steps.

## Documentation and Migration Artifact Update Tasks

- Add final migration report artifact under current spec package (parity evidence, dependency decision log, residual risk list, signoff outcomes).
- Update current feature contracts in `specs/019-rhds-final-migration/contracts/` with final cutover and retirement commitments.
- Add quickstart execution + rollback procedure for release-day use.
- Ensure no edits are made to historical spec packages; reference prior artifacts only.

## Comprehensive Regression Matrix

| Category | Core checks | Expected parity evidence |
|----------|-------------|--------------------------|
| Happy path | Step1 continue -> Step2 generate/fetch -> Step3 connect/verify/attach | Same step transitions, hash updates, status messages, and terminal completion behavior |
| Blocked path / gating | Attempt Step2/Step3 before prerequisites; unsupported product path | Same gate-block messages, `last_error_code` semantics, and blocked transitions |
| Error path / recovery | generate/fetch/connect/verify/attach failures + retry after correction | Same error states/messages, recovery path viability, and no extra required user actions |
| Loading / polling path | generate job accepted + polling loop to terminal state | Same polling cadence semantics, status progression, and terminal outcome handling |
| Accessibility + visual | Keyboard traversal, focus order, ARIA/live regions, visual hierarchy | Equivalent operability/announce behavior and acceptable RHDS visual compliance |

## Final Execution Plan (Cutover, Rollback, Signoff)

### Cutover sequence

1. Freeze migration scope and baseline current behavior evidence.
2. Replace remaining PF UI primitives with RHDS-first components in `App.tsx` and `step-content.tsx`.
3. Remove PF render branches from adapter files and finalize RHDS-first mode behavior.
4. Remove PF base stylesheet import from `src/mcp-app.ts`; adjust local styling for RHDS-only rendering.
5. Remove PF dependencies from `package.json` and regenerate lockfile.
6. Execute full regression matrix and collect evidence.
7. Produce final migration report and run signoff gate review.

### Rollback option

- **Primary rollback scope**: single-cut rollback commit that restores PF dependencies/imports and adapter PF branches while preserving all workflow logic changes unrelated to migration.
- **Rollback triggers**:
  - any regression in preserved behavior invariants,
  - critical accessibility failure,
  - blocking visual defect impacting task completion,
  - build/serve breakage in MCP UI resource delivery.
- **Rollback verification**: rerun critical happy path + blocked path + error recovery smoke checks before declaring rollback successful.

### Signoff gates

- **Gate A - Behavior parity**: all matrix categories pass with explicit evidence.
- **Gate B - Dependency retirement**: PF dependencies fully removed or residual explicitly justified.
- **Gate C - Security and boundaries**: credential handling and tool argument boundaries unchanged.
- **Gate D - Operational readiness**: cutover and rollback procedures validated and documented.
- **Gate E - Reporting**: final migration report completed with residual risks and owners.

## Phase 0: Research Plan

- Resolve remaining technical choices for RHDS replacement patterns (forms, selects, progress affordance) while preserving existing callback contracts.
- Confirm best-practice approach for retiring PF dependencies and stylesheet safely in a single release cut.
- Define release-safe rollback granularity for final cutover.

## Phase 1: Design & Contracts Plan

- Create `data-model.md` capturing migration entities (PF inventory item, replacement mapping, parity run, retirement decision, signoff gate).
- Create contracts:
  - `rhds-final-cutover.openapi.yaml`
  - `rhds-pf-retirement-contract.v1.json`
- Create `quickstart.md` with execution sequence, regression matrix runbook, rollback drill, and signoff checklist.
- Run `.specify/scripts/bash/update-agent-context.sh cursor-agent`.

## Post-Design Constitution Re-Check

- Final design introduces no diagnostics permission expansion. **PASS**
- MCP Apps bridge and text fallback contracts remain unchanged. **PASS**
- Secret boundary handling remains backend-only with no new model-visible secret flow. **PASS**
- All new artifacts are isolated to `specs/019-rhds-final-migration/`. **PASS**

## Complexity Tracking

No constitution violations identified; complexity justification table is not required.
