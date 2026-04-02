# Data Model - RHDS Visual Alignment Step 0

Step 0 is presentational-only and introduces no new persistence model. This data model defines planning entities used to validate scope and non-regression.

## Entity: WorkflowBehaviorContract

- **Purpose**: Captures immutable behavior expectations that must remain unchanged in Step 0.
- **Fields**:
  - `step_gating_rules` (enum-set): Allowed/blocked transitions between Step 1/2/3.
  - `hash_routing_contract` (map): Expected behavior for `#step-1`, `#step-2`, `#step-3`.
  - `tool_sequence_contract` (list): Required sequence and gating for generate/fetch and Jira actions.
  - `build_serve_contract` (list): Expected build/serve command outcomes.
- **Validation rules**:
  - Must match pre-change baseline outcomes exactly.
  - Any mismatch is release-blocking for Step 0.

## Entity: RhdsStyleMapping

- **Purpose**: Records RHDS-guided design choices applied in Step 0.
- **Fields**:
  - `token_category` (enum): typography | spacing | color | status | loading | fallback.
  - `target_surface` (list): file/component areas where style is applied.
  - `guidance_reference` (string): RHDS token intent or foundation guidance citation.
  - `change_type` (enum): variable mapping | class hook | wrapper spacing | fallback polish.
- **Validation rules**:
  - Every visual change must map to one `guidance_reference`.
  - No item may include runtime logic or interaction-flow changes.

## Entity: ValidationEvidence

- **Purpose**: Tracks objective completion evidence for Step 0 gates.
- **Fields**:
  - `automated_tests` (list): named test commands and outcomes.
  - `manual_flow_checks` (list): required flow checks and outcomes.
  - `risk_findings` (list): detected regressions or concerns.
  - `rollback_ready` (boolean): whether isolated rollback can be executed safely.
- **Validation rules**:
  - All required automated tests must pass.
  - All required manual flows must pass.
  - `rollback_ready` must be true before completion.

## State Transitions

- `BaselineCaptured` -> `StylingLayerApplied` -> `PresentationalTweaksApplied` -> `RegressionValidated` -> `Step0Accepted`
- Any failed gate transitions state to `RollbackRequired`.
