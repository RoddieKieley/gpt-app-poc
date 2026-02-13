# Research: MCP Runtime Skill Discovery (Hello World Skill)

**Feature**: 005-mcp-skill-discovery  
**Date**: 2026-02-13

## Decision: Canonical skill URI scheme and format

**Decision**: Use a single canonical URI for the Hello World skill: `skill://hello-world/SKILL.md`. The same URI is used for MCP resource read and for the discovery tool response.

**Rationale**: Aligns with spec (single source of truth). The `skill://` scheme distinguishes skill resources from `ui://` and `file://` and is human-readable. Path segment `SKILL.md` matches the canonical document name in agent-skills ecosystems.

**Alternatives considered**: `file://` (repo path) — rejected to avoid host-dependent paths. `ui://` — rejected so skill content is clearly document/resource, not UI. Generic `mcp://` — rejected in favor of domain-specific `skill://`.

---

## Decision: Repo-local SKILL.md location

**Decision**: Place the Hello World skill document at `skills/hello-world/SKILL.md` under the repository root. The server resolves this path at runtime when handling `resources/read` for the canonical URI.

**Rationale**: Keeps skills in a dedicated directory, scalable to future skills (e.g. `skills/other-name/SKILL.md`) without touching spec docs. Clear separation from `specs/` (planning) and `src/` (implementation).

**Alternatives considered**: `specs/005-mcp-skill-discovery/SKILL.md` — rejected to avoid coupling skill content to a single feature folder. Root-level `SKILL.md` — rejected to allow multiple skills later.

---

## Decision: Markdown read and list support

**Decision**: (1) Serve the skill resource with MIME type `text/markdown` for `resources/read`. (2) Ensure the skill resource is advertised in MCP `resources/list` so clients can discover it without prior knowledge of the URI.

**Rationale**: Spec requires "markdown read/list support." MCP defines `resources/list` for discovery and `resources/read` for content; using standard markdown MIME keeps clients able to render or parse the skill document.

**Alternatives considered**: Plain text — rejected because SKILL.md is markdown. Custom MIME — rejected to favor standard `text/markdown` for interop.

---

## Decision: Discovery tool response shape (text fallback + URI)

**Decision**: The discovery tool returns a response that includes (a) user-actionable text (e.g., skill name, description, and the canonical URI in plain text) and (b) the same canonical URI as a structured reference when useful. Tool is read-only; no arguments required.

**Rationale**: Constitution requires text fallbacks for non-UI hosts. Including the URI in the text ensures CLI and text-only clients can use it; structured reference supports future tooling that parses the response.

**Alternatives considered**: URI-only response — rejected (no text fallback). Side effects (e.g., caching) — rejected; tool is read-only per spec.

---

## Scope boundaries (no expansion)

- **Linux/Jira flow**: No changes to Jira tools, connection lifecycle, or Linux MCP usage. No new dependencies on Jira or Linux-specific MCP servers.
- **Existing tests**: Jira-related tests (contract, integration, regression) and existing MCP smoke tests for UI/resources remain unchanged except where adding skill resource and discovery tool checks is necessary. No removal or weakening of existing assertions.
