# Data Model: RHDS Step 1 Hybrid Migration

## Entity: SubstitutionCandidate

- **Purpose**: Represents one UI surface selected for Step 1 migration.
- **Fields**:
  - `id`: Unique candidate identifier (for example `B1-status-display`).
  - `name`: Human-readable candidate name.
  - `milestone`: Target milestone (`B1`, `B2`, `B3`).
  - `sourceOwner`: Current component owner (`PatternFly`).
  - `targetOwner`: Target component owner (`RHDS` or `Hybrid`).
  - `riskLevel`: `low`, `medium-low`, `medium`.
  - `status`: `planned`, `in_progress`, `validated`, `rolled_back`, `deferred`.
  - `dependsOn`: Zero or more prerequisite candidate IDs.
  - `rollbackRef`: Link to rollback strategy identifier.
- **Validation rules**:
  - `milestone` must be one of `B1`, `B2`, `B3`.
  - `status` transitions must follow defined workflow.
  - `riskLevel` must be explicitly set before implementation.
- **State transitions**:
  - `planned` -> `in_progress` -> `validated`
  - `in_progress` -> `rolled_back`
  - `planned` -> `deferred`
  - `validated` -> `rolled_back` (only if regression discovered later)

## Entity: AdapterContract

- **Purpose**: Defines stable boundary between workflow logic and UI rendering implementation.
- **Fields**:
  - `adapterId`: Unique adapter identifier.
  - `surface`: UI surface area (`status`, `action_button`, `progress_affordance`).
  - `inputProps`: Required props exposed to parent component.
  - `eventContracts`: Callback names and required payload/arity invariants.
  - `renderModes`: Available render options (PF, RHDS).
  - `fallbackMode`: Default rollback render mode.
  - `semanticsInvariant`: Statement of required behavior invariants.
- **Validation rules**:
  - Adapter event signatures must match current parent callback contracts.
  - Adapter cannot introduce new workflow decision ownership.
  - Fallback mode must be available for every adapted surface.

## Entity: RegressionCheckSet

- **Purpose**: Captures required validation for each substituted candidate.
- **Fields**:
  - `checkSetId`: Unique check set identifier.
  - `candidateId`: Related substitution candidate ID.
  - `behaviorChecks`: List of behavior parity checks.
  - `a11yChecks`: List of accessibility sanity checks.
  - `visualChecks`: List of visual consistency checks.
  - `result`: `pass`, `fail`, `blocked`.
  - `evidenceRefs`: Links/paths to validation evidence.
- **Validation rules**:
  - At least one check in each category (behavior, accessibility, visual).
  - `result` cannot be `pass` unless all three categories pass.

## Entity: RollbackPlan

- **Purpose**: Defines how to revert a substituted surface safely.
- **Fields**:
  - `rollbackId`: Unique rollback identifier.
  - `candidateId`: Related substitution candidate.
  - `triggerConditions`: Conditions that trigger rollback.
  - `executionSteps`: Ordered rollback steps.
  - `expectedOutcome`: Observable behavior after rollback.
  - `verificationChecks`: Minimal checks confirming rollback success.
- **Validation rules**:
  - Trigger conditions must include behavior regression and severe accessibility failure.
  - Execution steps must be candidate-scoped, not requiring full feature revert.
  - Verification checks must confirm workflow parity post-rollback.

## Entity: HybridMappingRecord

- **Purpose**: Tracks PF/RHDS ownership and migration state for Step 1.
- **Fields**:
  - `componentSurface`: Named surface in app workflow.
  - `currentMapping`: Current owner (`PatternFly`, `RHDS`, `Hybrid`).
  - `milestone`: Associated B1/B2/B3 milestone.
  - `riskNotes`: Risk summary for that surface.
  - `rollbackId`: Linked rollback plan identifier.
  - `nextPhaseHint`: Step 2 follow-up note.
- **Validation rules**:
  - Every in-scope Step 1 candidate must have a mapping record.
  - Deferred candidates must include justification and next-phase hint.
