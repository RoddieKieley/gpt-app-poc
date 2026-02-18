# Data Model: Local-First Sosreport MCP Tools

**Feature**: 006-sosreport-local-flow  
**Date**: 2026-02-18

This feature introduces runtime entities for local sosreport generation/fetch. No persistent database entities are added.

## Entities

### GenerateSosreportInput

- **Fields**:
  - `only_plugins?: string[]`
  - `enable_plugins?: string[]`
  - `disable_plugins?: string[]`
  - `log_size?: string`
  - `redaction?: boolean`
- **Validation**:
  - Plugin items match `^[A-Za-z0-9_-]+$`.
  - `log_size` matches `^\d+(k|K|m|M|g|G)?$`.
  - `only_plugins` cannot be combined with `enable_plugins` or `disable_plugins`.
- **Role**: Input contract for local generation request.

### GenerateSosreportResult

- **Fields**:
  - `archive_path: string` (resolved absolute local path)
  - `archive_name: string`
  - `size_bytes?: number`
  - `generated_at: string` (ISO timestamp)
  - `fetch_reference: string` (opaque reference value, path-based in Phase 1 contract)
  - `execution_mode: "local"`
  - `timeout_ms: number`
- **Role**: Structured metadata for downstream fetch operation.

### FetchSosreportInput

- **Fields**:
  - `fetch_reference: string`
- **Validation**:
  - Resolves to absolute local path.
  - Must pass local-safe path policy.
  - Filename matches expected sosreport archive pattern (`sosreport-*.tar*`).
- **Role**: Input contract for archive retrieval.

### FetchSosreportResult

- **Fields**:
  - `archive_path: string` (copied archive path under `/tmp`)
  - `size_bytes: number`
  - `sha256: string`
  - `source_archive_path: string`
  - `fetched_at: string` (ISO timestamp)
- **Role**: Output consumed by operator and compatible with `jira_attach_artifact`.

### SosreportError

- **Fields**:
  - `code: string`
  - `message: string` (sanitized and actionable)
  - `text: string` (plain fallback for MCP content)
- **Role**: Unified error response category and fallback representation.

## Relationships

- One `GenerateSosreportInput` request produces one `GenerateSosreportResult`.
- `GenerateSosreportResult.fetch_reference` is consumed by `FetchSosreportInput.fetch_reference`.
- One `FetchSosreportInput` request produces one `FetchSosreportResult`.
- Any operation can terminate with a `SosreportError`.

## State Transitions

### Generate Flow

1. `received` -> input validation
2. `validated` -> dependency/privilege pre-check
3. `ready` -> command execution (`sudo -n`)
4. `executed` -> archive path parse or fallback lookup
5. `resolved` -> result returned with fetch reference
6. Any step -> categorized error (`failed`)

### Fetch Flow

1. `received` -> fetch reference/path validation
2. `validated` -> source file read
3. `read` -> copy to `/tmp` and checksum calculation
4. `copied` -> result returned
5. Any step -> categorized error (`failed`)
