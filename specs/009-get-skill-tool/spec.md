# Feature Specification: Get Skill Tool Fallback

**Feature Branch**: `009-get-skill-tool`  
**Created**: 2026-02-18  
**Status**: Draft  
**Input**: User description: "/speckit.specify Add a new read-only MCP tool named get_skill so ChatGPT hosts that cannot call resources/read can still load skill markdown by URI."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Retrieve Skill Markdown via Tool (Priority: P1)

As an operator using a host session where resource reads are unavailable, I can call `get_skill` with a skill URI and receive the skill markdown so I can continue the workflow without switching platforms.

**Why this priority**: This is the core value of the feature and directly addresses the current host compatibility gap.

**Independent Test**: Can be fully tested by calling `get_skill` with a valid skill URI and verifying the returned markdown matches the corresponding skill resource content.

**Acceptance Scenarios**:

1. **Given** a host session that can call tools but cannot read resources, **When** the operator calls `get_skill` with `skill://engage-red-hat-support/SKILL.md`, **Then** the response returns the full skill markdown in plain text form.
2. **Given** a host session that supports structured responses, **When** the operator calls `get_skill` with a valid skill URI, **Then** the response includes the URI, markdown mime type, and markdown text in structured content.

---

### User Story 2 - Fail Safely on Invalid Requests (Priority: P2)

As an operator, I receive clear remediation guidance when I request an unknown or malformed URI so I can correct the request quickly without exposing sensitive information.

**Why this priority**: Safe failure behavior preserves usability and trust while preventing accidental data leakage.

**Independent Test**: Can be fully tested by calling `get_skill` with missing, empty, malformed, and unknown URIs and verifying actionable error text is returned without secrets.

**Acceptance Scenarios**:

1. **Given** a call to `get_skill` with an empty or missing `uri`, **When** validation runs, **Then** the call fails with clear guidance to provide a non-empty `skill://...` URI.
2. **Given** a call to `get_skill` with an unregistered skill URI, **When** the request is processed, **Then** the call fails with a message indicating the URI is unsupported and how to discover supported skill URIs.

---

### User Story 3 - Preserve Existing MCP Surfaces (Priority: P3)

As a platform maintainer, I can add `get_skill` without changing existing tool and resource behavior so current Jira and sosreport integrations continue to work as-is.

**Why this priority**: Backward compatibility avoids regressions in existing operator flows.

**Independent Test**: Can be fully tested by comparing MCP tool/resource contracts and smoke checks before and after the change, with parity for existing behavior.

**Acceptance Scenarios**:

1. **Given** the updated MCP server, **When** `tools/list` is requested, **Then** all existing tools remain present and unchanged, and `get_skill` appears as an additional read-only tool.
2. **Given** existing Jira and sosreport operations, **When** operators execute current workflows, **Then** behavior and outputs remain unchanged from pre-feature behavior.

---

### Edge Cases

- `uri` includes leading/trailing whitespace and must be normalized before validation.
- `uri` has the `skill://` scheme but points to an unregistered path.
- The requested skill markdown exists but is temporarily unavailable; error response must remain actionable and non-secret.
- Large markdown responses must still return complete text without truncating critical instructions.
- Calls made from non-UI hosts must still receive a human-readable plain text response.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide a new MCP tool named `get_skill`.
- **FR-002**: `get_skill` MUST be read-only and side-effect free.
- **FR-003**: `get_skill` input MUST require a `uri` field and MUST reject missing or empty values.
- **FR-004**: `get_skill` MUST validate that `uri` uses the `skill://` scheme.
- **FR-005**: `get_skill` MUST only return markdown for registered skill URIs and MUST support `skill://engage-red-hat-support/SKILL.md` at minimum.
- **FR-006**: For valid requests, `get_skill` MUST return markdown content that is equivalent to the skill content returned by resource read for the same URI.
- **FR-007**: The response for valid requests MUST include a plain text fallback suitable for hosts that do not render structured payloads.
- **FR-008**: The response for valid requests SHOULD include structured content containing `uri`, `mimeType` set to `text/markdown`, and markdown text.
- **FR-009**: For invalid or unknown URIs, `get_skill` MUST fail safely with actionable remediation text.
- **FR-010**: Error and success responses MUST NOT include secrets, tokens, or credential-like values.
- **FR-011**: Existing `resources/read` behavior MUST remain unchanged.
- **FR-012**: Existing `list_skills` behavior and canonical skill URI text MUST remain unchanged.
- **FR-013**: Existing Jira and sosreport tool/resource surfaces MUST remain unchanged.
- **FR-014**: The MCP tool listing MUST expose `get_skill` with read-only metadata.
- **FR-015**: Regression and contract coverage MUST verify tool listing, valid-call parity with skill resources, invalid-call failure behavior, and preservation of existing tool/resource surfaces.

### Key Entities *(include if feature involves data)*

- **Skill URI Request**: A request payload containing the target skill URI; key attributes are `uri` and validation status.
- **Skill Document**: A registered markdown artifact addressable by canonical skill URI; key attributes are `uri`, `mimeType`, and markdown body.
- **Get Skill Response**: A read-only result containing fallback text and optional structured fields; key attributes are status, human-readable message, and optional structured markdown payload.

### Assumptions

- The existing skill registration source of truth remains authoritative for determining which skill URIs are valid.
- At least one canonical skill URI is currently available: `skill://engage-red-hat-support/SKILL.md`.
- Hosts may differ in rendering capabilities, so both plain text fallback and structured fields are needed for broad compatibility.
- Existing tool and resource contracts are baseline behavior and must remain stable unless explicitly expanded by this feature.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In validation runs, 100% of valid `get_skill` requests for registered skill URIs return non-empty markdown content.
- **SC-002**: In validation runs, 100% of invalid or unknown URI requests are rejected with actionable remediation text.
- **SC-003**: In regression checks, existing Jira and sosreport tool/resource contract behavior shows 0 unintended changes.
- **SC-004**: In smoke checks, tool listing consistently exposes `get_skill` as read-only and successful `get_skill` calls match skill resource content for the same URI.
- **SC-005**: In sampled success and error outputs, 0 secret or token-like values are present.
