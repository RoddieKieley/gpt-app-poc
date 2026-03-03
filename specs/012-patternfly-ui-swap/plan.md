# Implementation Plan: PatternFly Increment 1 - Minimal Like-for-Like UI Swap

**Branch**: `012-patternfly-ui-swap` | **Date**: 2026-03-03 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `/specs/012-patternfly-ui-swap/spec.md`

## Summary

Migrate the Engage Support widget UI from direct HTML controls to PatternFly React components with the smallest safe change set and strict behavior parity. Keep all MCP workflow/tool contracts, step gating, hash routing, resource URIs, metadata wiring (`openai/outputTemplate` and widget metadata), PAT security boundary, and text fallback behavior unchanged.

## Technical Context

**Language/Version**: TypeScript 5.9 (Node.js runtime for server, browser bundle for widget UI)  
**Primary Dependencies**: Existing MCP/Express stack plus `react`, `react-dom`, `@patternfly/react-core`, `@patternfly/react-icons`  
**Storage**: N/A for this increment (no new persistence)  
**Testing**: Existing `tsx --test` suites (`unit`, `contract`, `integration`, `regression`) plus build verification  
**Target Platform**: Linux-hosted MCP server serving browser-rendered MCP widget resources  
**Project Type**: Single-project MCP app server + UI bundle  
**Performance Goals**: UI behavior parity with no observable workflow latency regression during step transitions and tool invocation actions  
**Constraints**: Preserve all tool names/args and server interactions, preserve `ui://` URIs, preserve hash routes, preserve PAT clearing boundary, preserve non-UI fallback text behavior  
**Scale/Scope**: One widget UI migration (`mcp-app.html` + `src/mcp-app.ts`) with build config and dependency updates only; no workflow logic redesign

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **1. Support-Workflow Fidelity**: Workflow remains diagnostics-first and behavior-preserving across all three steps. **Pass.**
- **2. Human-Authorized Diagnostics**: Step 2 explicit consent + generate/fetch behavior remains enforced as currently implemented. **Pass.**
- **3. Privacy-First Diagnostics**: No expansion of diagnostic collection scope or secret exposure paths. **Pass.**
- **4. Strict MCP Apps Compliance**: Existing `ui://` resources and MCP JSON-RPC bridge remain unchanged. **Pass.**
- **5. Graceful Degradation**: Text fallback remains available when UI bundle is unavailable. **Pass.**
- **6. Portability and Interop**: No host-specific runtime branching introduced. **Pass.**
- **7. Incremental Spec-Driven Delivery**: Plan artifacts are delivered in this active feature package only. **Pass.**
- **8. Secret Boundary for Tokens and Credentials**: PAT remains secure-intake only and is cleared from UI immediately after connect. **Pass.**
- **9. Non-Retroactive Specification Integrity**: No retroactive edits to completed historical spec packages. **Pass.**

**Post-Design Re-check**: Pass. Design artifacts keep contracts/URIs/metadata/security boundaries unchanged and limit scope to presentation-layer migration.

## Project Structure

### Documentation (this feature)

```text
specs/012-patternfly-ui-swap/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── engage-patternfly-migration.contract.v1.json
│   ├── engage-ui-component-map.v1.json
│   └── engage-verification-regression-checklist.v1.json
└── tasks.md
```

### Source Code (repository root)

```text
mcp-app.html
src/mcp-app.ts
src/mcp-app/
  App.tsx                         # new
  step-content.tsx                # new
  state.ts                        # new (optional extraction for parity-safe state typing)
server.ts
package.json
vite.config.ts
tests/contract/
tests/integration/
tests/regression/
```

**Structure Decision**: Keep single-project structure and migrate UI incrementally by introducing a focused React/PatternFly UI layer while preserving existing state transitions, tool call wiring, and server surfaces.

## Phase Plan

### Phase 0 - Research and decisions

