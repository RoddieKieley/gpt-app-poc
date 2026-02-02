# GPT App PoC

Proof-of-concept MCP app with a minimal server and UI bundle. This repo is used
to validate MCP Apps patterns and workflows, with an emphasis on repeatable,
incremental delivery.

## Development Methodology

This project follows an iterative, incremental, specification-driven workflow:

- Each feature is introduced through a spec package under `specs/`.
- A spec includes `spec.md`, `plan.md`, and `tasks.md`, plus supporting docs
  such as `research.md`, `data-model.md`, `quickstart.md`, and contracts.
- Changes are delivered in small, independently testable increments.
- The constitution defines project-wide constraints and quality gates.

See:
- `specs/001-mcp-apps-hello-world/` for an example spec package.
- `.specify/memory/constitution.md` for governing principles and quality gates.
- `.specify/templates/` for the spec, plan, and tasks templates.

## Project Structure

- `src/` MCP server implementation and app logic
- `mcp-app.html` single-file UI entry for the MCP app
- `server.ts` local server entry
- `specs/` feature specifications (one folder per spec)

## Quick Start

- Install dependencies: `npm install`
- Run the server: `npm run serve`
- Build the UI bundle: `npm run build`
