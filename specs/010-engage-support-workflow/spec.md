# Feature Specification: Engage Support Workflow

**Feature Branch**: `010-engage-support-workflow`  
**Created**: 2026-02-26  
**Status**: Draft  
**Input**: User description: "Refactor Engage Red Hat Support from a monolithic `ui://engage-red-hat-support/app.html` into a 3-step conversational workflow using multiple UI resources/pages. Workflow must be: (1) select product (Linux only), (2) generate + fetch sos report, (3) connect Jira via PAT intake endpoint to get `connection_id`, verify issue access, and attach sos artifact to Jira. Keep existing MCP tool names/schemas unchanged. Keep PAT security boundary intact (PAT only at secure HTTP intake, never in MCP args/results/prompts/log-safe text). Preserve text fallback behavior for non-UI hosts. Keep `app.html` compatibility entry point while introducing step-specific resources. Include required updates for skill markdown, workflow contract/spec docs, and tests."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Select Supported Product (Priority: P1)

As a support engineer, I can start the workflow by selecting a supported product so I can proceed only when the case is in scope.

**Why this priority**: Product selection gates all downstream actions and prevents invalid workflows before any diagnostics or credential steps happen.

**Independent Test**: Start from the compatibility entry point and verify users can choose Linux, cannot choose unsupported products, and receive clear next-step guidance.

**Acceptance Scenarios**:

1. **Given** the user opens the support workflow in a UI-capable host, **When** they reach step 1, **Then** they are prompted to select a product and Linux is selectable.
2. **Given** the user attempts to continue without selecting Linux, **When** they submit step 1, **Then** the workflow blocks progression and shows an actionable reason.
3. **Given** the host cannot render UI resources, **When** the workflow starts, **Then** the user receives an equivalent text-based prompt and can complete the same decision.

---

### User Story 2 - Produce sos Artifact (Priority: P1)

As a support engineer, I can generate and retrieve an sos report for the selected Linux product so I can prepare diagnostic evidence before connecting issue tracking.

**Why this priority**: The sos artifact is required evidence for the final attachment step and is a core outcome of the support workflow.

**Independent Test**: With Linux already selected, run step 2 and verify sos generation begins, completion/failure is surfaced, and a retrievable artifact reference is produced.

**Acceptance Scenarios**:

1. **Given** Linux is selected, **When** the user starts step 2, **Then** the workflow begins sos generation and reports progress state updates.
2. **Given** sos generation completes, **When** the user requests the output, **Then** they can retrieve the generated artifact reference for later attachment.
3. **Given** sos generation fails or times out, **When** step 2 ends, **Then** the workflow shows failure context and next actions without exposing sensitive data.

---

### User Story 3 - Connect Jira and Attach Evidence (Priority: P1)

As a support engineer, I can securely connect Jira using a personal access token through the approved intake path, confirm issue access, and attach the sos artifact.

**Why this priority**: This delivers the end-to-end business value: diagnostic evidence is linked to a Jira issue while maintaining strict credential boundaries.

**Independent Test**: From a completed step 2 state, provide PAT through secure intake, validate connection creation, verify issue access, and confirm artifact attachment success/failure handling.

**Acceptance Scenarios**:

1. **Given** a generated sos artifact exists, **When** the user provides a PAT through the secure intake endpoint, **Then** the workflow receives a connection identifier and does not expose the PAT in visible workflow messages.
2. **Given** a connection identifier exists, **When** the user provides a Jira issue target, **Then** the workflow verifies access before attempting attachment.
3. **Given** issue access is verified, **When** the user confirms attachment, **Then** the sos artifact is attached and the workflow returns a completion result.
4. **Given** issue access is denied or attachment fails, **When** step 3 runs, **Then** the workflow returns a clear non-sensitive failure outcome and does not mark the workflow complete.

### Edge Cases

- User leaves and resumes between steps; workflow state must preserve completed steps and prevent skipping required prerequisites.
- User supplies expired or invalid PAT at intake; connection creation fails safely and user can retry without leaking credential content.
- Jira issue exists but user lacks permission; workflow must stop before attachment and present a permission-specific error.
- sos artifact is unavailable at attachment time (expired, deleted, or inaccessible); workflow must fail gracefully and guide regeneration.
- Host does not support UI resources; text fallback must preserve all three steps and equivalent validation.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The support workflow MUST be presented as three ordered steps: product selection, sos generation/retrieval, and Jira connection/access verification plus attachment.
- **FR-002**: The workflow MUST allow Linux as the only supported product for step 1 and MUST block progression for unsupported or missing selections.
- **FR-003**: The existing compatibility entry point at `ui://engage-red-hat-support/app.html` MUST continue to launch the workflow successfully.
- **FR-004**: The workflow MUST support additional step-specific UI resources while preserving the compatibility behavior of existing entry flows.
- **FR-005**: For hosts that cannot render UI resources, the workflow MUST provide a text fallback that preserves equivalent step order, validations, and outcomes.
- **FR-006**: Step 2 MUST allow users to initiate sos generation and retrieve a resulting artifact reference when generation succeeds.
- **FR-007**: Step 2 MUST report user-meaningful states for in-progress, success, and failure outcomes.
- **FR-008**: Step 3 MUST obtain Jira connectivity via the approved PAT intake endpoint and produce a connection identifier usable by subsequent workflow actions.
- **FR-009**: The PAT MUST only be handled within the secure intake boundary and MUST NOT appear in workflow arguments, workflow results, prompts, or log-safe text.
- **FR-010**: Before attachment, step 3 MUST verify the user has access to the target Jira issue and MUST stop if access cannot be verified.
- **FR-011**: After successful access verification, step 3 MUST attach the sos artifact to the selected Jira issue and return a completion result.
- **FR-012**: Existing MCP tool names and schemas used by current integrations MUST remain unchanged.
- **FR-013**: The feature deliverable MUST include updates to skill guidance, workflow contract/spec documentation, and automated tests covering both UI and non-UI fallback flows.

### Key Entities *(include if feature involves data)*

- **Workflow Session**: Tracks the user’s progress through the three required steps, including completion state and validation checkpoints.
- **Product Selection**: Captures the selected support product with an allowed value set that currently includes Linux only.
- **sos Artifact**: Represents generated diagnostic evidence and includes retrievable metadata needed for downstream attachment.
- **Jira Connection**: Represents the secure Jira linkage created from PAT intake, including a connection identifier and connection validity state.
- **Issue Access Check**: Represents the result of verifying permission to the target Jira issue before attachment can proceed.
- **Attachment Result**: Represents the final success or failure outcome when attempting to attach the sos artifact to Jira.

## Assumptions

- Existing users and roles for running the Engage Red Hat Support workflow remain unchanged.
- A valid Jira issue identifier is provided by the user during step 3 when prompted.
- Existing non-UI text interaction patterns are still supported by the host environment.
- Credential retention beyond immediate intake processing is governed by existing organizational policy and is unchanged by this feature.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: At least 95% of eligible users complete step 1 (Linux product selection) on their first attempt without assistance.
- **SC-002**: At least 90% of workflow runs that start step 2 either produce a retrievable sos artifact or return a clear actionable failure reason within 10 minutes.
- **SC-003**: At least 95% of successful PAT intake attempts produce a usable Jira connection identifier on the first submission.
- **SC-004**: At least 90% of runs with valid issue access successfully attach the sos artifact without manual intervention.
- **SC-005**: 100% of sampled workflow-visible outputs (arguments, results, prompts, and log-safe text) contain no PAT values.
