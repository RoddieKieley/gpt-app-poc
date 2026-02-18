# Quickstart: Get Skill Tool Fallback (009)

**Feature**: 009-get-skill-tool  
**Branch**: `009-get-skill-tool`

## Objective

Implement `get_skill` as a minimal, read-only MCP tool so clients can retrieve skill markdown by URI when `resources/read` is unavailable, without changing existing tool/resource behavior.

## Scope

- Add tool registration and handler in `server.ts`.
- Keep existing `list_skills` and skill resource registration behavior unchanged.
- Preserve existing Jira/sosreport tools/resources.
- Add/adjust contract, regression, and smoke checks for `get_skill`.

## Implementation Steps

1. **Server tool registration**
   - Add `registerAppTool(server, "get_skill", ...)` in `server.ts`.
   - Use input schema `z.object({ uri: z.string().min(1, "skill URI is required") })`.
   - Set annotations to:
     - `readOnlyHint: true`
     - `openWorldHint: false`
     - `destructiveHint: false`
   - Keep existing UI metadata pattern (`ui.resourceUri`, `openai/outputTemplate`, `openai/widgetAccessible`).

2. **URI validation and resolution**
   - Normalize and validate `uri` input.
   - Require `skill://` scheme.
   - Require supported registered skill identity (minimum engage skill URI).
   - Reuse existing constants/loaders:
     - `ENGAGE_SKILL_RESOURCE_URI`
     - `SKILL_RESOURCE_MIME_TYPE`
     - `loadEngageSkillMarkdown`

3. **Response behavior**
   - Success:
     - Return `content` text fallback (plain text markdown output for non-UI hosts).
     - Return `structuredContent` with `{ uri, mimeType, text }`.
   - Invalid/unsupported URI:
     - Return `isError: true`.
     - Return actionable remediation text (format and supported URI guidance).
   - Ensure no secret/token leakage in outputs/errors.

4. **Test and smoke updates**
   - `tests/contract/engage-red-hat-support.contract.test.ts`:
     - assert `tools/list` includes `get_skill` with read-only metadata,
     - assert `tools/call get_skill` success for engage URI,
     - assert parity with `resources/read`.
   - `tests/regression/mcp-tool-surface-preservation.test.ts`:
     - include `get_skill` while preserving existing required tools.
   - `tests/regression/skill-resource-preservation.test.ts`:
     - keep resource assertions and add `get_skill` parity checks.
   - `scripts/mcp-smoke-tests.ts`:
     - add checks for `tools/list` metadata + `tools/call get_skill` + parity.

## Verification Commands

```bash
npm run test:contract
npm run test:mcp
```

## Validation Checklist

- `tools/list` includes `get_skill` and annotations indicate read-only behavior.
- `tools/call get_skill` with `skill://engage-red-hat-support/SKILL.md` returns markdown.
- `resources/read` for engage skill URI still works unchanged.
- Existing Jira and sosreport tool/resource surfaces remain unchanged.
- No secret/token text appears in `get_skill` outputs or errors.

## Verification Results

- 2026-02-18: `npm run test:contract` passed (including engage contract coverage for `get_skill`).
- 2026-02-18: `npm run test:regression` passed (MCP tool/skill resource preservation unchanged).
- 2026-02-18: `npm run build` passed.
- 2026-02-18: `npm run test:mcp` passed with checks for:
  - `tools/list` includes `get_skill` read-only metadata,
  - valid and invalid `tools/call get_skill` behavior,
  - `resources/read` parity with `get_skill` markdown output.

## Rollback Plan

- Remove `get_skill` registration block from `server.ts`.
- Revert targeted test/smoke updates.
- Re-run `npm run test:contract && npm run test:mcp` to confirm baseline behavior.
