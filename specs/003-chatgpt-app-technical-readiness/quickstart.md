# Quickstart: ChatGPT Apps Technical Readiness

## Prerequisites

- Node.js 18+
- App domain available at `https://gptapppoc.kieley.io`

## Build & Run

```bash
npm install
npm run build
npm run serve
```

Server listens at `http://localhost:3001/mcp` in dev. Production should expose
`https://gptapppoc.kieley.io/mcp`.

## Smoke Tests

```bash
npm run test:mcp
```

## Manual Validation (Developer Mode)

1. Add the MCP server URL in ChatGPT Developer Mode.
2. Call the `hello-world` tool and confirm:
   - Tool annotations are present.
   - UI renders using `ui://hello-world/app.html`.
   - The refresh button triggers a widget-initiated tool call.
3. Verify widget metadata:
   - `openai/widgetDomain` is `https://gptapppoc.kieley.io`.
   - `openai/widgetCSP` allowlists only `https://gptapppoc.kieley.io`.

## Technical Readiness Checklist

Complete `specs/003-chatgpt-app-technical-readiness/checklists/technical-readiness.md`
before moving to broader distribution readiness.

## Policy Endpoints

Ensure the app domain serves:

- Privacy policy: `https://gptapppoc.kieley.io/privacy`
- Support contact: `https://gptapppoc.kieley.io/support`

For local verification, the dev server exposes:

- `http://localhost:3001/privacy`
- `http://localhost:3001/support`