1. Confirm minimal PatternFly component set that maps one-to-one with current controls.
2. Define React bootstrap strategy that keeps existing `mcp-app.html` entrypoint and Vite build semantics.
3. Define parity-safe migration method to preserve handlers, tool names/args, and step gate logic.
4. Define regression-first verification strategy targeting routing, metadata/resource URIs, PAT clearing, and fallback behavior.

**Exit criteria**:
- `research.md` contains final decisions, rationale, and alternatives.
- No unresolved clarification items remain.

### Phase 1 - Design and contracts

1. Produce `data-model.md` for UI workflow state, route state, and gate/verification boundaries.
2. Produce migration/compatibility contracts in `contracts/`.
3. Produce `quickstart.md` with iterative migration sequence and verification commands.
4. Run `.specify/scripts/bash/update-agent-context.sh cursor-agent`.
5. Re-check constitution/security/compliance gates after design.

**Exit criteria**:
- `data-model.md`, `quickstart.md`, and contracts are consistent with `spec.md`.
- Contract-preservation and fallback verification are explicitly testable.

## Old UI -> PatternFly Mapping

- Navigation step buttons -> **PatternFly `Wizard`** step navigation.
- Per-step `<section>` blocks -> **PatternFly `WizardStep`** content containers.
- Per-step grouped inputs -> **PatternFly `Form` + `FormGroup`**.
- Product `<select>` control -> **PatternFly `Select`**.
- URL/token/reference text fields -> **PatternFly `TextInput`**.
- Action rows with multiple buttons -> **PatternFly `ActionGroup` + `Button`**.
- Status line text (`#status`) -> **PatternFly inline `Alert`**.
- Generate polling/waiting indicator -> **PatternFly inline `Spinner`**.

## File-by-File Change Plan

### `package.json`

- Add React + PatternFly dependencies (`react`, `react-dom`, `@patternfly/react-core`, `@patternfly/react-icons`).
- Keep existing scripts and MCP/server dependencies unchanged.

### `vite.config.ts`

- Keep single-file build behavior intact.
- Add only the minimal React/TSX build support required for `src/mcp-app.ts`/`src/mcp-app/*.tsx` usage.
- Ensure output path and input entrypoint behavior remain unchanged.

### `mcp-app.html`

- Replace raw control markup with minimal React mount shell.
- Keep title/meta compatibility and `src/mcp-app.ts` module entrypoint intact.
- Preserve text fallback messaging region semantics.

### `src/mcp-app.ts`

- Keep all existing workflow/tool-call logic and step gate checks unchanged in behavior.
- Add TSX bootstrap and render root wiring for PatternFly-based UI components.
- Preserve `App` connection flow, hash-route bootstrap, PAT clearing, and existing tool invocation argument shapes.

### `src/mcp-app/App.tsx` (new)

- Render PatternFly `Wizard` with 3 steps mapped to existing workflow states.
- Render step-level forms and actions using `Form`, `FormGroup`, `Select`, `TextInput`, `ActionGroup`, and `Button`.
- Render inline status feedback via `Alert`; show `Spinner` only during active generate polling states.
- Accept callback props that call existing handler logic without changing contracts.

### `src/mcp-app/step-content.tsx` (new)

- Encapsulate Step 1/2/3 view sections as presentational components.
- Keep display-only transformation logic separate from workflow actions to reduce regression risk.

### `src/mcp-app/state.ts` (new, optional)

- Extract UI-state and step-state TypeScript types for parity-safe updates if needed.
- No behavioral changes; typing consolidation only.

### `server.ts`

- No behavioral or contract modifications.
- Validate that MCP tool metadata/resource URI references still point to unchanged URIs/templates.

## Migration Sequence (smallest safe increments)

