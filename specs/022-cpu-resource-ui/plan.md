# Implementation Plan: Dynamic CPU Resource UI

**Branch**: `022-cpu-resource-ui` | **Date**: 2026-04-09 | **Spec**: `/wip/src/github.com/roddiekieley/gpt-app-poc/specs/022-cpu-resource-ui/spec.md`  
**Input**: Feature specification from `/wip/src/github.com/roddiekieley/gpt-app-poc/specs/022-cpu-resource-ui/spec.md`

## Summary

Implement a session-scoped MCP CPU telemetry resource for the troubleshooting step that updates once per second from `get_cpu_information`, appends one row per tick, and keeps only the latest 10 rows. Reuse the existing server-side resource subscription pattern already used by sosreport job resources (`ResourceTemplate`, `resources/subscribe`, `resources/unsubscribe`, `sendResourceUpdated`) and wire widget lifecycle behavior so troubleshooting step mount subscribes + reads, unmount unsubscribes, and UI renders the rolling table.

## Technical Context

**Language/Version**: TypeScript 5.x (ESM), React 19.x, Node.js runtime  
**Primary Dependencies**: `@modelcontextprotocol/sdk`, `@modelcontextprotocol/ext-apps`, `react`, `react-dom`, `express`, `zod`  
**Storage**: In-memory session-scoped buffers and interval jobs (no persistent storage)  
**Testing**: `tsx --test` suites (`test:unit`, `test:contract`, `test:integration`, `test:regression`)  
**Target Platform**: Linux-hosted MCP server + MCP Apps-compatible widget hosts  
**Project Type**: Single MCP server project with embedded React widget  
**Performance Goals**: Resource updates every 1 second; UI reflects new rows within 2 seconds for >=95% of ticks; bounded memory via max 10 rows/session  
**Constraints**: Keep compatibility entry URI unchanged, preserve text fallback behavior, keep diagnostics explicit/read-only, avoid host-specific APIs, preserve existing step resource registration pattern  
**Scale/Scope**: Troubleshooting step telemetry for concurrent sessions using isolated in-memory rolling buffers and subscription-aware update notifications

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Diagnostics stay explicit and read-only: telemetry uses `get_cpu_information` and does not introduce implicit privileged writes. **PASS**
- MCP Apps compliance is preserved: UI continues through `ui://` resources and MCP JSON-RPC bridge with `resources/read` + subscribe/unsubscribe. **PASS**
- Text fallback behavior remains intact: all tool outputs still provide text fallback and troubleshooting remains compatible in non-UI hosts. **PASS**
- Data minimization and least-scope handling remain in place: only bounded CPU summaries are kept in-memory per session (max 10 samples). **PASS**
- Non-retroactive spec integrity is preserved: all new contracts/docs are added only under `specs/022-cpu-resource-ui/`. **PASS**

## Project Structure

### Documentation (this feature)

```text
specs/022-cpu-resource-ui/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── engage-cpu-telemetry-resource.contract.v1.json
│   ├── engage-cpu-telemetry-subscription.openapi.yaml
│   └── engage-troubleshooting-live-workflow.contract.v1.json
└── tasks.md
```

### Source Code (repository root)

```text
server.ts

src/
├── linux/
│   └── system-info/
│       ├── cpu-info-model.ts
│       └── cpu-info-tool-handler.ts
├── mcp-app.ts
└── mcp-app/
    ├── App.tsx
    ├── state.ts
    ├── step-content.tsx
    └── ui/
        ├── adapter-contract.ts
        └── progress-affordance-adapter.tsx

tests/
├── unit/
│   └── cpu-info-tool-handler.test.ts
├── contract/
│   ├── engage-red-hat-support.contract.test.ts
│   └── cpu-information-tools.contract.test.ts
├── integration/
│   ├── engage-red-hat-support.workflow.test.ts
│   └── sosreport-generate.resource-subscribe.test.ts
└── regression/
    ├── engage-four-step-navigation.test.ts
    └── mcp-tool-surface-preservation.test.ts
```

**Structure Decision**: Keep the existing single-project architecture and extend established server resource patterns and widget state/routing flow in place; avoid introducing new services or persistence layers.

## Implementation Strategy

1. Add a session-scoped CPU telemetry resource URI template and in-memory rolling buffer state in `server.ts`.
2. Reuse current resource job mechanics by extending subscription tracking and `sendResourceUpdated` dispatch for CPU telemetry URIs.
3. Add per-session update jobs that run every second, call `handleGetCpuInformation`, append one row, cap to latest 10 rows, and skip bad ticks without halting.
4. Register resource read handler that returns full rolling payload for a session (including ordered rows and summary text).
5. Update troubleshooting UI state/model to hold rolling CPU rows and telemetry subscription status.
6. Wire widget lifecycle: subscribe + initial read when troubleshooting step mounts/enters, unsubscribe on unmount/step exit, and re-read on resource update signals.
7. Keep existing workflow compatibility metadata and step resource registration unchanged while adding telemetry-read rendering to step 2 content.
8. Add/adjust unit, integration, contract, and regression tests for rolling-buffer bounds, session isolation, resource subscribe/read/unsubscribe flow, and tools/list surface parity.

## Phase 0: Research Plan

- Confirm exact reuse boundaries of existing generate-job resource infrastructure in `server.ts` (subscription set, URI prefix filters, update notifier).
- Confirm best-practice handling for per-session interval lifecycle (start on demand, stop when unsubscribed/session ends, avoid orphan timers).
- Confirm widget-side MCP Apps patterns for resource subscribe/read lifecycle and safe mount/unmount cleanup.
- Confirm test extension strategy using existing `sosreport-generate.resource-subscribe.test.ts` as pattern for telemetry resources.

## Phase 1: Design & Contracts Plan

- Create `data-model.md` for session telemetry buffers, sample rows, subscription state, and troubleshooting UI state transitions.
- Create contracts:
  - `contracts/engage-cpu-telemetry-resource.contract.v1.json`
  - `contracts/engage-cpu-telemetry-subscription.openapi.yaml`
  - `contracts/engage-troubleshooting-live-workflow.contract.v1.json`
- Create `quickstart.md` with implementation sequence and verification commands for server resource flow + widget lifecycle flow.
- Run `.specify/scripts/bash/update-agent-context.sh cursor-agent`.

## Post-Design Constitution Re-Check

- Telemetry collection remains read-only and bounded to explicit troubleshooting context. **PASS**
- Resource flow remains MCP-native (`resources/read`, subscribe/unsubscribe, update notifications). **PASS**
- Text fallback and non-UI compatibility remain preserved by design. **PASS**
- No credential or secret pathways are added. **PASS**
- All new spec contracts stay within active feature package only. **PASS**

## Complexity Tracking

No constitution violations identified; complexity justification table is not required.
