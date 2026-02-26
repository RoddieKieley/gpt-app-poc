# Implementation Plan: Backend Human-Consent Gate for generate_sosreport

**Branch**: `011-consent-gate-sosreport` | **Date**: 2026-02-26 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `/specs/011-consent-gate-sosreport/spec.md`

## Summary

Add backend-enforced, one-time consent evidence for `generate_sosreport` by introducing a secure mint endpoint and centralized sensitive-tool policy middleware. Step 2 UI click must mint consent then call `generate_sosreport` with the token, replay must fail, non-UI hosts must have explicit text fallback instructions, and existing PAT boundaries, entry URI compatibility, and unrelated tool/resource surfaces must remain unchanged.

## Technical Context

**Language/Version**: TypeScript (Node.js 18+)  
**Primary Dependencies**: `@modelcontextprotocol/sdk`, `@modelcontextprotocol/ext-apps`, `express`, `zod`, `node:crypto`, `tsx`  
**Storage**: Existing in-memory/runtime stores plus new consent nonce consumption store (single-use state keyed by token `jti`)  
**Testing**: `tsx --test` suites in `tests/contract`, `tests/integration`, `tests/regression`, and targeted unit tests  
**Target Platform**: Linux-hosted MCP server + browser-rendered MCP App UI  
**Project Type**: Single-project MCP app server + UI bundle  
**Performance Goals**: Consent mint + validation path adds negligible overhead; denial/allow decision for `generate_sosreport` remains near-immediate for operators  
**Constraints**: Keep `ui://engage-red-hat-support/app.html` stable, keep tool names stable, preserve PAT boundary, no secret leakage in tool payloads/results/logs  
**Scale/Scope**: Consent endpoint, policy middleware, `generate_sosreport` schema/handler integration, UI Step 2 flow update, non-UI fallback docs, contract/integration/regression coverage

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **1. Support-Workflow Fidelity**: Keeps diagnostics-first support flow while adding explicit consent gate before collection. **Pass.**
- **2. Human-Authorized Diagnostics**: `generate_sosreport` is blocked unless explicit Step 2 action minted valid one-time consent. **Pass.**
- **3. Privacy-First Diagnostics**: Denial messages and logs remain secret-safe; only least-scope claims are carried in token. **Pass.**
- **4. Strict MCP Apps Compliance**: Existing `ui://` resources and MCP Apps JSON-RPC bridge remain the interaction model. **Pass.**
- **5. Graceful Degradation**: Non-UI text fallback includes explicit consent mint + tool call sequence. **Pass.**
- **6. Portability and Interop**: Host-agnostic backend policy; no host-specific branching. **Pass.**
- **7. Incremental Spec-Driven Delivery**: Plan/research/data model/contracts/quickstart are produced under this spec package. **Pass.**
- **8. Secret Boundary for Tokens and Credentials**: PAT intake boundary unchanged; consent token is scoped, short-lived, single-use, and never treated as a stored credential. **Pass.**

**Post-Design Re-check**: Pass. Phase 1 artifacts define claim validation, replay prevention, safe denial behavior, and explicit regression boundaries.

## Project Structure

### Documentation (this feature)

```text
specs/011-consent-gate-sosreport/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── consent-endpoint.openapi.yaml
│   ├── sensitive-tool-policy.contract.json
│   └── engage-consent-workflow.contract.v3.json
└── tasks.md
```

### Source Code (repository root)

