# Quickstart: PatternFly Increment 1 - Minimal Like-for-Like UI Swap

## Prerequisites

- Install dependencies: `npm install`
- Baseline tests available: `npm run test:unit`, `npm run test:contract`, `npm run test:integration`, `npm run test:regression`
- Build pipeline available: `npm run build`
- Local server runnable: `npm run serve`

## Implementation Order (smallest safe changes)

1. Add React + PatternFly dependencies and TSX bootstrap support.
2. Replace `mcp-app.html` with a React mount shell while preserving the same entrypoint behavior.
3. Port Step 1 UI to PatternFly, keeping existing handlers/gates.
4. Port Step 2 UI to PatternFly, keeping consent + generate/fetch/polling behavior.
5. Port Step 3 UI to PatternFly, keeping connect/verify/list/attach/disconnect behavior.
6. Replace status line with inline PatternFly `Alert` and show `Spinner` during generate polling.
7. Run build and contract-focused verification before handoff.

## Old UI -> PatternFly Component Checklist

- [x] Workflow navigation -> `Wizard`
- [x] Step content containers -> `WizardStep`
- [x] Grouped controls -> `Form` + `FormGroup`
- [x] Product chooser -> `Select`
- [x] Text fields -> `TextInput`
- [x] Action rows -> `ActionGroup` + `Button`
- [x] Status output -> inline `Alert`
- [x] Generate polling indicator -> `Spinner`

## File-by-File Migration Sequence

1. `package.json`: add `react`, `react-dom`, `@patternfly/react-core`, `@patternfly/react-icons`.
2. `vite.config.ts`: keep single-file output behavior and enable TSX pipeline with minimal config changes.
3. `mcp-app.html`: keep same shell entry resource and script source, replace body controls with root mount.
4. `src/mcp-app.ts`: preserve existing logic; introduce React render bootstrap and callback wiring.
5. `src/mcp-app/App.tsx` and optional `src/mcp-app/step-content.tsx`: implement PatternFly-presentational UI mapped to existing handlers.
6. `server.ts`: no behavior changes; verify metadata/resource wiring remains identical.

## Verification Checklist

### Required behavior checks

- [x] Step gating behavior is identical to baseline.
- [x] Hash routes `#step-1`, `#step-2`, `#step-3` are behaviorally identical to baseline.
- [x] PAT clearing happens immediately after connect and no PAT retention is introduced.
- [x] Tool names, arguments, and call sequence are unchanged.
- [x] UI resource URIs and `openai/outputTemplate` compatibility are unchanged.
- [x] Text fallback behavior remains intact when UI bundle is unavailable.

### Suggested commands

```bash
npm run build
npm run test:unit
npm run test:contract
npm run test:integration
npm run test:regression
```

### Optional focused reruns

```bash
tsx --test tests/contract/**/*.test.ts
tsx --test tests/integration/**/*.test.ts
tsx --test tests/regression/**/*.test.ts
```

## Sign-off Criteria

- All verification checklist items pass.
- No contract/URI/metadata regressions detected.
- No PAT boundary regressions detected.
- Migration remains presentation-layer only, with workflow logic unchanged.

## Validation Run Notes

- 2026-03-03 baseline: `npm run build` passed before final validation.
- 2026-03-03 baseline: `npm run test:contract`, `npm run test:integration`, and `npm run test:regression` passed.
- 2026-03-03 parity checks: `npx tsc --noEmit` passed.
- 2026-03-03 final: `npm run build` passed.
- 2026-03-03 final: `npm run test:unit` passed.
- 2026-03-03 final: `npm run test:contract` passed.
- 2026-03-03 final: `npm run test:integration` passed.
- 2026-03-03 final: `npm run test:regression` passed.
- Verified in tests and code review:
  - Step gating parity preserved.
  - Hash route parity preserved for `#step-1`, `#step-2`, and `#step-3`.
  - PAT is sent only via secure connect intake and cleared immediately after connect.
  - MCP UI resource URIs and `openai/outputTemplate` metadata wiring remain unchanged.
  - Text fallback guidance remains present when UI bundle is unavailable.
