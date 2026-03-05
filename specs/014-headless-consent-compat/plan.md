# Implementation Plan: Headless Consent Compatibility and Parsing Guarantees

**Branch**: `014-headless-consent-compat` | **Date**: 2026-03-05 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `/specs/014-headless-consent-compat/spec.md`

## Summary

Formalize and lock existing headless consent behavior as explicit compatibility and security guarantees without changing established web UI flow behavior. The implementation emphasis is gap analysis and additive deltas: contracts, docs, and regression coverage that prove explicit permission gating, structured-first token parsing with text fallback, and no web regressions.

## Scope Summary and Architecture Impact

- **Scope**: Convert implemented headless consent and parsing behavior into explicit feature artifacts for package `014`, including plan/research/data model/contracts/quickstart and targeted test/docs alignment.
- **Architecture impact**: No net-new runtime subsystem is required; existing MCP tooling, consent enforcement, and web endpoint behavior remain the operational baseline.
- **Expected runtime delta**: Minimal to none if current behavior already satisfies requirements; focus is on validation hardening and compatibility documentation.
- **Preservation rule**: Existing UI/web consent route semantics remain unchanged and are protected by regression verification.

## Technical Context

**Language/Version**: TypeScript (Node.js, ESM)  
**Primary Dependencies**: `@modelcontextprotocol/sdk`, `@modelcontextprotocol/ext-apps`, `express`, `zod`, `tsx`  
**Storage**: Existing in-memory workflow/session and consent state; no new persistence required  
**Testing**: `tsx --test` suites across `tests/unit`, `tests/integration`, `tests/contract`, `tests/regression`  
**Target Platform**: Linux-hosted MCP server used by web UI and headless/text bridge clients  
**Project Type**: Single-project backend + MCP app resources  
**Performance Goals**: Preserve current near-immediate consent mint and generate gating behavior; no added round trips for web  
**Constraints**: Additive-only updates; no edits to historical specs; preserve existing web flow; keep fail-closed consent checks  
**Scale/Scope**: Spec package `014` artifacts plus focused contracts/docs/tests and optional descriptor alignment

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **1. Support-Workflow Fidelity**: Keeps existing support workflow sequence and sosreport-first diagnostics model. **Pass.**
- **2. Human-Authorized Diagnostics**: Requires explicit headless permission before mint; no implicit diagnostics collection. **Pass.**
- **3. Privacy-First Diagnostics**: No new diagnostic data surfaces; deny-path messaging remains non-secret and actionable. **Pass.**
- **4. Strict MCP Apps Compliance**: Uses existing MCP tool/resource model with host-agnostic behavior. **Pass.**
- **5. Graceful Degradation**: Formalizes structured-first and text fallback behavior for non-UI hosts. **Pass.**
- **6. Portability and Interop**: Bridge compatibility is explicitly documented without host-branching runtime logic. **Pass.**
- **7. Incremental Spec-Driven Delivery**: Produces complete 014 planning artifacts for subsequent tasks/implementation. **Pass.**
- **8. Secret Boundary**: No secret-bearing payload expansion; permission and consent semantics remain explicit. **Pass.**
- **9. Non-Retroactive Specification Integrity**: All changes are confined to `specs/014-headless-consent-compat/`. **Pass.**

**Post-Design Re-check**: Pass. Phase-1 artifacts remain additive, preserve web behavior, and avoid retroactive edits to prior spec packages.

## Current-State vs Required-State Gap Analysis

| Area | Current State | Required State | Gap | Planned Delta |
|------|---------------|----------------|-----|---------------|
| Headless explicit permission | `mint_engage_consent_token` denies when `permission_granted` is not true | Explicit permission requirement must be codified and validated by feature artifacts | Documentation/contract formalization gap | Add 014 contracts + test assertions + operator guidance alignment |
| Mint response parsing | Mint returns structured fields and text fallback lines | Clients must prefer structured fields and support text fallback parsing | Compatibility contract not yet in 014 package | Add compatibility contract + quickstart parsing rules |
| Required headless sequence | Start -> select product -> mint -> generate -> fetch behavior already enforced | Sequence and denial semantics must be explicitly guaranteed | Formal sequence guarantee not yet in 014 package | Add headless sequence contract and validation matrix |
| Web/UI compatibility | Existing web consent flow and endpoint behavior are intact | No web behavior regressions allowed | Need stronger 014 no-regression evidence | Add explicit web no-regression contract/test references |
| Historical spec immutability | Prior specs exist and should not be changed | New work must be additive in 014 only | Governance traceability needs explicit plan guardrails | Restrict all new artifacts to 014 and link existing tests/contracts by reference |

## Ordered Phases

### Phase 0 - Research and decision closure

1. Confirm that all technical unknowns are already resolved by current code behavior and prior completed implementation.
2. Decide no-op threshold criteria for runtime code changes versus artifact-only updates.
3. Define bridge/client backward-compatibility commitments for structured-first parsing and text fallback behavior.
4. Define explicit risk controls for preserving web UI behavior while updating docs/contracts/tests.

**Exit criteria**:
- `research.md` contains decisions, rationale, and alternatives.
- No unresolved clarification markers remain.

### Phase 1 - Design, contracts, and verification framing

1. Produce `data-model.md` focused on permission signal, mint response compatibility, workflow sequence, and deny outcomes.
2. Produce additive contracts in `specs/014-headless-consent-compat/contracts/` for:
   - explicit permission + mint output compatibility,
   - required headless sequence and failure behavior,
   - web/UI no-regression compatibility guarantee.
