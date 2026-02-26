# Feature Specification: Backend Human-Consent Gate for Diagnostics

**Feature Branch**: `011-consent-gate-sosreport`  
**Created**: 2026-02-26  
**Status**: Draft  
**Input**: User description: "Add a backend-enforced human-consent gate for diagnostic collection in Engage Red Hat Support so generate_sosreport can never run unless the user explicitly clicks the Step 2 Generate button in the UI. Implement Option 1 + Option 5 with one-time consent token and policy middleware for sensitive tools."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Explicit Human Consent Before Diagnostics (Priority: P1)

As a support user in Engage Red Hat Support, I can only generate diagnostics after I explicitly perform the Step 2 Generate action and provide fresh consent evidence, so diagnostics cannot run automatically or implicitly.

**Why this priority**: This is the core security and trust requirement. Without it, the feature fails its primary purpose.

**Independent Test**: Can be fully tested by attempting `generate_sosreport` without consent evidence, with invalid evidence, and with valid evidence produced immediately after explicit Step 2 action.

**Acceptance Scenarios**:

1. **Given** a user has not completed Step 2 consent action, **When** the user invokes `generate_sosreport`, **Then** the request is denied and no diagnostics process starts.
2. **Given** a user explicitly performs Step 2 and receives valid consent evidence, **When** the user invokes `generate_sosreport` once with that evidence, **Then** diagnostics run successfully.
3. **Given** a user uses consent evidence once successfully, **When** the same evidence is replayed, **Then** the request is denied and no diagnostics process starts.

---

### User Story 2 - Consistent Policy Enforcement on Sensitive Tools (Priority: P2)

As a product owner, I need a centralized policy mechanism for sensitive tool execution so access control is enforced consistently and safely when consent is missing, invalid, expired, or replayed.

**Why this priority**: Centralized enforcement prevents one-off bypasses and reduces policy drift as sensitive workflows evolve.

**Independent Test**: Can be tested by injecting each invalid consent condition (missing, malformed, expired, replayed, wrong scope, wrong user/session binding) and verifying deterministic denial behavior.

**Acceptance Scenarios**:

1. **Given** a sensitive tool invocation has missing or invalid consent evidence, **When** policy validation runs, **Then** the tool is blocked with actionable guidance and no sensitive action executes.
2. **Given** consent evidence is valid for another user/session or another scope, **When** `generate_sosreport` is invoked, **Then** the request is denied and no diagnostics process starts.

---

### User Story 3 - Compatible UI and Non-UI Paths (Priority: P3)

As a user operating in UI and non-UI host contexts, I need the same consent protection while preserving current entrypoints and fallback behavior so existing workflows remain usable.

**Why this priority**: Compatibility prevents operational disruption while introducing stronger safeguards.

**Independent Test**: Can be tested by validating existing UI entrypoint and non-UI text fallback flow, including explicit endpoint-based consent acquisition for non-UI users.

**Acceptance Scenarios**:

1. **Given** a UI host launches `ui://engage-red-hat-support/app.html`, **When** the user clicks Step 2 Generate and then runs `generate_sosreport`, **Then** the workflow succeeds without requiring renamed tools or entrypoint changes.
2. **Given** a non-UI host, **When** a user explicitly obtains consent evidence through documented endpoint flow and invokes `generate_sosreport`, **Then** diagnostics run successfully once and all fallback text behavior remains intact.

---

### Edge Cases

- Consent evidence expires between issuance and tool invocation.
- Consent evidence is syntactically valid but has wrong scope, wrong step, or wrong user/session binding.
- Two concurrent invocations attempt to consume the same one-time consent evidence.
- Consent evidence is presented to a tool other than `generate_sosreport`.
- Clients that do not yet send the consent parameter attempt to call `generate_sosreport`.
- Unrelated tools/resources are invoked during or after consent-related failures.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST require explicit human consent evidence before any `generate_sosreport` execution begins.
- **FR-002**: System MUST provide a secure backend endpoint that issues one-time, short-lived, server-minted consent evidence only after explicit user Step 2 action.
- **FR-003**: Issued consent evidence MUST be unforgeable and include user/session binding, scope limited to `generate_sosreport`, workflow step value `2`, expiry, and a unique identifier to support one-time use.
- **FR-004**: System MUST reject consent evidence if it is missing, invalid, expired, already used, not bound to the requesting user/session, or scoped for anything other than `generate_sosreport`.
- **FR-005**: On first successful `generate_sosreport` authorization, system MUST mark that consent evidence as consumed so replay attempts fail.
- **FR-006**: System MUST enforce sensitive-tool policy checks centrally so `generate_sosreport` cannot bypass consent validation through alternate execution paths.
- **FR-007**: When consent validation fails, system MUST return safe, actionable denial text and MUST NOT collect diagnostics.
- **FR-008**: Existing PAT security boundary MUST remain unchanged by this feature.
- **FR-009**: Existing MCP tool names MUST remain stable; schema changes are allowed only where strictly required to enforce consent (including adding consent evidence input to `generate_sosreport`).
- **FR-010**: System MUST preserve compatibility of `ui://engage-red-hat-support/app.html` and existing text fallback behavior for non-UI hosts.
- **FR-011**: System MUST support a documented explicit consent acquisition flow for non-UI users that enables one-time authorized `generate_sosreport` execution.
- **FR-012**: System MUST preserve behavior of unrelated tools and resources.
- **FR-013**: System MUST provide updated skill guidance, workflow contracts/spec documentation, and operator documentation describing consent gating behavior and usage.
- **FR-014**: System MUST include contract, integration, and regression tests covering denial without valid consent, user/session binding, scope/step validation, expiration, one-time use, replay failure, successful explicit UI Step 2 path, and non-regression for unrelated tool/resource surfaces.

### Key Entities *(include if feature involves data)*

- **Consent Evidence**: A server-issued authorization artifact proving explicit human Step 2 approval; contains user/session binding, scope, step, expiry, unique identifier, and consumption state.
- **Consent Issuance Request**: A request context that captures explicit human action intent and identifies the requester/session for consent evidence issuance.
- **Sensitive Tool Policy Decision**: A centralized allow/deny result for sensitive tool invocation based on consent validation outcomes and policy rules.
- **Consent Consumption Record**: A durable or reliably queryable record that marks whether a specific consent evidence identifier has been used.

### Assumptions

- Existing identity/session context is already available to bind consent evidence to the correct user/session.
- Denial responses can safely instruct users to complete explicit Step 2 action (UI) or explicit endpoint flow (non-UI) without exposing sensitive internals.
- Short-lived consent duration is configured to minimize abuse window while remaining practical for normal user completion of the generate action.
- This feature introduces no new diagnostics data classes; it only governs authorization to start existing diagnostics collection behavior.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of attempted `generate_sosreport` invocations without valid consent evidence are denied before diagnostics start.
- **SC-002**: 100% of replay attempts using previously consumed consent evidence are denied.
- **SC-003**: At least 95% of users who explicitly complete Step 2 in UI can successfully complete a single authorized diagnostics generation on first attempt.
- **SC-004**: 100% of non-UI users who follow documented explicit consent endpoint flow can complete one authorized diagnostics generation.
- **SC-005**: 0 regressions are introduced in behavior of unrelated tools/resources as verified by regression suite outcomes for this release.
