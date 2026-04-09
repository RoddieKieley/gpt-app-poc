# Quickstart: Local CPU Information MCP Tool

## Goal

Implement and validate `get_cpu_information` as a local-only MCP tool using dedicated linux/system-info modules and compatibility-preserving metadata/fallback behavior.

## Preconditions

- Work on branch `020-cpu-information-mcp`.
- Existing test suites pass before feature edits.
- Linux host exposes standard CPU and load-average information to local process execution.

## Implementation Sequence

1. Add domain modules under `src/linux/system-info/`:
   - `cpu-info-model.ts`
   - `cpu-info-tool-schema.ts`
   - `cpu-info-parser.ts`
   - `cpu-info-tool-handler.ts`
2. Implement parser logic that maps local CPU source text into required `CpuInfo` keys.
3. Implement handler that:
   - validates input schema,
   - executes local CPU info retrieval flow,
   - returns both `structuredContent` and `content` text fallback.
4. Register `get_cpu_information` in `server.ts` using existing engage tool metadata and read-only annotations.
5. Add/extend tests:
   - parser unit tests (complete + partial source text)
   - handler unit tests (success + fallback/error paths)
   - contract test for `tools/list` descriptor and metadata
   - regression test to preserve global MCP tool surface with the new tool added

## Validation Commands

Run targeted suites during development:

```bash
npm run test:unit
npm run test:contract
npm run test:regression
```

Run full confidence suite before merge:

```bash
npm run test:unit && npm run test:contract && npm run test:integration && npm run test:regression
```

## Acceptance Checklist

- [ ] `get_cpu_information` appears in MCP `tools/list`.
- [ ] Tool input schema remains local-only and excludes `host`.
- [ ] Tool descriptor annotations include `readOnlyHint: true`.
- [ ] Structured response exposes all required `CpuInfo` keys when source data is available.
- [ ] Text fallback is present for all success/error paths.
- [ ] New and existing MCP tool-surface regression checks pass.

## Rollback Guidance

If regressions occur:

1. Remove tool registration in `server.ts`.
2. Revert new linux/system-info module imports.
3. Re-run contract/regression suites to confirm baseline MCP surface restoration.
