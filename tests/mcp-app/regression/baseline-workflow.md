# Baseline Workflow Evidence (Pre-Step 1 Hybrid)

## Scope

- Step 1 select product progression
- Step 2 generate/fetch actions and continue gating
- Step 3 connect/verify/status/list/attach/disconnect actions
- Inline status surface semantics

## Contract Baseline

- Callback signatures are zero-argument handlers (`() => void`) across navigation and action buttons.
- Status message surface is addressed via `#status`.
- Step gating semantics are controlled by workflow state, not UI component internals.

## Expected Invariants During Step 1

- No behavior or data-flow changes in `src/mcp-app.ts`.
- No callback signature changes in `src/mcp-app/App.tsx` or `src/mcp-app/step-content.tsx`.
- Build and serve commands remain unchanged.
