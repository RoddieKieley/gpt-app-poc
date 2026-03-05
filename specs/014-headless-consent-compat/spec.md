# Feature Specification: Headless Consent Compatibility and Parsing Guarantees

**Feature Branch**: `014-headless-consent-compat`  
**Created**: 2026-03-05  
**Status**: Draft  
**Input**: User description: "We are following Speckit process order: specify -> plan -> tasks -> implement."

## Problem Statement

Headless and text-first workflows for invasive diagnostics need explicit, auditable user permission and reliable token extraction behavior. The current codebase already introduces explicit headless consent minting and fallback guidance, but this package must formalize those behaviors as product requirements and compatibility guarantees. The specification also needs to lock in that web/UI consent behavior remains unchanged while headless compatibility is expanded.

## Goals / Non-Goals

### Goals

- Formalize that headless/text clients must provide explicit approval before invasive sosreport generation can proceed.
- Formalize mint response parsing compatibility rules: prefer structured output, allow text fallback parsing when structured fields are unavailable.
- Define the required headless operation sequence and fail-closed behavior for invalid or missing consent states.
- Guarantee no behavioral regressions in existing UI/web consent flow.
- Document compatibility and security constraints in language aligned to the implemented behavior.

### Non-Goals

- Redesigning or replacing the existing web consent UX path.
- Introducing implicit or automatic consent minting.
- Allowing sosreport generation without explicit consent evidence.
- Changing product scope beyond current workflow boundaries.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Headless user provides explicit permission before diagnostics (Priority: P1)

As a headless/text workflow operator, I can only mint diagnostics consent after confirming explicit user approval, so invasive data collection never starts without a clear yes.

**Why this priority**: This is the core safety and compliance requirement for non-UI flows that cannot rely on a consent button.

**Independent Test**: Can be fully tested by invoking the headless sequence and verifying mint denial without explicit permission and success when explicit permission is provided.

**Acceptance Scenarios**:

1. **Given** a headless session has reached the diagnostics step, **When** consent mint is requested without explicit permission confirmation, **Then** mint is denied with next-step guidance to obtain user permission first.
2. **Given** a headless session has reached the diagnostics step and explicit user approval was obtained, **When** consent mint is requested with explicit permission confirmation, **Then** a consent token is minted for immediate diagnostics use.

---

### User Story 2 - Headless clients parse mint responses compatibly (Priority: P2)

As a headless client integrator, I can read consent token details from structured output first, and still complete the flow by parsing text fallback if structured fields are unavailable in my client.

**Why this priority**: Bridge/client compatibility depends on deterministic parsing behavior across different MCP host capabilities.

**Independent Test**: Can be tested by validating extraction from structured output and validating fallback extraction from text output for required mint fields.

**Acceptance Scenarios**:

1. **Given** mint returns structured fields, **When** the client reads the response, **Then** the client uses structured fields as the primary source of `consent_token`, `expires_at`, and `workflow_session_id`.
2. **Given** a client cannot access structured fields, **When** the client reads mint text output, **Then** it can parse fallback token details and continue the flow.

---

### User Story 3 - Existing web/UI consent flow remains stable (Priority: P3)

As a web UI user, I can continue the current consent-and-generate workflow with no behavior changes introduced by headless compatibility requirements.

**Why this priority**: Existing user experience and production behavior must remain stable while new headless guarantees are codified.

**Independent Test**: Can be tested by running existing web/UI consent and generation regression paths and confirming no additional steps or interface changes.

**Acceptance Scenarios**:

1. **Given** a standard web UI session, **When** the user follows the existing consent path, **Then** the web consent route and downstream generation behavior remain unchanged.
2. **Given** headless compatibility requirements are enforced, **When** web flow regression tests run, **Then** no web consent path regressions are introduced.

---

### Edge Cases

