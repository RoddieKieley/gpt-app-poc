# Feature Specification: Local Sosreport Generation and Fetch

**Feature Branch**: `006-sosreport-local-flow`  
**Created**: 2026-02-18  
**Status**: Draft  
**Input**: User description: "Port linux-mcp-server sosreport generation and fetch flow into gpt-app-poc as a local-first PoC feature."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Generate a Local Diagnostic Archive (Priority: P1)

As an operator using the MCP tools locally, I can request diagnostic archive generation with validated options and receive a reference I can use later to retrieve the archive.

**Why this priority**: Without generation, the feature delivers no diagnostic collection value and no downstream artifact workflow.

**Independent Test**: Can be fully tested by submitting valid and invalid generation requests and confirming that valid requests return structured report metadata plus a reusable fetch reference.

**Acceptance Scenarios**:

1. **Given** local prerequisites are configured and the request options are valid, **When** I run `generate_sosreport`, **Then** I receive metadata including archive details and a fetch reference for later retrieval.
2. **Given** a request with conflicting plugin options or invalid `log_size` format, **When** I run `generate_sosreport`, **Then** the request is rejected with an actionable validation error.
3. **Given** local privilege configuration does not allow non-interactive execution, **When** I run `generate_sosreport`, **Then** I receive an actionable error that explains the missing or misconfigured prerequisite.

---

### User Story 2 - Fetch a Generated Archive for Reuse (Priority: P2)

As an operator, I can fetch a previously generated archive by using the fetch reference so that I can pass a stable local artifact path to existing attachment workflows.

**Why this priority**: Retrieval is required to make generated output practically usable by other tools.

**Independent Test**: Can be fully tested by generating a report, fetching it via the returned reference, and verifying returned path, size, and checksum data.

**Acceptance Scenarios**:

1. **Given** a valid fetch reference from a prior generation, **When** I run `fetch_sosreport`, **Then** the system returns a copied local archive path, size in bytes, and SHA-256 checksum.
2. **Given** a fetch reference that is not absolute, is unsafe for local access, or does not match the expected naming pattern, **When** I run `fetch_sosreport`, **Then** the request is rejected with an actionable validation error.

---

### User Story 3 - Operate Within Phase 1 Boundaries (Priority: P3)

As a platform owner, I can rely on clear local-only constraints, documentation, and regression safety so the PoC can be adopted without disrupting existing Jira-related workflows.

**Why this priority**: Scope and compatibility controls prevent accidental expansion and reduce adoption risk.

**Independent Test**: Can be tested by verifying no host-based execution paths are exposed, existing Jira flows still function, and docs/tests describe local prerequisites and deferred remote scope.

**Acceptance Scenarios**:

1. **Given** the Phase 1 implementation is installed, **When** I inspect tool inputs and behavior, **Then** only local execution is supported and remote connection features are absent.
2. **Given** an existing Jira artifact attachment flow, **When** I pass the fetched archive path as artifact reference input, **Then** the flow continues to work without behavior regression.

---

### Edge Cases

- `generate_sosreport` output does not include an archive path; system uses fallback lookup for the most recent matching archive and returns an error if none is found.
- The sos command is unavailable locally; request fails fast before privileged execution.
- The privileged command would require interactive password entry; request fails with a clear remediation message.
- A fetch reference points to an existing file that no longer exists at fetch time; fetch fails with an actionable not-found message.
- A generated archive is readable but copy-to-temp fails (for example, permission or disk space); fetch reports a specific copy/storage error.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide two MCP tools named `generate_sosreport` and `fetch_sosreport`.
- **FR-002**: System MUST support local execution only for this phase and MUST NOT accept remote host targeting inputs.
- **FR-003**: `generate_sosreport` MUST validate option fields for `only_plugins`, `enable_plugins`, `disable_plugins`, `log_size`, and `redaction`.
- **FR-004**: `generate_sosreport` MUST validate plugin list formats and reject invalid plugin entries with actionable errors.
- **FR-005**: `generate_sosreport` MUST validate `log_size` format and reject invalid values before command execution.
- **FR-006**: `generate_sosreport` MUST reject requests that combine `only_plugins` with `enable_plugins` or `disable_plugins`.
- **FR-007**: `generate_sosreport` MUST verify local sos availability before attempting generation.
- **FR-008**: `generate_sosreport` MUST run generation through a non-interactive privileged path and MUST fail if interactive password entry would be required.
- **FR-009**: `generate_sosreport` MUST use deterministic temporary/output naming settings so archive discovery is predictable.
- **FR-010**: `generate_sosreport` MUST use a default generation timeout of 600,000 milliseconds.
- **FR-011**: `generate_sosreport` MUST derive the archive path from command output and use latest-matching fallback lookup when direct parsing is unavailable.
- **FR-012**: `generate_sosreport` MUST return structured metadata including archive details and a fetch reference.
- **FR-013**: `fetch_sosreport` MUST accept only a fetch reference produced by `generate_sosreport` output format.
- **FR-014**: `fetch_sosreport` MUST validate the fetch reference is an absolute local-safe path and matches expected sosreport archive naming.
- **FR-015**: `fetch_sosreport` MUST read archive bytes locally and write a copy into `/tmp` for simplified cleanup.
- **FR-016**: `fetch_sosreport` MUST return `archive_path`, `size_bytes`, and `sha256` for the copied archive.
- **FR-017**: Both tools MUST map failures into actionable error categories consistent with existing sosreport workflow behavior, while allowing simplified wording for this PoC.
- **FR-018**: Both tools MUST provide plain-text fallback messages in MCP responses.
- **FR-019**: Fetched `archive_path` output MUST remain usable by the existing Jira artifact attachment flow.
- **FR-020**: The feature MUST NOT introduce regressions to existing Jira tools or skill discovery behavior.
- **FR-021**: Documentation MUST describe local prerequisites, local-only scope, and deferred remote scope.
- **FR-022**: Automated tests MUST cover happy path behavior, validation logic, and key failure categories for both tools.

### Key Entities *(include if feature involves data)*

- **Sosreport Generation Request**: User-provided generation inputs, including plugin filters, log size, and redaction preference.
- **Generated Sosreport Metadata**: Generation result payload containing archive identity, archive location, status details, and fetch reference.
- **Fetch Reference**: Opaque reference value that identifies a specific locally generated archive eligible for retrieval.
- **Fetched Archive Result**: Retrieval result containing copied archive path, archive size, and checksum for downstream use.
- **Actionable Error Category**: Structured error classification paired with human-readable fallback text that guides remediation.

### Assumptions and Dependencies

- Local system prerequisites (sos package availability and configured non-interactive privilege rules) are prepared by the operator.
- Phase 1 scope is single-operator local usage on trusted machines.
- Deferred Phase 2 capabilities are explicitly out of scope for this feature: SSH execution support, connection lifecycle management, host trust and secret management, and multi-tenant hardening including rate limits.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: At least 95% of valid generation requests complete successfully within 10 minutes in a correctly prepared local environment.
- **SC-002**: 100% of requests with invalid option combinations or formats are rejected before any privileged generation attempt.
- **SC-003**: 100% of successful fetch operations return a local archive path, byte size, and checksum that are internally consistent with the copied file.
- **SC-004**: At least 95% of successful fetched archive paths are accepted by the existing Jira artifact attachment flow without additional manual path correction.
- **SC-005**: Documentation consumers can complete local prerequisite setup and run the end-to-end generate-then-fetch flow without unresolved setup questions in validation review.
