# Data Model: Headless Consent Compatibility and Parsing Guarantees

## Entity: Headless Consent Permission Signal

- **Purpose**: Represents explicit user approval to mint consent for invasive diagnostics in non-UI flows.
- **Core fields**:
  - `permission_granted` (boolean; required true to mint consent)
  - `workflow_session_id` (optional string; validates session context when provided)
- **Validation rules**:
  - Mint MUST be denied if explicit permission is absent or false.
  - Provided workflow session identifier MUST be valid and context-aligned.

## Entity: Consent Mint Response Compatibility Envelope

- **Purpose**: Provides canonical token details that clients use to continue diagnostics workflow.
- **Core fields**:
  - `consent_token` (string)
  - `expires_at` (timestamp string)
  - `workflow_session_id` (string)
- **Compatibility rules**:
  - Structured response fields are primary extraction source.
  - Text fallback lines provide secondary extraction for limited clients.

## Entity: Headless Workflow Sequence Context

- **Purpose**: Models required operation order for support workflow in headless/text mode.
- **Sequence stages**:
  1. Start support workflow.
  2. Select supported product context.
  3. Mint consent after explicit permission.
  4. Generate sosreport with valid consent.
  5. Fetch generated sosreport artifact.
- **Validation rules**:
  - Out-of-order or missing precondition calls MUST fail closed.
  - Generation without valid consent MUST be denied.

## Entity: Consent Token Authorization State

- **Purpose**: Encodes authorization constraints for diagnostics generation.
- **Constraint dimensions**:
  - user identity
  - session context
  - required scope
  - required workflow step
  - expiration
  - single-use token identity
- **Validation outcomes**:
  - Deny for missing, invalid, expired, replayed, or context-mismatched token usage.

## Entity: Web Consent Compatibility Boundary

- **Purpose**: Captures the no-regression guarantee for existing web/UI flow semantics.
- **Core fields**:
  - existing web consent route contract
  - existing UI consent interaction sequence
  - downstream generation behavior
- **Validation rules**:
  - No additional steps are introduced for web users.
  - Existing consent and generation behavior remains unchanged.

## State Transitions

1. `permission_pending` -> `permission_denied` when explicit approval is not granted.
2. `permission_pending` -> `mint_ready` when explicit approval is granted and prerequisites are satisfied.
3. `mint_ready` -> `minted` when consent token is issued.
4. `minted` -> `generated` when valid token authorizes one successful diagnostics generation.
5. `generated` -> `fetched` when artifact retrieval succeeds.
6. `minted` -> `denied_replay` when token is reused after successful generation.
