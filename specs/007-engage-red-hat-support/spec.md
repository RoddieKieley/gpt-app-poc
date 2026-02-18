# Feature Specification: Engage Red Hat Support

**Feature Branch**: `007-engage-red-hat-support`  
**Created**: 2026-02-18  
**Status**: Draft  
**Input**: User description: "Create feature "Engage Red Hat Support" for gpt-app-poc using Option A orchestration (UI/skill orchestrates existing tools, no new MCP orchestration tool). Scope: add skill://engage-red-hat-support/SKILL.md and ui://engage-red-hat-support/app.html; linux is the only product selection; workflow must require Jira PAT intake via secure backend endpoint to create/verify connection_id, then run generate_sosreport -> fetch_sosreport -> jira_attach_artifact using issue key + connection_id. Enforce PAT secret boundary: PAT must never appear in MCP tool args/results/prompts/logs; only opaque connection_id in MCP calls. Preserve existing tools/resources behavior and text fallbacks for non-UI hosts. Include user stories, acceptance criteria, edge cases, functional requirements, entities, and measurable success criteria."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Submit Linux Diagnostic Bundle to Support Case (Priority: P1)

As an operator troubleshooting a Linux system, I want to securely connect Jira and attach a generated diagnostic bundle to a chosen support issue so I can engage Red Hat Support without manual file transfer steps.

**Why this priority**: This is the core business outcome; without end-to-end attachment to a Jira issue, the feature does not provide support engagement value.

**Independent Test**: Can be fully tested by completing PAT intake, creating/verifying a connection, selecting Linux, generating and fetching a bundle, and attaching it to a valid issue key in one session.

**Acceptance Scenarios**:

1. **Given** a user has a valid Jira PAT and target issue key, **When** they complete the workflow for Linux, **Then** the diagnostic artifact is attached to the specified issue and the user receives a clear success confirmation.
2. **Given** a user has already established a valid connection, **When** they provide issue key and run the workflow again, **Then** a new artifact is attached without requiring PAT re-entry in that flow.

---

### User Story 2 - Protect Credential Boundaries (Priority: P1)

As a security-conscious operator, I want PAT handling to stay inside secure credential intake boundaries so credentials are never exposed in tool calls, prompts, or logs.

**Why this priority**: Credential protection is mandatory for safe adoption and compliance expectations for support workflows.

**Independent Test**: Can be tested by executing both successful and failed runs, then reviewing tool arguments/results and user-visible logs to confirm only opaque connection identifiers are used beyond credential intake.

**Acceptance Scenarios**:

1. **Given** a user enters a PAT, **When** the workflow begins tool orchestration, **Then** only an opaque `connection_id` is used in downstream calls and outputs.
2. **Given** a workflow failure at any step, **When** error details are shown, **Then** PAT values are never displayed or persisted in user-facing content.

---

### User Story 3 - Use in UI and Non-UI Hosts (Priority: P2)

As an operator using different host experiences, I want the same support workflow to be available with an app UI where supported and equivalent text fallback guidance where UI rendering is unavailable.

**Why this priority**: Preserving host compatibility prevents regressions and ensures the feature can be used in all supported interaction environments.

**Independent Test**: Can be tested by running the workflow in a UI-capable host and in a non-UI host, verifying both paths complete with equivalent outcomes and instructions.

**Acceptance Scenarios**:

1. **Given** a UI-capable host, **When** the user opens Engage Red Hat Support, **Then** the dedicated app experience drives the full Linux support flow.
2. **Given** a non-UI host, **When** the user invokes the same feature, **Then** text fallback guidance provides the same sequence and required inputs to complete support engagement.

---

### Edge Cases

