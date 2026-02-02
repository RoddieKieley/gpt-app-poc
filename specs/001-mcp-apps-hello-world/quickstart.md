# Quickstart: MCP Apps Hello World

## Prerequisites
- Node.js 18+

## Install
```bash
npm install
```

## Build UI bundle
```bash
npm run build
```

## Run MCP server (HTTP)
```bash
npm run serve
```

## Validate
- Connect an MCP Apps-capable host to `http://localhost:3001/mcp`.
- Call the `hello-world` tool and confirm:
  - A text greeting is returned.
  - The UI renders and can trigger a second greeting update.
- Call the tool from a text-only host and confirm the response still explains success without UI.

## Compliance Checks
- Verify no host-specific runtime APIs are used in the UI.
- Confirm all UI flows have a complete text fallback.
