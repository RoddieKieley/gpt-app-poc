# Feature Specification: RHDS Final Migration Phase

**Feature Branch**: `019-rhds-final-migration`  
**Created**: 2026-04-02  
**Status**: Draft  
**Input**: User description: "We are executing Step 2 (final phase) of RHDS migration for `gpt-app-poc`.

Goal:
Complete RHDS-first migration of the UI resource and retire PatternFly dependencies where feasible, while maintaining full functional parity with pre-migration behavior.

Scope:
- In scope:
  - Replace remaining PF UI primitives with RHDS equivalents.
  - Remove PF base stylesheet import and stale PF dependencies when safe.
  - Final RHDS visual compliance and parity verification.
- Out of scope:
  - Workflow behavior changes unrelated to migration.

Must preserve exactly:
- step gating + route/hash behavior
- tool call order/arguments
- status semantics
- secure credential handling boundaries
- MCP UI resource build/serve mechanics

Acceptance criteria:
1. RHDS-first UI complete.
2. Functional parity confirmed across success and failure paths.
3. PF dependencies removed or justified if any residual remains.
4. Final migration report with parity evidence and residual risk list.

Please produce:
- Final-phase spec with completion definition, dependency retirement criteria, and signoff checklist."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Preserve Existing Workflow Behavior (Priority: P1)

As an operator using the migrated interface, I can execute the same end-to-end workflow as before migration, with the same gate transitions, route/hash behavior, tool calls, and status semantics.

**Why this priority**: Functional parity is the release gate for migration completion. Any behavioral regression blocks production use.

**Independent Test**: Run full success and failure workflow paths in the migrated interface and confirm outcomes, sequence transitions, and observable status behavior match pre-migration baseline.

**Acceptance Scenarios**:

1. **Given** a user starts at the first step of the workflow, **When** the user advances through all valid steps, **Then** step gating decisions and route/hash transitions match the pre-migration behavior exactly.
2. **Given** a workflow action that triggers tool usage, **When** the action executes, **Then** tool call order and arguments are unchanged from baseline behavior.
3. **Given** a workflow failure condition, **When** the failure path is triggered, **Then** status semantics and user-visible outcomes match the baseline failure behavior.

---

### User Story 2 - Deliver RHDS-First Visual Compliance (Priority: P2)

As a user of the UI, I experience RHDS-aligned components and styling while keeping the same information architecture and interaction outcomes.

**Why this priority**: The migration objective is RHDS-first UI adoption, but visual changes are acceptable only if they do not alter core behavior.

**Independent Test**: Validate each migrated screen for RHDS visual alignment and verify parity of controls, labels, and outcomes relative to baseline.

**Acceptance Scenarios**:

1. **Given** the final-phase migrated UI, **When** a user navigates all in-scope screens, **Then** remaining PatternFly primitives are replaced with RHDS equivalents where feasible.
2. **Given** migrated screens, **When** users perform core actions, **Then** users can still discover and complete tasks without additional workflow steps.

---

### User Story 3 - Retire PatternFly Dependencies Safely (Priority: P3)

As a maintainer, I can remove unused PatternFly dependencies and the PatternFly base stylesheet import when safe, while documenting any justified residual dependency and associated risk.

**Why this priority**: Dependency retirement reduces maintenance overhead and aligns the codebase to the target design system, but safety and parity take precedence.

**Independent Test**: Audit dependency and style usage after migration, remove obsolete items, verify build/serve behavior remains intact, and document any retained dependency rationale.

**Acceptance Scenarios**:

1. **Given** final-phase migration changes are complete, **When** dependency retirement review is performed, **Then** obsolete PatternFly packages and base stylesheet import are removed if no required usage remains.
2. **Given** any PatternFly dependency cannot be removed without regression, **When** the release package is prepared, **Then** the retained dependency is explicitly justified with risk and follow-up action.

---

### Edge Cases

