import test from "node:test";
import assert from "node:assert/strict";
import { JiraClient } from "../../src/jira/jira-client.js";

test("verifyConnection treats redirect-to-login as invalid credentials guidance", async () => {
  let redirectMode: string | undefined;
  const client = new JiraClient(async (_url, init) => {
    redirectMode = init?.redirect;
    return new Response(null, {
      status: 302,
      headers: { location: "https://idp.example.com/saml/login" },
    });
  });

  await assert.rejects(
    () => client.verifyConnection("https://jira.example.com", "pat-token"),
    (error: unknown) => {
      const mapped = error as { code?: string; status?: number; message?: string };
      assert.equal(mapped.code, "invalid_credentials");
      assert.equal(mapped.status, 401);
      assert.match(String(mapped.message), /interactive login URL/i);
      assert.match(String(mapped.message), /idp\.example\.com/);
      return true;
    },
  );
  assert.equal(redirectMode, "manual");
});

test("verifyConnection uses bearer auth header for legacy mode", async () => {
  let authHeader = "";
  const client = new JiraClient(async (_url, init) => {
    authHeader = String((init?.headers as Record<string, string>)?.Authorization ?? "");
    return new Response("{}", { status: 200 });
  });

  await client.verifyConnection("https://jira.example.com", {
    authMode: "bearer_pat",
    secret: "legacy-token",
  });
  assert.equal(authHeader, "Bearer legacy-token");
});

test("verifyConnection uses basic auth header for cloud mode", async () => {
  let authHeader = "";
  const client = new JiraClient(async (_url, init) => {
    authHeader = String((init?.headers as Record<string, string>)?.Authorization ?? "");
    return new Response("{}", { status: 200 });
  });

  await client.verifyConnection("https://jira.example.com", {
    authMode: "basic_cloud",
    accountEmail: "ops@example.com",
    secret: "api-token",
  });
  const expected = `Basic ${Buffer.from("ops@example.com:api-token", "utf8").toString("base64")}`;
  assert.equal(authHeader, expected);
});
