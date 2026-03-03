# Feature Specification: MCP Consent Mint Path for Text Clients

**Feature Branch**: `013-mcp-consent-mint-path`  
**Created**: 2026-03-03  
**Status**: Draft  
**Input**: User description: "Add a dedicated MCP consent-mint path for headless/text clients while preserving the existing web consent flow."

## Problem Statement

The current consent flow depends on a web UI action that mints a consent token before diagnostics generation begins. This works for web users but blocks headless and text-only MCP clients that cannot perform the UI click, preventing them from completing required support workflows. The feature must add an explicit non-web consent path without weakening the existing permission model.

## Goals / Non-Goals

### Goals

- Enable headless and text-only users to explicitly mint an Engage consent token through MCP tooling.
- Preserve the existing web consent flow and endpoint behavior without regressions.
- Keep consent enforcement strict: diagnostics generation remains blocked unless a valid consent token is provided.
- Support optional workflow session linkage for consent minting with strict validation when a session is provided.
- Introduce new versioned specification and contract artifacts rather than modifying existing versions.

### Non-Goals

- Replacing, deprecating, or changing the UI-triggered web consent flow.
- Automatically minting consent tokens during workflow start or product selection.
- Automatically generating sosreports after token minting.
- Expanding supported product values beyond the existing workflow behavior.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Headless user completes explicit consent flow (Priority: P1)

As a headless/text MCP user, I can explicitly mint a consent token after selecting product context so I can generate a sosreport without using web UI interactions.

**Why this priority**: This is the core business gap and is required for MCP-only clients to complete support workflows.

**Independent Test**: Can be fully tested by calling MCP tools in sequence (`start_engage_red_hat_support`, `select_engage_product`, `mint_engage_consent_token`, `generate_sosreport`, `fetch_sosreport`) and verifying a report is generated only when a valid token is supplied.

**Acceptance Scenarios**:

1. **Given** a headless user started Engage support and selected `linux`, **When** the user calls `mint_engage_consent_token` and then `generate_sosreport` with the returned token, **Then** sosreport generation succeeds and can be retrieved via `fetch_sosreport`.
2. **Given** a headless user started Engage support and selected `linux`, **When** the user attempts `generate_sosreport` without a valid consent token, **Then** the request is rejected with a consent-required failure.

---

### User Story 2 - Web user flow remains unchanged (Priority: P2)

As a web user, I can continue using the current consent button flow and endpoint without any behavior change.

**Why this priority**: Existing production behavior must remain stable while adding the new path.

**Independent Test**: Can be tested independently by invoking web consent via `POST /api/engage/consent-tokens` and confirming the UI sequence still mints consent and allows sosreport generation.

**Acceptance Scenarios**:

1. **Given** the existing web consent UX, **When** the user triggers consent in UI, **Then** `POST /api/engage/consent-tokens` continues to work as before and downstream generation behavior is unchanged.

---

### User Story 3 - Session-aware consent validation (Priority: P3)

As a support workflow user, I can optionally provide `workflow_session_id` while minting consent so consent can be explicitly tied to the intended session context.

**Why this priority**: Session binding improves correctness and enforces explicit user context, but the optional parameter makes this less critical than baseline headless support.

**Independent Test**: Can be tested by calling `mint_engage_consent_token` with and without `workflow_session_id`, confirming valid values succeed and invalid values are rejected.

**Acceptance Scenarios**:

1. **Given** a valid workflow session identifier, **When** `mint_engage_consent_token` is called with that identifier, **Then** the response includes `consent_token`, `expires_at`, and `workflow_session_id`.
2. **Given** an invalid workflow session identifier, **When** `mint_engage_consent_token` is called, **Then** the request fails validation and no token is minted.

---

### Edge Cases

- `mint_engage_consent_token` is called before product selection for `linux`.
- `generate_sosreport` is called with an expired token.
- `generate_sosreport` is called with a token minted for a different user/session/scope/step context.
- A token is reused after a successful `generate_sosreport` call.
- `workflow_session_id` is provided in mint/generate calls but does not match workflow context.

## User Stories

