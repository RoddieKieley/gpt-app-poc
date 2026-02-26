# Quickstart: Implement Consent-Gated `generate_sosreport`

## Prerequisites

- Dependencies installed: `npm install`
- Server can run locally: `npm run serve`
- UI build available when needed: `npm run build`
- New env settings planned:
  - `CONSENT_TOKEN_SIGNING_KEY` (required in non-test environments)
  - `CONSENT_TOKEN_TTL_SECONDS` (short-lived default)

## Implementation Order

1. Add consent token service and sensitive-tool policy modules in `src/security/`.
2. Update `server.ts` to:
   - add consent mint endpoint for explicit Step 2 action,
   - enforce centralized policy for `generate_sosreport`.
3. Update `src/sosreport/sosreport-tool-schemas.ts` to require consent token input.
4. Update `src/sosreport/sosreport-tool-handlers.ts` wiring to enforce fail-closed behavior.
5. Update `src/mcp-app.ts` Step 2 Generate click flow to mint token then call tool.
6. Update skill/docs/contracts.
7. Add/extend contract, integration, regression, and unit tests.

## Validation Checklist

### Consent enforcement checks

- `generate_sosreport` is denied when consent token is missing.
- `generate_sosreport` is denied for invalid, expired, replayed, wrong-user, and wrong-scope tokens.
- `generate_sosreport` executes exactly once for a valid token and consumes `jti`.

### UI behavior checks

- Step 2 Generate button explicitly mints token then calls `generate_sosreport`.
- No diagnostic collection occurs on page load, hash routing, or step navigation.
- Compatibility entrypoint remains `ui://engage-red-hat-support/app.html`.

### Non-UI fallback checks

- Text guidance documents explicit mint endpoint call and follow-up tool invocation.
- Non-UI user can complete mint -> generate -> fetch with actionable denial/retry instructions.

### Security and compatibility checks

- PAT boundary remains unchanged (`POST /api/jira/connections` only for PAT intake).
- No secret leakage in MCP payloads, tool responses, or log-safe messages.
- Unrelated tool/resource surfaces remain unchanged.

## Suggested Commands

```bash
npm run build
npm run test:unit
npm run test:contract
npm run test:integration
npm run test:regression
```

## Focused Test Targets

```bash
tsx --test tests/unit/consent-token-service.test.ts
tsx --test tests/unit/sensitive-tool-policy.test.ts
tsx --test tests/contract/sosreport-tools.contract.test.ts
tsx --test tests/contract/engage-red-hat-support.contract.test.ts
tsx --test tests/integration/sosreport-generate.failures.test.ts
tsx --test tests/integration/sosreport-generate.success.test.ts
tsx --test tests/integration/engage-red-hat-support.workflow.test.ts
tsx --test tests/regression/mcp-tool-surface-preservation.test.ts
tsx --test tests/regression/no-pat-leakage-mcp.test.ts
tsx --test tests/regression/skill-resource-preservation.test.ts
```

## Gate Sign-Off Criteria

- All consent-negative and replay tests pass.
- Happy-path Step 2 click flow passes.
- No regressions in unrelated tools/resources.
- Constitution/security gates remain pass with residual risks documented.
