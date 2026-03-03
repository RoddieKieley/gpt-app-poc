# Research: MCP Consent Mint Path for Text Clients

## Decision 1: Add separate MCP mint tool (Option A)

- **Decision**: Implement `mint_engage_consent_token` as a dedicated MCP tool and keep web minting via `POST /api/engage/consent-tokens`.
- **Rationale**: Headless/text clients need a non-UI explicit consent action; dedicated tool preserves intent clarity and keeps web behavior stable.
- **Alternatives considered**:
  - Reusing web endpoint only from text clients: rejected because MCP-only clients should not depend on HTTP-side UX coupling.
  - Auto-mint on generate: rejected due to explicit consent and security model violation.

## Decision 2: Reuse existing consent token service and policy checks

- **Decision**: Reuse `ConsentTokenService` mint/verify + `authorizeSensitiveToolCall` for generation authorization semantics.
- **Rationale**: Existing user/session/scope/step binding and single-use replay protections already satisfy requirements; avoids duplicated security logic.
- **Alternatives considered**:
  - New token subsystem for MCP path: rejected due to security drift risk and duplicate maintenance burden.

## Decision 3: Optional `workflow_session_id` with strict validation

- **Decision**: Accept optional `workflow_session_id` in mint tool input; if supplied, require strict validation against known workflow session context.
- **Rationale**: Supports both default MCP session behavior and explicit workflow targeting without ambiguity.
- **Alternatives considered**:
  - Make `workflow_session_id` required: rejected as unnecessary friction for existing session-bound clients.
  - Ignore invalid `workflow_session_id` and fallback silently: rejected because it weakens correctness and operator trust.

## Decision 4: Preserve existing web UX and endpoint semantics

- **Decision**: Keep `POST /api/engage/consent-tokens` request/response behavior unchanged.
- **Rationale**: Existing UI flows are in production and must remain regression-safe while adding headless capability.
- **Alternatives considered**:
  - Move web flow to MCP-only mint tool: rejected due to avoidable behavior churn and compatibility risk.

## Decision 5: New versioned contracts only in active feature package

- **Decision**: Introduce new versioned contract files under `specs/013-mcp-consent-mint-path/contracts/` and do not edit prior spec package contracts.
- **Rationale**: Satisfies constitution non-retroactive integrity and maintains historical traceability.
- **Alternatives considered**:
  - Updating `specs/011` contract versions in place: rejected as retroactive modification.

## Decision 6: Test coverage must prove parity + explicit headless flow

- **Decision**: Add focused integration tests for headless happy path and denial matrix, plus contract/regression assertions for new tool while preserving web behavior.
- **Rationale**: Required behavior mixes additive capability and strict non-regression constraints.
- **Alternatives considered**:
  - Unit-only validation for mint tool: rejected because session/workflow correctness requires integration-level behavior checks.
