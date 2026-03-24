# Feature Specification: Jira Cloud Minimal-Auth Migration for Attachment Workflow

**Feature Branch**: `016-jira-cloud-auth`  
**Created**: 2026-03-24  
**Status**: Draft  
**Input**: User description: "Title: Jira Cloud minimal-auth migration for existing attachment workflow"

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.
  
  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - Restore Cloud connection and listing (Priority: P1)

As an operator configuring Jira integration, I can connect to Atlassian Cloud Jira and retrieve issue attachments using the current workflow so that existing automation remains usable after the self-hosted instance shutdown.

**Why this priority**: Connection and attachment listing are currently blocked in Cloud, preventing the baseline workflow from functioning.

**Independent Test**: Can be fully tested by creating a connection, checking status, and listing attachments for a known Cloud issue.

**Acceptance Scenarios**:

1. **Given** a valid Cloud Jira base URL, account email, and API token, **When** a user creates a Jira connection, **Then** the connection is accepted and can transition to a healthy status.
2. **Given** a healthy Cloud connection for an issue with existing attachments, **When** attachments are listed, **Then** attachment metadata is returned successfully without changing response shape.

---

### User Story 2 - Preserve attachment upload behavior (Priority: P2)

As an operator, I can attach a local artifact to a Cloud Jira issue through the same workflow so that downstream processes do not need to change.

**Why this priority**: Upload must remain functional to keep the full connect -> list -> attach workflow intact.

**Independent Test**: Can be tested by uploading a local artifact to a known issue and verifying the new attachment appears in a follow-up list.

**Acceptance Scenarios**:

1. **Given** a healthy Cloud connection and a valid local file, **When** the user attaches the file to the target issue, **Then** the attachment is created and discoverable through the existing list step.

---

### User Story 3 - Maintain auth boundary and backward compatibility (Priority: P3)

As a security-conscious maintainer, I can support Cloud-compatible credentials while preserving current bearer-based compatibility paths and secret-handling boundaries.

**Why this priority**: The migration must not introduce secret leakage or break existing environments that still rely on bearer authentication.

**Independent Test**: Can be tested by validating no secret values appear in tool-facing data and by confirming existing bearer-compatible behavior remains available where required.

**Acceptance Scenarios**:

1. **Given** the system receives authentication material at backend intake, **When** MCP/tools use the connection for list and attach actions, **Then** only an opaque `connection_id` is exposed outside backend boundaries.
2. **Given** environments still requiring bearer-compatible authentication, **When** those connections are used, **Then** existing bearer path behavior remains available without regression.

---

### Edge Cases

- Cloud base URL is provided with an incorrect format (for example missing Cloud host pattern) and the connection must fail with existing error semantics.
- Cloud credentials are invalid or revoked and connection verification reports failure without exposing credential content.
- A connection configured for bearer-compatible mode is used in environments where that mode remains valid and must continue to work.
- Attachment list or attach is requested with an unknown `connection_id` and error responses remain consistent with current behavior.
- Target issue exists but has no attachments yet; list returns an empty set in the same response shape.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST support Cloud-compatible Jira authentication using account email plus API token for the existing connection creation workflow.
- **FR-002**: System MUST preserve a bearer-compatible authentication path for environments where it is still needed.
- **FR-003**: System MUST keep the current workflow sequence unchanged: create connection, verify status, list issue attachments, attach local artifact.
- **FR-004**: System MUST keep endpoint behavior and response shapes stable for connection creation, status verification, attachment listing, and attachment upload operations.
- **FR-005**: System MUST keep the existing Jira interaction endpoints unless a change is strictly required to make Cloud compatibility work.
- **FR-006**: System MUST update only the minimum connection metadata needed to distinguish authentication mode and carry any Cloud-specific identifier data required for authentication.
- **FR-007**: System MUST enforce the existing security boundary where secrets are accepted only at backend intake and are never exposed through tool arguments, tool results, logs, or fallback text.
- **FR-008**: System MUST continue to allow MCP/tools and related workflows to operate only with an opaque `connection_id` and without direct credential access.
- **FR-009**: System MUST provide documentation updates that define Cloud base URL expectations and required Cloud credential inputs for connection setup.
- **FR-010**: System MUST include a manual verification checklist for the Cloud workflow covering connect, status verification, list, and attach steps.
- **FR-011**: System MUST include minimal test updates and targeted additional tests that validate Cloud auth support, backward compatibility behavior, and no-secret-exposure expectations.

### Key Entities

- **Jira Connection**: Represents an integration profile used by tools and workflows; includes base URL, authentication mode, and backend-managed secret material.
- **Connection Reference**: Opaque identifier used outside backend boundaries to perform operations without exposing credentials.
- **Issue Attachment**: Represents attachment metadata and content associated with a Jira issue and accessed through list and attach steps.
- **Authentication Context**: Represents the credential interpretation used by backend for a connection (Cloud-compatible credential pair or bearer-compatible credential).

### Assumptions & Dependencies

- Atlassian Cloud Jira is the active deployment target and self-hosted Jira is no longer available.
- A readable test issue with existing attachments remains available for verification (`APPENG-999999`).
- Existing consumers depend on current endpoint contracts and workflow ordering.
- Human operators can supply valid Cloud account email and API token during connection creation.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: For the Cloud target environment, 100% of manual validation runs can complete connect -> status verify -> list attachments -> attach artifact on `APPENG-999999` without changing the workflow sequence.
- **SC-002**: 100% of successful connection setup attempts with valid Cloud credentials produce a usable connection that can list attachments for a readable issue.
- **SC-003**: 0 known secret-exposure findings are observed in tool arguments, tool results, logs, and fallback text during validation.
- **SC-004**: Existing bearer-compatible regression tests pass with no behavior change in currently supported bearer scenarios.
- **SC-005**: Documentation consumers can complete Cloud connection setup on first attempt using only updated documentation in at least 90% of walkthroughs.
