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
