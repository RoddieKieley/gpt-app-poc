import assert from "node:assert/strict";

type JsonRpcResponse =
  | { jsonrpc: "2.0"; id: number; result: unknown }
  | { jsonrpc: "2.0"; id: number; error: { code: number; message: string } };

export const startConsentTestServer = async (tag: string) => {
  process.env.NODE_ENV = "test";
  process.env.JIRA_MOCK_MODE = "1";
  const { createApp } = await import(`../../server.js?consent-${tag}-${Date.now()}`);
  const app = createApp();
  const srv = app.listen(0);
  const port = (srv.address() as { port: number }).port;
  return { srv, base: `http://127.0.0.1:${port}` };
};

export const createMcpJsonRpcClient = (base: string, userId: string) => {
  const mcpUrl = `${base}/mcp`;
  let sessionId: string | undefined;
  let id = 1;

  const call = async (method: string, params?: unknown) => {
    const response = await fetch(mcpUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
        "x-user-id": userId,
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

  const initialize = async () => {
    await call("initialize", {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "consent-integration", version: "1.0.0" },
    });
    const initializedResponse = await fetch(mcpUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
        "x-user-id": userId,
        ...(sessionId ? { "mcp-session-id": sessionId } : {}),
      },
      body: JSON.stringify({ jsonrpc: "2.0", method: "initialized" }),
    });
    assert.equal(initializedResponse.ok, true);
  };

  const getSessionId = (): string => sessionId ?? "";

  return { call, initialize, getSessionId };
};

export const mintConsentToken = async (input: {
  base: string;
  userId: string;
  sessionId: string;
  scope?: string;
  step?: number;
}) => {
  await fetch(`${input.base}/api/engage/workflow/start`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-user-id": input.userId,
      "x-session-id": input.sessionId,
    },
    body: JSON.stringify({ session_id: input.sessionId }),
  });
  await fetch(`${input.base}/api/engage/workflow/select-product`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-user-id": input.userId,
      "x-session-id": input.sessionId,
    },
    body: JSON.stringify({ session_id: input.sessionId, product: "linux" }),
  });

  const response = await fetch(`${input.base}/api/engage/consent-tokens`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-user-id": input.userId,
      "x-session-id": input.sessionId,
    },
    body: JSON.stringify({
      workflow: "engage_red_hat_support",
      step: input.step ?? 2,
      requested_scope: input.scope ?? "generate_sosreport",
      session_id: input.sessionId,
      client_action_id: "integration-test",
    }),
  });
  return {
    status: response.status,
    body: await response.json() as { consent_token?: string; text?: string },
  };
};
