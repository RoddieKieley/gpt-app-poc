# Data Model: MCP Runtime Skill Discovery (Hello World Skill)

**Feature**: 005-mcp-skill-discovery  
**Date**: 2026-02-13

This feature does not introduce new stored state or databases. It adds a single logical entity exposed via MCP and one repo-local file.

## Entities

### Canonical skill URI

- **Identifier**: `skill://hello-world/SKILL.md` (stable, single source of truth).
- **Role**: MCP resource URI for read/list; same URI returned by the discovery tool.
- **Validation**: Opaque to clients; server maps this URI to the repo-local file path.

### SKILL.md (canonical skill document)

- **Location**: Repo-local file at `skills/hello-world/SKILL.md`.
- **Content**: Markdown document defining the Hello World skill (name, description, when to use, procedural guidance per agent-skills style).
- **MIME type**: `text/markdown` when served via MCP resource read.
- **State**: Read-only at runtime; no versioning or mutation in this feature. If the file is missing, server returns an error or minimal fallback for the resource and discovery tool may still return the URI with an availability note.

### Discovery tool (runtime only)

- **Name**: Single MCP tool (e.g. `list_skills` or `skill_discovery` — see contracts).
- **Input**: No required arguments (read-only discovery).
- **Output**: Response content must include (a) user-actionable text (skill name, short description, canonical URI in plain text) and (b) the same canonical URI as the reference. No side effects; no stored state.

## Relationships

- One canonical URI → one repo-local file path (`skills/hello-world/SKILL.md`).
- One discovery tool → returns/references that single canonical URI.
- No relationship to Jira, Linux MCP, or connection state; existing entities unchanged.

## State transitions

None. Resource read and discovery tool are stateless and idempotent.
