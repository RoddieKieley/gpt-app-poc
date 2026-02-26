import test from "node:test";
import assert from "node:assert/strict";

type JsonRpcResponse =
  | { jsonrpc: "2.0"; id: number; result: unknown }
  | { jsonrpc: "2.0"; id: number; error: { code: number; message: string } };

test("sosreport tools are registered with expected metadata", async () => {
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
    assert.equal(response.ok, true);
    if (!sessionId) {
      sessionId = response.headers.get("mcp-session-id") ?? undefined;
    }
    const payload = (await response.json()) as JsonRpcResponse;
    if ("error" in payload) {
      throw new Error(payload.error.message);
    }
    return payload.result;
  };

  try {
    await jsonRpc("initialize", {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "sosreport-contract", version: "1.0.0" },
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
        inputSchema?: { properties?: Record<string, unknown>; required?: string[] };
        annotations?: { readOnlyHint?: boolean; destructiveHint?: boolean; openWorldHint?: boolean };
        _meta?: Record<string, unknown>;
      }>;
    };

    const generateTool = listed.tools?.find((tool) => tool.name === "generate_sosreport");
    assert.ok(generateTool, "generate_sosreport tool missing");
    assert.equal(generateTool?.annotations?.readOnlyHint, false);
    assert.equal(generateTool?.annotations?.destructiveHint, false);
    assert.equal(generateTool?.annotations?.openWorldHint, false);
    assert.equal(generateTool?._meta?.["openai/outputTemplate"], "ui://engage-red-hat-support/app.html");
    const generateSchemaProps = Object.keys(generateTool?.inputSchema?.properties ?? {});
    assert.ok(generateSchemaProps.includes("consent_token"), "generate_sosreport must expose consent_token input");

    const fetchTool = listed.tools?.find((tool) => tool.name === "fetch_sosreport");
    assert.ok(fetchTool, "fetch_sosreport tool missing");
    assert.equal(fetchTool?.annotations?.readOnlyHint, true);
    assert.equal(fetchTool?.annotations?.destructiveHint, false);
    assert.equal(fetchTool?.annotations?.openWorldHint, false);
    assert.equal(fetchTool?._meta?.["openai/outputTemplate"], "ui://engage-red-hat-support/app.html");
  } finally {
    srv.close();
  }
});