```text
server.ts
src/mcp-app.ts
src/sosreport/sosreport-tool-schemas.ts
src/sosreport/sosreport-tool-handlers.ts
src/security/security-events.ts
src/security/redaction.ts
src/security/
  consent-token-service.ts                 # new
  sensitive-tool-policy.ts                 # new
skills/engage-red-hat-support/SKILL.md
specs/007-engage-red-hat-support/contracts/engage-workflow-contract.json
specs/010-engage-support-workflow/contracts/engage-workflow-contract.v2.json
README.md
docs/operator-guide.md
docs/security-model.md
tests/contract/engage-red-hat-support.contract.test.ts
tests/contract/sosreport-tools.contract.test.ts
tests/integration/engage-red-hat-support.workflow.test.ts
tests/integration/sosreport-generate.success.test.ts
tests/integration/sosreport-generate.failures.test.ts
tests/regression/mcp-tool-surface-preservation.test.ts
tests/regression/skill-resource-preservation.test.ts
tests/regression/no-pat-leakage-mcp.test.ts
tests/unit/sosreport-tool-schemas.test.ts
tests/unit/
  consent-token-service.test.ts            # new
  sensitive-tool-policy.test.ts            # new
```

**Structure Decision**: Keep the existing single-project architecture and implement consent gating with additive security modules plus focused updates to existing server/tool/UI/docs/tests.

## Phase Plan

### Phase 0 - Research and decisions

1. Decide signature strategy for unforgeable server-minted consent token.
2. Define token claims and validation rules (`user/session/scope/step/exp/jti`) and replay prevention behavior.
3. Define centralized policy middleware boundary for sensitive tool authorization.
4. Define UI Step 2 and non-UI explicit sequence that preserves no-implicit-diagnostics behavior.
5. Define canonical + feature contract updates and test matrix for compatibility/non-regression.

**Exit criteria**:
- `research.md` captures final decisions with rationale and alternatives.
- No unresolved `NEEDS CLARIFICATION` items remain.

### Phase 1 - Design and contracts

1. Produce `data-model.md` for consent token/session binding and policy decision entities.
2. Produce consent API and workflow contracts in `contracts/`.
3. Define implementation/test execution in `quickstart.md`.
4. Run `.specify/scripts/bash/update-agent-context.sh cursor-agent`.
5. Re-check constitution/security gates and residual risks.

**Exit criteria**:
- `data-model.md`, `quickstart.md`, and contracts are consistent.
- Security gates and residual risk mitigations are explicit.

## File-by-File Change Plan

### `server.ts`

- Add secure HTTP mint endpoint for Step 2 consent (for UI and documented non-UI flow).
- Resolve `userId` from existing request context and bind minted tokens to user/session context.
- Wire a consent service and centralized sensitive-tool policy middleware into `generate_sosreport` tool execution path.
- Keep existing tool/resource names stable; only extend `generate_sosreport` input requirements as required.
- Preserve `ui://engage-red-hat-support/app.html` resource behavior and text fallback responses.

### `src/security/consent-token-service.ts` (new)

- Mint signed short-lived consent tokens with claims:
  - `sub`/user binding, session binding, `scope=generate_sosreport`, `step=2`, `exp`, `jti`.
- Verify token signature and claim integrity.
- Enforce one-time usage via consumed `jti` persistence and atomic consume semantics.
- Emit safe security events for mint/consume/replay-deny outcomes without leaking token secrets.

### `src/security/sensitive-tool-policy.ts` (new)

- Centralize policy enforcement for sensitive tools.
- Provide reusable `authorizeSensitiveToolCall(...)` path that validates consent evidence for `generate_sosreport`.
- Return structured allow/deny decision with safe, actionable denial text.

### `src/sosreport/sosreport-tool-schemas.ts`

- Add required consent evidence field for `generate_sosreport` input contract (for example `consent_token`).
- Keep existing optional sosreport parameters and validation constraints intact.

### `src/sosreport/sosreport-tool-handlers.ts`

- Thread validated authorization context into generate handler invocation without altering diagnostics logic itself.
- Ensure diagnostics command execution cannot begin on policy denial.

### `src/mcp-app.ts`

- Step 2 Generate button flow:
  - First call consent mint endpoint from explicit click handler.
  - Then call `generate_sosreport` with returned consent token.
- Ensure no token mint or diagnostics collection occurs at page load, route bootstrap, or step navigation.
- Keep compatibility with current step navigation and text status messaging.

