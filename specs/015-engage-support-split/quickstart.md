# Quickstart: 015 UI-First Split Readiness

## 1) Implementation intent

1. Keep the existing UI/web workflow unchanged.
2. Clarify the main skill as UI-first and define explicit non-UI fallback routing semantics.
3. Add deterministic text fallback parity requirements for `job_id`, `fetch_reference`, `connection_id`.
4. Do not create/register the new headless skill in this phase.

## 2) Planned file targets

- `skills/engage-red-hat-support/SKILL.md`
- `docs/operator-guide.md`
- `docs/security-model.md`
- `specs/015-engage-support-split/contracts/*`
- `tests/contract/engage-red-hat-support.contract.test.ts`
- `tests/integration/engage-red-hat-support.workflow.test.ts`
- `tests/integration/sosreport-generate.success.test.ts`
- `tests/integration/jira-connection.lifecycle.test.ts`

## 3) Compatibility baseline references (read-only)

- `specs/014-headless-consent-compat/contracts/headless-consent-permission.contract.v1.json`
- `specs/014-headless-consent-compat/contracts/mint-output-parsing-compat.contract.v1.json`
- `specs/014-headless-consent-compat/contracts/web-consent-regression-compat.contract.v1.json`

These are baseline references only; they are not edited in this feature package.

## 4) Validation strategy

### A) Explicit web/UI non-regression

- Confirm existing UI resources, workflow sequencing, and consent UX behavior remain unchanged.
- Confirm no additional mandatory user steps are introduced in the web/UI flow.

### B) Text-only completion without `structuredContent`

- Execute integration flow using a client/test harness that parses only `content.text`.
- Verify end-to-end continuation across blocking handoffs:
  - obtain `job_id`,
  - obtain `fetch_reference`,
  - obtain `connection_id`,
  - complete downstream operations.

### C) Structured/text parity guarantees

- For each critical key emitted in structured output, require exact same value in text fallback output.
- Fail if required key is missing, duplicated, or inconsistent.

### D) Security boundary preservation

- Ensure PAT remains secure-intake-only and never appears in MCP tool args/results.
- Ensure explicit consent remains required before invasive diagnostics.

## 5) Suggested test commands

- `npm exec -- tsx --test tests/contract/engage-red-hat-support.contract.test.ts`
- `npm exec -- tsx --test tests/integration/engage-red-hat-support.workflow.test.ts`
- `npm exec -- tsx --test tests/integration/sosreport-generate.success.test.ts`
- `npm exec -- tsx --test tests/integration/jira-connection.lifecycle.test.ts`
- `npm run test:contract`
- `npm run test:integration`
- `npm run test:regression`

## 6) Migration note template

Use this wording in release/operator notes:

- "This is an additive split-readiness update."
- "The primary `engage-red-hat-support` skill remains UI-first."
- "When UI is unavailable, the skill response points to an alternate headless skill URI placeholder."
- "No new headless skill is created in this release."
- "Existing web/UI behavior and security boundaries remain unchanged."
