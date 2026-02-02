# Feature Specification: MCP Apps Hello World

**Feature Branch**: `001-mcp-apps-hello-world`  
**Created**: 2026-02-02  
**Status**: Draft  
**Input**: User description: "Create a first-iteration specification for a strict MCP Apps–compliant Hello World ChatGPT App, including a complete project structure, ui:// resource behavior, JSON-RPC UI bridge, and text fallback requirements."

## Clarifications

### Session 2026-02-02

- Q: Which MCP transport(s) must the Hello World server support in this increment? → A: HTTP (streamable) only

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Verify MCP Apps Hello World (Priority: P1)

A user launches the Hello World experience in an MCP Apps-capable host and sees a simple greeting plus a basic interactive action that confirms the app and host can communicate.

**Why this priority**: This validates end-to-end compatibility between the host, the MCP server, and the UI resource, which is the primary purpose of the first increment.

**Independent Test**: Can be fully tested by invoking the Hello World tool once and confirming the greeting and interactive UI action are visible and functional.

**Acceptance Scenarios**:

1. **Given** a host that supports MCP Apps UI resources, **When** the Hello World tool is called, **Then** the user sees a greeting and a simple interactive control in the rendered UI.
2. **Given** the Hello World UI is rendered, **When** the user activates the control, **Then** the UI shows an updated greeting that confirms a successful tool round-trip.

---

### User Story 2 - Text-Only Host Fallback (Priority: P2)

A user in a text-only or non-UI host receives a complete, readable response that proves the Hello World tool worked without needing any UI rendering.

**Why this priority**: Ensures graceful degradation and portability across MCP hosts, which is required by the project constitution.

**Independent Test**: Can be fully tested by invoking the Hello World tool in a text-only host and confirming the response provides sufficient confirmation without additional steps.

**Acceptance Scenarios**:

1. **Given** a host that does not render UI resources, **When** the Hello World tool is called, **Then** the user receives a complete text response that confirms success and explains that UI is optional.

---

### Edge Cases

- What happens when the host cannot render UI resources but still returns tool results?
- How does the system handle UI-initiated tool calls that fail or time out?
- What happens if the UI resource is unavailable when the tool returns a UI reference?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST expose a Hello World tool that returns a greeting when called.
- **FR-002**: The tool response MUST include a complete text fallback that is understandable without any UI rendering.
- **FR-003**: When the host supports MCP Apps UI resources, the tool response MUST include a UI resource that renders a greeting and a simple interactive control.
- **FR-004**: The UI MUST be able to trigger a tool call through the standard MCP Apps UI messaging bridge and show the updated greeting.
- **FR-005**: The system MUST remain host-agnostic and portable across MCP Apps-compatible clients without relying on host-specific behavior.
- **FR-006**: If the UI cannot render or an interaction fails, the system MUST provide a readable error or fallback message in text.
- **FR-007**: The delivery MUST include a complete, documented project skeleton covering server, UI, and build/run steps that enables a new contributor to run the Hello World experience without additional guidance.
- **FR-008**: The system MUST be reachable via an HTTP-based MCP transport for this increment.

## Assumptions & Dependencies

- The host supports MCP tool invocation, and UI rendering may or may not be available.
- No diagnostics collection, credentials, or external system access are required for this first increment.
- The delivered project skeleton includes all files needed to run the Hello World experience locally.
- This increment limits MCP transport support to HTTP.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In a UI-capable MCP Apps host, 95% of Hello World tool invocations render the greeting UI within 2 seconds.
- **SC-002**: In a text-only host, 100% of Hello World tool responses provide a complete, readable fallback without follow-up prompts.
- **SC-003**: At least 90% of first-time users can complete the Hello World verification flow (invoke tool and confirm updated greeting) on their first attempt.
- **SC-004**: A new contributor can follow the provided project skeleton instructions to run the Hello World experience within 15 minutes.
