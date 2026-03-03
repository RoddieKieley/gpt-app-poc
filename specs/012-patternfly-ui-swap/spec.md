# Feature Specification: PatternFly Increment 1 - Minimal UI Swap

**Feature Branch**: `012-patternfly-ui-swap`  
**Created**: 2026-03-03  
**Status**: Draft  
**Input**: User description: "Feature: PatternFly Increment 1 - minimal like-for-like UI swap"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Complete support workflow with unchanged behavior (Priority: P1)

As a support engineer, I can run the existing 3-step Engage Support workflow using a PatternFly-based interface without any changes to workflow behavior, order, or gating.

**Why this priority**: The core value is preserving current support operations while changing only presentation, so this must work first.

**Independent Test**: Can be fully tested by executing step-by-step from product selection through Jira disconnect and confirming each gate and transition behaves exactly as before.

**Acceptance Scenarios**:

1. **Given** the widget starts at step 1, **When** the user selects a supported Linux product, **Then** the workflow allows progression only according to current gate rules and moves to step 2.
2. **Given** the user is on step 2, **When** the user provides explicit consent and generates or fetches sosreport, **Then** the workflow allows progression to step 3 under the same conditions as current behavior.
3. **Given** the user is on step 3, **When** the user completes connect, verify, list, attach, and disconnect actions, **Then** each action availability and failure mode matches the current workflow behavior.

---

### User Story 2 - Maintain route-based navigation compatibility (Priority: P2)

As a user opening deep links, I can use `#step-1`, `#step-2`, and `#step-3` routes and get the same step targeting and gating outcomes as today.

**Why this priority**: Existing links and navigation behavior must not break during UI migration.

**Independent Test**: Can be tested by loading each hash route directly in valid and invalid gate states and verifying outcomes mirror existing behavior.

**Acceptance Scenarios**:

1. **Given** a valid state for the targeted step, **When** the user loads `#step-1`, `#step-2`, or `#step-3`, **Then** the correct step is shown with current gate behavior unchanged.
2. **Given** a state that does not satisfy a step gate, **When** the user loads a gated step hash directly, **Then** the same gate failure behavior is applied as in the current UI.

---

### User Story 3 - Preserve integrations and security boundaries (Priority: P3)

As an operator and compliance reviewer, I can trust that tool contracts, resource identifiers, metadata behavior, PAT handling boundaries, and text fallback behavior remain unchanged after the UI component swap.

**Why this priority**: Operational reliability and security posture depend on not altering backend contracts and sensitive-token handling.

**Independent Test**: Can be tested by comparing pre/post migration tool calls, URIs, metadata output behavior, PAT lifetime behavior, and fallback rendering when UI bundle is unavailable.

**Acceptance Scenarios**:

1. **Given** the migrated UI is in use, **When** workflow actions invoke server tools, **Then** tool names, arguments, and interaction semantics remain unchanged.
2. **Given** Jira secure intake is performed, **When** a PAT is used for connect, **Then** the PAT is only sent for secure intake and is cleared immediately after connect, matching current boundary behavior.
3. **Given** the UI bundle cannot be loaded, **When** the widget is rendered, **Then** users receive the same text fallback behavior as before.

### Edge Cases

- User attempts to open `#step-2` or `#step-3` before satisfying prior gates; the same denial and recovery path must occur as before.
- Consent token is missing, malformed, or expired during step 2; step progression remains blocked exactly as in current behavior.
- Sosreport generation/fetch fails or returns no usable artifact; users cannot proceed to step 3 unless current gate conditions are satisfied.
- Jira connect fails, verify fails, or list/attach operations fail; action-level failures and subsequent allowed actions remain unchanged.
- UI bundle for the widget or step view is unavailable; text fallback still renders and remains usable for minimal workflow continuity.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST present the Engage Support widget interface using PatternFly React components while preserving the existing workflow behavior.
- **FR-002**: The system MUST preserve the exact 3-step workflow sequence and gating rules: step 1 product selection, step 2 explicit consent plus sosreport generate/fetch, and step 3 Jira connect/verify/list/attach/disconnect.
- **FR-003**: The system MUST preserve hash route compatibility for `#step-1`, `#step-2`, and `#step-3`, including current gate outcomes when users access steps directly.
- **FR-004**: The system MUST keep these UI resource URIs unchanged: `ui://engage-red-hat-support/app.html`, `ui://engage-red-hat-support/steps/select-product.html`, `ui://engage-red-hat-support/steps/sos-report.html`, and `ui://engage-red-hat-support/steps/jira-attach.html`.
- **FR-005**: The system MUST keep MCP tool contracts unchanged, including tool names, argument shapes, response expectations, and workflow interaction sequence.
- **FR-006**: The system MUST keep server MCP metadata wiring and `openai/outputTemplate` behavior unchanged from current behavior.
- **FR-007**: The system MUST preserve the PAT handling boundary such that PAT data is sent only for secure intake and is cleared immediately after connect.
- **FR-008**: The system MUST preserve existing text fallback behavior when UI bundle resources are unavailable.
- **FR-009**: The system MUST produce and serve the MCP UI resources through the same build/serve path behavior currently relied upon.
- **FR-010**: The feature MUST exclude UX redesign, expanded validation behavior, and new workflow or contract behavior beyond the minimal UI component swap.

### Key Entities *(include if feature involves data)*

- **Workflow Step State**: Current user progression and gate eligibility across step 1, step 2, and step 3, including route-targeted step state.
- **Consent Token**: Explicit user consent artifact required for sosreport-related gating in step 2.
- **Sosreport Artifact Reference**: Generated or fetched diagnostic report reference used to satisfy progression conditions before step 3.
- **Jira Session Context**: Connection and verification state used by step 3 actions (connect, verify, list, attach, disconnect).
- **Widget Resource Descriptor**: UI resource identifiers and metadata contract values used to render and route widget views.

## Assumptions

- Existing workflow logic, tool contracts, and server resource metadata are already correct and serve as the baseline behavior.
- "Like-for-like" means behavior parity takes precedence over visual polish beyond required PatternFly component usage.
- Current performance and reliability baselines remain acceptable; this increment does not introduce new non-functional targets beyond parity.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In parity validation, 100% of defined step-transition and gate-failure scenarios produce the same user-visible outcomes as the baseline widget.
- **SC-002**: In parity validation, 100% of workflow actions trigger unchanged tool invocation signatures and interaction sequences compared to baseline behavior.
- **SC-003**: 100% of targeted route checks for `#step-1`, `#step-2`, and `#step-3` resolve to the same allowed/blocked behavior as baseline under equivalent preconditions.
- **SC-004**: 100% of required widget URIs and metadata-linked views continue to resolve successfully through the existing build/serve flow.
- **SC-005**: In security verification for step 3 connect, PAT exposure window remains limited to secure intake and token data is not retained after connect in all test runs.
