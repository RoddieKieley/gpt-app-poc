import test from "node:test";
import assert from "node:assert/strict";

type JsonRpcResponse =
  | { jsonrpc: "2.0"; id: number; result: unknown }
  | { jsonrpc: "2.0"; id: number; error: { code: number; message: string } };

const SKILL_RESOURCE_URI = "skill://hello-world/SKILL.md";

test("skill discovery tool and resource behavior remain unchanged", async () => {
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
      clientInfo: { name: "skill-regression", version: "1.0.0" },
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
    const resources = (await jsonRpc("resources/list")) as { resources?: Array<{ uri?: string }> };
    assert.ok(resources.resources?.some((entry) => entry.uri === SKILL_RESOURCE_URI));

    const readResult = (await jsonRpc("resources/read", {
      uri: SKILL_RESOURCE_URI,
    })) as { contents?: Array<{ mimeType?: string; text?: string }> };
    assert.equal(readResult.contents?.[0]?.mimeType, "text/markdown");
    assert.ok((readResult.contents?.[0]?.text ?? "").includes("Hello World Skill"));

    const toolResult = (await jsonRpc("tools/call", {
      name: "list_skills",
      arguments: {},
    })) as { content?: Array<{ type: string; text?: string }> };
    const text = toolResult.content?.find((item) => item.type === "text")?.text ?? "";
    assert.ok(text.includes(SKILL_RESOURCE_URI), "list_skills response missing canonical URI");
  } finally {
    srv.close();
  }
});
