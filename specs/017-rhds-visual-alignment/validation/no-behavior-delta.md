# No Behavior Delta Checklist - Step 0

Date: 2026-04-02
Status: PASS

## Invariants

- [x] VG-001 Step gating parity preserved.
- [x] VG-002 Hash routing parity preserved.
- [x] VG-003 Generate/fetch sequencing parity preserved.
- [x] VG-004 Jira lifecycle parity preserved.
- [x] VG-005 Tool invocation names/argument shapes/order preserved.
- [x] VG-006 Text fallback continuity preserved.
- [x] VG-007 Build/serve contract behavior preserved (build pass; serve requires expected signing key env).

## File-Level Safety Checks

- [x] `src/mcp-app.ts`: no workflow/state/tool-call logic changed; style import only.
- [x] `src/mcp-app/App.tsx`: presentational class hooks only; handlers and wizard step IDs unchanged.
- [x] `src/mcp-app/step-content.tsx`: class hooks only; IDs/events/gating props unchanged.
- [x] `mcp-app.html`: shell class hooks only; script bootstrap unchanged.
- [x] `server.ts`: fallback shell styling only; fallback workflow instruction semantics unchanged.

## Required Checkpoints

- [x] Post shell/App edit cluster check complete.
- [x] Post step-content edit cluster check complete.
- [x] Post fallback/loading polish cluster check complete.

## Validation Commands Executed

- `npm run test:integration`
- `npm run test:regression`
- `npm run build`

## Manual Verification Coverage

- Step 1/2 gating path validated via workflow start/select endpoint probes.
- Blocked gating path validated for unsupported product.
- Jira connect/verify/list/attach/disconnect path validated with endpoint probes and guarded responses.
- Generate polling/fetch enablement validated via integration tests that assert fetch gating and job polling behavior.
