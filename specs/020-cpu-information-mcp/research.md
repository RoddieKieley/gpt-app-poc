# Phase 0 Research: Local CPU Information MCP Tool

## Decision 1: Use dedicated linux/system-info module family

- **Decision**: Implement `get_cpu_information` through separate `cpu-info-model`, `cpu-info-tool-schema`, `cpu-info-parser`, and `cpu-info-tool-handler` modules under `src/linux/system-info/`.
- **Rationale**: Existing tool architecture already separates schemas and handlers; adding parser/model layers keeps CPU parsing isolated, testable, and reusable while avoiding parser logic bloat in `server.ts`.
- **Alternatives considered**:
  - Add all logic directly in `server.ts` (rejected: difficult to test and maintain).
  - Merge parser and handler into one file (rejected: weaker unit-test granularity and less clear ownership).

## Decision 2: Keep tool local-only with empty input schema

- **Decision**: Register `get_cpu_information` with no `host` argument and local-only execution semantics.
- **Rationale**: The feature scope explicitly excludes remote execution in this phase and avoids introducing remote authorization, transport, or validation complexity.
- **Alternatives considered**:
  - Add optional `host` now (rejected: out of scope and incompatible with current phase requirements).
  - Add hidden host defaults in handler internals (rejected: non-transparent behavior and future migration risk).

## Decision 3: Mirror existing engage metadata and annotations

- **Decision**: Register the tool via `registerAppTool` with `_meta` output template conventions and `annotations` aligned to existing read-only diagnostics patterns.
- **Rationale**: Existing contract and regression tests already assert metadata stability; reusing those conventions prevents client-side discovery and rendering regressions.
- **Alternatives considered**:
  - Introduce custom metadata keys for CPU tools (rejected: unnecessary divergence).
  - Omit UI metadata for read-only tools (rejected: inconsistent with current required surface expectations).

## Decision 4: Preserve structured content + text fallback parity

- **Decision**: Handler always returns `content` text and, when parseable, returns `structuredContent` containing the full `CpuInfo` field set.
- **Rationale**: Constitution and existing tool behavior require a complete text fallback so non-UI or constrained clients still receive actionable output.
- **Alternatives considered**:
  - Structured-only success path (rejected: breaks fallback requirement).
  - Text-only output with no structured payload (rejected: breaks schema compatibility and downstream automation).

## Decision 5: Validate through unit, contract, and regression tests

- **Decision**: Add parser/handler unit tests and tools/list contract + regression updates that explicitly include `get_cpu_information`.
- **Rationale**: This repo enforces behavior through layered suites; tool registration and response shape changes must be guarded at both module and MCP surface levels.
- **Alternatives considered**:
  - Unit tests only (rejected: misses MCP listing/metadata compatibility).
  - Contract tests only (rejected: insufficient parser edge-case coverage).

## Decision 6: Parse CPU values from Linux command text with partial-data tolerance

- **Decision**: Parser should map canonical CPU lines into required fields and gracefully degrade when one or more metrics are unavailable, preserving `cpu_line` and fallback text.
- **Rationale**: Real hosts vary in available CPU metadata; resilient partial parsing is required by the feature and avoids hard failures.
- **Alternatives considered**:
  - Fail tool call if any field missing (rejected: poor operator experience).
  - Fill missing values with fabricated defaults (rejected: inaccurate diagnostics).
