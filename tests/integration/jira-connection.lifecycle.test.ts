import test from "node:test";
import assert from "node:assert/strict";

test("connect and status flow returns opaque connection and non-secret state", async () => {
  process.env.NODE_ENV = "test";
  process.env.JIRA_MOCK_MODE = "1";
  process.env.JIRA_CONNECTION_TTL_SECONDS = "3600";
  const { createApp } = await import("../../server.js");

  const app = createApp();
  const srv = app.listen(0);
  const port = (srv.address() as { port: number }).port;
  const base = `http://127.0.0.1:${port}`;

  try {
    const connect = await fetch(`${base}/api/jira/connections`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": "u1",
      },
      body: JSON.stringify({
        jira_base_url: "https://jira.example.com",
        pat: "top-secret-pat",
      }),
    });
    assert.equal(connect.status, 201);
    const created = await connect.json() as { connection_id: string; status: string };
    assert.ok(created.connection_id);
    assert.equal(created.status, "connected");

    const status = await fetch(`${base}/api/jira/connections/${created.connection_id}`, {
      headers: { "x-user-id": "u1" },
    });
    assert.equal(status.status, 200);
    const body = await status.json() as { connection_id: string; status: string };
    assert.equal(body.connection_id, created.connection_id);
  } finally {
    srv.close();
  }
});

test("singular connect endpoint returns guidance to plural route", async () => {
  process.env.NODE_ENV = "test";
  process.env.JIRA_MOCK_MODE = "1";
  const { createApp } = await import("../../server.js");

  const app = createApp();
  const srv = app.listen(0);
  const port = (srv.address() as { port: number }).port;
  const base = `http://127.0.0.1:${port}`;

  try {
    const connect = await fetch(`${base}/api/jira/connection`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": "u1",
      },
      body: JSON.stringify({
        jira_base_url: "https://jira.example.com",
        pat: "top-secret-pat",
      }),
    });
    assert.equal(connect.status, 404);
    const body = await connect.json() as { text?: string };
    assert.match(String(body.text), /\/api\/jira\/connections/);
  } finally {
    srv.close();
  }
});

test("connect returns updated lifecycle status when verification fails", async () => {
  process.env.NODE_ENV = "test";
  process.env.JIRA_MOCK_MODE = "1";
  process.env.JIRA_CONNECTION_TTL_SECONDS = "3600";
  const { createApp } = await import("../../server.js");

  const app = createApp();
  const srv = app.listen(0);
  const port = (srv.address() as { port: number }).port;
  const base = `http://127.0.0.1:${port}`;

  try {
    const connect = await fetch(`${base}/api/jira/connections`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": "u5",
      },
      body: JSON.stringify({
        jira_base_url: "https://jira.example.com",
        pat: "bad-token",
      }),
    });
    assert.equal(connect.status, 201);
    const created = await connect.json() as {
      connection_id: string;
      status: string;
      last_verified_at: string | null;
    };
    assert.ok(created.connection_id);
    assert.equal(created.status, "error");
    assert.equal(created.last_verified_at, null);

    const status = await fetch(`${base}/api/jira/connections/${created.connection_id}`, {
      headers: { "x-user-id": "u5" },
    });
    assert.equal(status.status, 200);
    const body = await status.json() as { status: string };
    assert.equal(body.status, "error");
  } finally {
    srv.close();
  }
});
