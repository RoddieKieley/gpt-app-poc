<!--
Sync Impact Report
- Version change: none -> 0.1.0
- Modified principles: none (initial constitution)
- Added sections: Security & Data Handling, Architecture & Compliance, Development Workflow & Quality Gates
- Removed sections: placeholder template tokens
- Templates requiring updates:
  - .specify/templates/plan-template.md (updated)
  - .specify/templates/spec-template.md (updated)
  - .specify/templates/tasks-template.md (updated)
- Follow-up TODOs:
  - TODO(RATIFICATION_DATE): original adoption date not provided
-->
# GPT App PoC Constitution

## Core Principles

### 1. Support-Workflow Fidelity
The system MUST model the Red Hat support case lifecycle (severity, diagnostics,
escalation) and treat sosreport/must-gather-equivalent artifacts as primary
diagnostics. Outputs MUST be repeatable and optimized for support engineer use.

### 2. Human-Authorized Diagnostics
Diagnostics MAY be executed only via approved read-only MCP servers, and only
with explicit human permission and human-provided credentials. The app MUST NOT
run diagnostics implicitly or perform any write/state-changing operations.

### 3. Privacy-First Diagnostics
The system MUST minimize data exposure, guide redaction, and prompt for review
before ingesting or sharing diagnostics. Sensitive data MUST be treated as
explicitly protected by default.

### 4. Strict MCP Apps Compliance
Implement MCP core and the MCP Apps extension only (ui:// resources and JSON-RPC
UI bridge). Do NOT rely on ChatGPT-specific runtime APIs or host-only metadata.

### 5. Graceful Degradation
Every UI flow MUST include a complete text fallback so CLI and non-UI hosts
remain fully usable and informative.

### 6. Portability and Interop
Server logic MUST be host-agnostic and portable across MCP-aware clients without
branching on the host environment.

### 7. Incremental Spec-Driven Delivery
Each feature MUST be introduced through an explicit spec, plan, and task list,
and delivered in small, independently testable increments.

## Security & Data Handling

- Diagnostics collection MUST use approved MCP servers with explicit human
  consent and human-provided credentials. All diagnostics MUST be read-only.
- Sensitive data (IPs, hostnames, credentials, keys, tokens) MUST be identified
  and redacted before analysis or sharing.
- Data ingestion MUST be opt-in with clear prompts; default to redaction and
  least-scope collection.
- Acceptable sources include sosreport, must-gather, logs, and approved MCP
  servers that provide data/metrics in formats required by sosreport and
  must-gather outputs; unsolicited collection is prohibited.
- Retention MUST be minimal and explicitly authorized.

## Architecture & Compliance

- MCP server MUST implement initialize, tools/list, and tools/call and return
  ui:// resources with mcp.app annotations when UI is required.
- UI MUST communicate via MCP Apps JSON-RPC postMessage only; no window.openai or
  host-specific runtime dependencies.
- Tool responses MUST always include content text fallbacks.

## Development Workflow & Quality Gates

- Each increment MUST include spec.md, plan.md, and tasks.md updates.
- Tests are REQUIRED for diagnostics tool calls, redaction logic, and text
  fallback behavior.
- Security review is REQUIRED for any new diagnostic data access or permissions.
- PRs MUST cite which constitution principles are addressed.

## Governance

- This constitution supersedes all other project documentation.
- Amendments require a written rationale, migration plan, and semantic version
  bump recorded in this file.
- Reviews MUST verify compliance with this constitution; non-compliant changes
  must be revised before merge.

**Version**: 0.1.0 | **Ratified**: TODO(RATIFICATION_DATE) | **Last Amended**: 2026-02-02
