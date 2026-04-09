# Data Model: Dynamic CPU Resource UI

## Entity: SessionCpuTelemetrySample

- **Purpose**: One timestamped CPU measurement row rendered in troubleshooting table.
- **Fields**:
  - `sampled_at` (ISO-8601 timestamp)
  - `model` (string)
  - `logical_cores` (number)
  - `physical_cores` (number)
  - `frequency_mhz` (number)
  - `load_avg_1m` (number)
  - `load_avg_5m` (number)
  - `load_avg_15m` (number)
  - `cpu_line` (string)
- **Validation rules**:
  - Values map to `get_cpu_information` output fields.
  - One successful tick yields exactly one appended sample.
  - Samples are ordered oldest -> newest for table rendering.

## Entity: SessionCpuTelemetryBuffer

- **Purpose**: Session-local rolling collection of CPU samples.
- **Fields**:
  - `workflow_session_id` (string)
  - `samples` (`SessionCpuTelemetrySample[]`, max length 10)
  - `last_updated_at` (ISO-8601 timestamp)
  - `last_error_code` (optional string; informational only)
- **Validation rules**:
  - On append beyond 10, oldest sample is dropped.
  - Buffer never contains samples from other sessions.
  - Buffer is readable even when zero samples exist.

## Entity: SessionCpuTelemetryJob

- **Purpose**: Runtime scheduling state for per-session 1-second updates.
- **Fields**:
  - `workflow_session_id` (string)
  - `interval_ms` (number, fixed at 1000)
  - `timer_handle` (runtime interval reference)
  - `active` (boolean)
- **Validation rules**:
  - Only one active job per `workflow_session_id`.
  - Job starts only when at least one telemetry subscriber exists.
  - Job stops when subscriber count for session reaches zero.

## Entity: CpuTelemetrySubscriptionState

- **Purpose**: Track active MCP subscriptions for telemetry URIs.
- **Fields**:
  - `uri` (resource URI)
  - `workflow_session_id` (string)
  - `subscriber_count` (number)
- **Validation rules**:
  - Subscribe increments session demand; unsubscribe decrements.
  - Zero subscribers means no `sendResourceUpdated` dispatch for that URI.
  - Non-telemetry URIs continue using their existing subscription behavior.

## Entity: SessionCpuTelemetryResourcePayload

- **Purpose**: JSON payload returned by `resources/read` for troubleshooting telemetry.
- **Fields**:
  - `workflow_session_id` (string)
  - `sample_count` (number, 0..10)
  - `samples` (`SessionCpuTelemetrySample[]`)
  - `text` (human-readable fallback summary)
- **Validation rules**:
  - `sample_count` equals `samples.length`.
  - Payload remains valid when sample list is empty.
  - Text fallback is always present for non-UI hosts.

## Entity: TroubleshootingUiTelemetryState

- **Purpose**: Widget-side state required to render and clean up dynamic telemetry.
- **Fields**:
  - `telemetry_resource_uri` (string | null)
  - `telemetry_subscribed` (boolean)
  - `telemetry_rows` (`SessionCpuTelemetrySample[]`)
  - `telemetry_last_read_at` (ISO-8601 timestamp | null)
- **Validation rules**:
  - Entering troubleshooting mounts/subscribes and populates rows from immediate read.
  - Leaving troubleshooting unsubscribes and disables further row mutation.
  - UI renders exactly current rolling rows from latest resource read.
