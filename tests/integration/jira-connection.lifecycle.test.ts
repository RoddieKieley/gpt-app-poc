import test from "node:test";
import assert from "node:assert/strict";
import {
  asTextOnlyToolResult,
  createMcpJsonRpcClient,
  parseDeterministicKey,
} from "./consent-test-helpers.js";

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

test("cloud connect with wrong email reports error status", async () => {
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
      headers: {
        "Content-Type": "application/json",
        "x-user-id": "u6",
      },
      body: JSON.stringify({
        jira_base_url: "https://redhat.atlassian.net",
        auth_mode: "basic_cloud",
        account_email: "wrong@example.com",
        api_token: "cloud-token",
      }),
    });
    assert.equal(connect.status, 201);
    const created = await connect.json() as { connection_id: string; status: string };
    assert.ok(created.connection_id);
    assert.equal(created.status, "error");
  } finally {
    srv.close();
  }
});

test("MCP connect/status include deterministic connection_id and status fallback keys", async () => {
  process.env.NODE_ENV = "test";
  process.env.JIRA_MOCK_MODE = "1";
  const { createApp } = await import("../../server.js");

  const app = createApp();
  const srv = app.listen(0);
  const port = (srv.address() as { port: number }).port;
  const base = `http://127.0.0.1:${port}`;

  try {
    const client = createMcpJsonRpcClient(base, "u-mcp");
    await client.initialize();

    const connectRaw = (await client.call("tools/call", {
      name: "jira_connect_secure",
      arguments: {
        jira_base_url: "https://jira.example.com",
        pat: "mcp-top-secret-pat",
      },
    })) as {
      isError?: boolean;
      content?: Array<{ type?: string; text?: string }>;
      structuredContent?: { connection_id?: string; status?: string };
    };
    assert.equal(connectRaw.isError, undefined);
    const connectTextOnly = asTextOnlyToolResult(connectRaw);
    const structuredConnectionId = String(connectRaw.structuredContent?.connection_id ?? "");
    const structuredStatus = String(connectRaw.structuredContent?.status ?? "");
    assert.ok(structuredConnectionId.length > 0);
    assert.ok(structuredStatus.length > 0);
    assert.equal(parseDeterministicKey(connectTextOnly.text, "connection_id"), structuredConnectionId);
    assert.equal(parseDeterministicKey(connectTextOnly.text, "status"), structuredStatus);

    const statusRaw = (await client.call("tools/call", {
      name: "jira_connection_status",
      arguments: { connection_id: structuredConnectionId },
    })) as {
      isError?: boolean;
      content?: Array<{ type?: string; text?: string }>;
      structuredContent?: { connection_id?: string; status?: string };
    };
    assert.equal(statusRaw.isError, undefined);
    const statusTextOnly = asTextOnlyToolResult(statusRaw);
    assert.equal(
      parseDeterministicKey(statusTextOnly.text, "connection_id"),
      String(statusRaw.structuredContent?.connection_id ?? ""),
    );
    assert.equal(
      parseDeterministicKey(statusTextOnly.text, "status"),
      String(statusRaw.structuredContent?.status ?? ""),
    );
    assert.equal(statusTextOnly.text.includes("mcp-top-secret-pat"), false);
  } finally {
    srv.close();
  }
});
