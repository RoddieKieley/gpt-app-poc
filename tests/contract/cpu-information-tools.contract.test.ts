import test from "node:test";
import assert from "node:assert/strict";

type JsonRpcResponse =
  | { jsonrpc: "2.0"; id: number; result: unknown }
  | { jsonrpc: "2.0"; id: number; error: { code: number; message: string } };

test("get_cpu_information is registered with local-only schema and metadata", async () => {
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
      clientInfo: { name: "cpu-info-contract", version: "1.0.0" },
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

    const cpuInfoTool = listed.tools?.find((tool) => tool.name === "get_cpu_information");
    assert.ok(cpuInfoTool, "get_cpu_information tool missing");
    assert.equal(cpuInfoTool?.annotations?.readOnlyHint, true);
    assert.equal(cpuInfoTool?.annotations?.destructiveHint, false);
    assert.equal(cpuInfoTool?.annotations?.openWorldHint, false);
    assert.equal(cpuInfoTool?._meta?.["openai/outputTemplate"], "ui://engage-red-hat-support/app.html");
    const inputProps = Object.keys(cpuInfoTool?.inputSchema?.properties ?? {});
    assert.equal(inputProps.includes("host"), false, "get_cpu_information must not expose host parameter");
    assert.deepEqual(cpuInfoTool?.inputSchema?.required ?? [], []);
  } finally {
    srv.close();
  }
});
