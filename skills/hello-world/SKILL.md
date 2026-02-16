# Hello World Skill

## Summary

A minimal, repo-local skill used to validate MCP runtime skill discovery.

## When To Use

- You need a simple skill example for resource discovery via MCP.
- You want a stable `skill://` URI that resolves to markdown content.

## Instructions

1. Read this skill at `skill://hello-world/SKILL.md`.
2. Use the discovery tool to retrieve the same canonical URI.
3. Prefer text fallback content when UI rendering is unavailable.

## Expected Outcome

Clients can discover this skill and load it as markdown without requiring Jira or Linux workflow changes.
