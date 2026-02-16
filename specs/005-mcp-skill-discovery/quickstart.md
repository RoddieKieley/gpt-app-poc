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

## Manual verification notes

- Confirm `resources/list` includes `skill://hello-world/SKILL.md`.
- Confirm `resources/read` for `skill://hello-world/SKILL.md` returns markdown with "Hello World Skill".
- Confirm `tools/list` includes `list_skills` as read-only when Increment 2 is complete.
- Confirm `tools/call` for `list_skills` returns text fallback containing `skill://hello-world/SKILL.md`.
- Confirm Jira tool contracts still expose only:
  - `jira_connection_status`
  - `jira_list_attachments`
  - `jira_attach_artifact`
  - `jira_disconnect`

## Validation results

- `npm run test:mcp` -> PASS
  - Verified `resources/list` includes `skill://hello-world/SKILL.md`
  - Verified `resources/read` returns markdown (`text/markdown`) for the canonical skill URI
  - Verified `list_skills` returns text fallback containing `skill://hello-world/SKILL.md`
- `npm run test:jira` -> PASS
  - Unit: 4 passed
  - Contract: 5 passed
  - Integration: 4 passed
  - Regression: 5 passed (including Jira surface preservation)

## Contracts

- Skill resource: `specs/005-mcp-skill-discovery/contracts/skill-resource.json`
- Discovery tool: `specs/005-mcp-skill-discovery/contracts/mcp-tools-skill-discovery.json`