3. Produce `quickstart.md` with validation strategy and execution order.
4. Run `.specify/scripts/bash/update-agent-context.sh cursor-agent`.
5. Re-check constitution gates post-design.

**Exit criteria**:
- Design artifacts align to the 014 spec and current code behavior.
- Validation strategy explicitly covers permission path, parsing compatibility, and web no-regression.

### Phase 2 - Implementation sequencing (for `/speckit.tasks`)

1. Apply minimum additive deltas identified by gap analysis.
2. Prioritize tests/docs/contracts updates first when runtime behavior already conforms.
3. Keep all changes backward-compatible for bridge clients and web users.

## File-Level Change Strategy

### `server.ts`

- Prefer no runtime behavior changes unless a validation gap is found.
- If required, only additive hardening for explicit deny guidance or parsing clarity; do not alter web consent endpoint semantics.

### `src/sosreport/sosreport-tool-schemas.ts`

- Confirm `permission_granted` and optional workflow session inputs stay aligned with documented contract.
- Apply additive schema clarifications only if test/contract drift is found.

### `tests/integration/sosreport-generate.failures.test.ts`

- Ensure explicit permission denial and sequence failure paths remain covered and mapped to expected reason codes.

### `tests/integration/sosreport-generate.success.test.ts`

- Ensure headless happy path and parsing compatibility expectations are asserted.

### `tests/integration/engage-red-hat-support.workflow.test.ts`

- Preserve and/or extend web consent no-regression verification.

### `tests/contract/sosreport-tools.contract.test.ts`

- Keep tool surface and input compatibility checks aligned with 014 contracts.

### `tests/contract/engage-red-hat-support.contract.test.ts`

- Additive assertions for new 014 contract artifacts only.

### `README.md`, `docs/operator-guide.md`, `skills/engage-red-hat-support/SKILL.md`

- Confirm guidance language mirrors 014 compatibility and permission constraints.
- Update only where wording gaps exist; do not alter workflow intent.

### `specs/014-headless-consent-compat/contracts/*`

- Add new versioned contract files for permission/path/parsing/no-regression guarantees.

## Validation Strategy

- **Headless explicit permission path**:
  - Verify mint denial when `permission_granted` is absent/false.
  - Verify mint success and token issuance when `permission_granted=true`.
- **Structured-first parsing + text fallback**:
  - Verify `structuredContent` is the primary extraction source.
  - Verify fallback parsing from text output remains valid for bridge clients.
- **Web/UI no-regression verification**:
  - Verify web consent route behavior remains unchanged.
  - Verify existing UI flow still mints consent explicitly and does not auto-collect diagnostics.
- **Conformance checks**:
  - Ensure contracts/docs/tests in 014 are internally consistent and reflect current implementation.

## Risks and Mitigations

- **Risk**: Runtime changes accidentally regress web behavior.  
  **Mitigation**: Prefer no-op runtime path; gate with existing web regression tests.
- **Risk**: Bridge clients depend on text fallback parsing edge behavior.  
  **Mitigation**: Keep structured-first + text fallback contract explicit and test-backed.
- **Risk**: Spec says more than code guarantees today.  
  **Mitigation**: Gap analysis first; only claim behaviors validated by existing tests or planned additive checks.
- **Risk**: Retroactive edits to older spec packages.  
  **Mitigation**: Restrict all new artifacts to `specs/014-headless-consent-compat/`.

## Rollout and Backward Compatibility Notes

- Rollout is additive and compatibility-first: keep existing web UI flow unchanged.
- Bridge clients should treat structured mint fields as authoritative and retain text fallback parsing for compatibility.
- If runtime code remains unchanged, release notes should state "specification and verification hardening" rather than behavior change.
- Any optional descriptor updates must preserve existing fields and semantics while clarifying parse expectations.

## No-op Possibility

If validation confirms behavior already satisfies the 014 spec, the minimum required update set is:

1. New 014 planning/design artifacts (`plan.md`, `research.md`, `data-model.md`, `quickstart.md`, contracts).
2. Additive contract assertions/tests proving:
   - explicit headless permission gating,
   - structured-first parsing with text fallback,
   - web/UI no-regression.
3. Documentation/tool-descriptor wording alignment only, with no runtime logic changes.

## Implementation Outcome (Phase Execution)

- **Decision**: No runtime code delta required for permission gate, headless sequence, or web flow semantics after verification.
- **Applied deltas**:
  - Added 014-focused contract assertions and compatibility checks in contract tests.
  - Added explicit structured-first and text-fallback parsing validation in integration tests.
  - Added FR/AC evidence mapping and release-readiness checklist entries in 014 checklist artifacts.
- **Deferred runtime edits**: `server.ts` and schema behavior retained as-is because verified behavior already satisfies 014 requirements.

## Project Structure

### Documentation (this feature)

```text
specs/014-headless-consent-compat/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── headless-consent-permission.contract.v1.json
│   ├── mint-output-parsing-compat.contract.v1.json
│   └── web-consent-regression-compat.contract.v1.json
└── tasks.md
```

### Source Code (repository root)

```text
server.ts
src/sosreport/sosreport-tool-schemas.ts
README.md
docs/operator-guide.md
skills/engage-red-hat-support/SKILL.md
tests/integration/sosreport-generate.failures.test.ts
tests/integration/sosreport-generate.success.test.ts
tests/integration/engage-red-hat-support.workflow.test.ts
tests/contract/sosreport-tools.contract.test.ts
tests/contract/engage-red-hat-support.contract.test.ts
```

**Structure Decision**: Keep the existing single-project architecture and apply additive, compatibility-focused deltas; treat runtime code changes as optional and only for validated gaps.

## Complexity Tracking

No constitution violations to justify.
