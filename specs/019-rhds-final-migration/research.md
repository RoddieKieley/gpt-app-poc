# Phase 0 Research: RHDS Final Migration (Step 2)

## Decision 1: Remove remaining PF primitives in one controlled cutover batch

- **Decision**: Execute final PF-to-RHDS replacement in a single controlled cutover sequence rather than staggered mixed-mode release batches.
- **Rationale**: Remaining PF usage spans core shell, form inputs, and progress affordance. A single coordinated cut lowers the risk of mixed-style interactions and simplifies dependency retirement verification.
- **Alternatives considered**:
  - Incremental family-by-family release (rejected: leaves temporary dependency overlap and increases signoff complexity).
  - Keep hybrid mode permanently (rejected: conflicts with RHDS-first completion objective).

## Decision 2: Preserve behavior by freezing event and routing contracts

- **Decision**: Treat existing callback signatures, route/hash semantics, step gating outcomes, and tool invocation order/arguments as immutable migration invariants.
- **Rationale**: Final migration scope is UI replacement, not workflow redesign. Contract freeze directly prevents hidden behavior regressions.
- **Alternatives considered**:
  - Refactor workflow handlers during migration (rejected: introduces out-of-scope behavior risk).
  - Reorder tool invocations for perceived simplification (rejected: violates parity requirement).

## Decision 3: Retire PF dependencies only after code and style import elimination

- **Decision**: Dependency retirement order is: remove PF runtime imports -> remove PF base stylesheet import -> validate parity -> remove `@patternfly/*` packages from `package.json`.
- **Rationale**: This order ensures package retirement is evidence-backed and avoids premature lockfile churn while PF imports still exist.
- **Alternatives considered**:
  - Remove packages first and fix compile errors afterward (rejected: noisy and high-risk change path).
  - Keep PF dependencies indefinitely as fallback (rejected: defeats retirement goal unless explicitly justified residual).

## Decision 4: Keep rollback as a single release-safe reversal option

- **Decision**: Define rollback as a single reversible batch that restores PF dependencies/import and PF adapter branches if any signoff gate fails.
- **Rationale**: Release operations need fast, predictable rollback with minimal decision overhead under incident pressure.
- **Alternatives considered**:
  - Multi-step partial rollback options (rejected: slower execution and harder operational decision-making).
  - No formal rollback path (rejected: unacceptable operational risk).

## Decision 5: Evidence-first signoff using matrix-based parity validation

- **Decision**: Signoff requires complete evidence across happy path, blocked/gating, error/recovery, loading/polling, and accessibility/visual checks.
- **Rationale**: Final migration confidence requires coverage of both nominal and degraded paths; visual-only or behavior-only validation is insufficient.
- **Alternatives considered**:
  - Happy-path-only validation (rejected: misses gating/error regressions).
  - Snapshot-only visual checks (rejected: does not prove tool order/status semantics parity).

## Decision 6: Documentation closure is part of done criteria

- **Decision**: Final migration report, dependency retirement decisions, residual risks, and signoff outcomes are mandatory deliverables before closure.
- **Rationale**: Migration completion requires auditable evidence and explicit risk ownership, not just passing code changes.
- **Alternatives considered**:
  - Post-release documentation catch-up (rejected: weak traceability and delayed risk visibility).
