# Implementation Plan: UI-First Split Readiness Updates

**Branch**: `015-engage-support-split` | **Date**: 2026-03-06 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `/specs/015-engage-support-split/spec.md`

## Summary

Implement minimal, targeted split-readiness updates that keep `engage-red-hat-support` as the primary UI-first skill while defining deterministic text-only fallback contracts and migration semantics for a future alternate headless skill. Delivery is additive and backward-compatible: no new headless skill file, no removal of UI resources, and no regressions to current web/UI flow behavior.

## Technical Context

**Language/Version**: TypeScript (Node.js ESM) + Markdown/JSON contract artifacts  
**Primary Dependencies**: `@modelcontextprotocol/sdk`, `@modelcontextprotocol/ext-apps`, `express`, `zod`, `tsx --test`  
**Storage**: Existing in-memory workflow state + existing backend secure token vault; no new datastore  
**Testing**: `tsx --test` across `tests/contract`, `tests/integration`, `tests/regression`, plus additive split-readiness checks  
**Target Platform**: Linux-hosted MCP app/server consumed by web UI and text-only bridge clients  
**Project Type**: Single backend project with MCP app resources and spec-driven contract docs  
**Performance Goals**: No measurable regression in current web/UI step latency; text-only fallback parse remains deterministic in one pass  
**Constraints**: No creation/registration of new headless skill, no UI behavior removal, preserve PAT secure-intake boundary and explicit consent requirements  
**Scale/Scope**: Targeted edits to skill/docs/contracts/tests for routing semantics and handoff parity (`job_id`, `fetch_reference`, `connection_id`)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **1. Support-Workflow Fidelity**: Preserve support workflow sequence and required handoff identifiers while clarifying host routing semantics. **Pass.**
- **2. Human-Authorized Diagnostics**: Maintain explicit consent before invasive diagnostics and keep no implicit diagnostics execution. **Pass.**
- **3. Privacy-First Diagnostics**: Keep secret-safe messaging and least-scope handling; no additional sensitive data exposure in fallback text. **Pass.**
- **4. Strict MCP Apps Compliance**: Continue using `ui://` resources and JSON-RPC bridge semantics with no host-specific runtime branching. **Pass.**
- **5. Graceful Degradation**: Strengthen deterministic text fallback requirements for non-UI hosts. **Pass.**
- **6. Portability and Interop**: Use host-capability routing language without host-specific implementation coupling. **Pass.**
- **7. Incremental Spec-Driven Delivery**: Deliver this work through 015 plan/research/data model/contracts/quickstart/tasks flow. **Pass.**
- **8. Secret Boundary for Tokens/Credentials**: Preserve PAT intake only via secure backend endpoint and opaque `connection_id` use thereafter. **Pass.**
- **9. Non-Retroactive Specification Integrity**: New contracts and migration guidance live in `specs/015-engage-support-split/`; prior spec packages remain immutable. **Pass.**

**Post-Design Re-check**: Pass. Phase-1 artifacts preserve all constitutional constraints and avoid retroactive modifications to prior spec packages.

## Phase 0 Research Output Summary

- Deterministic fallback contract pattern: canonical `structuredContent` plus single machine-parseable text block with stable `key: value` lines for critical keys.
- Validation strategy: three-layer safety net (`contract`, `integration`, `regression`) plus dedicated text-only completion verification that ignores `structuredContent`.
- Migration semantics: additive compatibility hardening, explicit UI-first primary skill, and alternate headless skill URI placeholder only (no skill creation in this phase).

## Phase 1 Design Decisions

1. **Contract placement**: Add new split-readiness contracts under `specs/015-engage-support-split/contracts/` instead of editing historical spec packages.
2. **Handoff parity scope**: Enforce deterministic parity requirements for `job_id`, `fetch_reference`, and `connection_id` across structured and text representations.
3. **Backward compatibility**: Preserve existing UI/web semantics and prior headless compatibility guarantees from `specs/014-headless-consent-compat/contracts/*` via reference and regression assertions.
4. **Migration note**: Define routing semantics as "UI-first skill plus alternate headless skill route placeholder" without creating the headless skill file or URI registration.

## File-Level Change Strategy

### Required documentation/skill updates

- `skills/engage-red-hat-support/SKILL.md`
  - Clarify primary UI-first intent and explicit host-capability routing behavior.
  - Add alternate headless skill URI placeholder guidance for non-UI hosts.
  - Keep secure PAT intake and explicit consent language unchanged.
- `docs/operator-guide.md`
  - Add environment-selection rules (UI-capable vs text-only hosts).
  - Document deterministic fallback text parsing guarantees for critical handoff keys.
  - Add migration note: additive split-readiness only; no new headless skill yet.
