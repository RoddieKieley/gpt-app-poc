# Research: Backend Human-Consent Gate for `generate_sosreport`

## Decision 1: Token format and signature strategy

- **Decision**: Use a compact signed token (JWS-style) minted only by backend, signed with server-held HMAC key, and verified server-side before policy authorization.
- **Rationale**: Signature prevents forgery/tampering without requiring client trust; HMAC with backend-only key is simple and sufficient for single-service trust boundary.
- **Alternatives considered**:
  - Opaque random token with server-side lookup only: rejected because it introduces mandatory stateful reads for every validation and weakens self-describing claim checks.
  - Asymmetric key pair signing: rejected for this increment due to extra key lifecycle complexity without cross-service verifier requirement yet.

## Decision 2: Consent claims and validation rules

- **Decision**: Required claims are `sub` (user), session binding, `scope=generate_sosreport`, `step=2`, `exp`, and unique `jti`; token is denied if any claim is missing or mismatched.
- **Rationale**: These claims enforce least-scope authorization and directly map to explicit-human-action constraints in the workflow.
- **Alternatives considered**:
  - Minimal claims (`exp` + `jti` only): rejected because it cannot enforce user/session/scope/step binding.
  - Broad scope claims (all diagnostics): rejected because spec requires strict scope for `generate_sosreport`.

## Decision 3: Replay prevention and one-time semantics

- **Decision**: Maintain consumed-`jti` registry with atomic consume-on-first-success semantics; replays are denied deterministically.
- **Rationale**: Replay prevention is a hard requirement and must survive duplicate submissions and race conditions.
- **Alternatives considered**:
  - Consume on first validation attempt (before tool execution): rejected because failed execution would burn consent unexpectedly.
  - TTL-only token without consume registry: rejected because replay remains possible during validity window.

## Decision 4: Centralized sensitive-tool policy middleware

- **Decision**: Introduce a dedicated policy module that evaluates consent evidence and returns standardized allow/deny decisions for sensitive tools, with `generate_sosreport` as first adopter.
- **Rationale**: Centralized policy reduces bypass risk and creates reusable enforcement for future sensitive tools.
- **Alternatives considered**:
  - Inline validation in `handleGenerateSosreport`: rejected due to policy duplication risk and weak extensibility.
  - UI-only gate without backend policy: rejected because it violates backend-enforced guarantee.

## Decision 5: Explicit UI and non-UI flow behavior

- **Decision**: Step 2 Generate click explicitly requests consent token from backend mint endpoint, then passes token in `generate_sosreport`; no token mint or diagnostics run during page load or step navigation. Non-UI users follow explicit documented mint-then-call sequence.
- **Rationale**: This preserves explicit human-action requirement across both UI and text-only hosts.
- **Alternatives considered**:
  - Auto-mint token on step navigation: rejected because it weakens explicit consent semantics.
  - Auto-generate diagnostics at load when prerequisites exist: rejected by hard requirement.

## Decision 6: Contract and compatibility boundary

- **Decision**: Keep existing MCP tool names and resource URIs stable, update only `generate_sosreport` input contract to include consent evidence, and update canonical + feature workflow contracts to encode the consent gate.
- **Rationale**: Meets compatibility constraints while making enforcement testable and explicit.
- **Alternatives considered**:
  - Introduce a new wrapper MCP tool (`generate_sosreport_with_consent`): rejected because it changes tool surface and invites drift.
  - Rename existing Step 2 resources: rejected due to compatibility risks.

## Decision 7: Residual risk handling

- **Decision**: Document multi-instance replay risk if consumed-`jti` registry is process-local; define requirement for shared store in scaled deployment. Add bounded clock-skew tolerance and safe generic denial text.
- **Rationale**: Captures realistic operational risk without broadening implementation scope unexpectedly.
- **Alternatives considered**:
  - Ignore distributed replay and clock skew concerns in this phase: rejected due to security impact.
