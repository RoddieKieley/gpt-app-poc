# Phase 0 Research - RHDS Visual Alignment Step 0

## Decision 1: Introduce an RHDS-informed style token layer without behavior edits

- **Decision**: Apply a token-aligned styling layer as CSS variables and lightweight class hooks across `mcp-app.html`, `src/mcp-app/App.tsx`, and `src/mcp-app/step-content.tsx`, with `src/mcp-app.ts` limited to style import/wiring only if needed.
- **Rationale**: This keeps PatternFly components and all runtime behavior contracts intact while allowing typography, spacing, color hierarchy, and state polish to move toward RHDS guidance.
- **Alternatives considered**:
  - Replace PatternFly components with RHDS components now (rejected as out of scope and behavior-risky).
  - Heavy global overrides on PatternFly internals (rejected as brittle and high regression risk).

## Decision 2: Validate behavior parity with existing tests plus targeted manual gates

- **Decision**: Use current automated suites (`test:unit`, `test:contract`, `test:integration`, `test:regression`) plus mandatory manual gates for step gating/hash routing, generate/fetch, and Jira connect/verify/list/attach/disconnect.
- **Rationale**: Existing suites cover core server and workflow contracts; manual validation closes the UI-state gap for visual-only modifications.
- **Alternatives considered**:
  - Manual checks only (rejected due to weaker regression detection).
  - New full browser e2e framework in Step 0 (rejected as scope expansion).

## Decision 3: Keep rollback fast and deterministic

- **Decision**: Isolate Step 0 to presentational diffs in target files and keep behavior logic unchanged, enabling targeted rollback of style-layer commits/files.
- **Rationale**: If any functional drift appears, rollback can be immediate and low-risk without touching established workflow/tooling logic.
- **Alternatives considered**:
  - Large mixed refactor of style + behavior touchpoints (rejected; difficult to bisect and rollback safely).
  - Runtime style feature flags for Step 0 (rejected as unnecessary complexity for this increment).

## Resolved Clarifications

- No unresolved `NEEDS CLARIFICATION` items remain for Step 0.
