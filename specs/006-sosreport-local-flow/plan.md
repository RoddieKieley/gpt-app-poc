# Implementation Plan: Local-First Sosreport MCP Tools (Phase 1)

**Branch**: `006-sosreport-local-flow` | **Date**: 2026-02-18 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `/specs/006-sosreport-local-flow/spec.md`

## Summary

Add two local-first MCP tools, `generate_sosreport` and `fetch_sosreport`, to mirror linux-mcp-server sosreport workflow behavior with pragmatic TypeScript simplification. This increment implements validated local-only generation/fetch, non-interactive privileged execution (`sudo -n`), structured responses with plain-text fallback, and compatibility with `jira_attach_artifact` by returning a `/tmp` archive copy path.

## Technical Context

**Language/Version**: TypeScript (Node.js 18+)  
**Primary Dependencies**: `@modelcontextprotocol/sdk`, `@modelcontextprotocol/ext-apps`, `express`, `zod`, Node built-ins (`fs/promises`, `crypto`, `path`, `child_process`)  
**Storage**: Local filesystem only (existing archive path + `/tmp` copied archive); no new database/persistent secrets  
**Testing**: `tsx --test` suites (`tests/unit`, `tests/contract`, `tests/integration`, `tests/regression`) plus existing MCP smoke coverage  
**Target Platform**: Linux runtime for local command execution and sudoers-gated privilege path  
**Project Type**: Single Node MCP server (`server.ts` + `src/` feature modules)  
**Performance Goals**: Validation failures return in under 1 second; generation obeys 600000 ms timeout ceiling; fetch checksum for typical archive sizes completes within operator-acceptable local runtime  
**Constraints**: Local-only (no host/SSH), non-interactive privilege model only, deterministic output naming, actionable error categories, no regressions to Jira tools/resources/skill discovery  
**Scale/Scope**: Two new tools and supporting modules/tests/docs for one local operator workflow

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Support-workflow fidelity**: Adds sosreport generation/fetch as primary diagnostics workflow in MCP surface. **Pass.**
- **Human-authorized diagnostics**: Execution requires explicitly invoked tool call; no background or implicit runs. This feature adds no new credential collection channel. **Pass.**
- **Privacy-first diagnostics**: Redaction option validated/passed through and responses return metadata only (not archive contents). **Pass.**
- **MCP Apps compliance**: Adds tool registrations only; no host-specific runtime branching. **Pass.**
- **Graceful degradation**: Both tools will always return plain-text fallback content in MCP responses. **Pass.**
- **Secret boundary**: No PAT/credentials accepted or emitted by new tools. **Pass.**

**Post-Design Re-check**: Pass. Design keeps local explicit invocation, no secret ingress, no host-specific API usage, and required text fallback behavior.

## Project Structure

### Documentation (this feature)

```text
specs/006-sosreport-local-flow/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── mcp-tools-sosreport.json
│   └── fetch-reference-schema.json
└── tasks.md
```

### Source Code (repository root)

```text
server.ts                                    # Register two tools with metadata, schemas, handlers

src/
├── jira/
│   └── artifact-selection.ts                # unchanged logic; compatibility validated by tests
└── sosreport/
    ├── sosreport-tool-schemas.ts            # zod input schemas + validation helpers
    ├── sosreport-errors.ts                  # error categories and text mapping
    ├── sosreport-command.ts                 # local sudo -n command assembly/execution/timeout
    ├── sosreport-paths.ts                   # archive parsing + fallback lookup + path safety
    └── sosreport-tool-handlers.ts           # MCP tool handlers + structured/text responses

tests/
├── unit/
│   ├── sosreport-tool-schemas.test.ts       # plugin/log_size/conflict validation
│   ├── sosreport-paths.test.ts              # path/name safety and fallback lookup rules
│   └── sosreport-command.test.ts            # timeout and sudo error mapping
├── contract/
│   └── sosreport-tools.contract.test.ts     # tools/list metadata + schema exposure checks
├── integration/
│   ├── sosreport-generate.success.test.ts   # generation success + option propagation
│   ├── sosreport-generate.failures.test.ts  # timeout/privilege/sudo password required cases
│   └── sosreport-fetch.success.test.ts      # fetch copy to /tmp + checksum
└── regression/
    ├── jira-surface-preservation.test.ts    # assert existing jira_* tool surface unchanged
    └── mcp-tool-surface-preservation.test.ts# include new tools without regressing existing tools

README.md                                    # prerequisites, local-only scope, deferred SSH notes
docs/operator-guide.md                       # operational sudoers + cleanup guidance
```

**Structure Decision**: Keep the existing single-project architecture and add an isolated `src/sosreport/` module cluster. Register tools in `server.ts` using current `registerAppTool` pattern so metadata and MCP response conventions remain consistent with existing tools.

## Phase Plan

### Phase 0 - Research and decisions

1. Finalize schema and validation contract for generation/fetch inputs.
2. Finalize local privileged command model (`sudo -n`) and timeout handling.
3. Finalize archive path derivation and fallback lookup behavior.
4. Finalize error taxonomy and fallback text style.
5. Finalize Jira interoperability constraints for `/tmp` artifact references.

