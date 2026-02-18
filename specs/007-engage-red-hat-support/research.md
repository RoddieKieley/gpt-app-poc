# Research: Engage Red Hat Support (Option A)

**Feature**: 007-engage-red-hat-support  
**Date**: 2026-02-18

## Decision: Use Option A orchestration (UI/skill orchestrates existing tools)

**Decision**: Implement orchestration in `src/mcp-app.ts` and skill guidance, using existing tools and endpoints in sequence: secure PAT intake -> connection verification -> `generate_sosreport` -> `fetch_sosreport` -> `jira_attach_artifact`.

**Rationale**: Meets approved scope, avoids introducing a new MCP orchestration tool, and reuses existing tested tool contracts.

**Alternatives considered**:
- New MCP orchestration tool for one-call workflow - rejected because scope explicitly disallows new orchestration tooling.
- Backend-only orchestration endpoint - rejected to preserve current MCP tool surfaces and host compatibility model.

---

## Decision: Maintain hybrid standards profile for UI resources

**Decision**: Keep ext-apps SDK registration patterns and required OpenAI widget metadata while adding `ui://engage-red-hat-support/app.html` and preserving MCP Apps `ui://` + JSON-RPC semantics.

**Rationale**: Current project already follows this model and tests can enforce non-regression on metadata and fallback behavior.

**Alternatives considered**:
- Pure MCP Apps metadata without OpenAI widget keys - rejected because required for ChatGPT Apps distribution compatibility.
- Host-specific runtime APIs - rejected by constitution portability/compliance principles.

---

## Decision: Enforce Linux-only product gate in orchestration

**Decision**: Require Linux as the only valid product selection for the Engage flow and block progression for any non-Linux selection.

**Rationale**: Directly satisfies feature scope and avoids unsupported diagnostic permutations in this increment.

**Alternatives considered**:
- Allow product free-form entry - rejected due to ambiguity and higher regression risk.
- Multi-product support - rejected as out of scope.

---

## Decision: Preserve strict PAT secret boundary

**Decision**: PAT entry remains allowed only through secure backend endpoint intake (`POST /api/jira/connections`), with encrypted storage and opaque `connection_id` used in all MCP calls and outputs.

**Rationale**: Aligns with constitution principle 8 and existing security model controls.

**Alternatives considered**:
- PAT in MCP tool arguments - rejected as prohibited by constitution and current contract patterns.
- PAT in UI-to-tool bridge payloads - rejected because model-visible payloads must not contain secrets.

---

## Decision: Failure-stop orchestration with step-specific retry guidance

**Decision**: If any step fails, stop the sequence, keep PAT boundaries intact, and present actionable retry guidance naming the failed step.

**Rationale**: Prevents unsafe continuation and simplifies operator troubleshooting while preserving data boundaries.

**Alternatives considered**:
- Automatic retries across all failures - rejected due to risk of repeated unauthorized/invalid operations.
- Generic failure messaging - rejected because it reduces operator recoverability.

---

## Decision: Preserve backward compatibility and strengthen regression coverage

**Decision**: Keep existing `jira_*`, sosreport, and skill/resource behavior unchanged and add contract/regression assertions for new `ui://` and `skill://` resources plus PAT non-leakage.

**Rationale**: Feature must coexist with prior increments without surface regressions.

**Alternatives considered**:
- Refactor existing tool schemas while adding Engage flow - rejected due to unnecessary churn and compatibility risk.
- Rely on manual verification only - rejected; automated tests are required by constitution quality gates.

---

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| PAT leakage through MCP payloads/results/logs | Enforce backend-only PAT intake, keep opaque `connection_id` in MCP interfaces, and add regression checks for forbidden secret fields |
| Existing tool metadata or behavior regressions | Extend contract/regression tests for tool/resource surfaces and widget metadata invariants |
| UI changes break existing flows due to shared bundle | Keep explicit flow routing and validate existing plus new UI paths in integration tests |
| Connection status invalid during attach stage | Verify connection before progression and stop with reconnect guidance |
| Non-UI hosts lose usability | Maintain complete text fallback guidance with equivalent sequence and required inputs |

---

## Phase Boundaries

- **In scope**: Option A orchestration through UI/skill, Linux-only gate, secret-boundary enforcement, contracts/tests/docs updates.
- **Out of scope**: New MCP orchestration tool, non-Linux product support, broad architectural refactor outside listed files.
