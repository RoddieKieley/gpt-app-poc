# Quickstart: Dynamic CPU Resource UI

## Goal

Implement dynamic troubleshooting CPU telemetry using MCP resource updates with a session-scoped rolling table (1-second ticks, latest 10 rows).

## Preconditions

- Work on branch `022-cpu-resource-ui`.
- Existing troubleshooting step wiring is already present as workflow step 2.
- Existing `get_cpu_information` tool is available and returns structured CPU fields + text fallback.

## Implementation Sequence

1. Extend server telemetry resource model in `server.ts`:
   - Add `ResourceTemplate` URI for session CPU telemetry.
   - Add in-memory buffer map keyed by `workflowSessionId`.
   - Add interval-job map keyed by `workflowSessionId`.
2. Implement telemetry update loop:
   - On each 1-second tick call CPU info handler/tool path.
   - Append one sample row on success.
   - Trim rows to latest 10.
   - Trigger `sendResourceUpdated` for subscribed telemetry URI.
3. Reuse and extend subscribe/unsubscribe handlers:
   - Track telemetry URI subscriptions.
   - Start per-session job on first subscriber.
   - Stop job when last subscriber leaves.
4. Add telemetry resource read handler:
   - Return JSON payload with current rolling samples.
   - Always include summary text fallback.
5. Wire widget lifecycle in `src/mcp-app.ts`:
   - On troubleshooting step mount/entry: subscribe then read telemetry resource.
   - On troubleshooting step unmount/exit: unsubscribe and cleanup listeners/state.
   - Render rows in troubleshooting table component from resource payload.
6. Update tests:
   - Unit tests for rolling-buffer cap and tick behavior.
   - Integration test for subscribe/read/update/unsubscribe telemetry flow.
   - Contract/regression tests for tools/list compatibility and resource URI semantics.

## Verification Commands

Run focused suites first:

```bash
npm run test:unit
npm run test:integration
npm run test:contract
npm run test:regression
```

Run full confidence pass:

```bash
npm run test:unit && npm run test:contract && npm run test:integration && npm run test:regression
```

## Acceptance Checklist

- [ ] Troubleshooting uses session-scoped telemetry resource URI.
- [ ] Telemetry updates once per second while subscribed.
- [ ] Each successful tick appends one table row.
- [ ] Table/window is capped to latest 10 rows.
- [ ] Oldest row is dropped when row 11 is added.
- [ ] Session isolation is preserved across concurrent workflows.
- [ ] Widget subscribes/reads on troubleshooting entry and unsubscribes on exit.
- [ ] Text fallback remains present for non-UI hosts.
- [ ] Existing compatibility entry URI and step resource registration pattern remain unchanged.