- Consent mint is requested before required workflow/product preconditions are completed.
- Consent mint request includes an invalid workflow session identifier.
- Diagnostics generation is requested with missing, malformed, expired, replayed, or mismatched consent.
- A client receives mint text output only and must parse fallback fields to proceed.
- A client attempts to reuse a token after one successful diagnostics generation attempt.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST require explicit headless permission confirmation before minting a consent token for invasive sosreport generation.
- **FR-002**: When explicit permission is not granted in headless/text flow, consent minting MUST fail closed and MUST return guidance to obtain explicit permission before retry.
- **FR-003**: The system MUST support this required headless sequence: start workflow, select supported product, mint consent, generate sosreport with consent, and fetch sosreport artifact.
- **FR-004**: The system MUST reject out-of-order or invalid sequence attempts in headless/text flow, including mint-before-prerequisite and generate-without-valid-consent paths.
- **FR-005**: Consent mint responses MUST provide `consent_token`, `expires_at`, and `workflow_session_id` as canonical fields for clients.
- **FR-006**: Client compatibility guidance MUST define parsing priority as structured response fields first, with text fallback parsing allowed when structured fields are unavailable.
- **FR-007**: The system MUST preserve existing web/UI consent workflow behavior and MUST NOT require additional web-user actions compared with current behavior.
- **FR-008**: Feature documentation and contracts for this package MUST be created as new versioned artifacts and MUST NOT modify historical spec packages.

### Security Constraints

- **SEC-001**: Consent for invasive diagnostics MUST remain explicit, user-initiated, and auditable across headless and web flows.
- **SEC-002**: Consent tokens MUST remain bound to user/session/scope/step context and MUST be enforced at diagnostics generation time.
- **SEC-003**: Consent tokens MUST remain short-lived and single-use.
- **SEC-004**: Invalid, expired, replayed, wrong-user, wrong-session, wrong-scope, and wrong-step consent usage MUST be denied.
- **SEC-005**: Error responses MUST provide actionable next-step guidance without exposing secrets or sensitive credentials.

### Compatibility Constraints

- **COMP-001**: Existing web consent route behavior and UI flow semantics MUST remain compatible and regression-free.
- **COMP-002**: Headless/text integrations MUST be able to complete consent mint and diagnostics generation using structured outputs where available.
- **COMP-003**: Headless/text integrations with limited response surfaces MUST be able to parse text fallback lines for required mint details.
- **COMP-004**: Tool and bridge descriptors MUST continue documenting permission flag expectations and structured-first parse behavior with text fallback support.

### Key Entities *(include if feature involves data)*

- **Consent Mint Request**: Explicit user-approved request to mint permission for invasive diagnostics; includes permission confirmation and optional workflow context.
- **Consent Mint Response**: Canonical response containing token details required to authorize diagnostics and support client parsing compatibility.
- **Consent Token**: Short-lived, single-use authorization artifact tied to user/session/scope/step constraints.
- **Workflow Session Context**: Correlation context used to enforce sequence correctness and optional session-aware validation.
- **Diagnostics Generation Request**: Request to generate sosreport that is authorized only by a valid consent token in the correct context.

## Acceptance Criteria

- **AC-001**: Headless mint attempts without explicit permission are denied with clear next-step guidance.
- **AC-002**: Headless mint attempts with explicit permission return required token detail fields.
- **AC-003**: Headless clients can complete the required sequence end-to-end when consent and sequence preconditions are satisfied.
- **AC-004**: Generate requests without valid consent are denied across missing, invalid, expired, replayed, and mismatch conditions.
- **AC-005**: Mint output parsing guidance supports structured-first extraction and text fallback parsing compatibility.
- **AC-006**: Existing web/UI consent path behavior is preserved with no regression in flow semantics.
- **AC-007**: This package is created under a new `014` spec directory without changing historical spec directories.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of headless consent mint attempts without explicit permission are denied in validation and integration tests.
- **SC-002**: 100% of covered headless happy-path runs complete consent-mint -> generate -> fetch sequence when explicit permission and valid context are provided.
- **SC-003**: 100% of covered invalid consent cases (missing, invalid, expired, replayed, wrong-user/session/scope/step) are blocked.
- **SC-004**: 100% of covered web consent regression tests continue passing without additional user steps.
- **SC-005**: 100% of bridge compatibility checks confirm structured-first parsing guidance and text fallback parsing availability.

## Assumptions

- Current code behavior enforcing explicit permission for headless consent minting is the baseline this specification formalizes.
- Existing web consent workflow is already in production and must remain behaviorally stable.
- Headless clients may vary in their ability to consume structured fields, so fallback parsing guidance remains necessary.
- Existing integration and regression test coverage is representative of current workflow behavior and compatibility guarantees.
