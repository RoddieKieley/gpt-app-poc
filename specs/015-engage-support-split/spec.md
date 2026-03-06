# Feature Specification: UI-First Skill Split Readiness

**Feature Branch**: `015-engage-support-split`  
**Created**: 2026-03-06  
**Status**: Draft  
**Input**: User description: "/speckit.specify Create a split-ready update for engage-red-hat-support so the main skill is explicitly UI-first and references a separate headless text-only fallback skill for non-UI hosts, without creating that new skill yet."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Route correctly by host capability (Priority: P1)

As an operator using the engage-red-hat-support skill from different host environments, I need the main skill to explicitly declare that it is UI-first and route to a dedicated headless fallback skill when UI is unavailable, so sessions do not fail in text-only environments.

**Why this priority**: Correct environment routing prevents hard failures in text-only bridges and is required before any other split-readiness work can be trusted.

**Independent Test**: Can be fully tested by invoking the main skill from a UI-capable host and a non-UI host, confirming normal UI behavior remains unchanged and fallback guidance is returned for non-UI hosts.

**Acceptance Scenarios**:

1. **Given** a UI-capable host, **When** an operator invokes engage-red-hat-support, **Then** the UI workflow continues with no behavior regression.
2. **Given** a non-UI host, **When** an operator invokes engage-red-hat-support, **Then** the response explicitly indicates UI is unavailable and provides the alternate headless skill URI placeholder.

---

### User Story 2 - Preserve deterministic handoffs in text-only contexts (Priority: P2)

As a bridge integrator for text-only clients, I need deterministic text output requirements for critical handoff fields so downstream automation can parse key values reliably when structured data is not available.

**Why this priority**: Existing blocking handoffs in text-only bridges are a known reliability risk and directly affect operational continuity.

**Independent Test**: Can be tested independently by validating text-only responses for handoff steps and verifying parseable values for required keys.

**Acceptance Scenarios**:

1. **Given** a handoff that includes `job_id`, `fetch_reference`, or `connection_id`, **When** the system emits text output for a text-only context, **Then** each required key appears exactly once with deterministic labeling and value formatting.
2. **Given** an output that includes both structured and text representations, **When** values are compared, **Then** the critical handoff key values match exactly across both representations.

---

### User Story 3 - Clarify operator and security expectations (Priority: P3)

As a support operator or security reviewer, I need updated documentation that defines environment selection, fallback behavior, and security boundaries, so operations remain safe and consistent during and after the split.

**Why this priority**: Documentation alignment reduces operational mistakes, preserves consent and credential boundaries, and prepares teams for later headless skill rollout.

**Independent Test**: Can be tested by reviewing updated docs and confirming they unambiguously describe environment selection, text parsing guarantees, and consent/PAT constraints.

**Acceptance Scenarios**:

1. **Given** updated operator and security documentation, **When** an operator follows the guidance, **Then** they can determine when to use UI flow versus headless fallback without ambiguous handoffs.
2. **Given** diagnostic workflows that request sensitive access, **When** guidance is followed, **Then** PAT handling remains secure intake only and invasive diagnostics require explicit operator consent.

---

### Edge Cases

- UI capability is misdetected; the main skill must still emit clear fallback guidance instead of failing silently.
- A response omits one critical handoff key; the output must indicate incomplete handoff state rather than implying success.
- A critical key contains characters that could break naive parsers; deterministic labeling must still allow safe extraction.
- A host can render partial rich content but not interactive UI; behavior must follow the non-UI fallback path.
- Existing workaround patterns conflict with new deterministic format; docs must explicitly deprecate ambiguous patterns while preserving compatibility guidance.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The engage-red-hat-support main skill MUST be explicitly documented and described as UI-first.
- **FR-002**: The main skill MUST define fallback behavior for non-UI or text-only hosts, including a reference to a dedicated alternate headless skill URI placeholder.
- **FR-003**: The specification update MUST NOT create, register, or activate the new headless skill.
- **FR-004**: Existing UI resource behavior and current web/UI user flows MUST remain unchanged in scope and expected behavior.
- **FR-005**: Skill, operator, and security documentation MUST map current UI-first assumptions and existing headless guidance, and resolve ambiguities where the two conflict.
- **FR-006**: The specification MUST identify blocking handoff points in text-only bridges, explicitly covering `job_id`, `fetch_reference`, and `connection_id`, including known workaround patterns and their limitations.
- **FR-007**: Contracts and documentation MUST define deterministic text output requirements for machine parsing of critical handoff keys when UI is unavailable.
- **FR-008**: For all critical handoff keys, the text fallback representation MUST maintain value parity with the structured representation.
- **FR-009**: Regression expectations MUST explicitly state that existing web/UI behavior remains preserved while headless fallback readiness artifacts are introduced.
- **FR-010**: Security requirements MUST preserve the existing boundary: PAT credentials are accepted only through secure intake workflows.
- **FR-011**: Security requirements MUST preserve explicit operator consent before any invasive diagnostics are performed.
- **FR-012**: Split-readiness targets MUST define that when UI is unavailable, the UI skill routes users to the alternate headless skill reference rather than attempting unsupported UI interactions.

### Key Entities *(include if feature involves data)*

- **Host Environment Capability**: Classification of calling context as UI-capable, partially UI-capable, or non-UI; determines routing behavior and allowable interaction mode.
- **Fallback Skill Reference**: Placeholder identifier/URI pointing to the future dedicated headless skill; used only for routing guidance in this phase.
- **Critical Handoff Keys**: Required operational identifiers (`job_id`, `fetch_reference`, `connection_id`) that must be consistently present and value-aligned across representations.
- **Output Representation Pair**: The structured representation and text fallback representation of the same handoff data, used for parity verification.
- **Security Boundary Controls**: Policy conditions for secure PAT intake and explicit consent checkpoints before invasive diagnostics.

### Assumptions

- The future dedicated headless skill will be developed and registered in a later phase outside this specification.
- Non-UI hosts require deterministic plain-text outputs that can be parsed without rich interaction support.
- Existing workaround patterns in text-only bridges are documented inputs for this update, but they do not replace formal deterministic contract requirements.
- No change is required to existing UI workflow capabilities in this phase beyond making fallback behavior explicit.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of reviewed main-skill entry points and core docs explicitly state UI-first behavior and include the alternate headless skill URI placeholder for non-UI contexts.
- **SC-002**: For approved test scenarios covering text-only bridges, 100% of responses containing critical handoff data provide parseable text entries for `job_id`, `fetch_reference`, and `connection_id`.
- **SC-003**: In parity validation scenarios, critical handoff key values match exactly between structured and text representations in 100% of sampled cases.
- **SC-004**: Regression validation confirms no net change to existing web/UI workflow outcomes across agreed baseline scenarios.
- **SC-005**: Security and operator reviews confirm that PAT secure intake and explicit consent requirements are present in all relevant updated guidance artifacts.
