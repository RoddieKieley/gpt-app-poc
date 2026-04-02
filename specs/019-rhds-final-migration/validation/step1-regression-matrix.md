# Step 1 Regression Matrix

| Category | Result | Evidence |
|---|---|---|
| Happy path | PASS | `npm run test:integration` (`headless MCP flow mints consent then generates and fetches`) |
| Blocked/gating path | PASS | `npm run test:integration` (`generate_sosreport is denied until step 1 product selection completes`) |
| Error/recovery path | PASS | `npm run test:integration` + `npm run test:regression` deny/error cases |
| Loading/polling path | PASS | `npm run test:integration` (`generate job state is readable...`) |
| Accessibility/visual checks | PASS | RHDS UI replacements validated against unchanged workflow tests + manual checklist docs |
