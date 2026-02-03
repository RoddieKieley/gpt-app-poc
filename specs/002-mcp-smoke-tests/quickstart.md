# Quickstart: Automated MCP Smoke Tests

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

## Run MCP smoke tests
```bash
npm run test:mcp
```

## What to expect
- The test runner starts the MCP server on `http://localhost:3000`.
- The tests perform MCP initialization, list tools, call `hello-world`, and
  validate the UI resource retrieval.
- The command exits non-zero and reports the failing check if any step fails.
