# Feature Specification: CPU Information UI Step

**Feature Branch**: `021-cpu-info-ui-step`  
**Created**: 2026-04-09  
**Status**: Draft  
**Input**: User description: "Insert a new troubleshooting workflow step between select_product and sos_report in engage support UI. Add a static RHDS-consistent table that displays one row from get_cpu_information output and a Next button that advances to sos_report. Preserve existing UI compatibility entry and step resource registration pattern."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Review CPU Information During Guided Troubleshooting (Priority: P1)

As a support user following the engage troubleshooting flow, I can view a dedicated CPU information step after selecting a product so I can confirm key CPU context before continuing.

**Why this priority**: This is the core value of the change and the main behavior requested by the business workflow.

**Independent Test**: Can be fully tested by starting a troubleshooting session, completing product selection, and confirming a CPU information step appears before the SOS report step with one populated row.

**Acceptance Scenarios**:

1. **Given** a user has completed the product selection step, **When** the workflow advances, **Then** the next step shown is the new CPU information step.
2. **Given** the CPU information step is displayed, **When** the page renders, **Then** a table is visible that shows one row mapped to CPU information fields.

---

### User Story 2 - Continue Workflow from CPU Information Step (Priority: P2)

As a support user, I can select Next on the CPU information step so I can proceed to the SOS report step without interruption.

**Why this priority**: Workflow continuity is required for the new step to be usable in practice.

**Independent Test**: Can be fully tested by navigating to the CPU information step and activating Next to verify transition to the SOS report step.

**Acceptance Scenarios**:

1. **Given** the user is on the CPU information step, **When** they choose Next, **Then** the workflow transitions to the SOS report step.
2. **Given** existing troubleshooting steps are registered, **When** the new step is added, **Then** existing step registration and compatibility behavior continue to work for the full workflow.

---

### User Story 3 - Receive Readable Output When Rich Rendering Is Unavailable (Priority: P3)

As a support user in environments that do not support rich table rendering, I still receive readable CPU information content for the step.

**Why this priority**: Maintaining fallback behavior preserves usability and compatibility across supported client contexts.

**Independent Test**: Can be tested by invoking the step in a non-rich rendering context and confirming textual output is presented with CPU data and progression instructions.

**Acceptance Scenarios**:

1. **Given** a client context that does not support rich UI rendering, **When** the CPU information step is reached, **Then** a text fallback is returned that includes the same CPU fields represented in the table view.

---

### Edge Cases

- If CPU data values are missing or unavailable for one or more fields, the step still renders with explicit placeholder values and does not block progress.
- If users revisit the step from browser/navigation history, the displayed static CPU row remains consistent and Next still routes to the SOS report step.
- If the step registry or compatibility metadata are read by existing clients, they continue to resolve the workflow without duplicate or broken step entries.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The troubleshooting workflow MUST include a new CPU information step positioned after product selection and before SOS report.
- **FR-002**: The CPU information step MUST present a static table aligned with RHDS visual conventions.
- **FR-003**: The table MUST display exactly one row containing these CPU information fields: model, logical_cores, physical_cores, frequency_mhz, load_avg_1m, load_avg_5m, load_avg_15m, and cpu_line.
- **FR-004**: The CPU information step MUST provide a Next action that advances the user directly to the SOS report step.
- **FR-005**: The step MUST preserve existing UI compatibility metadata entry conventions used by other engage support steps.
- **FR-006**: The step MUST preserve existing step resource registration conventions so clients can discover and load the step consistently with existing steps.
- **FR-007**: When rich UI rendering is unavailable, the step MUST provide a text fallback containing the same CPU data represented by the table.
- **FR-008**: The feature MUST include automated verification for step parser/handler behavior and MCP tools/list surface compatibility covering the new step.

### Key Entities *(include if feature involves data)*

- **Troubleshooting Step**: A discrete workflow stage with ordering, metadata compatibility info, resource registration, display content, and navigation actions.
- **CPU Information Row**: A single structured data record containing model, core counts, frequency, load averages, and CPU summary line.
- **Compatibility Entry**: Metadata that signals step support expectations to clients and preserves backward-compatible behavior.
- **Step Resource Registration**: The discoverable registration record that makes a troubleshooting step available through the existing tools/list surface.

### Assumptions

- The CPU information shown in this phase is a static representative row and does not require live system collection.
- Existing workflow step identifiers for product selection and SOS report are stable and remain unchanged.
- RHDS consistency is evaluated against currently used engage support table and button patterns.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In 100% of workflow runs, users reach the CPU information step immediately after product selection and before SOS report.
- **SC-002**: In 100% of tested runs, selecting Next on the CPU information step transitions users to SOS report in a single action.
- **SC-003**: In 100% of compatibility checks, the tools/list surface includes the new step without removing or altering existing step entries.
- **SC-004**: In automated tests for this feature, parser/handler and fallback scenarios pass with no regressions in existing troubleshooting step behavior.