- A component appears visually equivalent in RHDS but changes keyboard or focus behavior that could alter step progression.
- Failure-path status updates race with UI transitions, causing users to see inconsistent state labels.
- A hidden or rarely used workflow path still references a PatternFly primitive and only appears under specific error conditions.
- Dependency removal passes normal usage checks but affects MCP UI resource build/serve behavior in deployment-like conditions.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST preserve existing step gating decisions and route/hash behavior exactly for all in-scope workflows.
- **FR-002**: The system MUST preserve tool call order and argument payloads for all workflow actions covered by the migration.
- **FR-003**: The system MUST preserve status semantics across success and failure paths, including user-visible state transitions.
- **FR-004**: The system MUST preserve secure credential handling boundaries with no expansion of credential exposure scope.
- **FR-005**: The system MUST preserve MCP UI resource build and serve mechanics with no workflow behavior changes introduced by migration.
- **FR-006**: The system MUST replace remaining in-scope PatternFly UI primitives with RHDS equivalents where feasible without changing workflow outcomes.
- **FR-007**: The system MUST remove the PatternFly base stylesheet import when no in-scope feature relies on it.
- **FR-008**: The system MUST retire stale PatternFly dependencies that are not required for preserved functionality.
- **FR-009**: The system MUST produce a dependency retirement decision log that lists each removed dependency and each retained dependency with rationale.
- **FR-010**: The system MUST produce parity evidence covering both success and failure paths for all in-scope workflows.
- **FR-011**: The system MUST produce a final migration report containing completion definition status, parity evidence summary, dependency retirement outcomes, and residual risk list.
- **FR-012**: The final phase MUST not introduce workflow behavior changes that are unrelated to RHDS migration scope.

### Completion Definition

Final-phase migration is complete only when all of the following are true:

- RHDS-first UI objective is met for all in-scope screens.
- Functional parity evidence demonstrates no regression in preserved behaviors.
- PatternFly dependency retirement review is complete, with obsolete dependencies removed and any residual dependency justified.
- Final migration report is published with residual risks and explicit signoff outcomes.

### Dependency Retirement Criteria

A PatternFly dependency or stylesheet qualifies for retirement when:

- No in-scope user scenario depends on it for successful task completion.
- Removing it does not change preserved behaviors defined in functional requirements.
- Success and failure path verification remains equivalent after removal.
- Build/serve mechanics for the MCP UI resource remain stable after removal.

If a dependency does not meet retirement criteria, it must be marked as residual with:

- business or user-impact justification,
- risk statement,
- owner and target follow-up phase.

### Signoff Criteria

Signoff requires explicit approval that:

- parity evidence covers both success and failure paths,
- preserved behaviors remain unchanged,
- dependency retirement decisions are complete and justified,
- residual risks are documented with owners and next actions.

### Key Entities *(include if feature involves data)*

- **Parity Evidence Record**: A structured record of observed behavior before and after migration for success/failure scenarios, including pass/fail outcomes.
- **Dependency Retirement Decision**: A record for each PatternFly dependency or stylesheet documenting remove/retain decision and rationale.
- **Residual Risk Item**: A migration-related risk that remains after final-phase delivery, with impact, mitigation, owner, and follow-up target.
- **Final Migration Report**: A stakeholder-facing artifact combining completion status, parity evidence summary, dependency outcomes, signoff state, and residual risks.

### Assumptions

- Pre-migration baseline behavior and test paths are available for parity comparison.
- "Where feasible" means dependency removal is required unless it would violate preserved behavior requirements.
- Signoff participants and approval flow already exist and only require migration-specific evidence inputs.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of in-scope workflow scenarios pass parity verification for both success and failure paths.
- **SC-002**: 100% of preserved behavior checks (step gating, route/hash, tool call order/arguments, status semantics, credential boundaries, build/serve mechanics) show no regression.
- **SC-003**: 100% of identified stale PatternFly dependencies are removed, or each residual dependency includes documented justification and risk acceptance.
- **SC-004**: Final migration report is delivered and approved with a complete residual risk list and signoff outcomes before phase closure.
- **SC-005**: At least 95% of parity test executions complete without requiring migration-related rework cycles after initial final-phase implementation.
