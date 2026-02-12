# Implementation Plan: Jira Attachment via User PAT Secret Boundary

**Branch**: `004-jira-attachment-pat` | **Date**: 2026-02-12 | **Spec**: `specs/004-jira-attachment-pat/spec.md`
**Input**: Feature specification from `/specs/004-jira-attachment-pat/spec.md`

## Summary

Add a secure Jira connection and attachment workflow where end users can connect
with base URL + PAT, verify status, list issue attachments, upload selected local
artifacts, and revoke access. Secret-bearing data is handled only in backend token
vault components with encryption at rest, while MCP and UI surfaces use opaque
references (for example `connection_id`) plus text fallbacks for non-UI hosts.

## Technical Context

**Language/Version**: TypeScript 5.x on Node.js 18+ (ES modules)  
**Primary Dependencies**: `express`, `@modelcontextprotocol/sdk`, `@modelcontextprotocol/ext-apps`, `zod`, `cors`  
**Storage**: Backend token vault persistence with encrypted-at-rest credential records (user-scoped), plus non-secret audit/event records  
**Testing**: Existing repo tooling (`tsx`) with added unit/integration scripts for auth flow, redaction, Jira error mapping, and MCP text fallback checks  
**Target Platform**: Linux server deployment against self-hosted Jira over HTTPS  
**Project Type**: Single project (MCP server + UI resources in one repo)  
**Performance Goals**: 95% of connect operations under 30s; 95% of attachment operations under 2m; revoke effect within 5s  
**Constraints**: PATs backend-only; no secret leakage to MCP args/results/prompts/transcripts/logs; opaque references in tool interfaces; explicit revoke + bounded credential lifetime  
**Scale/Scope**: Per-user Jira connection management and artifact attachment only (OAuth, multi-provider secret abstraction, tenant-wide admin policy out of scope)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Diagnostics are executed only via approved read-only MCP servers with explicit
  human permission and human-provided credentials.
  **Pass**: This feature consumes user-selected local artifacts (including retrieved
  sosreport artifacts) and does not add implicit diagnostic collection behavior.
- MCP Apps compliance: ui:// resources + JSON-RPC UI bridge, no host-specific APIs.
  **Pass**: Plan keeps UI resources under `ui://` and widget-server communication on
  JSON-RPC MCP bridge with text fallbacks.
- All UI flows include text fallbacks for non-UI hosts.
  **Pass**: Every tool response includes actionable text content for CLI/non-UI hosts.
- Redaction and least-scope data handling are enforced for diagnostic data.
  **Pass**: Artifact scope is user-selected; logs and event records are non-secret
  and redacted by design.
- Secret boundary for tokens and credentials (Principle 8).
  **Pass**: PAT intake and use are backend-only, encrypted at rest, never exposed in
  MCP tool payloads, model-visible transcripts, prompts, or logs.

## Project Structure

### Documentation (this feature)

```text
specs/004-jira-attachment-pat/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
/
├── server.ts
├── mcp-app.html
├── src/
│   ├── mcp-app.ts
│   ├── jira/
│   │   ├── jira-tool-schemas.ts
│   │   ├── jira-tool-handlers.ts
│   │   └── jira-error-mapping.ts
│   └── security/
│       ├── token-vault.ts
│       ├── redaction.ts
│       └── connection-lifecycle.ts
├── scripts/
│   ├── mcp-smoke-tests.ts
│   └── jira-token-boundary-tests.ts
├── dist/
└── specs/
    └── 004-jira-attachment-pat/
```

**Structure Decision**: Keep a single-project layout and extend existing `server.ts`
and `src/mcp-app.ts` integration points with focused `src/jira/` and
`src/security/` modules. This minimizes churn while isolating secret-handling and
Jira integration concerns into testable units.

## API and MCP Boundary Contract

- **Allowed secret ingress**: Backend-only HTTPS endpoint used by widget/server
  channel to submit PAT for immediate vaulting; endpoint never echoes token.
- **Forbidden secret surfaces**: MCP tool args/results, JSON-RPC bridge payloads,
  prompts, model-visible transcripts, and logs.
- **MCP tool contract**: Uses opaque `connection_id` and non-secret operational
  fields only (`issue_key`, `artifact_ref`, status filters).
- **Vault usage**: Tool handlers resolve `connection_id` -> vault credential in
  backend memory/runtime boundary just-in-time for outbound Jira call, then redact.

## Complexity Tracking

No constitution violations. No justified complexity exceptions required.

## Phase 0 Output (Research)

- `specs/004-jira-attachment-pat/research.md`

## Phase 1 Output (Design & Contracts)

- `specs/004-jira-attachment-pat/data-model.md`
- `specs/004-jira-attachment-pat/contracts/mcp-tools.json`
- `specs/004-jira-attachment-pat/contracts/http-api.yaml`
- `specs/004-jira-attachment-pat/quickstart.md`

## Constitution Check (Post-Design)

- Diagnostics are executed only via approved read-only MCP servers with explicit
  human permission and human-provided credentials.  
  **Pass**: Design does not introduce unapproved diagnostics collection.
- MCP Apps compliance: ui:// resources + JSON-RPC UI bridge, no host-specific APIs.  
  **Pass**: Tool invocations remain through MCP + `ui://` resources; no host runtime coupling.
- All UI flows include text fallbacks for non-UI hosts.  
  **Pass**: Contracts require text responses for success and failure paths.
- Redaction and least-scope data handling are enforced for diagnostic data.  
  **Pass**: Artifact and event schemas are least-scope; logs redact sensitive strings.
- Secret boundary for tokens and credentials (Principle 8).  
  **Pass**: Token vault, opaque references, revoke/expiry controls, and leak-prevention tests are explicit design requirements.
