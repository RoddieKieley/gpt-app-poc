import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";

test("maps 403 and 404 failures and size-limit rejection", async () => {
  process.env.NODE_ENV = "test";
  process.env.JIRA_MOCK_MODE = "1";
  process.env.JIRA_ATTACHMENT_MAX_BYTES = "8";
  const { createApp } = await import("../../server.js");
  const app = createApp();
  const srv = app.listen(0);
  const port = (srv.address() as { port: number }).port;
  const base = `http://127.0.0.1:${port}`;
  const artifactPath = path.join(process.cwd(), ".tmp-tests", "artifact-too-big.txt");
  await fs.mkdir(path.dirname(artifactPath), { recursive: true });
  await fs.writeFile(artifactPath, "this is bigger than eight bytes", "utf8");

  try {
    const connect = await fetch(`${base}/api/jira/connections`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-id": "u3" },
      body: JSON.stringify({ jira_base_url: "https://jira.example.com", pat: "good-token" }),
    });
    const created = await connect.json() as { connection_id: string };
    const connectionId = created.connection_id;

    const forbidden = await fetch(`${base}/api/jira/issues/FORBIDDEN-1/attachments`, {
      headers: { "x-user-id": "u3", "x-connection-id": connectionId },
    });
    assert.equal(forbidden.status, 403);

    const missing = await fetch(`${base}/api/jira/issues/MISSING-1/attachments`, {
      headers: { "x-user-id": "u3", "x-connection-id": connectionId },
    });
    assert.equal(missing.status, 404);

    const tooBig = await fetch(`${base}/api/jira/issues/SUP-101/attachments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": "u3",
        "x-connection-id": connectionId,
      },
      body: JSON.stringify({ artifact_ref: artifactPath }),
    });
    assert.equal(tooBig.status, 400);
  } finally {
    srv.close();
  }
});

