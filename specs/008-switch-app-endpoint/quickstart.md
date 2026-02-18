# Quickstart: Development Endpoint Switch

This quickstart describes how to implement and validate the endpoint migration with minimal risk.

## Preconditions

- Branch is `008-switch-app-endpoint`.
- Scope is limited to:
  - `server.ts`
  - `scripts/mcp-smoke-tests.ts`
  - `tests/contract/engage-red-hat-support.contract.test.ts`
  - `README.md`
- Historical `specs/**` files are not modified.

## Implementation Steps

1. Replace legacy endpoint literals:
   - From: `https://gptapppoc.kieley.io`
   - To: `https://leisured-carina-unpromotable.ngrok-free.dev`
2. Apply replacements only to in-scope files listed above.
3. Keep behavior unchanged beyond endpoint value updates (no refactors, no contract-shape changes).

## Validation Steps

1. Build assets:

   ```bash
   npm run build
   ```

2. Run contract tests:

   ```bash
   npm run test:contract
   ```

3. Run MCP smoke tests:

   ```bash
   npm run test:mcp
   ```

4. Verify legacy endpoint removal outside specs:

   ```bash
   rg "gptapppoc\.kieley\.io" --glob '!specs/**'
   ```

   Expected result: no matches in non-spec paths.

5. Verify new endpoint appears in scoped files:

   ```bash
   rg "leisured-carina-unpromotable\.ngrok-free\.dev" server.ts scripts/mcp-smoke-tests.ts tests/contract/engage-red-hat-support.contract.test.ts README.md
   ```

## Evidence to Capture

- Passing output for `npm run test:contract`.
- Passing output for `npm run test:mcp`.
- Zero-match output for legacy endpoint scan excluding `specs/**`.
- Positive-match output for new endpoint scan in scoped files.

## Constitution Checks During Execution

- Preserve text fallback behavior for non-UI hosts.
- Keep MCP Apps metadata usage compliant (`ui://` + JSON-RPC patterns intact).
- Do not alter PAT or credential handling behavior.

## Risks and Mitigations

- **Risk**: One scoped file is missed during replacement.  
  **Mitigation**: Use explicit file list and verification scan.
- **Risk**: Test assertions diverge from runtime metadata.  
  **Mitigation**: Update runtime and test literals together, then run both suites.
- **Risk**: Historical specs are accidentally changed.  
  **Mitigation**: Avoid global replace and confirm changed-file list before merge.
