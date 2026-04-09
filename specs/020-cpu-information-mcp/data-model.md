# Data Model: Local CPU Information MCP Tool

## Entity: CpuInfo

- **Purpose**: Canonical structured CPU payload returned by `get_cpu_information`.
- **Fields**:
  - `model`: CPU model text derived from local system information.
  - `logical_cores`: Count of logical cores.
  - `physical_cores`: Count of physical cores (or best-available resolved count).
  - `frequency_mhz`: Current or nominal CPU frequency value in MHz.
  - `load_avg_1m`: One-minute load average.
  - `load_avg_5m`: Five-minute load average.
  - `load_avg_15m`: Fifteen-minute load average.
  - `cpu_line`: Canonical raw CPU information line retained for traceability.
- **Validation rules**:
  - Field keys are fixed and deterministic.
  - Numeric fields are numeric when present.
  - `cpu_line` must preserve source context for fallback/debugging.

## Entity: CpuInfoParseResult

- **Purpose**: Intermediate parser output used by handler to decide structured success vs fallback emphasis.
- **Fields**:
  - `cpuInfo`: Partial or complete `CpuInfo` object.
  - `missingFields`: List of required fields that could not be derived.
  - `rawText`: Raw system output used for parsing.
  - `parseWarnings`: Human-readable notes for non-fatal parse gaps.
- **Validation rules**:
  - `missingFields` is empty only when all required fields are derived.
  - `rawText` is always preserved for fallback generation.

## Entity: CpuInfoToolResult

- **Purpose**: Outbound MCP tool payload for `get_cpu_information`.
- **Fields**:
  - `content`: Required text fallback array for all clients.
  - `structuredContent`: Structured `CpuInfo` payload when parseable enough to return schema-compatible data.
  - `isError`: Optional flag for terminal error paths.
- **Validation rules**:
  - `content` must always include a readable CPU summary/fallback text.
  - `structuredContent` must use the exact `CpuInfo` key set when present.
  - Tool must not emit remote-host fields or secret-bearing values.

## Entity: CpuInformationToolDescriptor

- **Purpose**: MCP tool registration contract exposed in `tools/list`.
- **Fields**:
  - `name`: `get_cpu_information`.
  - `annotations`: Includes `readOnlyHint: true`, `openWorldHint: false`, `destructiveHint: false`.
  - `_meta`: Engage-compatible output template metadata.
  - `inputSchema`: Empty/local-only schema with no host parameter.
- **Validation rules**:
  - Descriptor naming and metadata must remain stable for compatibility suites.
  - Input schema must not introduce remote execution arguments in this phase.

## Relationships

- `CpuInfoParseResult` is produced by parser modules from local raw CPU output.
- `CpuInfoToolResult` is assembled by handler modules from `CpuInfoParseResult`.
- `CpuInformationToolDescriptor` references handler behavior and schema model via `server.ts` registration.
