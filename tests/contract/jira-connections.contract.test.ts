import test from "node:test";
import assert from "node:assert/strict";
import { connectSchema, connectionIdSchema } from "../../src/jira/jira-tool-schemas.js";

test("connect schema requires https URL and PAT", () => {
  const ok = connectSchema.safeParse({
    jira_base_url: "https://jira.example.com",
    pat: "abc123",
  });
  assert.equal(ok.success, true);

  const bad = connectSchema.safeParse({
    jira_base_url: "http://jira.example.com",
    pat: "abc123",
  });
  assert.equal(bad.success, false);
});

test("connection status tool schema requires opaque connection id", () => {
  const parsed = connectionIdSchema.safeParse({ connection_id: "conn-123" });
  assert.equal(parsed.success, true);
});

