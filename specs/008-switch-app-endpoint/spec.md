# Feature Specification: Development Endpoint Switch

**Feature Branch**: `008-switch-app-endpoint`  
**Created**: 2026-02-18  
**Status**: Draft  
**Input**: User description: "Switch active app endpoint references from https://gptapppoc.kieley.io to https://leisured-carina-unpromotable.ngrok-free.dev for development. Update runtime code, tests, smoke tests, and top-level README docs only. Do not modify historical specs/** files."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Run against development endpoint (Priority: P1)

As a developer, I need local and shared development workflows to point at the active development endpoint so I can validate behavior against the current environment without manual URL overrides.

**Why this priority**: All development activity depends on the correct endpoint; if this is incorrect, local verification and integration testing are blocked.

**Independent Test**: Execute a standard runtime path and confirm requests target the new development endpoint and not the previous endpoint.

**Acceptance Scenarios**:

1. **Given** the application is started in development workflow mode, **When** it initiates outbound calls to the active app endpoint, **Then** it uses `https://leisured-carina-unpromotable.ngrok-free.dev`.
2. **Given** code paths that previously referenced `https://gptapppoc.kieley.io`, **When** a development execution path runs, **Then** no runtime requests are sent to the old endpoint.

---

### User Story 2 - Keep tests aligned with active endpoint (Priority: P2)

As a maintainer, I need automated tests and smoke checks to validate against the same endpoint used by development runtime paths so verification remains reliable and consistent.

**Why this priority**: Misaligned test configuration can create false positives or false failures and slows releases.

**Independent Test**: Run the test suites and smoke tests that reference the active endpoint and verify they target only the new endpoint.

**Acceptance Scenarios**:

1. **Given** automated tests and smoke checks are executed, **When** endpoint references are resolved, **Then** they resolve to `https://leisured-carina-unpromotable.ngrok-free.dev`.
2. **Given** validation artifacts from test and smoke execution, **When** endpoint usage is inspected, **Then** no direct references to `https://gptapppoc.kieley.io` remain in in-scope test paths.

---

### User Story 3 - Keep operator guidance accurate (Priority: P3)

As a team member onboarding or running manual checks, I need top-level documentation to reference the active development endpoint so setup and validation steps match current behavior.

**Why this priority**: Accurate documentation reduces setup errors and avoids troubleshooting caused by stale endpoint references.

**Independent Test**: Review top-level README instructions and confirm manual test steps reference the new endpoint.

**Acceptance Scenarios**:

1. **Given** a user follows top-level README guidance for development usage, **When** they copy endpoint-related values, **Then** they are directed to `https://leisured-carina-unpromotable.ngrok-free.dev`.

---

### Edge Cases

- What happens when endpoint values are constructed indirectly (for example through shared constants or composed strings) rather than hardcoded in one location?
- How does the system handle stale references in ignored files or historical artifacts outside approved scope, especially under `specs/**`?
- What happens if environment-specific overrides are provided at runtime and conflict with the default development endpoint?
- How are smoke checks interpreted if network access to the new endpoint is temporarily unavailable during validation?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST treat `https://leisured-carina-unpromotable.ngrok-free.dev` as the active development endpoint wherever in-scope runtime code resolves the default app endpoint.
- **FR-002**: The system MUST remove or replace in-scope direct references to `https://gptapppoc.kieley.io` in runtime code paths used for development.
- **FR-003**: Test definitions and fixtures within approved scope MUST reference the same active development endpoint used by runtime development behavior.
- **FR-004**: Smoke test assets within approved scope MUST target the active development endpoint and MUST no longer target the previous endpoint.
- **FR-005**: Top-level README documentation MUST reference the active development endpoint for development and validation guidance.
- **FR-006**: The change scope MUST be limited to runtime code, tests, smoke tests, and top-level README documentation.
- **FR-007**: Historical specification content under `specs/**` that predates this feature MUST remain unchanged.
- **FR-008**: Any non-UI or text fallback behavior that depends on endpoint references MUST continue to function after the endpoint switch.

### Key Entities *(include if feature involves data)*

- **Active Development Endpoint**: The canonical URL used by development workflows, tests, smoke checks, and top-level docs; currently `https://leisured-carina-unpromotable.ngrok-free.dev`.
- **Legacy Endpoint Reference**: Any direct reference to `https://gptapppoc.kieley.io` in in-scope files that must be replaced or removed.
- **In-Scope Artifact**: File categories explicitly allowed for modification in this feature (runtime code, tests, smoke tests, top-level README).
- **Out-of-Scope Historical Spec**: Existing content under `specs/**` from prior features that must not be edited by this change.

### Assumptions

- The new ngrok domain is the intended development endpoint for the current lifecycle and remains valid for the duration of this feature.
- Production endpoint handling is outside this feature unless it appears in in-scope artifacts as a development default reference.
- Validation can rely on static reference checks plus existing automated tests/smoke checks without requiring new test frameworks.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of endpoint references in in-scope runtime files use `https://leisured-carina-unpromotable.ngrok-free.dev` as the development default.
- **SC-002**: 100% of in-scope tests and smoke tests that reference the active endpoint pass while targeting the new development endpoint.
- **SC-003**: 0 in-scope references to `https://gptapppoc.kieley.io` remain after completion, excluding intentionally unchanged out-of-scope files.
- **SC-004**: A new contributor following only top-level README instructions can run development setup and endpoint-based checks without needing manual endpoint correction.
