# Phase 0 Research: Engage Troubleshooting Step Insertion

## Decision 1: Insert troubleshooting as mandatory step 2 in the UI state machine

- **Decision**: Add `troubleshooting` as a first-class workflow step between `select_product` and `sos_report` in UI state, navigation gates, and step-index mapping.
- **Rationale**: Current UI flow hardcodes three-step progression and hash mapping. Step insertion must be explicit in the state machine to avoid bypassing or ambiguous step numbering.
- **Alternatives considered**:
  - Render troubleshooting inside existing sos step (rejected: breaks requirement that troubleshooting is a separate workflow step).
  - Keep three steps and add an inline modal (rejected: does not provide durable hash-routing/progress semantics).

## Decision 2: Expand hash routing to four stable anchors (`step-1` to `step-4`)

- **Decision**: Update route bootstrap and `setCurrentStep` mapping to include a dedicated troubleshooting hash and shift sos/jira to steps 3 and 4.
- **Rationale**: Existing tests and user shareability rely on hash routes. Stable explicit hash values preserve deep-link behavior and make ordering verifiable.
- **Alternatives considered**:
  - Use non-numeric hash slug names (rejected: inconsistent with current route style and existing tests).
  - Keep old hash values and remap silently (rejected: would mislabel steps and create user confusion in progress navigation).

## Decision 3: Add troubleshooting content as a dedicated step component

- **Decision**: Create a distinct step-content component that renders one RHDS-consistent static CPU-info table row plus a Next action.
- **Rationale**: Existing `step-content.tsx` pattern uses one component per workflow step; following this pattern minimizes coupling and keeps test targeting straightforward.
- **Alternatives considered**:
  - Inject troubleshooting markup directly into `App.tsx` (rejected: weak separation of concerns).
  - Load troubleshooting data dynamically from tool call in this phase (rejected: feature scope explicitly asks for static table row behavior).

## Decision 4: Preserve server resource registration pattern with one new step URI

- **Decision**: Add `ui://engage-red-hat-support/steps/troubleshooting.html` and register it through existing `registerEngageUiResource(...)` calls without changing compatibility entry URI.
- **Rationale**: Contract tests assert stable entrypoint behavior and discoverable resources. Pattern-preserving registration avoids metadata drift and compatibility regressions.
- **Alternatives considered**:
  - Reuse existing sos URI for troubleshooting state (rejected: breaks one-resource-per-step mapping and contract clarity).
  - Introduce a second entrypoint URI (rejected: violates compatibility requirement for stable app entry).

## Decision 5: Update workflow and skill contract mappings in the active spec package only

- **Decision**: Create new `specs/021-cpu-info-ui-step/contracts/*` artifacts that encode step order, resource URIs, and skill sequence with troubleshooting before sos generation.
- **Rationale**: Constitution requires non-retroactive spec integrity; new behavior must be captured in the current package rather than editing historical contracts.
- **Alternatives considered**:
  - Edit older `specs/010`/`specs/007` contracts (rejected: violates non-retroactive rule).
  - Rely on code-only updates with no mapping artifacts (rejected: would undercut contract-driven regression expectations in this repository).

## Decision 6: Extend existing contract/integration assertions for step-2 troubleshooting semantics

- **Decision**: Update tests that currently assume `sos_report` is step 2 so they assert troubleshooting as step 2 and sos as step 3.
- **Rationale**: Existing suites explicitly inspect route hashes, resource lists, and sequence naming. Without test updates, valid feature changes would be flagged as regressions.
- **Alternatives considered**:
  - Add only new tests while retaining old assumptions (rejected: creates contradictory assertions and unstable CI).
  - Delay test updates to a follow-on feature (rejected: violates requirement for parser/handler and surface compatibility validation during this increment).
