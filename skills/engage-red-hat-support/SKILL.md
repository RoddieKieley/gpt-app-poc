# Engage Red Hat Support Skill

## Summary

Guides operators through a Linux-only support workflow that securely connects Jira,
generates and fetches a local sosreport artifact, and attaches it to a Jira issue.

## When To Use

- You need to engage Red Hat Support with a Linux diagnostic bundle.
- You have a Jira issue key where the artifact should be attached.
- You need a text-first fallback sequence when UI rendering is unavailable.

## Instructions

1. Step 1 - Select product:
   - Select `linux` to proceed.
   - Stop if product is non-Linux; this workflow is Linux-only.
2. Step 2 - Generate and fetch sos report:
   - Run `generate_sosreport`.
   - Run `fetch_sosreport` with the returned `fetch_reference`.
   - Keep `artifact_ref` for step 3.
3. Step 3 - Connect Jira and attach:
   - Connect Jira through secure backend intake (`POST /api/jira/connections`) with
     `jira_base_url` and PAT, then store returned `connection_id`.
   - Verify connection with `jira_connection_status` or `GET /api/jira/connections/{connection_id}`.
   - Verify issue read access with `jira_list_attachments` using `connection_id` and `issue_key`.
   - Attach via `jira_attach_artifact` using `connection_id`, `issue_key`, `artifact_ref`.
4. If any step fails, stop and retry from the failed step after addressing the
   reported error.

## Security Boundary

- PAT is accepted only via the secure backend connection endpoint.
- MCP tool calls must use opaque `connection_id`; never pass PAT or tokens in MCP args.
- Status/error messages should remain secret-safe and avoid credential echoes.

## Expected Outcome

You can complete select product -> generate/fetch sos -> connect/verify/attach with
text fallback guidance for non-UI hosts and without exposing PAT in MCP-visible surfaces.
