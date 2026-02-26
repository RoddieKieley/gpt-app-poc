# Data Model: Consent-Gated `generate_sosreport`

## Entity: ConsentTokenClaims

- **Purpose**: Carries signed, verifiable evidence of explicit Step 2 human consent.
- **Fields**:
  - `sub` (string, required): Requesting user identity.
  - `session_id` (string, required): Session/context binding for same user interaction context.
  - `scope` (enum, required): Must equal `generate_sosreport`.
  - `step` (integer, required): Must equal `2`.
  - `exp` (integer timestamp, required): Expiration cutoff for token validity.
  - `iat` (integer timestamp, required): Mint time for audit and skew checks.
  - `jti` (string, required): Unique nonce for one-time use enforcement.

## Entity: ConsentMintRequest

- **Purpose**: Input contract for explicit human-action mint endpoint.
- **Fields**:
  - `workflow` (enum, required): `engage_red_hat_support`.
  - `step` (integer, required): Must equal `2`.
  - `requested_scope` (enum, required): Must equal `generate_sosreport`.
  - `client_action_id` (string, optional): Optional UI correlation value for troubleshooting.

## Entity: ConsentConsumptionRecord

- **Purpose**: Enforces single-use and replay prevention.
- **Fields**:
  - `jti` (string, required): Token nonce key.
  - `consumed_at` (datetime string, required): First successful consumption time.
  - `consumed_by_user` (string, required): User that consumed the token.
  - `consumed_for_scope` (enum, required): Scope under which token was consumed.
  - `result` (enum, required): `consumed | replay_denied`.

## Entity: SensitiveToolPolicyDecision

- **Purpose**: Standardized authorization outcome for sensitive tool invocation.
- **Fields**:
  - `tool_name` (string, required): e.g. `generate_sosreport`.
  - `allowed` (boolean, required): Final allow/deny result.
  - `reason_code` (enum, required):
    - `consent_missing`
    - `consent_invalid`
    - `consent_expired`
    - `consent_replayed`
    - `consent_wrong_user`
    - `consent_wrong_scope`
    - `consent_wrong_step`
    - `consent_session_mismatch`
    - `authorized`
  - `safe_text` (string, required): User-safe actionable response text.

## Validation Rules

1. `generate_sosreport` MUST include consent evidence input or be denied.
2. Consent token signature MUST verify with backend secret.
3. `scope` claim MUST equal `generate_sosreport`.
4. `step` claim MUST equal `2`.
5. `sub` and `session_id` MUST match current request context.
6. `exp` MUST be in the future (with bounded skew tolerance).
7. `jti` MUST be unused at authorization time.
8. On first successful authorization, `jti` MUST be marked consumed.
9. Any repeated use of consumed `jti` MUST deny authorization and diagnostics execution.

## State Transitions

1. **Mint requested** -> **Token minted**
   - Condition: Explicit Step 2 action context validated.
2. **Token minted** -> **Authorized + consumed**
   - Condition: Signature + claims valid and `jti` unused.
3. **Token minted** -> **Denied expired**
   - Condition: `exp` elapsed before use.
4. **Token minted** -> **Denied mismatch**
   - Condition: `sub`, `session_id`, `scope`, or `step` mismatch.
5. **Authorized + consumed** -> **Denied replay**
   - Condition: Same `jti` presented again.

## Relationships

- `ConsentMintRequest` produces one `ConsentTokenClaims` instance.
- `ConsentTokenClaims.jti` maps one-to-one to a `ConsentConsumptionRecord` after first successful consume.
- `SensitiveToolPolicyDecision` is derived from token validation + consumption state for each sensitive tool call.
