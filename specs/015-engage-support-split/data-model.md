# Data Model: UI-First Split Readiness

## Entity: Host Capability Profile

- **Purpose**: Classifies execution environment to determine routing and output expectations.
- **Fields**:
  - `host_mode`: enum (`ui_capable`, `partial_ui`, `text_only`)
  - `ui_available`: boolean
  - `detection_source`: enum (`host_metadata`, `runtime_probe`, `operator_override`)
- **Validation rules**:
  - `text_only` and `ui_available=true` cannot both be true.
  - Ambiguous capability resolves to fallback-safe behavior.

## Entity: Routing Decision

- **Purpose**: Represents the routing outcome for engage workflow invocation.
- **Fields**:
  - `primary_skill_uri`: string (`skill://engage-red-hat-support/SKILL.md`)
  - `alternate_headless_skill_uri_placeholder`: string
  - `routing_reason`: enum (`ui_available`, `ui_unavailable`, `capability_unknown`)
  - `migration_phase`: enum (`split_readiness_only`)
- **Validation rules**:
  - Placeholder URI is required in non-UI routing responses.
  - Routing decision cannot create/register alternate skill in this phase.

## Entity: Handoff Key Envelope

- **Purpose**: Captures required identifiers that enable deterministic step-to-step continuation.
- **Critical keys**:
  - `job_id`
  - `fetch_reference`
  - `connection_id`
- **Validation rules**:
  - When a key is present in structured output, matching text fallback value must be present.
  - Key labels in fallback output must remain deterministic and parseable.

## Entity: Output Representation Pair

- **Purpose**: Models parity relationship between structured and text representations.
- **Fields**:
  - `structured_payload`: object
  - `text_payload`: string
  - `parity_keys`: array (`job_id`, `fetch_reference`, `connection_id`)
  - `parity_status`: enum (`pass`, `fail`)
- **Validation rules**:
  - `parity_status=pass` only when all present parity keys match exactly across representations.
  - Text payload must remain machine-parseable for required keys in text-only contexts.

## Entity: Security Control Snapshot

- **Purpose**: Preserves required security invariants during routing and fallback behavior.
- **Fields**:
  - `pat_intake_mode`: enum (`secure_backend_only`)
  - `opaque_connection_reference`: string (`connection_id`)
  - `explicit_consent_required_for_invasive_diagnostics`: boolean
  - `secret_exposure_detected`: boolean
- **Validation rules**:
  - `pat_intake_mode` must always be `secure_backend_only`.
  - Diagnostic generation must be denied when explicit consent is absent.
  - Secret-bearing fields must not appear in fallback contracts.

## State Transitions

1. `route_pending` -> `ui_path_selected` when host is UI-capable.
2. `route_pending` -> `headless_placeholder_returned` when host is non-UI.
3. `handoff_pending` -> `handoff_ready` when required key(s) are available with parity.
4. `handoff_pending` -> `handoff_blocked` when required key is missing or non-parity.
5. `security_check_pending` -> `security_pass` when PAT boundary and consent constraints hold.
6. `security_check_pending` -> `security_block` when consent or secret-boundary violation is detected.
