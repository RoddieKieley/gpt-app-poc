# Quickstart - RHDS Visual Alignment Step 0

This quickstart executes Step 0 only: keep PatternFly components and behavior intact while applying RHDS-informed presentational alignment.

## 1) Baseline Verification

Run baseline tests:

```bash
npm run test:unit
npm run test:contract
npm run test:integration
npm run test:regression
```

Capture baseline manual checks:

1. Hash routing and step gating
   - Open with `#step-1`, `#step-2`, `#step-3`
   - Confirm step-entry allow/block behavior matches expected gates
2. Generate/fetch flow
   - Step 1 linux selection required before generate
   - Fetch only after valid fetch reference/terminal generate state
3. Jira flow
   - Connect -> Verify/Status -> List -> Attach -> Disconnect
   - Confirm attach is blocked until prereqs pass

## 2) Add Styling Layer

Target files only:

- `src/mcp-app.ts` (style wiring/import only; no workflow logic edits)
- `src/mcp-app/App.tsx` (class hooks/layout polish only)
- `src/mcp-app/step-content.tsx` (presentational spacing/status polish only)
- `mcp-app.html` (token variables and shell-level styling hooks)
- `server.ts` (optional fallback shell styling only if needed)

Do not:

- Replace PatternFly components
- Change tool-call names/arguments/order
- Change state machine, gating, route/hash behavior, or build/serve semantics

## 3) Apply Low-Risk Presentational Tweaks

- Tune typography, spacing, and status hierarchy to RHDS guidance
- Improve loading/fallback polish
- Keep control IDs, props, handlers, and event flow unchanged

## 4) Regression Validation

Re-run tests:

```bash
npm run test:unit
npm run test:contract
npm run test:integration
npm run test:regression
```

Re-run manual gates:

- Step gating/hash routing parity
- Generate/fetch parity
- Jira connect/verify/list/attach/disconnect parity

## 5) Execution Notes (Step 0)

- Integration tests passed (`npm run test:integration`).
- Regression tests passed (`npm run test:regression`).
- Build passed (`npm run build`).
- No-behavior-delta evidence recorded in:
  - `specs/017-rhds-visual-alignment/validation/no-behavior-delta.md`
  - `specs/017-rhds-visual-alignment/validation/baseline.md`

## Rollback

Rollback immediately if any parity gate fails:

1. Revert Step 0 presentational changes in the five target files.
2. Re-run automated tests and manual gates.
3. Confirm baseline behavior restored before proceeding.
