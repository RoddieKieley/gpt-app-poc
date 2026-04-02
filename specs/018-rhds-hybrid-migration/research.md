# Phase 0 Research: RHDS Step 1 Hybrid Migration

## Decision 1: Execute substitutions candidate-by-candidate in B1 -> B2 -> B3 order

- **Decision**: Migrate status display first (B1), then low-coupling action buttons (B2), then optional progress/navigation affordance alignment (B3).
- **Rationale**: This ordering minimizes blast radius by moving from passive display to limited interaction to higher perception-risk navigation affordances.
- **Alternatives considered**:
  - Migrate all low-risk components in one batch (rejected: harder to isolate regressions).
  - Start with navigation/progress for high visual impact (rejected: higher risk of implicit behavior regression).

## Decision 2: Use wrapper/adapter boundaries to preserve event contracts

- **Decision**: Introduce UI adapters with stable props that mirror existing callback signatures in `App.tsx` and `step-content.tsx`.
- **Rationale**: Adapters isolate PF vs RHDS rendering choices without changing workflow logic ownership or callback contracts.
- **Alternatives considered**:
  - Directly replace PF component usages inline (rejected: contract drift risk and weaker rollback isolation).
  - Introduce one global abstraction layer for all components (rejected: too broad for Step 1 and increases migration complexity).

## Decision 3: Make rollback independently executable per substituted surface

- **Decision**: Each adapter includes an explicit fallback mode that can restore PF rendering without changing parent component behavior.
- **Rationale**: Independent rollback reduces incident response time and avoids discarding successful substitutions from earlier milestones.
- **Alternatives considered**:
  - Global feature-level rollback only (rejected: too coarse and can undo validated low-risk work).
  - No explicit rollback path, rely on code revert (rejected: slower and less operationally predictable).

## Decision 4: Preserve historical mapping contract as immutable and create Step 1 contract locally

- **Decision**: Treat `specs/012-patternfly-ui-swap/contracts/engage-ui-component-map.v1.json` as read-only reference and create new Step 1 contract files in `specs/018-rhds-hybrid-migration/contracts/`.
- **Rationale**: Aligns with constitution requirement for non-retroactive specification integrity and keeps history auditable.
- **Alternatives considered**:
  - Update the v1 mapping file in `specs/012` (rejected: violates constitution principle on historical immutability).
  - Skip contract update for Step 1 (rejected: reduces migration traceability).

## Decision 5: Validate each substitution with parity + accessibility + visual checks

- **Decision**: Gate each milestone using behavior parity, accessibility sanity, visual consistency, and rollback readiness.
- **Rationale**: Hybrid migration risk is primarily behavioral drift and UX regressions; these checks directly guard those risks.
- **Alternatives considered**:
  - Behavior-only checks (rejected: misses accessibility and visual regressions).
  - Visual snapshot-only checks (rejected: does not prove callback/gating parity).
