# Quickstart: RHDS Final Migration (Step 2)

## Goal

Execute final RHDS-first migration cutover, retire PatternFly dependencies where safe, and complete signoff with parity evidence and residual risk documentation.

## Preconditions

- Work on branch `019-rhds-final-migration`.
- Baseline behavior evidence is captured before final cutover.
- Current build/serve path is healthy before migration edits.

## Cutover Execution Sequence

1. Enumerate remaining PF usages and map exact RHDS replacements.
2. Implement RHDS-first substitutions in `src/mcp-app/App.tsx` and `src/mcp-app/step-content.tsx`.
3. Remove PF fallback render paths in adapter files (`src/mcp-app/ui/*-adapter.tsx`, `adapter-mode.ts`) once parity is verified for each affected surface.
4. Remove PF base stylesheet import from `src/mcp-app.ts` and resolve any style dependencies in related assets.
5. Retire PF dependencies in `package.json` and regenerate lockfile.
6. Run comprehensive regression matrix and collect evidence.
7. Produce final migration report and execute signoff gate review.

## Dependency Retirement Procedure

1. Confirm no remaining PF imports in application runtime files.
2. Remove from `package.json`:
   - `@patternfly/react-core`
   - `@patternfly/react-icons`
3. Regenerate lockfile and run build/tests.
4. If a dependency cannot be retired, document:
   - reason,
   - risk level,
   - owner,
   - target follow-up phase.

## Regression Matrix Runbook

### 1) Happy path

- Validate full Step1 -> Step2 -> Step3 completion.
- Confirm no deviation in step transitions, route/hash, tool calls, and final status.

### 2) Blocked path / gating

- Attempt Step2/Step3 early and unsupported-product paths.
- Confirm same blocking messages, error codes, and gate outcomes.

### 3) Error path / recovery

- Trigger failures in generate/fetch/connect/verify/attach.
- Confirm parity in error semantics and successful recovery after correction.

### 4) Loading / polling path

- Validate generate polling progression from accepted to terminal state.
- Confirm same status progression and terminal branch handling.

### 5) Accessibility and visual checks

- Keyboard-only traversal, focus visibility/order, status announcements.
- RHDS visual compliance checks for hierarchy, spacing, and control discoverability.

## Rollback Option

### Trigger conditions

- Behavior parity regression
- Critical accessibility defect
- Blocking visual regression
- Build/serve failure affecting MCP UI resource

### Rollback steps

1. Revert migration change set to restore PF dependencies/imports and PF adapter branches.
2. Re-run critical smoke set:
   - happy path,
   - blocked gating path,
   - error recovery path.
3. Record rollback reason and failed gate in migration report.

## Signoff Checklist (Release Gate)

- [ ] Gate A: Behavior parity matrix complete and passing
- [ ] Gate B: PF dependency retirement complete or residuals justified
- [ ] Gate C: Credential/tool boundary invariants preserved
- [ ] Gate D: Cutover and rollback procedures validated
- [ ] Gate E: Final migration report approved with residual risks and owners

## Final Report Deliverables

- Final parity evidence summary
- PF inventory retirement decisions
- Residual risk list with owners
- Signoff gate outcomes and approvers

## Completion Summary

- RHDS-first UI migration completed with PF runtime imports removed.
- PF dependency retirement completed in `package.json` and lockfile.
- Full automated validation suite passed (build, unit, contract, integration, regression, MCP smoke).
