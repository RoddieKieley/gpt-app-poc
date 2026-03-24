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
    assert.equal(typeof created.connection_id, "string");
    const connectionId = created.connection_id;

    const list = await fetch(`${base}/api/jira/issues/SUP-100/attachments`, {
      headers: { "x-user-id": "u2", "x-connection-id": connectionId },
    });
    assert.equal(list.status, 200);
    const listed = await list.json() as { issue_key: string; attachments: unknown[]; text: string };
    assert.equal(listed.issue_key, "SUP-100");
    assert.equal(Array.isArray(listed.attachments), true);
    assert.equal(typeof listed.text, "string");

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
    const uploaded = await attach.json() as { filename: string; issue_key: string; text: string };
    assert.equal(uploaded.filename, "artifact-success.txt");
    assert.equal(uploaded.issue_key, "SUP-100");
    assert.equal(typeof uploaded.text, "string");
  } finally {
    srv.close();
  }
});

test("cloud basic auth path supports list and upload", async () => {
  process.env.NODE_ENV = "test";
  process.env.JIRA_MOCK_MODE = "1";
  const { createApp } = await import("../../server.js");
  const app = createApp();
  const srv = app.listen(0);
  const port = (srv.address() as { port: number }).port;
  const base = `http://127.0.0.1:${port}`;
  const artifactPath = path.join(process.cwd(), ".tmp-tests", "artifact-cloud.txt");
  await fs.mkdir(path.dirname(artifactPath), { recursive: true });
  await fs.writeFile(artifactPath, "artifact-data-cloud", "utf8");

  try {
    const connect = await fetch(`${base}/api/jira/connections`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-id": "u2-cloud" },
      body: JSON.stringify({
        jira_base_url: "https://redhat.atlassian.net",
        auth_mode: "basic_cloud",
        account_email: "ops@example.com",
        api_token: "cloud-token",
      }),
    });
    assert.equal(connect.status, 201);
    const created = await connect.json() as { connection_id: string; status: string };
    assert.equal(created.status, "connected");
    const connectionId = created.connection_id;

    const list = await fetch(`${base}/api/jira/issues/APPENG-999999/attachments`, {
      headers: { "x-user-id": "u2-cloud", "x-connection-id": connectionId },
    });
    assert.equal(list.status, 200);

    const attach = await fetch(`${base}/api/jira/issues/APPENG-999999/attachments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": "u2-cloud",
        "x-connection-id": connectionId,
      },
      body: JSON.stringify({ artifact_ref: artifactPath }),
    });
    assert.equal(attach.status, 201);
  } finally {
    srv.close();
  }
});