- User submits an invalid or expired PAT during connection setup.
- `connection_id` is missing, expired, revoked, or does not match the intended Jira account.
- Issue key format is valid but the issue does not exist or is inaccessible to the connection.
- Sosreport generation succeeds but artifact fetch fails due to temporary local file access limitations.
- Artifact upload fails because of attachment size limits or temporary Jira-side errors.
- User attempts to select a non-Linux product; flow must block and guide them back to Linux-only scope.
- User retries after partial completion; system must avoid credential re-exposure and clearly indicate which step needs rerun.
- Non-UI fallback message is available but host cannot render action controls; instructions must remain actionable via text-only interaction.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The feature MUST provide an "Engage Red Hat Support" capability accessible through both `skill://engage-red-hat-support/SKILL.md` and `ui://engage-red-hat-support/app.html`.
- **FR-002**: The workflow MUST support Linux as the only product option and MUST prevent completion with any other product selection.
- **FR-003**: Before any diagnostic generation or Jira attachment step, the workflow MUST require Jira PAT intake through a secure credential handling boundary that returns or verifies an opaque `connection_id`.
- **FR-004**: The end-to-end flow MUST execute in this order for successful runs: generate diagnostic bundle, fetch diagnostic artifact, then attach artifact to Jira issue using issue key plus `connection_id`.
- **FR-005**: PAT values MUST NOT appear in tool call arguments, tool call results, prompts, transcripts, logs, or user-facing status messages after intake is submitted.
- **FR-006**: All downstream orchestration steps after PAT intake MUST use only `connection_id` as the authentication reference.
- **FR-007**: The feature MUST preserve existing behavior of current tools and resources, including unchanged behavior outside this specific workflow.
- **FR-008**: The feature MUST provide text fallback behavior for hosts that cannot render the UI while preserving equivalent workflow intent, required inputs, and completion criteria.
- **FR-009**: The feature MUST require an issue key before artifact attachment and MUST return actionable validation feedback when the issue key is missing, malformed, or inaccessible.
- **FR-010**: The workflow MUST present step-level progress and final outcomes (success/failure) in user-understandable language without exposing secrets.
- **FR-011**: On any step failure, the feature MUST stop unsafe continuation, preserve secret boundaries, and provide clear retry guidance indicating the failed step.
- **FR-012**: The feature MUST allow reuse of a previously verified `connection_id` for subsequent runs without requiring PAT re-entry during the same engagement context unless the connection is invalid.

### Key Entities *(include if feature involves data)*

- **Support Engagement Session**: A user-initiated workflow instance for Linux support that tracks selected product, issue key, connection status, step progression, and final outcome.
- **Jira Connection Reference**: An opaque `connection_id` representing a validated Jira credential relationship, usable for downstream actions without exposing PAT.
- **Support Issue Target**: The user-specified Jira issue key and its validation state used as the destination for artifact attachment.
- **Diagnostic Artifact Reference**: Metadata describing the generated and fetched sosreport artifact (identity, availability state, and handoff readiness for attachment).
- **Workflow Step Result**: A normalized status record for each step (pending, running, succeeded, failed) with a safe, non-secret explanation.

### Assumptions & Dependencies

- The user has permission to create attachments on the target Jira issue.
- Existing sosreport generation and fetch capabilities remain available and operational.
- Existing Jira attachment capability accepts issue key plus opaque connection reference.
- Hosts without UI support can still deliver textual guidance and accept required inputs.
- Security and audit controls require that credential material stays inside secure intake boundaries.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: At least 95% of valid Linux support runs complete end-to-end (generate, fetch, attach) without manual intervention beyond required user inputs.
- **SC-002**: 100% of sampled workflow transcripts, prompts, and tool exchange records show no PAT exposure outside credential intake handling.
- **SC-003**: At least 90% of users complete the primary workflow in 8 minutes or less from opening the feature to attachment confirmation.
- **SC-004**: At least 95% of failed runs present a step-specific, user-actionable retry message that enables successful retry on the next attempt.
- **SC-005**: In acceptance testing, both UI and non-UI host paths achieve equivalent completion outcomes for the same valid inputs.
