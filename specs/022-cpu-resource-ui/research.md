# Phase 0 Research: Dynamic CPU Resource UI

## Decision 1: Use a session-scoped resource URI template for CPU telemetry

- **Decision**: Represent troubleshooting telemetry as `resource://engage/troubleshooting/cpu/{workflowSessionId}` using `ResourceTemplate` in `server.ts`.
- **Rationale**: The session key already exists in workflow state and supports strict isolation between concurrent sessions while matching existing dynamic resource conventions in this repo.
- **Alternatives considered**:
  - One global CPU telemetry resource (rejected: violates session-isolation requirement).
  - Resource key by user id only (rejected: users may run parallel sessions and require separate rolling windows).

## Decision 2: Reuse generate-job resource subscription mechanics

- **Decision**: Extend current subscribe/unsubscribe handling (`resourceSubscriptions` + URI-prefix filters) and keep `sendResourceUpdated({ uri })` as the only push signal.
- **Rationale**: Existing generate-job path already proves interoperability for MCP subscription flow and minimizes implementation risk.
- **Alternatives considered**:
  - Introduce a separate event bus abstraction (rejected: unnecessary complexity for current scope).
  - Poll-only UI with no subscriptions (rejected: does not satisfy dynamic MCP resource update requirement).

## Decision 3: Maintain in-memory rolling buffers with bounded retention

- **Decision**: Store telemetry per session in-memory as ordered samples; append each successful tick and trim to latest 10 rows.
- **Rationale**: This directly enforces the bounded-window requirement and keeps runtime memory predictable without adding storage dependencies.
- **Alternatives considered**:
  - Persist telemetry to disk/database (rejected: out of scope and adds operational overhead).
  - Keep unbounded in-memory history (rejected: violates requirement to drop oldest rows beyond 10).

## Decision 4: Start/stop telemetry jobs based on active subscription lifecycle

- **Decision**: Start a 1-second interval when first telemetry subscription for a session appears; stop interval when the session has no telemetry subscribers.
- **Rationale**: Aligns background work with user-visible demand and prevents orphan update loops.
- **Alternatives considered**:
  - Start jobs at workflow step entry regardless of subscription (rejected: does extra work when no consumer is attached).
  - Keep jobs running until process restart (rejected: leaks timers and violates least-work principles).

## Decision 5: Tick behavior calls `get_cpu_information` handler and tolerates transient failures

- **Decision**: Each tick calls `handleGetCpuInformation({})`, appends exactly one new row on success, and skips append on failure while continuing next ticks.
- **Rationale**: Preserves functional parity with the CPU tool output model and supports resilience requirement for intermittent collection failure.
- **Alternatives considered**:
  - Stop job after first error (rejected: violates requirement to continue processing later ticks).
  - Append synthetic placeholder rows on error (rejected: could mislead operators with non-measured data).

## Decision 6: Widget subscribes/reads on troubleshooting step mount and unsubscribes on unmount

- **Decision**: Add a troubleshooting lifecycle in `src/mcp-app.ts` that performs:
  1) initial `resources/subscribe`,
  2) immediate `resources/read`,
  3) rendering updates from subsequent reads/notifications,
  4) `resources/unsubscribe` on step exit/unmount.
- **Rationale**: This maps directly to MCP resource semantics and ensures deterministic cleanup with no stale cross-step updates.
- **Alternatives considered**:
  - Subscribe once at app bootstrap and never unsubscribe (rejected: unnecessary background activity outside troubleshooting step).
  - Read only on button click (rejected: fails automatic rolling table behavior).
