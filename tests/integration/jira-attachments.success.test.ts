import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";

test("list and upload succeed for active connection", async () => {
  process.env.NODE_ENV = "test";
  process.env.JIRA_MOCK_MODE = "1";
  const { createApp } = await import("../../server.js");
  const app = createApp();
  const srv = app.listen(0);
  const port = (srv.address() as { port: number }).port;
  const base = `http://127.0.0.1:${port}`;
  const artifactPath = path.join(process.cwd(), ".tmp-tests", "artifact-success.txt");
  await fs.mkdir(path.dirname(artifactPath), { recursive: true });
  await fs.writeFile(artifactPath, "artifact-data", "utf8");

  try {
    const connect = await fetch(`${base}/api/jira/connections`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-id": "u2" },
      body: JSON.stringify({ jira_base_url: "https://jira.example.com", pat: "good-token" }),
    });
    const created = await connect.json() as { connection_id: string };
    const connectionId = created.connection_id;

    const list = await fetch(`${base}/api/jira/issues/SUP-100/attachments`, {
      headers: { "x-user-id": "u2", "x-connection-id": connectionId },
    });
    assert.equal(list.status, 200);

    const attach = await fetch(`${base}/api/jira/issues/SUP-100/attachments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": "u2",
        "x-connection-id": connectionId,
      },
      body: JSON.stringify({ artifact_ref: artifactPath }),
    });
    assert.equal(attach.status, 201);
    const uploaded = await attach.json() as { filename: string };
    assert.equal(uploaded.filename, "artifact-success.txt");
  } finally {
    srv.close();
  }
});

