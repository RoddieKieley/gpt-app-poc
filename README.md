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

## Testing

- MCP smoke tests (after build): `npm run test:mcp`
- Jira feature tests:
  - `npm run test:unit`
  - `npm run test:contract`
  - `npm run test:integration`
  - `npm run test:regression`
  - `npm run test:jira`

## Runtime Skill Discovery

- Canonical Engage skill resource URI: `skill://engage-red-hat-support/SKILL.md`
- Repo-local skill source file: `skills/engage-red-hat-support/SKILL.md`
- Read-only discovery tool: `list_skills` (returns text fallback plus the canonical URI)
- Jira tools/contracts/tests remain unchanged by this feature.

## Local Sosreport Tools (Phase 1)

- New MCP tools:
  - `generate_sosreport`
  - `fetch_sosreport`
- Local prerequisites:
  - `sos` package installed and available in PATH
  - `/etc/sudoers.d/mcp-sos` configured with `NOPASSWD` entries for required `sos report` execution commands
- Privilege model:
  - generation uses `sudo -n` (non-interactive)
  - interactive password prompting is intentionally unsupported
- Output behavior:
  - `generate_sosreport` returns archive metadata and `fetch_reference`
  - `fetch_sosreport` copies archive to `/tmp` and returns `archive_path`, `size_bytes`, and `sha256`
  - tool responses always include text fallback content for non-UI hosts
- Scope boundaries:
  - local execution only in this increment
  - no SSH host parameter, no SSH credential lifecycle

### Deferred Phase 2 (Not Implemented)

- SSH execution support
- Remote connection lifecycle management
- Host trust and secret management
- Multi-tenant hardening and rate limits

## ChatGPT Apps Technical Readiness

Technical readiness details live under `specs/003-chatgpt-app-technical-readiness/`.

- MCP endpoint: `http://localhost:3001/mcp` (dev), `https://gptapppoc.kieley.io/mcp` (prod)
- Privacy policy: `http://localhost:3001/privacy` (dev), `https://gptapppoc.kieley.io/privacy` (prod)
- Support contact: `http://localhost:3001/support` (dev), `https://gptapppoc.kieley.io/support` (prod)

## Jira Attachment Security Behavior

- PATs are accepted only by backend connection endpoint (`POST /api/jira/connections`).
- PATs are encrypted at rest in backend token vault storage.
- MCP tools never accept or return PATs; they use opaque `connection_id` references.
- Tool and API flows always provide text fallbacks for non-UI MCP clients.
- Revoke and TTL-expiry block all protected Jira operations until reconnect.

## Engage Red Hat Support Workflow (Option A)

- New skill resource: `skill://engage-red-hat-support/SKILL.md`
- New UI resource: `ui://engage-red-hat-support/app.html`
- Orchestration model:
  - UI/skill orchestrates existing tools and endpoints
  - no new MCP orchestration tool is introduced
- Required workflow order:
  1. secure PAT intake: `POST /api/jira/connections`
  2. connection verification: `jira_connection_status` or `GET /api/jira/connections/{connection_id}`
  3. `generate_sosreport`
  4. `fetch_sosreport`
  5. `jira_attach_artifact` with `connection_id` + `issue_key` + fetched `artifact_ref`
- Linux-only product scope is enforced in the Engage UI flow.
- PAT secret boundary:
  - PAT is only used in secure backend intake
  - PAT must never appear in MCP tool args/results/prompts/logs
  - downstream calls use opaque `connection_id` only
