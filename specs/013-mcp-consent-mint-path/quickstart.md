# Quickstart: Implementing MCP Consent Mint Path

## 1) Implementation order

1. Update backend schemas and shared validation exports.
2. Add `mint_engage_consent_token` tool registration and handler in `server.ts`.
3. Ensure REST `POST /api/engage/consent-tokens` remains unchanged.
4. Add/adjust contract and regression tests for tool surface and workflow behavior.
5. Add integration happy-path and denial-path tests.
6. Add versioned contracts under `specs/013-mcp-consent-mint-path/contracts/`.

## 2) Target file changes

- `server.ts`
- `src/sosreport/sosreport-tool-schemas.ts`
- `src/security/consent-token-service.ts` (only if helper extraction is required)
- `src/security/sensitive-tool-policy.ts` (only if deny-text/code mapping extension is required)
- `tests/integration/consent-test-helpers.ts`
- `tests/integration/sosreport-generate.success.test.ts`
- `tests/integration/sosreport-generate.failures.test.ts`
- `tests/contract/sosreport-tools.contract.test.ts`
- `tests/regression/mcp-tool-surface-preservation.test.ts`

## 3) Test execution

### Targeted runs

- `tsx --test tests/integration/sosreport-generate.success.test.ts`
- `tsx --test tests/integration/sosreport-generate.failures.test.ts`
- `tsx --test tests/contract/sosreport-tools.contract.test.ts`
- `tsx --test tests/regression/mcp-tool-surface-preservation.test.ts`

### Full suites

- `npm run test:unit`
- `npm run test:contract`
- `npm run test:integration`
- `npm run test:regression`

## 4) Verification checklist

- Web flow still works with `POST /api/engage/consent-tokens`.
- Headless path succeeds with explicit tool sequence:
  - `start_engage_red_hat_support`
  - `select_engage_product(product=linux)`
  - `mint_engage_consent_token(...)`
  - `generate_sosreport(consent_token, workflow_session_id?)`
  - `fetch_sosreport(fetch_reference)`
- Denial checks pass:
  - mint-before-step1 denied
  - invalid `workflow_session_id` denied
  - replay/wrong-user/wrong-session/wrong-scope/wrong-step denied
- New versioned contracts exist in `specs/013-mcp-consent-mint-path/contracts/`.

## 5) Rollout notes

- This is an additive MCP tool rollout with no endpoint migration.
- Deploy with release notes emphasizing explicit headless consent action and unchanged web UX.
- Monitor denied-consent events for abnormal spikes after release.
