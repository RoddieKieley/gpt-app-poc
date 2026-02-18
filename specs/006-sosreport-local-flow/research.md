# Research: Local-First Sosreport MCP Tools (Phase 1)

**Feature**: 006-sosreport-local-flow  
**Date**: 2026-02-18

## Decision: Tool schema design and validation boundaries

**Decision**: Define two MCP inputs:
- `generate_sosreport`: `only_plugins`, `enable_plugins`, `disable_plugins`, `log_size`, `redaction`
- `fetch_sosreport`: `fetch_reference`

Validation rules:
- Plugin list items must match `^[A-Za-z0-9_-]+$`.
- `log_size` must match `^\d+(k|K|m|M|g|G)?$`.
- Reject any request combining `only_plugins` with `enable_plugins` or `disable_plugins`.
- `fetch_reference` must be absolute, local-safe, and match sosreport archive naming.

**Rationale**: Mirrors requested parity with linux-mcp-server behavior while keeping a concise TypeScript PoC schema contract.

**Alternatives considered**:
- More permissive plugin/value parsing - rejected to avoid ambiguous command behavior.
- Host/SSH argument support in Phase 1 - rejected by scope constraints.

---

## Decision: Local privileged execution model

**Decision**: Execute sosreport generation locally via `sudo -n` using non-interactive process execution and a default timeout of `600000` ms.

**Rationale**: `sudo -n` enforces explicit operational readiness and prevents prompt-driven hanging behavior incompatible with MCP tool calls.

**Alternatives considered**:
- Interactive password prompt flow - rejected as explicitly out of scope.
- Elevated daemon/service mediator for privilege - rejected for Phase 1 simplicity.

---

## Decision: Archive path discovery strategy

**Decision**: Parse generated archive path from command output first; if missing, perform fallback lookup by selecting the latest matching `sosreport-*.tar*` archive in expected output location.

**Rationale**: Provides deterministic operator experience even if command output format varies.

**Alternatives considered**:
- Output parsing only - rejected due to brittle behavior across environments.
- Directory scan only - rejected because direct output path is more precise and faster.

---

## Decision: Error taxonomy and MCP response style

**Decision**: Use stable, actionable error categories (`validation_error`, `dependency_missing`, `privilege_required`, `timeout`, `archive_not_found`, `path_unsafe`, `read_failed`, `copy_failed`, `unexpected_error`) and always return a plain-text fallback message in MCP responses.

**Rationale**: Meets constitutional fallback requirements and supports operational troubleshooting without exposing sensitive details.

**Alternatives considered**:
- Raw command stderr pass-through - rejected for security and consistency.
- Single generic error category - rejected because operators need remediation guidance.

---

## Decision: Fetch artifact output and Jira interoperability

**Decision**: `fetch_sosreport` copies the archive to `/tmp` and returns that copied `archive_path`, `size_bytes`, and `sha256`.

**Rationale**: Keeps a stable, local path suitable for current `jira_attach_artifact` path boundary checks and simplifies cleanup.

**Alternatives considered**:
- Return original source path - rejected; source path may be less ergonomic for downstream operations.
- Return in-memory bytes - rejected because existing Jira flow expects filesystem artifact references.

---

## Decision: Explicit Phase 2 deferrals

**Decision**: Defer SSH execution, connection lifecycle, host trust/secret management, and multi-tenant hardening/rate limiting.

**Rationale**: Preserves the Phase 1 local-first objective and keeps implementation increment small and testable.

**Alternatives considered**:
- Partial SSH scaffolding in Phase 1 - rejected due to complexity and security review overhead.
