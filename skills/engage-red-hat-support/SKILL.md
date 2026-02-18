# Engage Red Hat Support Skill

## Summary

Guides operators through a Linux-only support workflow that securely connects Jira,
generates and fetches a local sosreport artifact, and attaches it to a Jira issue.

## When To Use

- You need to engage Red Hat Support with a Linux diagnostic bundle.
- You have a Jira issue key where the artifact should be attached.
- You need a text-first fallback sequence when UI rendering is unavailable.

## Instructions

1. Start with Linux as the selected product. Non-Linux products are out of scope.
2. Connect Jira through secure backend intake (`POST /api/jira/connections`) with
   `jira_base_url` and PAT, then store the returned `connection_id`.
3. Verify the connection status before diagnostics:
   - `jira_connection_status` with `connection_id`, or
   - `GET /api/jira/connections/{connection_id}`.
4. Run `generate_sosreport`, then run `fetch_sosreport` with its `fetch_reference`.
5. Attach the fetched archive path to the target issue using:
   - `jira_attach_artifact` with `connection_id`, `issue_key`, `artifact_ref`.
6. If any step fails, stop and retry from the failed step after addressing the
   reported error.

## Security Boundary

- PAT is accepted only via the secure backend connection endpoint.
- MCP tool calls must use opaque `connection_id`; never pass PAT or tokens in MCP args.
- Status/error messages should remain secret-safe and avoid credential echoes.

## Expected Outcome

You can complete connect -> verify -> generate -> fetch -> attach with text fallback
guidance available for non-UI hosts and without exposing PAT in MCP-visible surfaces.
