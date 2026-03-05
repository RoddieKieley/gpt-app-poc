# Quickstart: 014 Headless Consent Compatibility and Parsing Guarantees

## 1) Execution approach

1. Validate current runtime behavior against 014 requirements before changing code.
2. Apply only additive deltas needed to close verified gaps.
3. Prioritize docs/contracts/tests updates when runtime already conforms.
4. Preserve existing web UI flow behavior as a hard compatibility gate.

## 2) Validation focus areas

- **Headless explicit permission path**
  - Mint denied when explicit permission is not granted.
  - Mint succeeds with explicit permission and returns required token details.
- **Parsing compatibility**
  - Parse `structuredContent` fields first.
  - Use text fallback parsing when structured fields are unavailable.
- **Web/UI no-regression**
  - Existing web consent route behavior remains unchanged.
  - Existing UI Step-2 consent-and-generate flow remains unchanged.

## 3) Candidate file targets (only if gaps are found)

- `server.ts`
- `src/sosreport/sosreport-tool-schemas.ts`
- `README.md`
- `docs/operator-guide.md`
- `skills/engage-red-hat-support/SKILL.md`
- `tests/integration/sosreport-generate.failures.test.ts`
- `tests/integration/sosreport-generate.success.test.ts`
- `tests/integration/engage-red-hat-support.workflow.test.ts`
- `tests/contract/sosreport-tools.contract.test.ts`
- `tests/contract/engage-red-hat-support.contract.test.ts`

## 4) Test commands

### Targeted checks

- `tsx --test tests/integration/sosreport-generate.failures.test.ts`
- `tsx --test tests/integration/sosreport-generate.success.test.ts`
- `tsx --test tests/integration/engage-red-hat-support.workflow.test.ts`
- `tsx --test tests/contract/sosreport-tools.contract.test.ts`
- `tsx --test tests/contract/engage-red-hat-support.contract.test.ts`

### Full suites

- `npm run test:unit`
- `npm run test:contract`
- `npm run test:integration`
- `npm run test:regression`

## 5) No-op completion checklist

Use this checklist when runtime behavior already satisfies the spec:

- 014 planning/design artifacts are complete.
- 014 contracts define explicit permission, parsing compatibility, and web no-regression guarantees.
- Tests and docs/descriptors reflect and verify current behavior.
- No historical specs are modified.

## 6) Rollout and backward compatibility notes

- Treat this as additive compatibility hardening.
- Keep bridge clients backward compatible by maintaining structured-first parsing and text fallback guidance.
- Release notes should clearly call out "no web flow behavior changes."

## 7) Validation run results (2026-03-05)

### Targeted checks

- `npm exec -- tsx --test tests/integration/sosreport-generate.failures.test.ts` - pass
- `npm exec -- tsx --test tests/integration/sosreport-generate.success.test.ts` - pass
- `npm exec -- tsx --test tests/integration/engage-red-hat-support.workflow.test.ts` - pass
- `npm exec -- tsx --test tests/contract/sosreport-tools.contract.test.ts` - pass
- `npm exec -- tsx --test tests/contract/engage-red-hat-support.contract.test.ts` - pass

### Full suites

- `npm run test:unit` - pass
- `npm run test:contract` - pass
- `npm run test:integration` - pass
- `npm run test:regression` - pass

## 8) No-op/code-delta outcome

- Runtime behavior for permission gating, headless sequence, and web flow remained unchanged.
- Implementation deltas were additive and focused on 014 evidence artifacts, contract assertions, and parsing compatibility tests.
