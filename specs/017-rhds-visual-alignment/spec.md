# Feature Specification: RHDS Visual Alignment Step 0

**Feature Branch**: `017-rhds-visual-alignment`  
**Created**: 2026-04-02  
**Status**: Draft  
**Input**: User description: "We are executing Step 0 of an iterative RHDS migration for `gpt-app-poc`."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Preserve Existing Workflow Behavior While Refreshing Visual Design (Priority: P1)

As a product team member validating release safety, I need the app to look Red Hat-aligned while the Step 1/2/3 workflow behaves exactly as it does today, so we can improve presentation without introducing regressions.

**Why this priority**: Behavior stability is the primary business risk in this step; visual improvements only add value if existing flows remain unchanged.

**Independent Test**: Run through Step 1, Step 2, and Step 3 workflows before and after the change and confirm identical gating, navigation, and tool-call outcomes while visual styling is updated.

**Acceptance Scenarios**:

1. **Given** a user performs the standard Step 1/2/3 workflow, **When** Step 0 changes are applied, **Then** progression rules, tool-call triggering, and route/hash navigation remain identical to baseline behavior.
2. **Given** unchanged user inputs and sequence of actions, **When** the workflow is executed post-change, **Then** resulting state transitions and displayed step content match baseline behavior.

---

### User Story 2 - Achieve Clear Red Hat Visual Alignment (Priority: P2)

As a designer or stakeholder reviewing the UI, I need typography, spacing, color hierarchy, and status/loading treatment to align to RHDS guidance so the product visually matches Red Hat expectations.

**Why this priority**: Visual consistency with RHDS is the core value of Step 0 and enables future migration phases.

**Independent Test**: Compare UI shell and workflow screens against RHDS foundations and confirm token-aligned choices for typography, spacing, color, and status/fallback states.

**Acceptance Scenarios**:

1. **Given** the updated UI shell, **When** typography, spacing, and color usage are reviewed, **Then** design choices map to RHDS guidance and token intent.
2. **Given** loading, empty, and status views, **When** user-facing states are exercised, **Then** visual hierarchy and state cues are consistent and polished in a Red Hat-aligned style.

---

### User Story 3 - Keep Current Build and Serving Experience Stable (Priority: P3)

As a developer maintaining delivery flow, I need build and serve behavior to stay unchanged so styling updates do not disrupt local development or app serving.

**Why this priority**: Operational continuity is necessary for safe iterative delivery but is lower priority than workflow correctness and design alignment.

**Independent Test**: Execute existing build and serve checks and confirm the same runtime entry points and behavior contracts remain valid.

**Acceptance Scenarios**:

1. **Given** the existing build and serve commands, **When** they are run after Step 0 changes, **Then** the app builds and serves successfully with no required command or flow changes.

---

### Edge Cases

- Visual updates accidentally imply disabled/enabled state changes; the UI must not alter actual gating behavior.
- Status colors improve hierarchy, but semantics (success/warning/error/loading meaning) must remain consistent with current workflow outcomes.
- Loading and fallback polish must not introduce extra waiting states or block user progression beyond current behavior.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST preserve exact runtime behavior for workflow state transitions, step gating, tool-call sequencing, and navigation semantics in `src/mcp-app.ts`.
- **FR-002**: The system MUST preserve behavior contracts of `src/mcp-app/App.tsx` and `src/mcp-app/step-content.tsx`, including user-visible workflow outcomes and step progression behavior.
- **FR-003**: The system MUST apply only presentational updates in this step, including RHDS-informed typography, spacing, color usage, status styling, and loading/fallback polish.
- **FR-004**: The system MUST keep existing component structure intact and MUST NOT replace existing PatternFly React components with RHDS components in this step.
- **FR-005**: The system MUST keep tool-call behavior, data flow, step gating rules, and route/hash semantics unchanged.
- **FR-006**: The system MUST preserve the current build/serve behavior contracts currently exercised via `vite.config.ts` and `server.ts`.
- **FR-007**: The system MUST provide traceable rationale showing that changed design decisions map to RHDS tokens or RHDS guidance.
- **FR-008**: The system MUST include verification coverage for both behavioral non-regression and visual alignment before Step 0 is considered complete.

### Key Entities *(include if feature involves data)*

- **Workflow Behavior Contract**: Observable behavior for step transitions, gating rules, tool calls, and navigation that must remain unchanged in Step 0.
- **RHDS-Informed Styling Layer**: A presentational design layer that applies Red Hat-aligned typography, spacing, color hierarchy, and state styling without changing logic.
- **Verification Evidence**: Test and review outputs used to demonstrate no functional change and clear RHDS visual alignment.

### Assumptions

- Existing automated tests and current manual workflow checks are sufficient to detect Step 1/2/3 behavioral regressions for this step.
- RHDS guidance available from Red Hat UX foundations is adequate for defining token-aligned typography, spacing, and color decisions in Step 0.
- This step does not require new user roles, permissions, or workflow branches.

### Non-Goals

- Replacing PatternFly components with RHDS component implementations.
- Refactoring or changing workflow runtime logic, data flow, or tool-call orchestration.
- Modifying route structure, hash semantics, or step gating policy.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of baseline Step 1/2/3 regression checks pass with no observable functional differences in workflow progression, tool-call behavior, or navigation outcomes.
- **SC-002**: 100% of existing automated tests pass after Step 0 changes.
- **SC-003**: Reviewers can map all changed visual decisions to RHDS token intent or RHDS guidance with no unaccounted styling exceptions.
- **SC-004**: In design review, all primary workflow surfaces are rated as clearly Red Hat-aligned for typography, spacing, and status color hierarchy by designated reviewers.

### Verification Checklist

- Confirm no functional behavior changes in Step 1/2/3 workflow execution.
- Confirm behavior contracts remain unchanged in `src/mcp-app.ts`, `src/mcp-app/App.tsx`, and `src/mcp-app/step-content.tsx`.
- Confirm build/serve behavior remains unchanged for the current developer workflow.
- Confirm updated typography, spacing, color, and status/loading presentation align to RHDS guidance.
- Confirm each design choice changed in this step has documented RHDS mapping.
