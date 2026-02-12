import test from "node:test";
import assert from "node:assert/strict";

test("disconnect immediately blocks protected operations", async () => {
  process.env.NODE_ENV = "test";
  process.env.JIRA_MOCK_MODE = "1";
  const { createApp } = await import("../../server.js");
  const app = createApp();
  const srv = app.listen(0);
  const port = (srv.address() as { port: number }).port;
  const base = `http://127.0.0.1:${port}`;

  try {
    const connect = await fetch(`${base}/api/jira/connections`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-id": "u4" },
      body: JSON.stringify({ jira_base_url: "https://jira.example.com", pat: "good-token" }),
    });
    const created = await connect.json() as { connection_id: string };
    const connectionId = created.connection_id;

    const revoke = await fetch(`${base}/api/jira/connections/${connectionId}`, {
      method: "DELETE",
      headers: { "x-user-id": "u4" },
    });
    assert.equal(revoke.status, 204);

    const list = await fetch(`${base}/api/jira/issues/SUP-200/attachments`, {
      headers: { "x-user-id": "u4", "x-connection-id": connectionId },
    });
    assert.equal(list.status, 401);
  } finally {
    srv.close();
  }
});

