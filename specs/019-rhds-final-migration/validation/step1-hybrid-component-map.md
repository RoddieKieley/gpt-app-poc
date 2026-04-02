# Step 1 Hybrid Component Map

| PF Surface | File | RHDS Replacement | Batch | Status |
|---|---|---|---|---|
| `Alert` status fallback | `src/mcp-app/ui/status-display-adapter.tsx` | RHDS status block | B1 | Validated |
| `Button` fallback | `src/mcp-app/ui/action-button-adapter.tsx` | RHDS button classes | B2 | Validated |
| `Wizard` fallback | `src/mcp-app/ui/progress-affordance-adapter.tsx` | RHDS step navigation + panel | B3 | Validated |
| PF shell/form primitives | `src/mcp-app/App.tsx`, `src/mcp-app/step-content.tsx` | RHDS-first semantic HTML + styles | B2/B3 | Validated |
| PF base stylesheet | `src/mcp-app.ts` | Removed | Retirement | Removed |
