# Data Model: Engage Support Workflow Multi-Resource Refactor

## Entity: WorkflowSession

- **Purpose**: Shared state handoff across the three UI workflow steps.
- **Fields**:
  - `session_id` (string, required): Stable identifier for one workflow run.
  - `current_step` (enum, required): `select_product | sos_report | jira_attach | completed | failed`.
  - `selected_product` (enum, optional until step 1 complete): `linux`.
  - `connection_id` (string, optional until step 3 connect succeeds): Opaque reference from secure intake.
  - `issue_key` (string, optional until step 3 input): Jira issue target.
  - `issue_access_verified` (boolean, default `false`): Whether issue validation passed.
  - `fetch_reference` (string, optional until generate succeeds): Handle for fetch call.
  - `artifact_ref` (string, optional until fetch succeeds): Artifact path/reference for attach.
  - `last_error_code` (string, optional): Last failure reason for retry guidance.
  - `updated_at` (datetime string, required): Last state change timestamp.

## Entity: ProductSelection

- **Purpose**: Encodes step-1 decision and scope gate.
- **Fields**:
  - `product` (enum, required): Must equal `linux`.
  - `validated` (boolean, required): True only when product is in allowed set.

## Entity: SosReportState

- **Purpose**: Tracks step-2 diagnostic generation and retrieval.
- **Fields**:
  - `generation_status` (enum): `pending | running | succeeded | failed`.
  - `fetch_status` (enum): `pending | running | succeeded | failed`.
  - `fetch_reference` (string, optional): Output from `generate_sosreport`.
  - `artifact_ref` (string, optional): Output from `fetch_sosreport`.

## Entity: JiraAttachmentState

- **Purpose**: Tracks step-3 secure Jira flow.
- **Fields**:
  - `connection_id` (string, optional): Opaque connection reference only.
  - `connection_status` (enum): `unknown | connected | expired | revoked | failed`.
  - `issue_key` (string, optional): User-entered issue key.
  - `issue_access_verified` (boolean): Required true before attach.
  - `attachment_status` (enum): `pending | running | succeeded | failed`.

## Validation Rules

1. `selected_product` MUST be `linux` before step transition to `sos_report`.
2. `fetch_reference` MUST exist before invoking fetch step.
3. `artifact_ref` MUST exist before invoking attachment step.
4. `connection_id` MUST be opaque and non-empty before issue access verification.
5. PAT values are disallowed in all WorkflowSession fields.
6. `issue_access_verified` MUST be true before `jira_attach_artifact`.
7. Any failed step sets `current_step=failed` and records `last_error_code`.

## State Transitions

1. `select_product` -> `sos_report`
   - Condition: `selected_product=linux`.
2. `sos_report` (generate pending/running/succeeded) -> fetch succeeded
   - Condition: `fetch_reference` obtained then `artifact_ref` obtained.
3. `sos_report` -> `jira_attach`
   - Condition: `artifact_ref` present.
4. `jira_attach` -> `completed`
   - Condition: `connection_id` active, `issue_access_verified=true`, attach succeeded.
5. Any step -> `failed`
   - Condition: validation failure, tool failure, or access verification failure.
6. `failed` -> prior logical step
   - Condition: user retries after correcting required inputs.
