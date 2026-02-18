# Research: Get Skill Tool Fallback

**Feature**: 009-get-skill-tool  
**Date**: 2026-02-18

## Decision: Add `get_skill` as an additive read-only MCP tool

**Decision**: Register a new `get_skill` tool while preserving `list_skills`, existing skill resource registration, and Jira/sosreport tool surfaces unchanged.

**Rationale**: The host-compatibility gap is specifically that some sessions cannot call `resources/read`; an additive tool is the smallest change that solves this without altering current contracts.

**Alternatives considered**:
- Modify `list_skills` to return full markdown - rejected because it changes existing tool behavior and payload expectations.
- Replace skill resource usage entirely with tools - rejected because existing `resources/read` behavior must remain intact.

---

## Decision: Bind supported URIs to existing registered skill identity

**Decision**: Validate `uri` for non-empty `skill://` format and require a known registered skill identity, beginning with `skill://engage-red-hat-support/SKILL.md`.

**Rationale**: Enforces bounded scope and prevents accidental file-path access patterns or open-world URI resolution.

**Alternatives considered**:
- Accept any `skill://` URI and attempt dynamic file read - rejected due to security and unpredictability risks.
- Accept any URI scheme - rejected because requirement calls for skill URI semantics and actionable failure on invalid input.

---

## Decision: Reuse existing skill markdown loader and constants

**Decision**: Reuse `ENGAGE_SKILL_RESOURCE_URI`, `SKILL_RESOURCE_MIME_TYPE`, and `loadEngageSkillMarkdown` in the new tool handler.

**Rationale**: Guarantees parity between `resources/read` and `tools/call get_skill` responses and minimizes maintenance overhead.

**Alternatives considered**:
- Duplicate file-loading logic in `get_skill` - rejected due to drift risk.
- Return static markdown string in tool - rejected because resource parity and fallback behavior could diverge.

---

## Decision: Return both text fallback and structured content

**Decision**: For successful calls, return:
- `content` text fallback with URI and markdown body, and
- `structuredContent` with `{ uri, mimeType: "text/markdown", text }`.

For invalid/unsupported URI, return `isError: true` with actionable remediation text and no secret-bearing details.

**Rationale**: Satisfies graceful degradation for non-UI hosts while enabling structured consumers to parse predictable fields.

**Alternatives considered**:
- Structured-only response - rejected because non-UI host fallback is mandatory.
- Text-only response - rejected because structured content is an explicit desired contract and improves client interoperability.

---

## Decision: Preserve metadata conventions from existing tools

**Decision**: Follow current tool registration metadata pattern with:
- `_meta.ui.resourceUri` and `openai/outputTemplate` set to engage UI URI,
- `openai/widgetAccessible` true,
- annotations `readOnlyHint: true`, `openWorldHint: false`, `destructiveHint: false`.

**Rationale**: Maintains consistent tool listing semantics and avoids host-specific inconsistencies.

**Alternatives considered**:
- Omit metadata for `get_skill` - rejected because existing tools consistently include output template metadata and tests validate this shape.

---

## Decision: Validate parity and compatibility with targeted tests

**Decision**: Update:
- `tests/contract/engage-red-hat-support.contract.test.ts`
- `tests/regression/mcp-tool-surface-preservation.test.ts`
- `tests/regression/skill-resource-preservation.test.ts`
- `scripts/mcp-smoke-tests.ts`

to assert tool discovery, call behavior, error safety, and `resources/read` parity.

**Rationale**: Adds confidence that `get_skill` solves the host gap while preventing regressions in existing MCP surfaces.

**Alternatives considered**:
- Manual testing only - rejected due to regression risk and constitution quality gates requiring test coverage for fallback behavior.

---

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| New tool introduces regressions in existing tool/resource catalog | Additive registration only; keep existing lists/resources assertions and extend them with `get_skill` checks |
| Unsupported URI errors are vague or unsafe | Return clear remediation text referencing required URI format and discovery via `list_skills`, with no internal stack details |
| Tool/resource markdown outputs diverge over time | Reuse shared loader/constants and add parity assertions in contract + smoke checks |
| Sensitive values leak in output/logs | Keep input schema to URI only, sanitize error text, and assert no secret-like fields in new response paths |
