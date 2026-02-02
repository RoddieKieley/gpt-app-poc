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
