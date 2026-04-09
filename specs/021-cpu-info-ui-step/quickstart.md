# Quickstart: Engage Troubleshooting Step Insertion

## Goal

Add troubleshooting as workflow step 2 in engage support UI, including state/routing/progress/component updates, new troubleshooting resource URI registration, contract/spec mapping updates, and skill instruction ordering before sos generation.

## Preconditions

- Work on branch `021-cpu-info-ui-step`.
- Existing workflow tests are green before edits.
- Existing compatibility entry URI remains `ui://engage-red-hat-support/app.html`.

## Implementation Sequence

1. Update UI workflow state and routing:
   - Extend `WorkflowStep` in `src/mcp-app/state.ts` with `troubleshooting`.
   - Update hash mapping and bootstrap logic in `src/mcp-app.ts` to four steps.
   - Update gating so troubleshooting is required before entering sos step.
2. Update progress navigation and adapter contract:
   - Add step-4 callback and navigation resolution in `src/mcp-app/ui/adapter-contract.ts`.
   - Update `src/mcp-app/ui/progress-affordance-adapter.tsx` to render 4-step nav labels and content slots.
3. Update step content composition:
   - Add troubleshooting step content with RHDS-consistent static CPU table row and Next button in `src/mcp-app/step-content.tsx`.
   - Wire new step component and handlers in `src/mcp-app/App.tsx`.
4. Register troubleshooting UI resource URI:
   - Add `ui://engage-red-hat-support/steps/troubleshooting.html` constant in `server.ts`.
   - Register it using existing `registerEngageUiResource(...)` pattern.
5. Update skill instructions:
   - Insert troubleshooting guidance before sos generation in `skills/engage-red-hat-support/SKILL.md`.
6. Update tests:
   - Contract assertions for resource list and sequence ordering.
   - Integration/regression assertions for hash routing and step progression text.
7. Keep new documentation contracts confined to `specs/021-cpu-info-ui-step/contracts/`.

## Validation Commands

Run targeted suites during implementation:

```bash
npm run test:contract
npm run test:integration
npm run test:regression
```

Run full confidence suite before merge:

```bash
npm run test:unit && npm run test:contract && npm run test:integration && npm run test:regression
```

## Acceptance Checklist

- [ ] Troubleshooting appears as UI step 2 between product selection and sos.
- [ ] Route hashes support `step-1` through `step-4` with troubleshooting at `step-2`.
- [ ] Progress navigation labels and click handlers map to four steps correctly.
- [ ] Troubleshooting step renders one RHDS-consistent CPU row and Next advances to sos.
- [ ] `server.ts` registers troubleshooting URI using existing pattern.
- [ ] Skill instructions include troubleshooting before sos generation/fetch.
- [ ] Updated contracts in `specs/021-cpu-info-ui-step/contracts/` reflect new sequence and resources.
- [ ] Contract/integration/regression suites pass with updated expectations.

## Validation Status (2026-04-09)

- `npm run test:contract` passed.
- `npm run test:integration` passed.
- `npm run test:regression` passed.
- `npm run test:unit` passed.

## Rollback Guidance

If regressions occur:

1. Revert step insertion points in `state.ts`, `mcp-app.ts`, `App.tsx`, and `progress-affordance-adapter.tsx`.
2. Remove troubleshooting URI registration in `server.ts`.
3. Restore skill sequencing text to prior ordering.
4. Re-run contract/integration/regression suites to confirm baseline parity.
