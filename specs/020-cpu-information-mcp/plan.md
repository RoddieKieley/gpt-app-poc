# Implementation Plan: Local CPU Information MCP Tool

**Branch**: `020-cpu-information-mcp` | **Date**: 2026-04-09 | **Spec**: `/wip/src/github.com/roddiekieley/gpt-app-poc/specs/020-cpu-information-mcp/spec.md`  
**Input**: Feature specification from `/wip/src/github.com/roddiekieley/gpt-app-poc/specs/020-cpu-information-mcp/spec.md`

## Summary

Add a new local-first MCP tool `get_cpu_information` that matches linux-mcp-server CPU output semantics and field shape, implemented via dedicated `linux/system-info` modules (schemas/models/parsers/handler), registered in `server.ts` with existing engage metadata conventions, and validated with unit plus contract/regression coverage for parser behavior, fallback text behavior, and tools/list surface compatibility.

## Technical Context

**Language/Version**: TypeScript 5.x (ESM) on Node runtime  
**Primary Dependencies**: `@modelcontextprotocol/sdk`, `@modelcontextprotocol/ext-apps`, `zod`, `express`  
**Storage**: N/A (ephemeral local diagnostics read at call time)  
**Testing**: Node test runner via `tsx --test` (unit + contract + regression suites)  
**Target Platform**: Linux host running the local MCP server  
**Project Type**: Single server project with MCP tools/resources  
**Performance Goals**: Tool call returns within normal local command latency and does not block unrelated MCP calls  
**Constraints**: Local-only scope (no host argument), preserve existing `structuredContent` + text fallback conventions, keep `readOnlyHint: true`, and avoid secret-bearing payloads  
**Scale/Scope**: One new tool and supporting modules under `src/linux/system-info`, plus targeted tests and tool surface updates

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Diagnostics remain explicit user-invoked MCP calls and read-only for this tool path (`readOnlyHint: true`). **PASS**
- MCP Apps compliance unchanged; tool registration remains on MCP `tools/list` + `tools/call` with existing app metadata shape. **PASS**
- Text fallback remains mandatory and explicitly preserved in handler output contracts. **PASS**
- Data minimization preserved: only CPU summary metrics are returned; no credential flows are introduced. **PASS**
- Historical spec immutability preserved by confining artifacts to `specs/020-cpu-information-mcp/`. **PASS**

## Project Structure

### Documentation (this feature)

```text
specs/020-cpu-information-mcp/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── get-cpu-information.openapi.yaml
│   └── get-cpu-information-tool-surface.contract.v1.json
└── tasks.md
```

### Source Code (repository root)

```text
server.ts

src/
├── linux/
│   └── system-info/
│       ├── cpu-info-model.ts
│       ├── cpu-info-parser.ts
│       ├── cpu-info-tool-handler.ts
│       └── cpu-info-tool-schema.ts
└── sosreport/
    ├── sosreport-tool-handlers.ts
    └── sosreport-tool-schemas.ts

tests/
├── unit/
│   ├── cpu-info-parser.test.ts
│   ├── cpu-info-tool-handler.test.ts
│   └── sosreport-tool-schemas.test.ts
├── contract/
│   └── cpu-information-tools.contract.test.ts
└── regression/
    └── mcp-tool-surface-preservation.test.ts
```

**Structure Decision**: Keep existing single-project server layout and add a dedicated `src/linux/system-info/` module family so CPU diagnostics follow the same schema/handler separation used by sosreport and jira tool surfaces.

## Implementation Strategy

1. Add CPU domain model + schema + parser + handler modules under `src/linux/system-info/`.
2. Ensure parser normalizes and maps source text to required `CpuInfo` fields, with deterministic keys and stable value types.
3. Ensure handler returns both `structuredContent` and text fallback output aligned with existing engage conventions.
4. Register `get_cpu_information` in `server.ts` using `registerAppTool` annotations and `_meta` shape consistent with existing tools.
5. Expand tests:
   - unit parser coverage for complete and partial/incomplete raw output
   - unit handler coverage for success and fallback behavior
   - contract coverage for `tools/list` metadata/input shape and tool discovery
   - regression coverage to preserve global MCP tool surface expectations

## Phase 0: Research Plan

- Confirm local Linux CPU data extraction pattern that best matches linux-mcp-server output fields without introducing remote-host semantics.
- Confirm module split and naming conventions that match existing repository patterns (schema/model/parser/handler).
- Confirm metadata and fallback text conventions from current `registerAppTool` implementations and existing diagnostics handlers.

## Phase 1: Design & Contracts Plan

- Create `data-model.md` for `CpuInfo`, parser intermediate values, and handler result payload invariants.
- Create `contracts/get-cpu-information.openapi.yaml` describing planning-level invoke/list interactions for the new tool.
- Create `contracts/get-cpu-information-tool-surface.contract.v1.json` capturing required tool metadata, annotations, and response-shape invariants.
- Create `quickstart.md` for implementation sequencing and validation commands.
- Run `.specify/scripts/bash/update-agent-context.sh cursor-agent`.

## Post-Design Constitution Re-Check

- New tool remains read-only and explicit-invocation only. **PASS**
- Text fallback preserved in planned handler contract. **PASS**
- No new secret or credential handling paths introduced. **PASS**
- MCP app metadata conventions retained, no host-specific runtime dependencies introduced. **PASS**
- Design artifacts remain scoped to active feature package only. **PASS**

## Complexity Tracking

No constitution violations identified; complexity justification table is not required.
