# Research: ChatGPT Apps Technical Readiness

## Decision: Widget CSP allowlist

- **Decision**: Limit `openai/widgetCSP` allowlists to `https://gptapppoc.kieley.io` only.
- **Rationale**: The widget does not fetch external resources; restricting CSP reduces review risk and aligns with least-privilege guidance.
- **Alternatives considered**: Allow `https://*.oaistatic.com` or a broader CDN allowlist.

## Decision: Widget domain

- **Decision**: Set `openai/widgetDomain` to `https://gptapppoc.kieley.io`.
- **Rationale**: Required for ChatGPT Apps widget rendering and must be unique per app.
- **Alternatives considered**: Using a placeholder or development domain.

## Decision: Privacy policy hosting

- **Decision**: Host privacy policy at `https://gptapppoc.kieley.io/privacy`.
- **Rationale**: Keeps policy under the app domain and ensures a stable URL for compliance.
- **Alternatives considered**: External policy host or repo-only documentation.

## Decision: Support contact hosting

- **Decision**: Host support contact at `https://gptapppoc.kieley.io/support`.
- **Rationale**: Matches app domain and provides an accessible, stable support path.
- **Alternatives considered**: Support email or external support site.

## Decision: Widget-initiated tool calls

- **Decision**: Enable widget-initiated tool access for `hello-world`.
- **Rationale**: The UI refresh button requires direct tool invocation to update the greeting.
- **Alternatives considered**: Remove the refresh button and rely solely on model-initiated tool calls.

## Decision: Authentication scope

- **Decision**: Keep the app no-auth for this increment (no OAuth metadata or protected-resource endpoints).
- **Rationale**: The current tool is read-only and does not require user-specific data.
- **Alternatives considered**: Implement OAuth 2.1 per MCP authorization spec.
