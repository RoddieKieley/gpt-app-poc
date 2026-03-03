# Research: PatternFly Increment 1 - Minimal Like-for-Like UI Swap

## Decision 1: Migration strategy

- **Decision**: Perform an iterative UI-only migration where rendering moves to React + PatternFly while existing workflow logic and tool-call handlers remain behaviorally equivalent.
- **Rationale**: This minimizes regression risk by isolating change to presentation and preserving proven workflow code paths.
- **Alternatives considered**:
  - Full UI rewrite with state redesign: rejected because it increases behavioral drift risk and violates minimal-swap scope.
  - Keep raw HTML and only style with CSS: rejected because requirement explicitly targets PatternFly React component adoption.

## Decision 2: PatternFly component baseline

- **Decision**: Use a constrained component set: `Wizard`, `Form`, `FormGroup`, `Select`, `TextInput`, `ActionGroup`, `Button`, inline `Alert`, and `Spinner`.
- **Rationale**: This maps directly to current controls and supports one-to-one migration without introducing redesign complexity.
- **Alternatives considered**:
  - Broader PatternFly layout primitives (`Page`, `Grid`, advanced form patterns): rejected for incremental scope control.
  - Non-PatternFly custom components: rejected because it fails acceptance criteria for PatternFly rendering.

## Decision 3: Bootstrap and entrypoint compatibility

- **Decision**: Keep `mcp-app.html` as the same resource entry and convert it to a React mount shell, with `src/mcp-app.ts` as the same module entrypoint.
- **Rationale**: Preserves URI/build/serve behavior and avoids server metadata changes.
- **Alternatives considered**:
  - Introduce new HTML entrypoint name: rejected due to URI compatibility constraints.
  - Move entry logic into new route/resource URIs: rejected due to hard requirement to keep current URIs intact.

## Decision 4: Workflow and gate parity enforcement

- **Decision**: Retain existing step gate predicates and transition logic as source-of-truth and bind new component events to those existing handlers.
- **Rationale**: Gate behavior is critical and already validated; preserving logic reduces step-regression risk.
- **Alternatives considered**:
  - Recompute gates from Wizard active-step state: rejected due to possible divergence from established behavior.
  - Combine gate and presentation logic into new component-local state: rejected due to increased coupling and risk.

## Decision 5: Contract and metadata preservation

- **Decision**: Preserve tool names/arguments, server interaction sequences, `ui://` resource URIs, and `openai/outputTemplate` behavior exactly.
- **Rationale**: The feature goal is UI swap only; contracts/metadata must remain unchanged for host compatibility.
- **Alternatives considered**:
  - Add wrapper tools for new UI actions: rejected because it changes external contract shape.
  - Change resource URI namespace to match new UI structure: rejected because it breaks compatibility guarantees.

## Decision 6: PAT and sensitive input handling

- **Decision**: Keep PAT boundary unchanged: PAT is submitted only during secure intake (`connect`) and cleared immediately afterward.
- **Rationale**: Existing security boundary already aligns with constitution requirements and must not regress during UI migration.
- **Alternatives considered**:
  - Persist PAT in UI state for convenience: rejected due to secret-boundary violation.
  - Auto-refill PAT between retries: rejected due to retention risk.

## Decision 7: Verification-first rollout

- **Decision**: Validate parity through contract/integration/regression checks with explicit focus on step gating, hash routing, PAT clearing, URI/metadata compatibility, and fallback behavior.
- **Rationale**: Behavior-preserving migration requires stronger regression emphasis than feature-addition testing.
- **Alternatives considered**:
  - UI snapshot-only validation: rejected as insufficient to detect contract and security regressions.
  - Manual-only verification: rejected because repeatable regression proof is required for safe incremental delivery.
