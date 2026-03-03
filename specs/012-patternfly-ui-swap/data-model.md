# Data Model: PatternFly UI Parity Migration

## Entity: WorkflowUiState

- **Purpose**: Represents current in-memory workflow state that drives gating, route resolution, and action enablement.
- **Fields**:
  - `current_step` (enum, required): `select_product | sos_report | jira_attach | completed | failed`
  - `selected_product` (string, optional): expected value `linux` for progression
  - `fetch_reference` (string, optional): reference returned by generate for fetch
  - `artifact_ref` (string, optional): fetched artifact path/reference
  - `connection_id` (string, optional): Jira connection reference
  - `issue_key` (string, optional): target Jira issue
  - `issue_access_verified` (boolean, required): attach eligibility signal
  - `last_error_code` (string, optional): last gate/action failure code

## Entity: RouteState

- **Purpose**: Tracks hash-route based step targeting and keeps URL behavior compatible.
- **Fields**:
  - `hash` (enum, required): `step-1 | step-2 | step-3`
  - `resolved_step` (enum, required): mapped step from hash + gate checks
  - `was_blocked_by_gate` (boolean, required): whether requested hash was denied by current state

## Entity: UiActionBinding

- **Purpose**: Defines mapping from PatternFly UI events to existing workflow handlers without changing tool contracts.
- **Fields**:
  - `ui_action` (enum, required):
    - `continue_step_1`
    - `generate_sosreport`
    - `fetch_sosreport`
    - `continue_step_2`
    - `connect_jira`
    - `verify_connection`
    - `check_status`
    - `list_attachments`
    - `attach_artifact`
    - `disconnect`
    - `nav_step_1`
    - `nav_step_2`
    - `nav_step_3`
  - `handler_name` (string, required): existing function/callback used before migration
  - `tool_name` (string, optional): server tool invoked by action
  - `argument_contract_unchanged` (boolean, required): must remain `true`

## Entity: StatusPresentationState

- **Purpose**: Encapsulates user-facing status text and loading indicators rendered in PatternFly components.
- **Fields**:
  - `message` (string, required): current status text
  - `severity` (enum, required): `info | success | warning | danger` (presentation-only mapping)
  - `is_generating` (boolean, required): drives inline spinner visibility during polling

## Validation Rules

1. Step 2 navigation MUST be blocked unless `selected_product=linux`.
2. Step 3 navigation MUST be blocked unless `artifact_ref` is present.
3. Hash route resolution for `#step-1`, `#step-2`, `#step-3` MUST preserve current allowed/blocked outcomes.
4. All migrated UI actions MUST call existing handlers with unchanged tool name and argument shapes.
5. PAT value MUST be cleared immediately after successful secure connect attempt.
6. URI and metadata behavior MUST remain unchanged for widget entry and step resources.
7. Text fallback behavior MUST remain available when UI bundle cannot render.

## State Transitions

1. **Step 1 selected** -> **Step 2 accessible**
   - Condition: `selected_product=linux` and step-1 submit succeeds.
2. **Step 2 generate+fetch complete** -> **Step 3 accessible**
   - Condition: `artifact_ref` populated from successful fetch.
3. **Step 3 attach succeeds** -> **completed**
   - Condition: verified connection + verified issue access + attach success.
4. **Any critical action failure** -> **failed**
   - Condition: gate or tool failure requiring explicit user recovery.

## Relationships

- `WorkflowUiState` drives `RouteState` resolution and step visibility.
- `UiActionBinding` triggers `WorkflowUiState` transitions through existing handlers.
- `StatusPresentationState` derives from handler outcomes and is rendered via PatternFly `Alert` and `Spinner`.
