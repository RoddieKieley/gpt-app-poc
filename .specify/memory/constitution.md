<!--
Sync Impact Report
- Version change: 0.2.0 -> 0.3.0
- Modified principles: none
- Added principles: 9. Non-Retroactive Specification Integrity
- Added sections: none
- Removed sections: none
- Templates requiring updates:
  - none
- Follow-up TODOs:
  - none
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
UI bridge). Do NOT rely on ChatGPT-specific runtime APIs or host-only metadata,
except for the minimal OpenAI widget metadata required for ChatGPT Apps
distribution (e.g., `openai/widgetDomain`, `openai/widgetCSP`,
`openai/widgetAccessible`).

### 5. Graceful Degradation
Every UI flow MUST include a complete text fallback so CLI and non-UI hosts
remain fully usable and informative.

### 6. Portability and Interop
Server logic MUST be host-agnostic and portable across MCP-aware clients without
branching on the host environment.

### 7. Incremental Spec-Driven Delivery
Each feature MUST be introduced through an explicit spec, plan, and task list,
and delivered in small, independently testable increments.

### 8. Secret Boundary for Tokens and Credentials
Personal access tokens (PATs), API keys, and credentials MUST be handled only by
trusted backend services. Secrets MUST NOT appear in MCP tool arguments, tool
results, prompts, model-visible transcripts, or application logs.

### 9. Non-Retroactive Specification Integrity
Completed or historical specification packages (for example older numbered
directories under `specs/`) and their corresponding branches MUST be treated as
immutable records. New requirements, contract changes, and workflow behavior
updates MUST be introduced only in the current feature specification package and
its branch. If historical context is needed, reference earlier specs without
rewriting them.

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
- PATs and similar secrets MUST be entered only through secure backend endpoints,
  encrypted at rest, and accessed via opaque references (for example,
  `connection_id`) in MCP tool calls.
- Secrets MUST be redacted from logs by default. Logging of `Authorization`
  headers, raw tokens, and secret-bearing request bodies is prohibited.
- Credential handling MUST enforce least privilege, explicit revoke/disconnect
  flows, and bounded lifetime (TTL/expiry) for stored secrets.

## Architecture & Compliance

- MCP server MUST implement initialize, tools/list, and tools/call and return
  ui:// resources with mcp.app annotations when UI is required.
- UI MUST communicate via MCP Apps JSON-RPC postMessage only; no window.openai or
  host-specific runtime dependencies. The only allowed host-specific usage is
  OpenAI widget metadata required for ChatGPT Apps distribution
  (`openai/widgetDomain`, `openai/widgetCSP`, `openai/widgetAccessible`).
- Tool responses MUST always include content text fallbacks.
- Features that integrate third-party services (for example Jira) MUST use
  backend-mediated authentication and pass only non-secret identifiers through
  MCP tool interfaces.

## Development Workflow & Quality Gates

- Each increment MUST include spec.md, plan.md, and tasks.md updates.
- Tests are REQUIRED for diagnostics tool calls, redaction logic, and text
  fallback behavior.
- Security review is REQUIRED for any new diagnostic data access or permissions.
- Features that introduce credential handling MUST include tests proving secrets
  are never emitted in MCP tool payloads, responses, or logs.
- Implementations MUST NOT retroactively modify prior specification packages or
  prior feature branches to introduce new behavior. Any required new contracts
  or rules MUST be captured in the active feature specification package.
- PRs MUST cite which constitution principles are addressed.

## Amendment Record

### 2026-02-11: PAT and MCP App Secret-Handling Guardrails
- **Rationale**: Upcoming Jira attachment workflows require user-provided PATs.
  The project needs explicit, enforceable constraints to prevent secret leakage
  into model-visible channels and logs.
- **Migration Plan**:
  - Add backend-only credential intake and storage using encrypted-at-rest
    persistence.
  - Refactor any secret-bearing MCP interfaces to opaque reference-based flows.
  - Add regression tests for token redaction and transcript-safe tool payloads.
  - Update feature specs and PR checklists to cite Principle 8.

### 2026-02-26: Non-Retroactive Specification Integrity
- **Rationale**: Updating older spec packages/branches during new feature work
  obscures historical decisions and weakens traceability between a feature and
  its design artifacts.
- **Migration Plan**:
  - Keep previously completed spec packages and their contracts unchanged.
  - Place all new contract and workflow behavior requirements in the current
    feature spec package only.
  - Update review checklists to flag retroactive edits to prior specs/branches.
  - Require tests for new behavior to point to the active feature contracts.

## Governance

- This constitution supersedes all other project documentation.
- Amendments require a written rationale, migration plan, and semantic version
  bump recorded in this file.
- Reviews MUST verify compliance with this constitution; non-compliant changes
  must be revised before merge.

**Version**: 0.3.0 | **Ratified**: 2026-02-02 | **Last Amended**: 2026-02-26
