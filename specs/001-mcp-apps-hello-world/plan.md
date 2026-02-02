# Implementation Plan: MCP Apps Hello World

**Branch**: `001-mcp-apps-hello-world` | **Date**: 2026-02-02 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-mcp-apps-hello-world/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Deliver a strict MCP Apps–compliant Hello World MCP server and UI skeleton that works in UI-capable hosts and degrades gracefully in text-only hosts. The implementation uses an HTTP MCP transport, a single-file HTML UI bundle served via a `ui://` resource, and a minimal tool contract with a text fallback and UI-driven tool round-trip.

## Technical Context

**Language/Version**: TypeScript (Node.js 18+)  
**Primary Dependencies**: @modelcontextprotocol/sdk, @modelcontextprotocol/ext-apps, Express, cors, Vite, vite-plugin-singlefile, tsx  
**Storage**: N/A  
**Testing**: Minimal manual validation for tool listing, tool call, UI render, and text fallback  
**Target Platform**: Linux/macOS development host; MCP host connects via HTTP  
**Project Type**: Single project (server + UI in one repo)  
**Performance Goals**: UI renders within 2 seconds for 95% of tool calls  
**Constraints**: Strict MCP Apps compliance only; no host-specific runtime APIs  
**Scale/Scope**: Single-tool Hello World demo with one UI view and a single round-trip action

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Diagnostics are executed only via approved read-only MCP servers with explicit
  human permission and human-provided credentials. (Not applicable in this increment.)
- MCP Apps compliance: ui:// resources + JSON-RPC UI bridge, no host-specific APIs. (Compliant.)
- All UI flows include text fallbacks for non-UI hosts. (Compliant.)
- Redaction and least-scope data handling are enforced for diagnostic data. (Not applicable in this increment.)

**Post-Design Re-check**: Pass (no changes introduced that violate constitution principles).

## Project Structure

### Documentation (this feature)

```text
specs/001-mcp-apps-hello-world/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
server.ts
mcp-app.html
src/
└── mcp-app.ts

dist/
└── mcp-app.html

package.json
tsconfig.json
vite.config.ts
```

**Structure Decision**: Single project with server and UI in repo root. UI source lives in `mcp-app.html` + `src/mcp-app.ts` and builds into `dist/mcp-app.html` for serving as the `ui://` resource.

## Complexity Tracking

No constitution violations to justify.
