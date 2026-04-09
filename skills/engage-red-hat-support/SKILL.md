# Engage Red Hat Support Skill

## Summary

Guides operators through a Linux-only support workflow that securely connects Jira,
generates and fetches a local sosreport artifact, and attaches it to a Jira issue.
This is the primary UI-first skill for engage support workflows.

## Routing Mode

- Primary mode is UI-first via compatibility entry URI `ui://engage-red-hat-support/app.html`.
- If UI is unavailable or host is text-only, return fallback routing guidance that points to:
  - `skill://engage-red-hat-support-headless/SKILL.md` (placeholder URI; not implemented in this feature).
- Do not attempt to register or invoke a new headless skill implementation in this phase.

## When To Use

- You need to engage Red Hat Support with a Linux diagnostic bundle.
- You have a Jira issue key where the artifact should be attached.
- You need a text-first fallback sequence when UI rendering is unavailable.

## Instructions

1. Step 1 - Select product:
   - Start workflow explicitly with `start_engage_red_hat_support`.
   - Run `select_engage_product` with `product=linux`.
   - Select `linux` to proceed.
   - Stop if product is non-Linux; this workflow is Linux-only.
2. Step 2 - Troubleshooting CPU review:
   - Run `get_cpu_information` and review these fields before diagnostics generation:
     `model`, `logical_cores`, `physical_cores`, `frequency_mhz`, `load_avg_1m`,
     `load_avg_5m`, `load_avg_15m`, and `cpu_line`.
   - In UI contexts, troubleshooting uses session-scoped telemetry at
     `resource://engage/troubleshooting/cpu/{workflow_session_id}` with 1-second
     updates and a rolling latest-10 row window.
   - If your client supports resources, subscribe/read this URI and refresh table
     state from returned `samples` until ready to continue.
   - In UI contexts, confirm the troubleshooting table step is complete, then continue.
3. Step 3 - Generate and fetch sos report:
   - For text/headless clients, first ask the user to explicitly approve invasive diagnostics.
   - Only after an affirmative user response, mint consent via
     `mint_engage_consent_token(permission_granted=true)` (optionally include
     `workflow_session_id` when available).
   - Parse `consent_token` from `structuredContent` first; if unavailable in your
     client, parse text fallback lines in `content.text`.
   - Required deterministic fallback keys in this step are:
     `workflow_session_id`, `consent_token`, `expires_at`, `job_id`, `status`, `fetch_reference`.
   - For web/UI clients, continue minting via `POST /api/engage/consent-tokens` with
     `workflow=engage_red_hat_support`, `step=2`, `requested_scope=generate_sosreport`.
   - Run `generate_sosreport` with `consent_token` from mint response.
   - If `generate_sosreport` is asynchronous, poll `get_generate_sosreport_status`
     until completion before fetching.
   - Recommended text-client polling backoff is:
     1s -> 3s -> 5s -> 10s -> 20s -> 30s (cap at 30s between polls).
   - Optional alternative for MCP clients with resource support:
     subscribe/read `resource://engage/sosreport/jobs/{jobId}` for job updates
     instead of polling the status tool.
   - Example MCP sequence (replace `{jobId}` with the real generate job id):
     ```json
     {"method":"resources/subscribe","params":{"uri":"resource://engage/sosreport/jobs/{jobId}"}}
     {"method":"resources/read","params":{"uri":"resource://engage/sosreport/jobs/{jobId}"}}
     ```
   - Repeat `resources/read` until `status` is `succeeded` or `failed`.
   - Note that sosreport generation can take some time depending on host size,
     plugin scope, and amount of collected Linux diagnostic data.
   - Run `fetch_sosreport` with the returned `fetch_reference` after status is
     `succeeded`.
   - Keep `artifact_ref` for step 3.
4. Step 4 - Connect Jira and attach:
   - Connect Jira through secure backend intake (`POST /api/jira/connections`) with
     Cloud or legacy-compatible credentials, then store returned `connection_id`.
   - Atlassian Cloud input: `jira_base_url` (`https://<tenant>.atlassian.net`), `auth_mode=basic_cloud`, `account_email`, `api_token`.
   - Legacy/self-hosted-compatible input: `jira_base_url` and PAT.
   - Verify connection with `jira_connection_status` or `GET /api/jira/connections/{connection_id}`.
   - Verify issue read access with `jira_list_attachments` using `connection_id` and `issue_key`.
   - Attach via `jira_attach_artifact` using `connection_id`, `issue_key`, `artifact_ref`.
   - Required deterministic fallback key in this step is `connection_id`.
4. If any step fails, stop and retry from the failed step after addressing the
   reported error.

## Security Boundary

- PAT/API token values are accepted only via the secure backend connection endpoint.
- MCP tool calls must use opaque `connection_id`; never pass PAT/API token or long-lived credentials in MCP args.
- The only token accepted in MCP args is step-scoped `consent_token` for
  `generate_sosreport`; it is short-lived, single-use, and user/session bound.
- Consent minting is always explicit; do not auto-mint on workflow start, step transitions, or generate calls.
- Status/error messages should remain secret-safe and avoid credential echoes.

## Expected Outcome

You can complete select product -> troubleshooting CPU review -> generate/fetch sos -> connect/verify/attach with
text fallback guidance for non-UI hosts and without exposing PAT/API token in MCP-visible surfaces.

## Out of Scope

- Creating, registering, or activating a new headless skill implementation.
