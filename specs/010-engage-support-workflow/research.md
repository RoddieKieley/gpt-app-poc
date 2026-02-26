# Research: Engage Support Workflow Multi-Resource Refactor

## Decision 1: Resource URI decomposition with compatibility router

- **Decision**: Keep `ui://engage-red-hat-support/app.html` as the stable entry resource and add step resources under `ui://engage-red-hat-support/steps/`.
- **Rationale**: Existing hosts and tests already target `app.html`; preserving it avoids breaking consumers while enabling a multi-page conversational flow.
- **Alternatives considered**:
  - Replace `app.html` with a new primary URI and redirect: rejected due to compatibility risk and unnecessary test churn.
  - Keep only one UI page with conditional sections: rejected because it preserves monolithic coupling and weakens step-level contracts.

## Decision 2: Shared state handoff as explicit workflow session object

- **Decision**: Use a typed workflow session object that carries `selected_product`, `fetch_reference`, `artifact_ref`, `connection_id`, `issue_key`, and `issue_access_verified` across steps.
- **Rationale**: Explicit handoff keys make step preconditions testable and prevent accidental skip-paths.
- **Alternatives considered**:
  - Infer state only from DOM controls at runtime: rejected due to brittle coupling and poor testability.
  - Persist all state on backend immediately: rejected as unnecessary expansion for current UI-orchestrated scope.

## Decision 3: PAT secrecy validation as contract + regression invariant

- **Decision**: Treat PAT secrecy as a first-class contract invariant validated in workflow contract JSON, contract tests, and regression tests.
- **Rationale**: The constitution requires hard secrecy boundaries. Multi-layer validation reduces risk of regressions from UI refactor work.
- **Alternatives considered**:
  - Validate secrecy only in integration tests: rejected because contract/regression drift can still pass limited happy-path tests.
  - Rely only on code review policy: rejected because this boundary needs executable guarantees.

## Decision 4: Keep existing MCP tools unchanged; modify workflow orchestration only

- **Decision**: Do not change MCP tool names/schemas (`jira_*`, `generate_sosreport`, `fetch_sosreport`); implement refactor through resource/flow orchestration and docs/contracts.
- **Rationale**: User requirement explicitly mandates no tool schema/name changes and behavior stability outside this workflow.
- **Alternatives considered**:
  - Introduce a new orchestration tool: rejected because it changes tool surface and violates scope constraints.
  - Extend tool schemas with step-specific fields: rejected due to backward compatibility and secrecy risk.

## Decision 5: Canonical contract update remains in `specs/007` plus v2 planning contracts in `specs/010`

- **Decision**: Plan includes direct update to `specs/007-engage-red-hat-support/contracts/engage-workflow-contract.json` as canonical baseline and adds `specs/010/.../contracts/*.v2.json` for design detail.
- **Rationale**: Existing tests already reference the `007` canonical contract path; preserving that source of truth minimizes migration complexity while enabling richer planning artifacts.
- **Alternatives considered**:
  - Move all contract assertions to `010` only: rejected due to immediate regression in existing tests and references.
  - Keep only `007` contracts and no `010` contracts: rejected because plan phase requires contracts output under the active feature.
