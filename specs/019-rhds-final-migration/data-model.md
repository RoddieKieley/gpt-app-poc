# Data Model: RHDS Final Migration (Step 2)

## Entity: PFUsageInventoryItem

- **Purpose**: Represents one remaining PatternFly usage that must be replaced, removed, or justified.
- **Fields**:
  - `id`: Unique identifier (for example `pf-app-title`).
  - `filePath`: Source file path.
  - `symbol`: Imported component/style token.
  - `usageType`: `component`, `stylesheet`, `dependency`, `mode_flag`.
  - `replacementTarget`: RHDS equivalent or semantic RHDS-compatible fallback.
  - `retirementState`: `pending`, `replaced`, `removed`, `residual_justified`.
  - `owner`: Responsible implementer/reviewer.
  - `notes`: Risk or migration notes.
- **Validation rules**:
  - Every in-scope PF import/dependency must have one inventory item.
  - `residual_justified` requires linked risk and follow-up owner.

## Entity: ReplacementMapping

- **Purpose**: Defines exact PF-to-RHDS replacement strategy per UI surface.
- **Fields**:
  - `mappingId`: Unique mapping ID.
  - `inventoryItemId`: Linked PF inventory item.
  - `sourceBehaviorContract`: Behavior invariants preserved by replacement.
  - `targetRenderContract`: RHDS rendering contract.
  - `a11yExpectations`: Keyboard, focus, and assistive expectations.
  - `status`: `planned`, `implemented`, `validated`, `rolled_back`.
- **Validation rules**:
  - `sourceBehaviorContract` must include gating/route/status/tool-order invariants if relevant.
  - `validated` requires passing parity evidence in corresponding matrix categories.

## Entity: DependencyRetirementDecision

- **Purpose**: Tracks retirement outcome for each PatternFly package or stylesheet artifact.
- **Fields**:
  - `artifact`: Package name or stylesheet import.
  - `decision`: `remove` or `retain`.
  - `justification`: Required for `retain`.
  - `riskLevel`: `low`, `medium`, `high`.
  - `followUpOwner`: Required for `retain`.
  - `targetPhase`: Follow-up target for retained items.
- **Validation rules**:
  - `remove` requires no remaining runtime usage evidence.
  - `retain` requires justification + risk + owner + target phase.

## Entity: RegressionMatrixRun

- **Purpose**: Captures parity execution results across required validation categories.
- **Fields**:
  - `runId`: Unique run identifier.
  - `categories`: Results for `happy_path`, `blocked_gating`, `error_recovery`, `loading_polling`, `a11y_visual`.
  - `overallResult`: `pass`, `fail`, `blocked`.
  - `evidenceRefs`: Links/paths to logs, test outputs, or walkthrough notes.
  - `executedBy`: Responsible tester.
  - `executedAt`: Timestamp.
- **Validation rules**:
  - `overallResult=pass` only if all categories pass.
  - Failures must include defect references or rollback trigger notes.

## Entity: CutoverExecutionStep

- **Purpose**: Represents one ordered step in final migration execution.
- **Fields**:
  - `order`: Integer sequence.
  - `name`: Step title.
  - `preconditions`: Required checks before step execution.
  - `postconditions`: Observable completion checks.
  - `rollbackTrigger`: Conditions that force rollback from this step.
- **Validation rules**:
  - Steps must be strictly ordered and unique.
  - Every step must specify at least one postcondition.

## Entity: SignoffGateRecord

- **Purpose**: Tracks pass/fail for final release gates.
- **Fields**:
  - `gateId`: `A` through `E`.
  - `name`: Gate name (behavior parity, dependency retirement, etc.).
  - `status`: `pass`, `fail`, `waived`.
  - `evidence`: Supporting reference.
  - `approver`: Human approver identity.
  - `notes`: Optional concerns or waiver rationale.
- **Validation rules**:
  - Feature closeout requires all gates `pass` or formally waived.
  - Any `waived` gate must include explicit rationale and risk acceptance.

## Entity: FinalMigrationReport

- **Purpose**: Consolidated closeout record for RHDS final migration.
- **Fields**:
  - `completionDefinitionStatus`: `met` or `not_met`.
  - `paritySummary`: Narrative + matrix outcome.
  - `dependencyOutcomes`: All retirement decisions.
  - `residualRisks`: Ordered residual risk list with owners.
  - `signoffSummary`: Gate outcomes and approvers.
- **Validation rules**:
  - Cannot be marked complete unless parity and signoff gates are resolved.
  - Must include residual risk section even if empty ("none identified").
