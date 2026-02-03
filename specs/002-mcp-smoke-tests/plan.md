# Implementation Plan: Automated MCP Smoke Tests

**Branch**: `002-mcp-smoke-tests` | **Date**: 2026-02-02 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/002-mcp-smoke-tests/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Deliver an automated MCP smoke test command that runs after a successful build,
starts the MCP server automatically on localhost, validates MCP initialization,
tool listing, tool invocation, and UI resource retrieval, and reports clear
failures with server stdout/stderr captured.

## Technical Context

**Language/Version**: TypeScript (Node.js 18+)  
**Primary Dependencies**: @modelcontextprotocol/sdk, @modelcontextprotocol/ext-apps, Express, cors, Vite, vite-plugin-singlefile, tsx  
**Storage**: N/A  
**Testing**: Custom Node-based MCP smoke test script invoked via npm  
**Target Platform**: Linux/macOS development host; localhost-only testing  
**Project Type**: Single project (server + UI in one repo)  
**Performance Goals**: Smoke test completes in under 60 seconds; MCP initialization timeout at 10 seconds  
**Constraints**: Run against built output; fixed localhost port 3000; no headless browser automation; capture server stdout/stderr on failure  
**Scale/Scope**: Validate the `hello-world` MCP tool and its UI resource only

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
specs/002-mcp-smoke-tests/
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

scripts/
└── mcp-smoke-tests.ts

dist/
└── mcp-app.html

package.json
tsconfig.json
vite.config.ts
```

**Structure Decision**: Single project with server, UI, and a Node-based smoke
test script in `scripts/` that runs against the built `dist/` output.

## Complexity Tracking

No constitution violations to justify.
