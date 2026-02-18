# Quickstart: Engage Red Hat Support (007)

**Feature**: 007-engage-red-hat-support  
**Branch**: `007-engage-red-hat-support`

## Prerequisites

- Node.js 18+ and dependencies installed (`npm install`)
- Existing Jira secure intake endpoints available:
  - `POST /api/jira/connections`
  - `GET /api/jira/connections/{connection_id}`
- Existing MCP tools available and healthy:
  - `generate_sosreport`
  - `fetch_sosreport`
  - `jira_connection_status`
  - `jira_attach_artifact`
- Linux host/runtime prepared for sosreport generation

## Scope and Non-Goals

- **Included**:
  - Option A orchestration (UI/skill drives existing tools)
  - New `skill://engage-red-hat-support/SKILL.md`
  - New `ui://engage-red-hat-support/app.html`
  - Linux-only product gating
  - Strict PAT boundary with `connection_id` for MCP calls
  - Backward compatibility verification for existing tools/resources/tests
- **Excluded**:
  - New MCP orchestration tool
  - Non-Linux product support
  - Broad schema refactors for existing Jira/sosreport tools

## Implementation Steps

1. **Server resource registration**
   - Register `ui://engage-red-hat-support/app.html` in `server.ts`.
   - Register `skill://engage-red-hat-support/SKILL.md` with markdown fallback behavior.
   - Preserve required widget metadata and existing tool/resource registrations.

2. **UI flow updates**
   - Update `mcp-app.html` for Engage workflow controls and status rendering.
   - Implement orchestration in `src/mcp-app.ts` with step order:
     1) secure PAT intake  
     2) verify `connection_id`  
     3) `generate_sosreport`  
     4) `fetch_sosreport`  
     5) `jira_attach_artifact`
   - Block non-Linux product selections.

3. **Secret boundary enforcement**
   - Keep PAT in secure endpoint request only.
   - Ensure PAT is cleared immediately after intake and never passed into MCP tool arguments.
   - Ensure status/error text remains sanitized.

4. **Skill documentation**
   - Add `skills/engage-red-hat-support/SKILL.md` with text-first instructions for UI and non-UI hosts.
   - Include Linux-only scope and PAT boundary rules.

5. **Tests and docs**
   - Add contract, integration, and regression tests for new resource/tool expectations and no-secret leakage.
   - Update `docs/operator-guide.md` with Engage workflow guidance and incident-response notes.

## Verification Steps

### Functional workflow

- Valid run:
  - Connect with PAT through secure endpoint.
  - Verify valid `connection_id`.
  - Generate and fetch sosreport artifact.
  - Attach artifact to target issue key.
- Invalid/non-Linux selection is blocked before attachment path.
- If any step fails, subsequent steps do not execute automatically.

### Security boundary

- Confirm no PAT appears in:
  - MCP tool arguments
  - MCP tool results
  - user-visible status messages
  - regression test transcripts/log fixtures
- Confirm only opaque `connection_id` is used downstream.

### Compatibility and fallback

- Existing Jira/sosreport/skill resources remain present and unchanged unless intentionally extended.
- New UI resource includes required metadata (`openai/outputTemplate`, `openai/widgetAccessible`, `openai/widgetDomain`, `openai/widgetCSP`).
- Non-UI hosts receive complete text guidance and actionable outcomes.

### Constitution and risk checks

- Validate constitution principles 1-8 against implementation output.
- Validate mitigation evidence for:
  - PAT leakage prevention
  - workflow stop-on-failure behavior
  - Linux-only gate enforcement
  - resource/tool backward compatibility

## Test Commands

```bash
npm run test:unit
npm run test:contract
npm run test:integration
npm run test:regression
npm run test:jira
```

## Suggested Test Targets

- `tests/contract/engage-red-hat-support.contract.test.ts`
- `tests/integration/engage-red-hat-support.workflow.test.ts`
- `tests/regression/no-pat-leakage-mcp.test.ts`
- `tests/regression/mcp-tool-surface-preservation.test.ts`
- `tests/regression/skill-resource-preservation.test.ts`

## Operational Notes

- PAT must never be pasted into tool calls or prompt-level instructions.
- Reconnect flow is required for expired/revoked `connection_id`.
- Attachment failures should preserve artifact path context while remaining secret-safe.
