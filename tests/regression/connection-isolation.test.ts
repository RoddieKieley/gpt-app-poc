import test from "node:test";
import assert from "node:assert/strict";

test("cross-user connection access is denied", async () => {
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
      headers: { "Content-Type": "application/json", "x-user-id": "owner" },
      body: JSON.stringify({ jira_base_url: "https://jira.example.com", pat: "good-token" }),
    });
    const created = await connect.json() as { connection_id: string };
    const connectionId = created.connection_id;

    const status = await fetch(`${base}/api/jira/connections/${connectionId}`, {
      headers: { "x-user-id": "other-user" },
    });
    assert.equal(status.status, 404);
  } finally {
    srv.close();
  }
});

