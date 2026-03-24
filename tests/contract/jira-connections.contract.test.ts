import test from "node:test";
import assert from "node:assert/strict";
import { connectSchema, connectionIdSchema } from "../../src/jira/jira-tool-schemas.js";

test("connect schema accepts legacy bearer payload and cloud basic payload", () => {
  const legacyOk = connectSchema.safeParse({
    jira_base_url: "https://jira.example.com",
    pat: "abc123",
  });
  assert.equal(legacyOk.success, true);

  const cloudOk = connectSchema.safeParse({
    jira_base_url: "https://redhat.atlassian.net",
    auth_mode: "basic_cloud",
    account_email: "ops@example.com",
    api_token: "cloud-token",
  });
  assert.equal(cloudOk.success, true);

  const bad = connectSchema.safeParse({
    jira_base_url: "http://jira.example.com",
    pat: "abc123",
  });
  assert.equal(bad.success, false);
});

test("connect schema rejects mixed or incomplete cloud fields", () => {
  const missingEmail = connectSchema.safeParse({
    jira_base_url: "https://redhat.atlassian.net",
    auth_mode: "basic_cloud",
    api_token: "cloud-token",
  });
  assert.equal(missingEmail.success, false);

  const mixedSecrets = connectSchema.safeParse({
    jira_base_url: "https://redhat.atlassian.net",
    auth_mode: "basic_cloud",
    account_email: "ops@example.com",
    api_token: "cloud-token",
    pat: "legacy",
  });
  assert.equal(mixedSecrets.success, false);
});

test("connection status tool schema requires opaque connection id", () => {
  const parsed = connectionIdSchema.safeParse({ connection_id: "conn-123" });
  assert.equal(parsed.success, true);
});

