import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { access } from "node:fs/promises";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";

const HOST = "localhost";
const PORT = 3000;
const MCP_PATH = "/mcp";
const MCP_URL = `http://${HOST}:${PORT}${MCP_PATH}`;
const TOOL_NAME = "hello-world";
const UI_RESOURCE_URI = "ui://hello-world/app.html";
const INIT_TIMEOUT_MS = 10_000;

type JsonRpcResponse =
  | { jsonrpc: "2.0"; id: number; result: unknown }
  | { jsonrpc: "2.0"; id: number; error: { code: number; message: string } };

let nextId = 1;

const stdoutLines: string[] = [];
const stderrLines: string[] = [];
let sessionId: string | undefined;

const serverProc = () => {
  const child = spawn("npm", ["run", "serve"], {
    env: { ...process.env, PORT: String(PORT) },
    stdio: ["ignore", "pipe", "pipe"],
  });

  child.stdout?.on("data", (chunk) => {
    stdoutLines.push(String(chunk).trim());
  });
  child.stderr?.on("data", (chunk) => {
    stderrLines.push(String(chunk).trim());
  });

  return child;
};

const stopServer = async (child: ReturnType<typeof serverProc>) => {
  if (child.killed) return;
  child.kill("SIGTERM");
  await new Promise<void>((resolve) => {
    child.once("exit", () => resolve());
    setTimeout(resolve, 2000).unref();
  });
};

const jsonRpc = async (method: string, params?: unknown, timeoutMs = 5000) => {
  const id = nextId++;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs).unref();

  try {
    const response = await fetch(MCP_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
        ...(sessionId ? { "mcp-session-id": sessionId } : {}),
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id,
        method,
        params,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    if (!sessionId) {
      const headerValue = response.headers.get("mcp-session-id");
      if (headerValue) {
        sessionId = headerValue;
      }
    }

    const payload = (await response.json()) as JsonRpcResponse;
    if ("error" in payload) {
      throw new Error(`JSON-RPC ${payload.error.code}: ${payload.error.message}`);
    }
    return payload.result;
  } finally {
    clearTimeout(timeout);
  }
};

const jsonRpcNotify = async (method: string, params?: unknown) => {
  await fetch(MCP_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
      ...(sessionId ? { "mcp-session-id": sessionId } : {}),
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method,
      params,
    }),
  });
};

const check = async (label: string, run: () => Promise<void>, failures: string[]) => {
  try {
    await run();
    console.log(`✓ ${label}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`✗ ${label}: ${message}`);
    failures.push(`${label}: ${message}`);
  }
};

const initializeWithRetry = async () => {
  const start = Date.now();
  const params = {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: { name: "mcp-smoke-tests", version: "1.0.0" },
  };

  while (Date.now() - start < INIT_TIMEOUT_MS) {
    try {
      const remaining = Math.max(500, INIT_TIMEOUT_MS - (Date.now() - start));
      await jsonRpc("initialize", params, remaining);
      await jsonRpcNotify("initialized");
      return;
    } catch (error) {
      await delay(250);
      if (error instanceof Error && error.name === "AbortError") {
        break;
      }
    }
  }

  throw new Error("MCP initialize timeout");
};

const main = async () => {
  const failures: string[] = [];
  const distPath = path.join(process.cwd(), "dist", "mcp-app.html");

  await check("Built output present", async () => {
    await access(distPath);
  }, failures);

  const server = serverProc();

  try {
    await check("MCP initialize", initializeWithRetry, failures);

    await check("tools/list includes hello-world", async () => {
      const result = (await jsonRpc("tools/list")) as { tools?: { name: string }[] };
      const names = result?.tools?.map((tool) => tool.name) ?? [];
      assert.ok(names.includes(TOOL_NAME), "hello-world tool missing");
    }, failures);

    await check("tools/call returns text fallback", async () => {
      const result = (await jsonRpc("tools/call", {
        name: TOOL_NAME,
        arguments: {},
      })) as { content?: { type: string; text?: string }[] };
      const text = result?.content?.find((item) => item.type === "text")?.text;
      assert.ok(text && text.trim().length > 0, "text fallback missing");
    }, failures);

    await check("UI resource is retrievable", async () => {
      const result = (await jsonRpc("resources/read", {
        uri: UI_RESOURCE_URI,
      })) as { contents?: { text?: string }[] };
      const text = result?.contents?.[0]?.text;
      assert.ok(text && text.trim().length > 0, "UI resource content missing");
    }, failures);
  } finally {
    await stopServer(server);
  }

  if (failures.length > 0) {
    console.error("Failed checks:");
    failures.forEach((failure) => {
      console.error(`- ${failure}`);
    });

    console.error("Server stdout:");
    console.error(stdoutLines.length > 0 ? stdoutLines.filter(Boolean).join("\n") : "(empty)");

    console.error("Server stderr:");
    console.error(stderrLines.length > 0 ? stderrLines.filter(Boolean).join("\n") : "(empty)");

    console.error(`Smoke tests failed (${failures.length}).`);
    process.exit(1);
  }

  console.log("MCP smoke tests passed.");
};

main().catch((error) => {
  console.error("Smoke test runner error:", error);
  process.exit(1);
});