**Exit criteria**:
- All technical unknowns resolved in `research.md`.
- No `NEEDS CLARIFICATION` markers remain.

### Phase 1 - Design and contracts

1. Define entities and state transitions in `data-model.md`.
2. Define MCP tool contracts and fetch-reference schema in `contracts/`.
3. Produce implementation and verification steps in `quickstart.md`.
4. Update agent context via `.specify/scripts/bash/update-agent-context.sh cursor-agent`.
5. Re-run constitution check against resulting design artifacts.

**Exit criteria**:
- `data-model.md`, `contracts/*`, and `quickstart.md` are complete.
- Explicit non-goals include SSH execution and connection/secret lifecycle for this increment.

## File-by-File Change Plan

### `src/sosreport/sosreport-tool-schemas.ts`

- Add `generateSosreportSchema` with fields:
  - `only_plugins?: string[]`
  - `enable_plugins?: string[]`
  - `disable_plugins?: string[]`
  - `log_size?: string` (regex validated)
  - `redaction?: boolean`
- Add `fetchSosreportSchema` with:
  - `fetch_reference: string`
- Add helper validators:
  - plugin token allowlist regex (letters, digits, underscore, dash)
  - `log_size` regex (`^\\d+(k|K|m|M|g|G)?$`)
  - conflict guard: reject `only_plugins` with any `enable_plugins` or `disable_plugins`

### `src/sosreport/sosreport-errors.ts`

- Define categorized errors with stable codes:
  - `validation_error`
  - `dependency_missing`
  - `privilege_required`
  - `timeout`
  - `archive_not_found`
  - `path_unsafe`
  - `read_failed`
  - `copy_failed`
  - `unexpected_error`
- Provide mapping function to MCP response shape with text fallback guidance.

### `src/sosreport/sosreport-command.ts`

- Implement local command execution abstraction using `child_process.spawn`.
- Enforce non-interactive privilege command with `sudo -n`.
- Enforce default timeout `600000` ms (overridable only internally for tests).
- Validate local `sos` availability before run.
- Build deterministic generation command including predictable temp/name tokens.
- Capture stdout/stderr for archive path parsing and actionable failure mapping.

### `src/sosreport/sosreport-paths.ts`

- Parse archive path from command output with expected sosreport naming pattern.
- If parsing fails, resolve latest matching archive from local directory scan.
- Validate fetch reference:
  - absolute path required
  - local-safe root policy (align with artifact selection boundaries)
  - expected sosreport archive basename pattern (`sosreport-*.tar*`)
- Provide helper for generating deterministic `/tmp` copy path.

### `src/sosreport/sosreport-tool-handlers.ts`

- Implement `handleGenerateSosreport(args)`:
  - validate schema
  - run command
  - derive archive path (primary + fallback)
  - return `structuredContent` with archive metadata and `fetch_reference`
  - always include plain-text `content`
- Implement `handleFetchSosreport(args)`:
  - validate fetch reference
  - read source bytes
  - write copied archive to `/tmp`
  - compute SHA-256 and size
  - return `archive_path`, `size_bytes`, `sha256` in structured + text output

### `server.ts`

- Import sosreport schemas and handlers.
- Register `generate_sosreport` and `fetch_sosreport` via `registerAppTool`.
- Apply metadata conventions matching existing tools:
  - `readOnlyHint: false` for generate and `readOnlyHint: true` for fetch
  - `openWorldHint: false`, `destructiveHint: false`
  - include `_meta` output template for consistent UI/text fallback behavior
- Ensure no changes to existing Jira and skill registration behavior.

### Tests

- Add unit tests for validation, parsing, timeout, and error mapping.
- Add integration tests for:
  - generation success with option propagation
  - parsing fallback path resolution
  - invalid option combinations
  - timeout and privilege errors
  - sudo password-required mapping
  - fetch success with checksum
  - invalid fetch path handling
  - `/tmp` output path behavior
- Add regression checks to keep existing Jira and skill discovery tool surfaces stable.

### Docs

- Update `README.md` with:
  - `sos` prerequisite
  - `/etc/sudoers.d/mcp-sos` NOPASSWD prerequisite
  - `sudo -n` non-interactive behavior
  - local-only limitations
  - deferred SSH Phase 2 boundaries
- Update `docs/operator-guide.md` with operational setup and cleanup guidance for `/tmp` copies.

## Acceptance Criteria for Plan Execution

- Plan artifacts define exact schema fields, validation rules, and response contracts for both tools.
- Design clearly specifies local privileged command execution, timeout behavior, and archive path fallback strategy.
- Interoperability with `jira_attach_artifact` is explicitly preserved via `/tmp` archive path output.
- Test plan covers all required happy paths and key failure mappings from the approved feature scope.
- Documentation plan includes prerequisites, non-interactive sudo model, local-only limits, and deferred SSH scope.

## Non-Goals (Explicitly Deferred)

- SSH execution support or `host` parameter input.
- Remote connection/session lifecycle management.
- Host trust policy and secret management for remote execution.
- Multi-tenant hardening and rate limiting.

## Complexity Tracking

No constitution violations to justify.
