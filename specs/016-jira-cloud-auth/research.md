# Research: Jira Cloud Minimal-Auth Migration

## Decision 1: Add Cloud Basic auth without replacing bearer path

- **Decision**: Support Cloud-compatible Basic auth semantics for Jira requests while preserving bearer-compatible behavior for existing records.
- **Rationale**: Atlassian Cloud requires email + API token authentication semantics; existing bearer-only behavior is currently failing for Cloud but may still be needed in other environments.
- **Alternatives considered**:
  - Replace bearer path entirely with Cloud-only behavior: rejected due to backward-compatibility risk.
  - Build a full pluggable auth-provider layer: rejected as out of scope for smallest-change strategy.

## Decision 2: Localize changes to Jira auth construction and connection metadata

- **Decision**: Keep migration scope to `jira-client`, connect schema, connection lifecycle metadata, and integration wiring in handlers/server.
- **Rationale**: This minimizes risk of workflow regressions and keeps endpoint/tool surfaces stable.
- **Alternatives considered**:
  - Broad refactor of all Jira flow code: rejected due to increased regression surface.
  - Introduce separate Cloud-only connection subsystem: rejected because it duplicates existing lifecycle/vault logic.

## Decision 3: Preserve external workflow and response contracts

- **Decision**: Keep connect -> verify -> list -> attach workflow and existing endpoint/MCP response shapes unchanged.
- **Rationale**: Operators and existing integrations depend on current sequencing and output fields, and feature goals explicitly require no workflow redesign.
- **Alternatives considered**:
  - Introduce new endpoints for Cloud mode: rejected unless strictly required for compatibility.
  - Add secret-bearing fields to downstream tools for convenience: rejected due to security boundary violation.

## Decision 4: Keep secret boundary unchanged

- **Decision**: Accept credential inputs only at backend intake and continue using `connection_id` as the only MCP-facing reference.
- **Rationale**: This matches constitution and current security model, and avoids model-visible secret exposure.
- **Alternatives considered**:
  - Pass email/token directly through MCP tool arguments: rejected due to explicit boundary restrictions.
  - Return auth metadata in tool payloads: rejected because it increases leakage risk without workflow benefit.

## Decision 5: Use compatibility defaults for older connection records

- **Decision**: Treat missing auth metadata as legacy bearer-compatible mode to avoid breaking pre-existing stored connections.
- **Rationale**: Existing records in `.data/jira-connections.json` do not contain Cloud auth metadata today.
- **Alternatives considered**:
  - Hard migration script for existing records: rejected as unnecessary for minimal change.
  - Fail closed on missing metadata: rejected because it would create avoidable production disruption.

## Decision 6: Add focused tests and runbook instead of broad new suites

- **Decision**: Update listed unit/contract/integration tests minimally, add only targeted assertions for Cloud mode and secret-safe behavior, and include explicit manual runbook with `APPENG-999999`.
- **Rationale**: Keeps implementation cost low while still proving acceptance criteria.
- **Alternatives considered**:
  - Add full end-to-end test matrix for all Jira variants: rejected as disproportionate for this migration.
  - Manual-only verification: rejected because it weakens regression safety.
