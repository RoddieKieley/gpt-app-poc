# Implementation Plan: MCP Runtime Skill Discovery (Hello World Skill)

**Branch**: `005-mcp-skill-discovery` | **Date**: 2026-02-13 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `/specs/005-mcp-skill-discovery/spec.md`

**Scope**: Two increments only. No expansion into Linux/Jira flow. Existing Jira behavior and tests preserved.

## Summary

Expose a repo-local Hello World skill (SKILL.md) as a canonical MCP resource at a stable `skill://` URI with markdown read and list support, then add a small read-only discovery tool that returns a text fallback and references the same canonical URI. Delivers runtime skill discovery for MCP clients without changing existing tools or UI.

## Technical Context

**Language/Version**: TypeScript (Node.js 18+)  
**Primary Dependencies**: @modelcontextprotocol/sdk, @modelcontextprotocol/ext-apps, Express, existing server stack (unchanged for Jira)  
**Storage**: Repo-local file only — `SKILL.md` on disk (path TBD under repo root or `specs/`); no new persistence  
**Testing**: Existing `tsx` + `npm run test:mcp`; add assertions for skill resource read/list and discovery tool (no changes to Jira tests)  
**Target Platform**: Same as current (Linux/macOS dev host; MCP over HTTP)  
**Project Type**: Single project; this feature adds one resource and one tool to the existing server  
**Performance Goals**: Resource read and discovery tool response &lt;500ms p95 in dev  
**Constraints**: Canonical URI scheme `skill://`; markdown MIME for resource; discovery tool read-only with text fallback; no Jira/Linux flow changes  
**Scale/Scope**: One skill (Hello World), one canonical URI, one discovery tool; future multi-skill out of scope

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Diagnostics / read-only MCP**: Skill resource and discovery tool are read-only; no diagnostics or credentials. **Pass.**
- **MCP Apps compliance**: Feature adds a `skill://` resource and a tool; existing `ui://` and JSON-RPC unchanged. **Pass.**
- **Text fallbacks**: Discovery tool response MUST include user-actionable text (e.g., skill URI and short description) so non-UI hosts can use it. **Pass.**
- **Redaction / least-scope**: No sensitive data in skill document or discovery response. **Pass.**

**Post-Design Re-check**: Pass (design does not introduce new constitution violations).

## Project Structure

### Documentation (this feature)

```text
specs/005-mcp-skill-discovery/
├── plan.md              # This file
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/           # Phase 1 (MCP resource + tool contracts)
└── tasks.md             # Phase 2 (/speckit.tasks)
```

### Source Code (repository root)

No new top-level directories. Changes confined to:

- **server.ts**: Register skill resource (read + list) at canonical `skill://` URI; register discovery tool.
- **Repo-local SKILL.md**: One file (e.g. `skills/hello-world/SKILL.md` or `specs/005-mcp-skill-discovery/SKILL.md`) — exact path in data-model/contracts.
- **scripts/mcp-smoke-tests.ts**: Add checks for skill resource and discovery tool (no Jira test changes).
- **tests/**: Optional small unit or contract test for discovery tool and resource handler only; existing Jira/integration/regression tests untouched.

**Structure Decision**: Single project; skill is a new resource + tool on the existing server. SKILL.md lives in repo under a single canonical path; server reads it at runtime for `resources/read` and advertises it in `resources/list`.

## Complexity Tracking

No constitution violations to justify.

## Increment Summary

| Increment | Scope | Deliverable |
|-----------|--------|-------------|
| **1** | Expose SKILL.md as MCP resource | Canonical `skill://` URI; markdown read; resource listed in MCP resources/list |
| **2** | Read-only discovery tool | One tool returning text fallback + same canonical URI; no side effects |
