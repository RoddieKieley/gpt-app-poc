import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";

const run = async () => {
  process.env.NODE_ENV = "test";
  process.env.JIRA_MOCK_MODE = "1";
  const { createApp } = await import("../server.js");
  const app = createApp();
  const server = app.listen(0);
  const port = (server.address() as { port: number }).port;
  const base = `http://127.0.0.1:${port}`;
  const artifact = path.join(process.cwd(), ".tmp-tests", "token-boundary-artifact.txt");
  await fs.mkdir(path.dirname(artifact), { recursive: true });
  await fs.writeFile(artifact, "fixture", "utf8");

  try {
    const connect = await fetch(`${base}/api/jira/connections`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-id": "run-user" },
      body: JSON.stringify({
        jira_base_url: "https://jira.example.com",
        pat: "run-script-token",
      }),
    });
    const connected = await connect.json() as { connection_id: string };
    assert.equal(connect.status, 201);
    assert.ok(connected.connection_id);
    const bodyString = JSON.stringify(connected);
    assert.equal(bodyString.includes("run-script-token"), false);

    const list = await fetch(`${base}/api/jira/issues/SUP-500/attachments`, {
      headers: { "x-user-id": "run-user", "x-connection-id": connected.connection_id },
    });
    assert.equal(list.status, 200);

    const attach = await fetch(`${base}/api/jira/issues/SUP-500/attachments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": "run-user",
        "x-connection-id": connected.connection_id,
      },
      body: JSON.stringify({ artifact_ref: artifact }),
    });
    assert.equal(attach.status, 201);

    const revoke = await fetch(`${base}/api/jira/connections/${connected.connection_id}`, {
      method: "DELETE",
      headers: { "x-user-id": "run-user" },
    });
    assert.equal(revoke.status, 204);

    const denied = await fetch(`${base}/api/jira/issues/SUP-500/attachments`, {
      headers: { "x-user-id": "run-user", "x-connection-id": connected.connection_id },
    });
    assert.equal(denied.status, 401);
  } finally {
    server.close();
  }
};

run().then(() => {
  console.log("jira-token-boundary-tests: PASS");
}).catch((error) => {
  console.error("jira-token-boundary-tests: FAIL", error);
  process.exit(1);
});

