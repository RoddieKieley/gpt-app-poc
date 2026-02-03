# Feature Specification: ChatGPT Apps Technical Readiness

**Feature Branch**: `003-chatgpt-app-technical-readiness`  
**Created**: 2026-02-03  
**Status**: Draft  
**Input**: User description: "Focus this increment only on the technical updates required so the project is functionally complete and correct per ChatGPT Apps marketplace requirements, deferring submission planning."

## Clarifications

### Session 2026-02-03

- Q: What production domain should be used for technical metadata? → A: `https://gptapppoc.kieley.io`
- Q: Should OAuth be included in this increment? → A: No, keep the app no-auth for this increment.
- Q: Which domains should `openai/widgetCSP` allow for this app? → A: Only the app domain (`https://gptapppoc.kieley.io`).
- Q: Where should the privacy policy be hosted? → A: On the app domain (target `https://gptapppoc.kieley.io/privacy`).
- Q: What support contact should the app expose? → A: Support page on the app domain (target `https://gptapppoc.kieley.io/support`).
- Q: Should the widget be allowed to call tools directly (component-initiated tool access)? → A: Yes, allow widget-initiated calls.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Marketplace-compliant MCP metadata (Priority: P1)

As a maintainer, I want the MCP server and UI resources to carry the required
metadata (CSP, widgetDomain, tool annotations) so the app is technically
correct for ChatGPT Apps marketplace requirements.

**Compliance note**: The changes in this increment must remain MCP Apps
specification compliant (ui:// resources, JSON-RPC UI bridge, no host-specific
runtime APIs).

**Why this priority**: Correct metadata is required for the app to function
properly in ChatGPT Apps environments.

**Independent Test**: Connect the published MCP server in ChatGPT Developer Mode
and confirm the tool listing, UI rendering, and metadata validations pass without
errors.

**Acceptance Scenarios**:

1. **Given** the MCP server is reachable at `https://gptapppoc.kieley.io/mcp`,
   **When** ChatGPT fetches the tool list, **Then** each tool includes correct
   annotations and a valid UI template reference.
2. **Given** the UI template is registered, **When** ChatGPT renders the widget,
   **Then** the resource provides a valid `openai/widgetDomain` and
   `openai/widgetCSP` allowing required domains only.

---

### User Story 2 - Technical policy artifacts (Priority: P2)

As a maintainer, I want required technical policy artifacts (privacy policy and
support contact) defined so the app is compliant even before submission.

**Why this priority**: These artifacts are required for compliance and are
commonly missing from technical integrations.

**Independent Test**: Verify the privacy policy URL and support contact are
documented and accessible from the app metadata.

**Acceptance Scenarios**:

1. **Given** the documented policy artifacts, **When** they are reviewed,
   **Then** the privacy policy URL and support contact are available and accurate.

---

### User Story 3 - Validate technical readiness (Priority: P3)

As a maintainer, I want a readiness checklist and tests to confirm the app meets
the technical requirements before submission planning begins.

**Why this priority**: Prevents technical regressions and future review gaps.

**Independent Test**: Run automated smoke tests plus the technical checklist
and confirm all items pass.

**Acceptance Scenarios**:

1. **Given** the automated checks, **When** the tests run, **Then** they confirm
   tool metadata and UI resource availability.
2. **Given** the manual checklist, **When** each item is verified, **Then** the
   app is technically ready for marketplace submission.

---

### Edge Cases

- What happens if the UI resource loads without `openai/widgetCSP` metadata?
- What happens if `openai/widgetDomain` is missing or not unique per app?
- How do we detect incorrect tool annotations (e.g., missing `readOnlyHint`)?
- What happens if the privacy policy URL is missing or unreachable?

## Requirements *(mandatory)*

### Current State & Gaps

- `server.ts` registers the `hello-world` tool and UI resource but only sets
  `_meta: { ui: { resourceUri } }`; it does not include widget metadata such as
  `openai/widgetDomain` or `openai/widgetCSP`.
- The Express server enables CORS and JSON parsing only; it does not enforce or
  declare CSP requirements for the widget resource.
- No privacy policy or support contact is currently defined in repo metadata.
- No OAuth endpoints or security schemes exist, consistent with the no-auth
  scope for this increment.

### Functional Requirements

- **FR-001**: The MCP server MUST be publicly accessible over HTTPS at
  `https://gptapppoc.kieley.io/mcp` for marketplace-compatible operation.
- **FR-002**: The UI resource MUST include `openai/widgetDomain` set to
  `https://gptapppoc.kieley.io` (unique per app).
- **FR-003**: The UI resource MUST include `openai/widgetCSP` with explicit
  allowlists limited to `https://gptapppoc.kieley.io` (no external fetches).
- **FR-004**: The UI resource MUST be registered as `text/html+skybridge` and
  referenced by the tool metadata output template.
- **FR-005**: Each MCP tool MUST provide accurate, human-readable names and
  descriptions aligned with the actual behavior.
- **FR-006**: Tool annotations MUST be set correctly:
  - `readOnlyHint: true` for the current `hello-world` tool.
  - `openWorldHint` and `destructiveHint` set appropriately for any future
    write tools.
- **FR-007**: The app MUST remain no-auth for this increment (no OAuth metadata
  or protected-resource endpoints).
- **FR-008**: The app MUST expose a privacy policy URL at
  `https://gptapppoc.kieley.io/privacy` describing data categories, purposes,
  recipients, and user controls.
- **FR-009**: The app MUST include a support contact at
  `https://gptapppoc.kieley.io/support` for end users.
- **FR-010**: The app MUST avoid collecting restricted data or requesting raw
  location inputs; tool inputs must be minimal and task-scoped.
- **FR-011**: The app MUST avoid iframe usage unless explicitly required; if
  `frame_domains` is introduced, it MUST be justified and documented.
- **FR-012**: A technical readiness checklist MUST be provided covering
  metadata correctness, CSP allowlists, and UI rendering validation.
- **FR-013**: The `hello-world` tool MUST permit widget-initiated calls so the
  refresh button can trigger tool execution.

### Key Entities *(include if feature involves data)*

- **ComplianceMetadata**: Privacy policy URL and support contact used for
  marketplace compliance.
- **WidgetSecurityConfig**: `widgetDomain` and `widgetCSP` allowlists.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The MCP server passes existing smoke tests plus new metadata
  validations (tool annotations + UI resource accessibility).
- **SC-002**: The app can be added in ChatGPT Developer Mode using the production
  endpoint without CSP or widgetDomain errors.
- **SC-003**: The privacy policy URL and support contact are documented and
  reachable without submission planning steps.
