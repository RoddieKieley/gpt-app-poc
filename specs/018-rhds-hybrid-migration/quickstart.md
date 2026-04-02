# Quickstart: RHDS Step 1 Hybrid Migration

## Goal

Execute Step 1-only migration in incremental milestones while preserving all workflow behavior and callback contracts.

## Preconditions

- Work on branch `018-rhds-hybrid-migration`.
- Baseline build and serve flow are passing before any substitution.
- Existing workflow behavior is captured as baseline evidence for parity comparison.

## Milestone Execution Order

1. **B1**: Status display adapter substitution.
2. **B2**: Low-coupling action buttons adapter substitution.
3. **B3**: Optional progress/navigation affordance alignment.

Do not start the next milestone unless current milestone clears its go/no-go gate.

## B1 Procedure

1. Add `status-display-adapter` and wire it from `src/mcp-app/App.tsx`.
2. Preserve current status inputs and severity semantics.
3. Run validation:
   - Behavior parity: status messages and severity behavior unchanged.
   - Accessibility sanity: status announcement/readability still valid.
   - Visual consistency: status placement and emphasis unchanged.
4. Execute rollback drill:
   - Force adapter fallback to PF mode.
   - Confirm behavior restores to baseline.
5. **Go/No-Go**:
   - Go if all checks and rollback drill pass.
   - No-Go if any behavior or accessibility regression appears.

## B2 Procedure

1. Add `action-button-adapter` and apply only to low-coupling button groups.
2. Keep button IDs, labels, disabled logic, and callback signatures unchanged.
3. Run validation:
   - Behavior parity: all button callbacks and ordering unchanged.
   - Accessibility sanity: keyboard and focus behavior valid.
   - Visual consistency: action hierarchy remains clear.
4. Execute rollback drill:
   - Fallback adapted groups to PF mode only.
   - Confirm unaffected surfaces remain stable.
5. **Go/No-Go**:
   - Go if all checks and rollback drill pass.
   - No-Go if callback behavior diverges or critical a11y issues appear.

## B3 Procedure

1. Add `progress-affordance-adapter` for optional visual alignment only.
2. Ensure no gating or step enablement semantics change.
3. Run validation:
   - Behavior parity: step transitions and gating unchanged.
   - Accessibility sanity: step navigation is understandable and operable.
   - Visual consistency: progression cues are coherent and non-misleading.
4. Execute rollback drill:
   - Revert progress adapter to PF mode.
   - Verify B1/B2 remain intact after B3 rollback.
5. **Go/No-Go**:
   - Go if all checks and rollback drill pass.
   - No-Go if navigation semantics appear altered or user interpretation risk is high.

## Completion Criteria

- All completed milestones passed behavior, accessibility, and visual checks.
- Every substituted surface has a tested rollback path.
- Contracts and mapping artifacts in `specs/018-rhds-hybrid-migration/contracts/` are updated.
- No updates were made to historical `specs/012-patternfly-ui-swap/` artifacts.
