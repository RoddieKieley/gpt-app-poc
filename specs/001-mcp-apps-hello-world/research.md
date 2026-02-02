# Research: MCP Apps Hello World

## Decision: UI resource URI scheme
**Rationale**: MCP Apps hosts detect UI resources via the `ui://` scheme. A stable URI is required for tool metadata and resource handler to align.  
**Alternatives considered**: HTTP/HTTPS URIs (rejected: hosts will not treat them as MCP Apps UI resources).

## Decision: JSON-RPC UI bridge messaging
**Rationale**: Use the MCP Apps JSON-RPC postMessage bridge via the `App` helper from `@modelcontextprotocol/ext-apps` to avoid host-specific runtime APIs and reduce protocol errors.  
**Alternatives considered**: Manual postMessage JSON-RPC (rejected: higher risk for malformed messages and duplicate lifecycle handling).

## Decision: Single-file HTML bundle
**Rationale**: A single HTML file simplifies serving the UI resource and avoids CSP or asset loading issues in sandboxed iframes.  
**Alternatives considered**: Multi-file bundles with external assets (rejected: higher risk of blocked resources and more complex hosting).

## Decision: Minimal tool contract
**Rationale**: A single Hello World tool with a simple input schema and text fallback satisfies strict MCP Apps compliance and demonstrates UI and non-UI host behavior.  
**Alternatives considered**: Multiple tools or richer schema (rejected: unnecessary for first increment).