1. Add React + PatternFly dependencies and TSX bootstrap support.
2. Replace `mcp-app.html` body with React mount shell while preserving entrypoint/build path.
3. Port Step 1 UI to PatternFly and keep existing handlers and gates.
4. Port Step 2 UI to PatternFly and keep consent/generate/fetch/polling logic.
5. Port Step 3 UI to PatternFly and keep connect/verify/list/attach/disconnect logic.
6. Replace status line rendering with PatternFly inline `Alert` (plus `Spinner` for generate polling).
7. Run build/tests and contract-focused verification suite before sign-off.

## Risk List and Mitigations

- **Risk**: Step gate regressions caused by UI state refactoring.
  - **Mitigation**: Preserve gate predicates/functions and only change rendering layer.
- **Risk**: Hash route behavior drift with Wizard navigation.
  - **Mitigation**: Keep existing hash parsing/setting logic as source of truth and bind Wizard step changes to it.
- **Risk**: Tool argument drift during handler rewiring.
  - **Mitigation**: Reuse existing tool call helpers and argument builders; add regression assertions for names/args.
- **Risk**: PAT exposure due to new input state handling.
  - **Mitigation**: Keep immediate PAT clear behavior after connect and verify in tests.
- **Risk**: URI/metadata wiring regression during UI restructuring.
  - **Mitigation**: Verify unchanged resource URIs and `openai/outputTemplate` metadata paths post-build.
- **Risk**: Loss of fallback behavior if UI bundle fails.
  - **Mitigation**: Preserve and validate existing text fallback responses and operator guidance.

## Regression Checklist (contract preservation focused)

- Tool names unchanged for all step actions.
- Tool argument shapes unchanged (`generate_sosreport`, `fetch_sosreport`, Jira flow tools).
- Step transition outcomes unchanged for success/failure and blocked gating states.
- `#step-1`, `#step-2`, `#step-3` hash routing outcomes unchanged.
- `ui://engage-red-hat-support/app.html` and all step resource URIs unchanged.
- `openai/outputTemplate` and widget metadata behavior unchanged.
- PAT only sent to secure intake boundary and cleared immediately after connect.
- Text fallback behavior unchanged when UI bundle is unavailable.

## Verification Plan

### Build and resource verification

1. Run `npm install` then `npm run build`.
2. Confirm output still serves MCP widget entry resource flow as before.
3. Confirm URI compatibility for:
   - `ui://engage-red-hat-support/app.html`
   - `ui://engage-red-hat-support/steps/select-product.html`
   - `ui://engage-red-hat-support/steps/sos-report.html`
   - `ui://engage-red-hat-support/steps/jira-attach.html`

### Behavior parity verification

1. **Step gating**: Verify blocked/allowed transitions exactly match baseline for all three steps.
2. **Hash routing**: Verify direct load and navigation through `#step-1`, `#step-2`, `#step-3`.
3. **PAT clearing**: Verify PAT is cleared immediately after connect and never retained in local UI state.
4. **Contract preservation**: Verify unchanged tool names/args and server interactions.
5. **Metadata compatibility**: Verify `openai/outputTemplate` and widget metadata wiring are unchanged.
6. **Fallback behavior**: Verify text fallback behavior remains intact when UI bundle is unavailable.

### Suggested validation commands

```bash
npm run build
npm run test:unit
npm run test:contract
npm run test:integration
npm run test:regression
```

## Complexity Tracking

No constitution violations to justify.

## Verification Status

- 2026-03-03: `npm run build` passed.
- 2026-03-03: `npx tsc --noEmit` passed.
- 2026-03-03: `npm run test:unit` passed.
- 2026-03-03: `npm run test:contract` passed.
- 2026-03-03: `npm run test:integration` passed.
- 2026-03-03: `npm run test:regression` passed.
- Confirmed through tests:
  - Step gate behavior parity is preserved.
  - Hash route parity for `#step-1`, `#step-2`, and `#step-3` is preserved.
  - PAT handling boundary remains unchanged and PAT is cleared immediately after secure intake connect.
  - Server resource URIs and `openai/outputTemplate`/widget metadata compatibility are preserved.
  - Text fallback behavior remains available when UI bundle is unavailable.
