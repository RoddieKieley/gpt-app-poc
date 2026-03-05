# Research: Headless Consent Compatibility and Parsing Guarantees

## Decision 1: Treat current runtime behavior as baseline and plan for additive deltas

- **Decision**: Assume existing headless/server logic is already implemented and focus this feature on formalization, gap validation, and compatibility artifacts.
- **Rationale**: Current code and tests already cover explicit permission gating, mint denial paths, structured output, fallback text guidance, and web regression checks.
- **Alternatives considered**:
  - Re-implement consent flow internals: rejected due to unnecessary behavior churn and higher regression risk.

## Decision 2: Preserve web consent flow as a strict compatibility boundary

- **Decision**: Keep existing web UI consent workflow and endpoint behavior unchanged; treat no-regression as a hard gate.
- **Rationale**: The spec explicitly requires compatibility and existing behavior is already validated by regression tests.
- **Alternatives considered**:
  - Harmonize web flow to headless-only semantics: rejected because it changes stable UI behavior with no product value.

## Decision 3: StructuredContent-first parsing with text fallback remains required

- **Decision**: Define token extraction order for bridge clients as structured fields first, then text fallback parsing if structured fields are unavailable.
- **Rationale**: Different MCP hosts expose response payloads differently; this strategy preserves interoperability without weakening safety.
- **Alternatives considered**:
  - Structured-only parsing: rejected because some bridge clients rely on text-only output surfaces.
  - Text-only parsing: rejected because structured output is more deterministic and should be canonical.

## Decision 4: Use contracts and tests to prove guarantees even in no-op runtime path

- **Decision**: Represent this feature primarily through additive contracts, docs, and coverage alignment.
- **Rationale**: When behavior already satisfies the spec, artifact hardening is the minimal compliant delta.
- **Alternatives considered**:
  - Runtime code changes without evidence of gap: rejected as unnecessary risk.

## Decision 5: Keep updates non-retroactive and package-local

- **Decision**: All new requirements and contracts live only in `specs/014-headless-consent-compat/`.
- **Rationale**: Constitution Principle 9 requires historical spec immutability and clear lineage.
- **Alternatives considered**:
  - Modifying older spec directories for consistency: rejected as retroactive change.

## Decision 6: No unresolved clarifications

- **Decision**: No `NEEDS CLARIFICATION` items remain for planning.
- **Rationale**: Scope, constraints, and compatibility boundaries are explicit in the feature spec and current code context.
- **Alternatives considered**:
  - Deferring decisions to tasks phase: rejected because plan-phase closure is required.
