# Research: Automated MCP Smoke Tests

## Decision: Test against built output
**Rationale**: Validating the built bundle ensures the smoke tests reflect the
actual artifacts shipped by the build process rather than source-only behavior.  
**Alternatives considered**: Testing against TypeScript source (rejected: does
not prove the built output is executable).

## Decision: Automatic server lifecycle
**Rationale**: Starting and stopping the server within the test runner removes
manual steps and guarantees a repeatable, isolated check.  
**Alternatives considered**: Requiring a separately running server (rejected:
adds manual setup and failure points).

## Decision: Fixed localhost port (3000)
**Rationale**: A fixed port reduces ambiguity for test configuration and aligns
with localhost-only scope.  
**Alternatives considered**: Dynamic ports (rejected: added discovery complexity).

## Decision: MCP initialization timeout (10 seconds)
**Rationale**: A bounded timeout prevents hanging tests and gives consistent
failure behavior across environments.  
**Alternatives considered**: No timeout or longer timeouts (rejected: slower
feedback and less deterministic failures).

## Decision: Scope limited to `hello-world` tool
**Rationale**: Keeps validation aligned with the first increment and avoids
over-expanding test coverage beyond the defined MCP surface.  
**Alternatives considered**: Validating all tools (rejected: scope creep).

## Decision: UI resource validation without headless automation
**Rationale**: The goal is to ensure the resource is retrievable, not to test UI
rendering or interaction.  
**Alternatives considered**: Headless browser tests (rejected: unnecessary
complexity for smoke checks).

## Decision: Capture server stdout/stderr on failure
**Rationale**: Provides immediate diagnostic context for failures without adding
log file management.  
**Alternatives considered**: No capture (rejected: poor debugging experience),
log file output (deferred for future needs).
