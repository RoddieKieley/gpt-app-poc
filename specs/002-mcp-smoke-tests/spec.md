# Feature Specification: Automated MCP Smoke Tests

**Feature Branch**: `002-mcp-smoke-tests`  
**Created**: 2026-02-02  
**Status**: Draft  
**Input**: User description: "Automate MCP smoke tests by turning prior manual curl and MCP Inspector checks into an automated test command that runs after a successful build, starts the server process automatically, and targets built output."

## Clarifications

### Session 2026-02-02

- Q: Which tool expectations should the automated tests enforce? → A: Validate only the `hello-world` tool and its UI resource.
- Q: What should be the timeout for MCP initialization before the test fails? → A: 10 seconds.
- Q: Which fixed port should the test runner use? → A: 3000.
- Q: What should the test runner capture for failure diagnostics? → A: Capture stdout and stderr from the server process.
- Q: Should UI resource validation require a headless browser, or just validate the resource is retrievable? → A: Headless automation is not required.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Run automated MCP checks after build (Priority: P1)

As a developer, I want a single automated test command that starts the MCP server
and validates core MCP behaviors against built output, so I can verify the build
works without manual curl or Inspector steps.

**Why this priority**: This replaces the current manual validation and is the
minimum viable automated coverage for MCP capabilities.

**Independent Test**: Run the test command after a successful build and confirm
it completes with a clear pass/fail result without manual interaction.

**Acceptance Scenarios**:

1. **Given** a successful build, **When** the automated test command runs,
   **Then** it starts the MCP server, completes MCP initialization, and reports
   a passing result when the server is healthy.
2. **Given** a successful build, **When** the MCP server fails to start,
   **Then** the test command fails with a clear error and a non-zero exit code.

---

### User Story 2 - Diagnose failing checks (Priority: P2)

As a developer, I want the automated tests to identify which MCP check failed,
so I can quickly fix the regression.

**Why this priority**: Clear feedback reduces debugging time and increases trust
in the automated checks.

**Independent Test**: Intentionally break one MCP capability and confirm the
output names the failed check.

**Acceptance Scenarios**:

1. **Given** the MCP server responds without the expected tool, **When** the
   tests run, **Then** the output explicitly reports the missing tool check and
   the command exits non-zero.

---

### Edge Cases

- What happens when the test runner cannot bind to the expected local port?
- How does the system handle a timeout during MCP initialization?
- What happens when the tool call succeeds but does not return a text fallback?
- How does the test behave if the UI resource reference is missing or invalid?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide a single automated command to run MCP smoke
  tests after a successful build.
- **FR-002**: The test runner MUST start the MCP server process automatically and
  stop it when tests complete.
- **FR-002a**: The test runner MUST start the server on port 3000.
- **FR-003**: The tests MUST exercise the built output rather than source code.
- **FR-004**: The tests MUST verify MCP initialization succeeds.
- **FR-004a**: MCP initialization MUST fail the test if it does not complete
  within 10 seconds.
- **FR-005**: The tests MUST verify `tools/list` includes the `hello-world` tool
  and do not require validation of any other tools.
- **FR-006**: The tests MUST call the `hello-world` tool and validate that a text
  fallback response is returned.
- **FR-007**: The tests MUST validate that the UI resource referenced by the
  `hello-world` tool is accessible and returns content without headless
  browser automation.
- **FR-008**: The tests MUST run using localhost only and require no external
  credentials or network access.
- **FR-009**: The test command MUST exit with a non-zero status on any failure.
- **FR-010**: The test output MUST clearly identify which check failed.
- **FR-011**: The test runner MUST capture and surface stdout and stderr from the
  server process when a test fails.

## Assumptions

- The current MCP surface includes the `hello-world` tool and its UI resource,
  consistent with the first specification.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The automated MCP test command completes in under 60 seconds on a
  typical developer machine.
- **SC-002**: When the MCP server is healthy, the test command exits with code 0
  and reports a passing status for each check.
- **SC-003**: When any MCP check fails, the test command exits non-zero and
  reports the failing check by name.
