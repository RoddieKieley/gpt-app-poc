# Quickstart: Engage Support Workflow Multi-Resource Refactor

## Prerequisites

- Node dependencies installed: `npm install`
- Build artifacts available: `npm run build`
- Test runtime supports local server startup and temporary files

## Implementation Order

1. Update resource registration and compatibility routing in `server.ts`.
2. Refactor UI flow orchestration and state handoff in `src/mcp-app.ts`.
3. Update UI shell/step content in `mcp-app.html`.
4. Update skill guidance in `skills/engage-red-hat-support/SKILL.md`.
5. Update canonical contract in `specs/007-engage-red-hat-support/contracts/engage-workflow-contract.json`.
6. Update docs in `README.md` and `docs/operator-guide.md`.
7. Update contract/integration/regression test coverage.

## Validation Checklist

### Resource and compatibility checks

- `ui://engage-red-hat-support/app.html` remains present and functional.
- Step URIs are discoverable and readable.
- Existing MCP tools and schemas are unchanged.

### Workflow behavior checks

- Step 1 blocks non-Linux selection.
- Step 2 produces `fetch_reference` then `artifact_ref`.
- Step 3 verifies issue access before attach.
- Failures stop progression and provide retry guidance.

### PAT secrecy checks

- PAT accepted only through `POST /api/jira/connections`.
- No PAT/token-bearing fields in MCP tool args/results.
- No PAT content in user-facing status/error text.
- No PAT content in log-safe message paths.

## Suggested Commands

```bash
npm run build
npm run test:contract
npm run test:integration
npm run test:regression
```

## Focused Test Targets

```bash
tsx --test tests/contract/engage-red-hat-support.contract.test.ts
tsx --test tests/integration/engage-red-hat-support.workflow.test.ts
tsx --test tests/regression/mcp-tool-surface-preservation.test.ts
tsx --test tests/regression/no-pat-leakage-mcp.test.ts
tsx --test tests/regression/skill-resource-preservation.test.ts
tsx --test tests/regression/jira-surface-preservation.test.ts
```

## Validation Run Notes

- 2026-02-26: `npm run test:contract -- tests/contract/engage-red-hat-support.contract.test.ts` passed.
- 2026-02-26: `npm run test:integration -- tests/integration/engage-red-hat-support.workflow.test.ts` passed.
- 2026-02-26: `npm run test:regression -- tests/regression/mcp-tool-surface-preservation.test.ts tests/regression/no-pat-leakage-mcp.test.ts tests/regression/skill-resource-preservation.test.ts tests/regression/jira-surface-preservation.test.ts` passed.
