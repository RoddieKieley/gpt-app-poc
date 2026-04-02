# Step 0 Baseline and Validation Record

Date: 2026-04-02
Branch: `017-rhds-visual-alignment`

## Automated Validation

- `npm run test:integration` -> PASS (41 passed, 0 failed)
- `npm run test:regression` -> PASS (12 passed, 0 failed)
- `npm run build` -> PASS

## Manual Checks

### Step 1 -> Step 2 -> Step 3 happy path

- Verified workflow start and Step 1 linux selection via HTTP flow probes:
  - `POST /api/engage/workflow/start` returned `current_step: select_product`
  - `POST /api/engage/workflow/select-product` with `linux` returned `current_step: sos_report`
- Full connect/verify/list/attach/disconnect route path validated with live endpoint probes (non-secret dummy credential path):
  - create connection -> verify status -> list attachments -> attach attempt -> disconnect

### Blocked navigation / gating warnings

- Verified unsupported Step 1 selection is blocked:
  - `POST /api/engage/workflow/select-product` with `openshift` returned `unsupported_product`.
- Verified missing generate job poll path returns blocked/error state:
  - `GET /api/sosreport/jobs/missing-job` returned `job_not_found`.

### Generate polling + fetch enabling

- Covered by integration suite checks:
  - `step-2 handoff requires fetch_reference before fetch and produces artifact_ref`
  - `generate job state is readable via MCP resource subscribe/read flow`
  - `headless MCP flow mints consent then generates and fetches`

### Jira connect / verify / list / attach / disconnect flow

- Manual endpoint probe sequence completed:
  - `POST /api/jira/connections` -> connection created with `connection_id`
  - `GET /api/jira/connections/{connection_id}` -> status response returned
  - `GET /api/jira/issues/{issue_key}/attachments` -> guarded response returned
  - `POST /api/jira/issues/{issue_key}/attachments` -> guarded/not-found response returned for invalid artifact
  - `DELETE /api/jira/connections/{connection_id}` -> `204 No Content`

## Risk Notes

- `npm run serve` without `CONSENT_TOKEN_SIGNING_KEY` fails by design in non-test mode.
- Manual endpoint probes were executed with explicit test signing key and alternate port to avoid environment conflicts.