### `skills/engage-red-hat-support/SKILL.md`

- Update workflow guidance to require explicit Step 2 consent mint before `generate_sosreport`.
- Add non-UI fallback sequence for explicit mint endpoint call then tool invocation with consent token.
- Reiterate PAT boundary unchanged and no secret-bearing prompts/tool args beyond scoped consent evidence.

### Contracts and workflow docs

- Update canonical workflow contract:
  - `specs/007-engage-red-hat-support/contracts/engage-workflow-contract.json`
- Update feature-level workflow contract:
  - `specs/010-engage-support-workflow/contracts/engage-workflow-contract.v2.json`
- Add feature contracts in this spec:
  - `specs/011-consent-gate-sosreport/contracts/consent-endpoint.openapi.yaml`
  - `specs/011-consent-gate-sosreport/contracts/sensitive-tool-policy.contract.json`
  - `specs/011-consent-gate-sosreport/contracts/engage-consent-workflow.contract.v3.json`

### Operator and project docs

- Update `README.md` with consent-gated Step 2 behavior and compatibility notes.
- Update `docs/operator-guide.md` with mint endpoint operations, expiry/replay failure handling, and non-UI explicit flow.
- Update `docs/security-model.md` with consent token trust model and residual-risk handling.

### Test plan by file

- **Contract tests**
  - `tests/contract/sosreport-tools.contract.test.ts`: assert `generate_sosreport` consent input contract and metadata stability.
  - `tests/contract/engage-red-hat-support.contract.test.ts`: assert workflow contract requires consent gate and stable entry/resource/tool surfaces.
- **Integration tests**
  - `tests/integration/sosreport-generate.failures.test.ts`: missing token, malformed token, expired token, replay token, wrong-user token, wrong-scope token.
  - `tests/integration/sosreport-generate.success.test.ts`: explicit Step 2 mint + generate happy path.
  - `tests/integration/engage-red-hat-support.workflow.test.ts`: Step 2 UI click path mints then generates; no implicit generation on load/nav.
- **Regression tests**
  - `tests/regression/mcp-tool-surface-preservation.test.ts`: unchanged unrelated tool/resource surfaces.
  - `tests/regression/skill-resource-preservation.test.ts`: skill URI/content remains available with updated instructions.
  - `tests/regression/no-pat-leakage-mcp.test.ts`: PAT boundary unchanged and no secret leakage in MCP payloads/messages.
- **Unit tests**
  - `tests/unit/consent-token-service.test.ts`: signature validation, claim validation, single-use consume semantics.
  - `tests/unit/sensitive-tool-policy.test.ts`: centralized deny/allow decisions and safe failure text.

## Security Gate Checks

- **Gate A - Explicit human consent required**: `generate_sosreport` path must fail closed without fresh valid consent token.
- **Gate B - Token trustworthiness**: token must be server-minted, signed, short-lived, scoped, user/session-bound, and single-use.
- **Gate C - Replay resistance**: first successful consume marks `jti` used; subsequent calls deny deterministically.
- **Gate D - Secret boundary**: PAT boundary remains at secure intake endpoint; no PAT/token leakage in logs, tools, or model-visible outputs.
- **Gate E - Compatibility**: `ui://engage-red-hat-support/app.html` stable; existing MCP tool names stable except required consent input addition.

## Residual Risks and Handling

- **Risk**: In-memory single-use store may not prevent replay across horizontally scaled instances.
  - **Handling**: document requirement for shared durable nonce store in multi-instance deployment profile.
- **Risk**: Clock skew could create false-expired or false-valid windows.
  - **Handling**: apply bounded skew tolerance and monitor denial-rate anomalies.
- **Risk**: Overly verbose errors may leak validation internals.
  - **Handling**: standardized safe denial text with operator guidance only.

## Complexity Tracking

No constitution violations to justify.
