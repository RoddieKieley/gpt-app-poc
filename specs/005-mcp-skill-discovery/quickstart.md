# Quickstart: MCP Runtime Skill Discovery (005)

**Feature**: 005-mcp-skill-discovery  
**Branch**: `005-mcp-skill-discovery`

## Prerequisites

- Node.js 18+
- Repo dependencies installed (`npm install`)
- Existing MCP server and smoke test setup (unchanged)

## Scope (two increments)

1. **Increment 1**: Skill resource at `skill://hello-world/SKILL.md` — markdown read + list.
2. **Increment 2**: Read-only discovery tool returning text fallback + same URI.

No Jira or Linux flow changes. Existing tests preserved.

## Local run

1. Create the skill document (Increment 1):
   ```bash
   mkdir -p skills/hello-world
   # Add skills/hello-world/SKILL.md with Hello World skill content (name, description, when to use, steps).
   ```

2. Start the server (same as today):
   ```bash
   npm run build
   node server.js
   # Or your usual dev command; MCP endpoint e.g. http://localhost:3001/mcp
   ```

3. **Resource read**: Call MCP `resources/read` with `uri: "skill://hello-world/SKILL.md"`. Expect markdown body and `text/markdown` MIME.

4. **Resource list**: Call MCP `resources/list`. Expect the skill URI to appear in the list.

5. **Discovery tool** (Increment 2): Call tool `list_skills` (or name in contract). Expect response with plain-text content including the canonical URI `skill://hello-world/SKILL.md` and no side effects.

## Verification

- **Smoke tests**: After implementation, `npm run test:mcp` should pass and include checks for (a) skill resource readable at canonical URI, (b) skill resource listed, (c) discovery tool returns same URI and text fallback.
- **Jira**: All existing Jira tools and tests must continue to pass unchanged.

## Contracts

- Skill resource: `specs/005-mcp-skill-discovery/contracts/skill-resource.json`
- Discovery tool: `specs/005-mcp-skill-discovery/contracts/mcp-tools-skill-discovery.json`
