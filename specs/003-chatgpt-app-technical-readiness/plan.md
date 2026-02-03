# Implementation Plan: ChatGPT Apps Technical Readiness

**Branch**: `003-chatgpt-app-technical-readiness` | **Date**: 2026-02-03 | **Spec**: `specs/003-chatgpt-app-technical-readiness/spec.md`
**Input**: Feature specification from `/specs/003-chatgpt-app-technical-readiness/spec.md`

## Summary

Align the MCP app with ChatGPT Apps technical requirements by adding widget
metadata (widgetDomain + CSP), proper tool annotations, widget-initiated tool
access, and policy/support endpoints on the app domain, while keeping the app
no-auth and host-agnostic per the constitution.

## Technical Context

**Language/Version**: TypeScript (Node.js 18+), ES modules  
**Primary Dependencies**: `@modelcontextprotocol/sdk`, `@modelcontextprotocol/ext-apps`, `express`, `zod`, `cors`, `vite`, `tsx`  
**Storage**: N/A (no persistence)  
**Testing**: `tsx scripts/mcp-smoke-tests.ts` via `npm run test:mcp`  
**Target Platform**: Linux server (Node.js)  
**Project Type**: Single project (server + UI bundle)  
**Performance Goals**: p95 tool response <500ms in local/dev; UI resource load <1s in dev  
**Constraints**: No OAuth; widget CSP allowlist limited to `https://gptapppoc.kieley.io`; UI must retain text fallback  
**Scale/Scope**: Single tool, low traffic, no data persistence

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Diagnostics are executed only via approved read-only MCP servers with explicit
  human permission and human-provided credentials.  
  **Pass**: No diagnostics tooling in scope.
- MCP Apps compliance: ui:// resources + JSON-RPC UI bridge, no host-specific APIs.  
  **Pass**: UI uses MCP Apps JSON-RPC via `@modelcontextprotocol/ext-apps`.
  Constitution amended to allow minimal OpenAI widget metadata for ChatGPT Apps.
- All UI flows include text fallbacks for non-UI hosts.  
  **Pass**: Tool response includes text fallback; maintain in changes.
- Redaction and least-scope data handling are enforced for diagnostic data.  
  **Pass**: No diagnostic data in scope.

## Project Structure

### Documentation (this feature)

```text
specs/003-chatgpt-app-technical-readiness/
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
│   └── mcp-app.ts
├── scripts/
│   └── mcp-smoke-tests.ts
├── package.json
└── specs/
    └── 003-chatgpt-app-technical-readiness/
```

**Structure Decision**: Single project with server and UI bundle in the repo
root; feature artifacts live under `specs/003-chatgpt-app-technical-readiness/`.

## Phase 0 Output (Research)

- `specs/003-chatgpt-app-technical-readiness/research.md`

## Phase 1 Output (Design & Contracts)

- `specs/003-chatgpt-app-technical-readiness/data-model.md`
- `specs/003-chatgpt-app-technical-readiness/contracts/mcp-tools.json`
- `specs/003-chatgpt-app-technical-readiness/quickstart.md`

## Constitution Check (Post-Design)

- Diagnostics are executed only via approved read-only MCP servers with explicit
  human permission and human-provided credentials.  
  **Pass**: No diagnostics tooling in scope.
- MCP Apps compliance: ui:// resources + JSON-RPC UI bridge, no host-specific APIs.  
  **Pass**: UI uses MCP Apps JSON-RPC via `@modelcontextprotocol/ext-apps`.
  Constitution amended to allow minimal OpenAI widget metadata for ChatGPT Apps.
- All UI flows include text fallbacks for non-UI hosts.  
  **Pass**: Tool response includes text fallback; maintain in changes.
- Redaction and least-scope data handling are enforced for diagnostic data.  
  **Pass**: No diagnostic data in scope.

## Complexity Tracking

No constitution violations.
