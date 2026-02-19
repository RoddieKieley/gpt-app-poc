import test from "node:test";
import assert from "node:assert/strict";

type JsonRpcResponse =
  | { jsonrpc: "2.0"; id: number; result: unknown }
  | { jsonrpc: "2.0"; id: number; error: { code: number; message: string } };

const REQUIRED_JIRA_TOOLS = [
  "jira_connect_secure",
  "jira_connection_status",
  "jira_list_attachments",
  "jira_attach_artifact",
  "jira_disconnect",
] as const;

const EXPECTED_JIRA_METADATA: Record<
  (typeof REQUIRED_JIRA_TOOLS)[number],
  { readOnlyHint: boolean; destructiveHint: boolean; outputTemplate: string }
> = {
  jira_connect_secure: {
    readOnlyHint: false,
    destructiveHint: false,
    outputTemplate: "ui://engage-red-hat-support/app.html",
  },
  jira_connection_status: {
    readOnlyHint: true,
    destructiveHint: false,
    outputTemplate: "ui://engage-red-hat-support/app.html",
  },
  jira_list_attachments: {
    readOnlyHint: true,
    destructiveHint: false,
    outputTemplate: "ui://engage-red-hat-support/app.html",
  },
  jira_attach_artifact: {
    readOnlyHint: false,
    destructiveHint: false,
    outputTemplate: "ui://engage-red-hat-support/app.html",
  },
  jira_disconnect: {
    readOnlyHint: false,
    destructiveHint: true,
    outputTemplate: "ui://engage-red-hat-support/app.html",
  },
};

test("jira MCP tool surface remains unchanged", async () => {
  process.env.NODE_ENV = "test";
  const { createApp } = await import("../../server.js");

  const app = createApp();
  const srv = app.listen(0);
  const port = (srv.address() as { port: number }).port;
  const mcpUrl = `http://127.0.0.1:${port}/mcp`;
  let sessionId: string | undefined;
  let id = 1;

  const jsonRpc = async (method: string, params?: unknown) => {
    const response = await fetch(mcpUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
        ...(sessionId ? { "mcp-session-id": sessionId } : {}),
      },
      body: JSON.stringify({ jsonrpc: "2.0", id: id++, method, params }),
    });
    assert.equal(response.ok, true, `request failed for ${method}`);
    if (!sessionId) {
      const header = response.headers.get("mcp-session-id");
      if (header) sessionId = header;
    }
    const payload = (await response.json()) as JsonRpcResponse;
    if ("error" in payload) {
      throw new Error(`JSON-RPC ${payload.error.code}: ${payload.error.message}`);
    }
    return payload.result;
  };

  try {
    await jsonRpc("initialize", {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "jira-surface-regression", version: "1.0.0" },
    });
    await fetch(mcpUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
        ...(sessionId ? { "mcp-session-id": sessionId } : {}),
      },
      body: JSON.stringify({ jsonrpc: "2.0", method: "initialized" }),
    });

    const listed = (await jsonRpc("tools/list")) as {
      tools?: Array<{
        name: string;
        annotations?: { readOnlyHint?: boolean; destructiveHint?: boolean };
        _meta?: Record<string, unknown>;
      }>;
    };

    assert.ok(
      listed.tools?.some((tool) => tool.name === "list_skills"),
      "list_skills tool missing",
    );

    const jiraNames = (listed.tools ?? [])
      .map((tool) => tool.name)
      .filter((name) => name.startsWith("jira_"))
      .sort();
    assert.deepEqual(jiraNames, [...REQUIRED_JIRA_TOOLS].sort(), "Jira tool names changed");

    for (const name of REQUIRED_JIRA_TOOLS) {
      const tool = listed.tools?.find((item) => item.name === name);
      assert.ok(tool, `missing ${name}`);
      const expected = EXPECTED_JIRA_METADATA[name];
      assert.equal(tool.annotations?.readOnlyHint, expected.readOnlyHint, `${name} readOnlyHint mismatch`);
      assert.equal(
        tool.annotations?.destructiveHint,
        expected.destructiveHint,
        `${name} destructiveHint mismatch`,
      );
      assert.equal(
        tool._meta?.["openai/outputTemplate"],
        expected.outputTemplate,
        `${name} outputTemplate mismatch`,
      );
    }
  } finally {
    srv.close();
  }
});
