# Research: Jira Attachment via User PAT Secret Boundary

## Decision: PAT intake via backend-only vault write path

- **Decision**: Accept PATs only through a backend endpoint that immediately stores
  credentials in encrypted-at-rest token vault storage and returns an opaque
  `connection_id`.
- **Rationale**: Satisfies constitution Principle 8 and prevents secret exposure in
  MCP tool payloads, model-visible transcripts, prompts, and logs.
- **Alternatives considered**: Passing PAT directly in MCP tool arguments; storing
  PAT in UI state; keeping PAT only in process memory without persistence.

## Decision: Token vault storage design

- **Decision**: Use user-scoped vault records with fields for encrypted credential
  blob, key version, status, created/updated timestamps, `expires_at`, and
  `revoked_at`. Resolve credential only at call time for outbound Jira requests.
- **Rationale**: Supports explicit revoke, bounded lifetime, per-user isolation, and
  auditable lifecycle while limiting credential exposure window.
- **Alternatives considered**: Plaintext storage, global shared connection record,
  unbounded credentials, or storing credentials in non-isolated config files.

## Decision: Threat notes for token boundary

- **Decision**: Treat the following as primary threats: log leakage, transcript
  leakage, cross-user connection misuse, stale credential replay, and accidental
  inclusion in error bodies.
- **Rationale**: These represent the highest-likelihood leakage vectors in MCP app
  and integration flows.
- **Alternatives considered**: Narrowing scope only to transport encryption threats
  (insufficient for model-visible channel protections).

## Decision: MCP/API contract boundaries for secret flow

- **Decision**: MCP tools accept only opaque references and operational inputs
  (`connection_id`, `issue_key`, `artifact_ref`) and return non-secret metadata and
  textual fallbacks. Secret ingress is constrained to backend connection endpoint.
- **Rationale**: Keeps model-visible and transcript-visible channels secret-free and
  testable.
- **Alternatives considered**: Combined "connect-and-attach" MCP call with inline
  PAT; embedding secret fragments in tool result metadata.

## Decision: Jira auth and target platform assumptions

- **Decision**: Use PAT-based authorization against self-hosted Jira over HTTPS only.
- **Rationale**: Matches explicit scope and avoids introducing OAuth complexity.
- **Alternatives considered**: OAuth 2.0, API token brokering service, or non-HTTPS
  Jira connections.

## Decision: Error mapping strategy

- **Decision**: Normalize Jira/network/vault failures into non-sensitive categories:
  `invalid_credentials`, `forbidden`, `not_found`, `artifact_invalid`,
  `connection_expired`, `connection_revoked`, `upstream_unavailable`,
  `unexpected_error`.
- **Rationale**: Produces user-actionable errors while preventing disclosure of
  secrets and internal stack details.
- **Alternatives considered**: Returning raw upstream status bodies; generic single
  error code for all failure modes.

## Decision: Test strategy extension

- **Decision**: Extend existing script-driven test approach with focused unit and
  integration coverage for token redaction, connection lifecycle, and Jira error
  translation, plus contract checks proving no secret fields in MCP schemas.
- **Rationale**: Aligns with repository tooling and constitution quality gates with
  minimal framework churn.
- **Alternatives considered**: Deferring security tests to manual verification only.