- Story A: Headless/text client user needs explicit consent minting via MCP to complete diagnostics generation.
- Story B: Web UI user must see no behavior change in existing consent and generation flows.
- Story C: Support operators need optional session binding with strict validation for compliance and traceability.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST continue supporting `POST /api/engage/consent-tokens` for the existing web consent flow without behavioral regression.
- **FR-002**: The system MUST expose a new MCP tool named `mint_engage_consent_token`.
- **FR-003**: `mint_engage_consent_token` MUST return `consent_token`, `expires_at`, and `workflow_session_id` in successful responses.
- **FR-004**: `mint_engage_consent_token` MUST accept an optional `workflow_session_id` input and MUST apply strict validation whenever that input is provided.
- **FR-005**: The system MUST keep `generate_sosreport` gated by a valid consent token and MUST reject requests that do not include a valid token.
- **FR-006**: The non-web text workflow MUST support this explicit sequence: `start_engage_red_hat_support` -> `select_engage_product(product=linux)` -> `mint_engage_consent_token(...)` -> `generate_sosreport(consent_token, workflow_session_id?)` -> `fetch_sosreport(fetch_reference)`.
- **FR-007**: The system MUST NOT automatically mint consent tokens at workflow start, product selection, or generation time.
- **FR-008**: The system MUST NOT automatically trigger sosreport generation after consent minting.
- **FR-009**: New specification and contract artifacts for this feature MUST be added as new versioned files and MUST NOT overwrite previous versions.

### Security Requirements

- **SR-001**: Consent tokens MUST remain bound to user identity, session context, scope, and workflow step.
- **SR-002**: Consent tokens MUST remain short-lived and single-use.
- **SR-003**: Consent token minting MUST require explicit user intent through an API or tool invocation, with no implicit minting behavior.
- **SR-004**: Consent verification at sosreport generation time MUST enforce binding constraints and reject mismatches.
- **SR-005**: Validation failures and denied generation attempts MUST return clear, non-sensitive error outcomes that do not leak secrets.

### Compatibility Constraints

- **CC-001**: Existing web clients relying on `POST /api/engage/consent-tokens` MUST continue functioning without interface changes.
- **CC-002**: Existing MCP tools (`start_engage_red_hat_support`, `select_engage_product`, `generate_sosreport`, `fetch_sosreport`) MUST preserve current request/response contracts except where explicitly versioned additions are introduced.
- **CC-003**: New contract/spec documents introduced for this feature MUST use new versioned filenames and coexist with older versions.

### Key Entities *(include if feature involves data)*

- **Consent Token**: A short-lived, single-use permission artifact authorizing sosreport generation for a specific user/session/scope/step context; includes expiration metadata.
- **Workflow Session**: An Engage support session context that may be optionally referenced when minting and generating artifacts; used for validation and traceability.
- **Consent Mint Request**: User-initiated request to mint consent, optionally including `workflow_session_id` for strict session-aware validation.
- **Sosreport Generation Request**: Request to create diagnostics that must include a valid consent token and may include workflow session context.

## Acceptance Criteria

- AC-001: Web consent flow remains unchanged and `POST /api/engage/consent-tokens` continues to succeed for current web paths.
- AC-002: Headless/text clients can mint consent through `mint_engage_consent_token` and receive `consent_token`, `expires_at`, and `workflow_session_id`.
- AC-003: `mint_engage_consent_token` enforces strict validation for provided `workflow_session_id` and rejects invalid values.
- AC-004: `generate_sosreport` rejects calls without a valid consent token and accepts valid single-use tokens once.
- AC-005: Non-web explicit sequence succeeds end-to-end for product `linux` with no UI dependency.
- AC-006: No auto-consent minting or auto-generation behavior occurs in any flow.
- AC-007: New versioned contract/spec artifacts are created without modifying existing versioned files.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of tested web consent journeys continue to complete successfully with no additional user steps.
- **SC-002**: 100% of tested headless/text journeys can complete the required explicit MCP sequence from workflow start through sosreport fetch.
- **SC-003**: 100% of generation attempts without a valid consent token are blocked.
- **SC-004**: 100% of tested reused consent tokens are rejected after first successful use.
- **SC-005**: 100% of newly introduced specification and contract updates for this feature are published as new versioned files.

## Assumptions

- The existing Engage workflow continues to support `linux` as the required product value for sosreport generation.
- Existing consent token semantics (binding, short-lived, single-use) are already implemented and remain the source of truth.
- "Strict validation" for `workflow_session_id` means rejecting malformed identifiers and identifiers that do not correspond to the current allowed workflow context.

## Open Questions (only if critical)

No critical open questions at this time.
