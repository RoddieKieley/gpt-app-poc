# Research: UI-First Split Readiness and Headless Fallback Contracts

## Decision 1: Use additive split-readiness updates only

- **Decision**: Implement documentation/contract/test updates that clarify UI-first behavior and fallback semantics without creating or registering a new headless skill.
- **Rationale**: The feature scope explicitly excludes headless skill implementation in this phase and requires backward-compatible hardening.
- **Alternatives considered**:
  - Create the alternate headless skill now: rejected as out of scope.
  - Leave fallback behavior implicit: rejected due to current ambiguity in text-only hosts.

## Decision 2: Treat `structuredContent` as canonical and text fallback as deterministic compatibility path

- **Decision**: Define a dual-output contract where `structuredContent` remains authoritative and `content.text` includes deterministic, machine-parseable key/value lines for fallback.
- **Rationale**: Existing hosts vary in output capabilities; deterministic text fallback is required for non-UI bridges while preserving robust structured parsing.
- **Alternatives considered**:
  - Structured-only output: rejected because text-only hosts cannot consume it.
  - Free-form text-only output: rejected because it is not deterministic for machine parsing.

## Decision 3: Lock critical key parity requirements for handoff safety

- **Decision**: Require exact value parity across structured and text output for critical keys `job_id`, `fetch_reference`, and `connection_id`.
- **Rationale**: These keys represent blocking handoff points where parsing failures currently disrupt workflow completion.
- **Alternatives considered**:
  - Parity checks for only one representation: rejected due to bridge compatibility risk.
  - Best-effort formatting with no strict key guarantees: rejected due to nondeterministic automation behavior.

## Decision 4: Preserve web/UI behavior as a strict non-regression gate

- **Decision**: Keep existing web/UI flow behavior unchanged and enforce this through contract + integration + regression checks.
- **Rationale**: The feature requires split-readiness hardening, not UI behavior changes; regression risk is highest when output contracts evolve.
- **Alternatives considered**:
  - Refactor UI/web flow in parallel: rejected as unnecessary coupling and higher risk.
  - Rely on manual verification only: rejected due to weak repeatability.

## Decision 5: Keep historical spec packages immutable

- **Decision**: Do not edit `specs/014-headless-consent-compat/contracts/*`; treat them as compatibility baselines and add new contracts in `specs/015-engage-support-split/contracts/`.
- **Rationale**: Constitution Principle 9 requires non-retroactive specification integrity and clear lineage per feature package.
- **Alternatives considered**:
  - Version-bump and edit 014 contracts directly: rejected due to historical record immutability rule.
  - Duplicate 014 files in-place with local modifications: rejected because it still mutates historical package contents.

## Decision 6: Migration semantics are explicit routing guidance, not runtime skill registration

- **Decision**: Document migration as "UI-first primary skill routes to alternate headless skill URI placeholder when UI is unavailable."
- **Rationale**: This removes ambiguity for operators/bridges while preserving current runtime boundaries.
- **Alternatives considered**:
  - Omit alternate URI placeholder until headless exists: rejected because routing remains ambiguous.
  - Introduce temporary fake skill registration: rejected because it could imply unsupported behavior.
