# Feature Specification: Jira Attachment via User PAT

**Feature Branch**: `004-jira-attachment-pat`  
**Created**: 2026-02-12  
**Status**: Draft  
**Input**: User description: "Jira attachment capability using end-user PAT with MCP Apps-safe secret boundaries."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Connect Jira Securely (Priority: P1)

As an end user, I can connect my Jira account by providing a Jira base URL and my personal access token (PAT), so I can authorize attachment actions without exposing credentials in model-visible channels.

**Why this priority**: Without a secure connection flow, no Jira attachment workflow can happen, and the primary security risk (credential leakage) remains unaddressed.

**Independent Test**: Can be fully tested by connecting with valid credentials, checking connected status, and confirming all user-facing and tool-visible channels contain only opaque references and never secret values.

**Acceptance Scenarios**:

1. **Given** I am not connected to Jira, **When** I submit a valid Jira base URL and PAT, **Then** the system stores credentials in a backend-only secret boundary, returns a non-secret connection reference, and shows status as connected.
2. **Given** I previously connected to Jira, **When** I request connection status, **Then** I can view connected/disconnected state and non-sensitive metadata without seeing secret values.
3. **Given** I am connected to Jira, **When** the credential lifetime expires, **Then** the connection status changes to expired and protected Jira operations are blocked until reconnect.

---

### User Story 2 - Attach Local Artifact to Jira Issue (Priority: P2)

As a connected user, I can choose a local artifact (including retrieved sosreport artifacts) and attach it to a private Jira issue, so incident evidence can be shared in the issue workflow.

**Why this priority**: This is the main business outcome, but depends on secure connection being available.

**Independent Test**: Can be fully tested by selecting an existing local artifact and a valid issue key, then confirming the attachment appears in the target issue and operation records contain no secrets.

**Acceptance Scenarios**:

1. **Given** I have an active Jira connection and a readable local artifact, **When** I submit an attach request for a valid issue, **Then** the file is uploaded to that issue and I receive a success result with attachment metadata.
2. **Given** I have an active Jira connection, **When** I request existing attachments for an issue, **Then** I receive the issue attachment list with non-sensitive metadata.
3. **Given** I attempt to attach a file to an issue I cannot access, **When** the request is processed, **Then** the operation fails with a clear permission error and no secret details are exposed.

---

### User Story 3 - Revoke Jira Access (Priority: P3)

As an end user, I can disconnect/revoke my Jira connection at any time, so I can immediately end credential use.

**Why this priority**: Explicit revocation is a required security control and limits exposure if credentials are no longer trusted.

**Independent Test**: Can be fully tested by connecting, revoking, and then verifying all Jira operations requiring credentials fail until reconnect.

**Acceptance Scenarios**:

1. **Given** I have an active Jira connection, **When** I disconnect/revoke, **Then** stored credentials are invalidated for future use and status becomes disconnected.
2. **Given** I disconnected or my credential expired, **When** I try to list or attach issue files, **Then** the system denies the action and prompts me to reconnect.

---

### Edge Cases

- User enters an invalid Jira base URL format.
- User enters a PAT that is invalid, revoked, or lacks required issue/attachment permissions.
- Jira host is unreachable, times out, or returns temporary service errors.
- Target issue key does not exist or is not visible to the user.
- Selected artifact path no longer exists, is unreadable, or points outside allowed local boundaries.
- Selected artifact is empty or exceeds Jira attachment size limits.
- Duplicate filename already exists on the target issue.
- User has multiple active sessions and revokes connection in one session while another session attempts attachment.
- Credential lifetime expires during a long-running attachment request.
- Cross-user reference misuse attempt (user provides another user's connection reference).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow a user to create a Jira connection using Jira base URL plus PAT and return only an opaque connection reference for subsequent operations.
- **FR-002**: System MUST keep PAT values within backend-only secret boundaries and MUST NOT expose secrets in MCP tool arguments, MCP tool results, prompts, transcripts, or logs.
- **FR-003**: System MUST encrypt stored Jira credentials at rest and restrict credential access to the owning user context.
- **FR-004**: System MUST provide connection status checks that report only non-sensitive state (for example connected, disconnected, expired, last verification time).
- **FR-005**: System MUST allow a connected user to list attachments for a specified Jira issue they can access.
- **FR-006**: System MUST allow a connected user to attach a selected local artifact to a specified Jira issue they can access.
- **FR-007**: System MUST enforce per-user isolation so one user cannot use, read, or act through another user's Jira connection reference.
- **FR-008**: System MUST provide explicit disconnect/revoke action that invalidates future credential use immediately.
- **FR-009**: System MUST enforce bounded credential lifetime and require re-connection after expiration before protected Jira operations are allowed.
- **FR-010**: System MUST return clear, non-sensitive error outcomes for invalid credentials, permission denial, missing issue, missing artifact, network failures, expired connection, and revoked connection.
- **FR-011**: System MUST reject any request that includes direct secret material in model-visible interfaces and instruct users to use the secure connection flow instead.
- **FR-012**: System MUST maintain auditable security event records for connect, verify, list, attach, expiration, and revoke outcomes without storing secret values.

### Key Entities *(include if feature involves data)*

- **Jira Connection**: A user-scoped authorization record containing Jira base URL, opaque connection ID, status, bounded lifetime, and revocation/expiration state.
- **Secret Credential**: The PAT material bound to a Jira Connection, managed only in backend secret storage with encryption at rest and never returned to model-visible channels.
- **Artifact Reference**: A user-selected local file reference used for attachment actions, including ownership context, file metadata, and validation status.
- **Jira Issue Attachment**: Metadata describing files attached to an issue (issue identifier, attachment identifier, filename, size, uploader, timestamps).
- **Security Event**: Non-secret audit record of sensitive operations and outcomes (connect, verify, list, attach, revoke, expiration, authorization failures).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of sampled user-visible responses, MCP tool payloads, and operation logs for this feature contain no PAT values or other secret material.
- **SC-002**: At least 95% of valid connection attempts complete with a connected status in under 30 seconds.
- **SC-003**: At least 95% of valid attachment operations complete successfully and make the artifact visible on the target issue in under 2 minutes.
- **SC-004**: 100% of revoke actions prevent any new credential-backed Jira operation within 5 seconds of completion.
- **SC-005**: 100% of cross-user connection-reference access attempts are denied.
- **SC-006**: At least 90% of representative error scenarios (invalid PAT, missing issue, permission denied, expired/revoked connection, missing artifact) return user-actionable, non-sensitive messages on first attempt.

## Assumptions

- PAT authorization is provided by the end user and grants sufficient Jira permissions for viewing issue attachments and uploading attachments where required.
- Attachment actions are performed only for artifacts available on the local host under approved user access boundaries.
- This feature targets per-user isolation only; tenant-wide policy orchestration and provider-agnostic secret frameworks remain out of scope.
