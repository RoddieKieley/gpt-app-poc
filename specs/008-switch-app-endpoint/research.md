# Phase 0 Research: Development Endpoint Switch

## Decision 1: Use explicit, file-scoped literal replacements only

- **Decision**: Replace `https://gptapppoc.kieley.io` with `https://leisured-carina-unpromotable.ngrok-free.dev` only in `server.ts`, `scripts/mcp-smoke-tests.ts`, `tests/contract/engage-red-hat-support.contract.test.ts`, and `README.md`.
- **Rationale**: This is the lowest-risk path because all in-scope references are literal strings and the requested scope is constrained to runtime code, tests, smoke tests, and top-level docs.
- **Alternatives considered**:
  - Global repository replace: rejected due to accidental edits under historical `specs/**`.
  - Introduce new shared config constant: rejected because it expands scope and risk beyond required migration.

## Decision 2: Keep historical `specs/**` unchanged and exclude from legacy-reference checks

- **Decision**: Treat all historical `specs/**` files as immutable for this migration and verify legacy endpoint removal only in non-spec paths.
- **Rationale**: The feature specification explicitly excludes historical specs from modification.
- **Alternatives considered**:
  - Updating historical spec snapshots for consistency: rejected; violates bounded-scope requirement.

## Decision 3: Validation order is build -> contract tests -> smoke tests

- **Decision**: Run validation in this order:
  1. `npm run build`
  2. `npm run test:contract`
  3. `npm run test:mcp`
- **Rationale**: Smoke tests depend on built output and local server startup; contract tests are faster and catch metadata mismatches earlier.
- **Alternatives considered**:
  - Run smoke tests before contract tests: rejected as slower feedback and weaker triage order.

## Decision 4: Use targeted reference scans to prove migration completeness

- **Decision**: Verify references using:
  - `rg "gptapppoc\\.kieley\\.io" server.ts scripts tests README.md`
  - `rg "gptapppoc\\.kieley\\.io" --glob '!specs/**'`
- **Rationale**: Provides direct evidence that legacy endpoint references are removed from active code/docs while respecting historical spec immutability.
- **Alternatives considered**:
  - Rely only on tests: rejected because tests do not guarantee all stale literals are removed.

## Decision 5: Preserve constitution-sensitive behavior unchanged

- **Decision**: Keep PAT/secret handling, MCP Apps compliance shape, and text fallback behavior unchanged while migrating endpoint literals.
- **Rationale**: This feature is metadata/reference migration, not orchestration or credential-flow redesign.
- **Alternatives considered**:
  - Opportunistic refactor of tool/resource response structure: rejected due to unnecessary risk to backward compatibility.

## Risk and Mitigation Summary

| Risk | Mitigation |
|------|------------|
| Missed legacy literal in in-scope paths | Use explicit file list + targeted `rg` verification |
| Regression in test assertions | Update runtime and test literals in same change, run both test suites |
| Accidental historical spec edits | Avoid global replace and verify changed files before merge |
| ngrok endpoint churn | Keep migration procedure documented and repeatable in quickstart |