- `docs/security-model.md`
  - Codify text fallback contract security expectations (no secret expansion, deterministic key output).
  - Re-affirm PAT intake boundary and explicit consent before invasive diagnostics.

### Contracts and compatibility baselines

- `specs/014-headless-consent-compat/contracts/*`
  - **No direct edits planned** due to Constitution Principle 9 (historical package immutability).
  - Use as compatibility baseline in tests and 015 migration references.
- `specs/015-engage-support-split/contracts/*` (new)
  - Add routing-semantics contract for UI-first + alternate-headless placeholder behavior.
  - Add handoff parity contract for `job_id`, `fetch_reference`, `connection_id`.
  - Add web/UI non-regression contract preserving existing behavior.

### Additional compatibility tests and validations

- `tests/contract/engage-red-hat-support.contract.test.ts`
  - Add assertions for new 015 contracts and verify they preserve 014 baselines.
- `tests/integration/engage-red-hat-support.workflow.test.ts`
  - Add explicit non-regression assertions for existing web/UI flow behavior.
  - Add text-only completion path assertions where parsing proceeds from `content.text` when `structuredContent` is unavailable.
- `tests/integration/sosreport-generate.success.test.ts` and/or new split-focused integration test
  - Verify deterministic text keys for `job_id` and `fetch_reference` and parity with structured outputs.
- `tests/integration/jira-connection.lifecycle.test.ts` and/or new split-focused integration test
  - Verify deterministic `connection_id` text output and structured/text parity.

## Validation Strategy

### 1) Existing web/UI non-regression checks (must stay green)

- Preserve resource discoverability and output-template bindings.
- Preserve step sequencing and existing UI route semantics.
- Preserve explicit consent mint behavior and no auto diagnostics collection.

### 2) Text-only completion proof when `structuredContent` is unavailable

- Add a test harness mode that intentionally reads only `content.text`.
- Validate end-to-end handoff progression using parsed text keys:
  - `job_id` from generate status path,
  - `fetch_reference` for fetch handoff,
  - `connection_id` for Jira operations.
- Verify machine parsing remains deterministic and single-pass for required keys.

### 3) Structured/text parity checks

- For each critical handoff key present in structured output, require exact value parity in deterministic text fallback output.
- Require stable key labels and one occurrence per key in parse block.

### 4) Security boundary checks

- Assert no PAT exposure in MCP args/results or logs.
- Assert explicit consent gating remains mandatory prior to invasive diagnostics.

## Risks and Mitigations

- **Risk**: Text fallback contract tightening breaks existing bridge parsers.
  - **Mitigation**: Maintain compatible `key: value` labeling and add parity + format contract tests before any wording refinements.
- **Risk**: Contract updates accidentally imply runtime behavior changes not implemented.
  - **Mitigation**: Constrain contract language to current observed behavior and mark future headless skill as placeholder-only.
- **Risk**: Non-regression drift in web/UI flow while adding split-readiness language.
  - **Mitigation**: Keep UI resources and route semantics unchanged; gate on existing regression suites plus targeted additions.
- **Risk**: Retroactive edits to prior spec packages due to compatibility references.
  - **Mitigation**: Treat `specs/014-headless-consent-compat/contracts/*` as immutable baseline and add all new artifacts under 015.

## Migration Note Strategy

- Publish migration semantics as additive update:
  - Primary route remains the UI-first `engage-red-hat-support` skill.
  - If UI is unavailable, skill response points to an alternate headless skill URI placeholder.
  - No new headless skill file/registration is part of this phase.
  - Existing web/UI behavior and security boundaries remain unchanged.

## Project Structure

### Documentation (this feature)

```text
specs/015-engage-support-split/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── ui-headless-routing-semantics.contract.v1.json
│   ├── handoff-text-structured-parity.contract.v1.json
│   └── web-ui-split-readiness-regression.contract.v1.json
└── tasks.md
```

### Source Code (repository root)

```text
skills/engage-red-hat-support/SKILL.md
docs/operator-guide.md
docs/security-model.md
tests/contract/engage-red-hat-support.contract.test.ts
tests/integration/engage-red-hat-support.workflow.test.ts
tests/integration/sosreport-generate.success.test.ts
tests/integration/jira-connection.lifecycle.test.ts
specs/014-headless-consent-compat/contracts/*
```

**Structure Decision**: Keep the current single-project architecture and apply minimal, targeted additive updates. Historical spec contracts under `014` are reference-only; all new split-readiness contracts and design artifacts are created in `015`.

## Complexity Tracking

No constitution violations require justification.
