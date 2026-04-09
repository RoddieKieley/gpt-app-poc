import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { ConnectionLifecycleStore } from "../../src/security/connection-lifecycle.js";
import { handleFetchSosreport, handleGenerateSosreport } from "../../src/sosreport/sosreport-tool-handlers.js";

const startServer = async (tag: string) => {
  process.env.NODE_ENV = "test";
  process.env.JIRA_MOCK_MODE = "1";
  const { createApp } = await import(`../../server.js?engage-${tag}-${Date.now()}`);
  const app = createApp();
  const srv = app.listen(0);
  const port = (srv.address() as { port: number }).port;
  return { srv, base: `http://127.0.0.1:${port}` };
};

test("engage flow supports active and revoked lifecycle gating", async () => {
  const { srv, base } = await startServer("lifecycle");

  try {
    const connect = await fetch(`${base}/api/jira/connections`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": "engage-user",
      },
      body: JSON.stringify({
        jira_base_url: "https://jira.example.com",
        pat: "mock-pat-lifecycle",
      }),
    });
    assert.equal(connect.status, 201);
    const created = await connect.json() as { connection_id: string };
    assert.ok(created.connection_id);

    const status = await fetch(`${base}/api/jira/connections/${created.connection_id}`, {
      headers: { "x-user-id": "engage-user" },
    });
    assert.equal(status.status, 200);
    const verified = await status.json() as { status: string };
    assert.equal(verified.status, "connected");

    const revoke = await fetch(`${base}/api/jira/connections/${created.connection_id}`, {
      method: "DELETE",
      headers: { "x-user-id": "engage-user" },
    });
    assert.equal(revoke.status, 204);

    const listAfterRevoke = await fetch(`${base}/api/jira/issues/SUP-900/attachments`, {
      headers: {
        "x-user-id": "engage-user",
        "x-connection-id": created.connection_id,
      },
    });
    assert.equal(listAfterRevoke.status, 401);
    const denied = await listAfterRevoke.json() as { code: string };
    assert.equal(denied.code, "connection_revoked");
  } finally {
    srv.close();
  }
});

test("step-2 handoff requires fetch_reference before fetch and produces artifact_ref", async () => {
  const invalidFetch = await handleFetchSosreport({ fetch_reference: "" });
  assert.equal(invalidFetch.isError, true);

  const sourceArchive = path.join("/tmp", `sosreport-step2-${randomUUID()}.tar.xz`);
  await fs.writeFile(sourceArchive, "step2-handoff-content", "utf8");

  const generated = await handleGenerateSosreport(
    { consent_token: "test-consent-token" },
    {
      runGenerate: async () => ({
        exitCode: 0,
        stdout: `Archive: ${sourceArchive}`,
        stderr: "",
        timedOut: false,
      }),
      findLatest: async () => null,
    },
  );
  assert.equal(generated.isError, undefined);
  const fetchReference = String(generated.structuredContent?.fetch_reference ?? "");
  assert.ok(fetchReference.length > 0);

  const fetched = await handleFetchSosreport({ fetch_reference: fetchReference });
  assert.equal(fetched.isError, undefined);
  const artifactRef = String(fetched.structuredContent?.archive_path ?? "");
  assert.ok(artifactRef.startsWith("/tmp/"), "expected artifact_ref copied to /tmp");
});

test("web consent endpoint behavior remains unchanged for step-2 mint", async () => {
  const { srv, base } = await startServer("web-consent-regression");
  try {
    const sessionId = `web-session-${randomUUID()}`;
    const start = await fetch(`${base}/api/engage/workflow/start`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-user-id": "web-regression-user",
        "x-session-id": sessionId,
      },
      body: JSON.stringify({ session_id: sessionId }),
    });
    assert.equal(start.status, 200);

    const select = await fetch(`${base}/api/engage/workflow/select-product`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-user-id": "web-regression-user",
        "x-session-id": sessionId,
      },
      body: JSON.stringify({ session_id: sessionId, product: "linux" }),
    });
    assert.equal(select.status, 200);

    const mint = await fetch(`${base}/api/engage/consent-tokens`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-user-id": "web-regression-user",
        "x-session-id": sessionId,
      },
      body: JSON.stringify({
        workflow: "engage_red_hat_support",
        step: 2,
        requested_scope: "generate_sosreport",
        session_id: sessionId,
        client_action_id: "web-regression",
      }),
    });
    assert.equal(mint.status, 201);
    const payload = await mint.json() as {
      consent_token?: string;
      expires_at?: string;
      scope?: string;
      step?: number;
      workflow_session_id?: string;
    };
    assert.ok(String(payload.consent_token ?? "").length > 0);
    assert.ok(String(payload.expires_at ?? "").length > 0);
    assert.equal(payload.scope, "generate_sosreport");
    assert.equal(payload.step, 2);
    assert.equal(Object.hasOwn(payload, "workflow_session_id"), false);
  } finally {
    srv.close();
  }
});

test("step-3 contract requires connection and issue-read verification before attach", async () => {
  const file = path.join(
    process.cwd(),
    "specs",
    "007-engage-red-hat-support",
    "contracts",
    "engage-workflow-contract.json",
  );
  const raw = await fs.readFile(file, "utf8");
  const contract = JSON.parse(raw) as {
    sequence: Array<{ name: string; requiredOperations?: string[]; requiredPreconditions?: string[] }>;
  };
  const step3 = contract.sequence.find((step) => step.name === "connect_verify_and_attach");
  assert.ok(step3, "missing step 3 contract block");

  const ops = step3?.requiredOperations ?? [];
  const verifyIdx = ops.findIndex((op) => op.includes("jira_connection_status"));
  const readIdx = ops.findIndex((op) => op.includes("jira_list_attachments"));
  const attachIdx = ops.findIndex((op) => op.includes("jira_attach_artifact"));
  assert.ok(verifyIdx >= 0, "connection verification op missing");
  assert.ok(readIdx >= 0, "issue-read verification op missing");
  assert.ok(attachIdx >= 0, "attach op missing");
  assert.ok(verifyIdx < attachIdx, "connection verification must occur before attach");
  assert.ok(readIdx < attachIdx, "issue-read verification must occur before attach");
  assert.ok(
    step3?.requiredPreconditions?.includes("issue_access_verified=true"),
    "issue_access_verified precondition missing",
  );
});

test("engage flow blocks expired connections", async () => {
  const lifecycleFile = path.join(process.cwd(), ".tmp-tests", `${randomUUID()}.json`);
  const store = new ConnectionLifecycleStore(lifecycleFile, -1);
  const conn = await store.create("expired-user", "https://jira.example.com");
  const derived = await store.getOwned("expired-user", conn.connectionId);
  assert.equal(derived?.status, "expired");
});

test("step-2 UI flow explicitly mints consent before generate and avoids auto collection", async () => {
  const uiFile = path.join(process.cwd(), "src", "mcp-app.ts");
  const uiSource = await fs.readFile(uiFile, "utf8");

  assert.ok(
    uiSource.includes('fetch(apiUrl("/api/engage/consent-tokens")'),
    "Step 2 UI must mint consent token from backend endpoint",
  );
  assert.ok(
    /callTool\("generate_sosreport",\s*\{[\s\S]*consent_token:\s*consentToken/.test(uiSource),
    "generate_sosreport call must pass consent_token from Step 2",
  );
  assert.ok(
    /callTool\(\s*"get_generate_sosreport_status"/.test(uiSource),
    "Step 2 UI must poll generate job status via MCP tool bridge",
  );
  const bootstrapStart = uiSource.indexOf("const bootstrapRoute = () => {");
  const bootstrapEnd = uiSource.indexOf("bootstrapRoute();");
  assert.ok(bootstrapStart >= 0 && bootstrapEnd > bootstrapStart, "bootstrapRoute block must exist");
  const bootstrapBlock = uiSource.slice(bootstrapStart, bootstrapEnd);
  assert.equal(
    bootstrapBlock.includes("generate_sosreport"),
    false,
    "bootstrapRoute must not auto-generate diagnostics",
  );
  assert.equal(
    bootstrapBlock.includes("/api/engage/consent-tokens"),
    false,
    "bootstrapRoute must not auto-mint consent",
  );
});

test("UI source preserves hash routing and PAT clear boundaries", async () => {
  const uiFile = path.join(process.cwd(), "src", "mcp-app.ts");
  const uiSource = await fs.readFile(uiFile, "utf8");

  assert.ok(uiSource.includes('window.location.hash = "step-1"'));
  assert.ok(uiSource.includes('window.location.hash = "step-2"'));
  assert.ok(uiSource.includes('window.location.hash = "step-3"'));
  assert.ok(uiSource.includes('window.location.hash = "step-4"'));
  assert.ok(uiSource.includes('if (hash === "step-2")'));
  assert.ok(uiSource.includes('if (hash === "step-3")'));
  assert.ok(uiSource.includes('if (hash === "step-4")'));

  assert.ok(
    uiSource.includes("formState.jiraPat = \"\";"),
    "PAT must be cleared from UI state immediately after secure connect intake",
  );
  assert.ok(
    uiSource.includes('callTool("jira_connect_secure"'),
    "PAT should still be sent only to jira_connect_secure secure intake flow",
  );
});

test("select-product endpoint advances workflow to troubleshooting step", async () => {
  const { srv, base } = await startServer("step2-troubleshooting");
  try {
    const sessionId = `troubleshooting-session-${randomUUID()}`;
    const start = await fetch(`${base}/api/engage/workflow/start`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-user-id": "step2-user",
        "x-session-id": sessionId,
      },
      body: JSON.stringify({ session_id: sessionId }),
    });
    assert.equal(start.status, 200);

    const select = await fetch(`${base}/api/engage/workflow/select-product`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-user-id": "step2-user",
        "x-session-id": sessionId,
      },
      body: JSON.stringify({ session_id: sessionId, product: "linux" }),
    });
    assert.equal(select.status, 200);
    const payload = await select.json() as { current_step?: string; text?: string };
    assert.equal(payload.current_step, "troubleshooting");
    assert.ok(String(payload.text ?? "").toLowerCase().includes("troubleshooting"));
  } finally {
    srv.close();
  }
});

test("end-to-end connect -> connection_id -> generate -> fetch -> attach succeeds", async () => {
  const { srv, base } = await startServer("e2e");

  try {
    const connect = await fetch(`${base}/api/jira/connections`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": "engage-e2e",
      },
      body: JSON.stringify({
        jira_base_url: "https://jira.example.com",
        pat: "mock-pat-e2e",
      }),
    });
    assert.equal(connect.status, 201);
    const connected = await connect.json() as { connection_id: string; text?: string };
    assert.ok(connected.connection_id);
    assert.equal((connected.text ?? "").includes("mock-pat-e2e"), false);

    const sourceArchive = path.join("/tmp", `sosreport-engage-${randomUUID()}.tar.xz`);
    await fs.writeFile(sourceArchive, "engage-sosreport-content", "utf8");
    const generated = await handleGenerateSosreport(
      { consent_token: "test-consent-token" },
      {
        runGenerate: async () => ({
          exitCode: 0,
          stdout: `Archive: ${sourceArchive}`,
          stderr: "",
          timedOut: false,
        }),
        findLatest: async () => null,
      },
    );
    assert.equal(generated.isError, undefined);
    const fetchReference = String(generated.structuredContent?.fetch_reference ?? "");
    assert.ok(fetchReference);

    const fetched = await handleFetchSosreport({ fetch_reference: fetchReference });
    assert.equal(fetched.isError, undefined);
    const artifactRef = String(fetched.structuredContent?.archive_path ?? "");
    assert.ok(artifactRef.startsWith("/tmp/"));

    const attach = await fetch(`${base}/api/jira/issues/SUP-901/attachments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": "engage-e2e",
        "x-connection-id": connected.connection_id,
      },
      body: JSON.stringify({ artifact_ref: artifactRef }),
    });
    assert.equal(attach.status, 201);
    const attached = await attach.json() as { filename?: string; text?: string };
    assert.ok(attached.filename);
    assert.equal((attached.text ?? "").includes("mock-pat-e2e"), false);
  } finally {
    srv.close();
  }
});

test("fallback-routing guidance is additive and preserves compatibility entry behavior", async () => {
  const { srv, base } = await startServer("routing-guidance");
  const mcpUrl = `${base}/mcp`;
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
    const payload = await response.json() as { result?: unknown; error?: { message: string } };
    if (payload.error) throw new Error(payload.error.message);
    return payload.result;
  };

  try {
    await jsonRpc("initialize", {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "engage-routing-guidance", version: "1.0.0" },
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

    const start = await jsonRpc("tools/call", {
      name: "start_engage_red_hat_support",
      arguments: {},
    }) as { structuredContent?: { compatibility_entry_uri?: string } };
    assert.equal(start.structuredContent?.compatibility_entry_uri, "ui://engage-red-hat-support/app.html");

    const skillRead = await jsonRpc("resources/read", {
      uri: "skill://engage-red-hat-support/SKILL.md",
    }) as { contents?: Array<{ text?: string }> };
    const skillText = skillRead.contents?.[0]?.text ?? "";
    assert.ok(skillText.includes("UI-first"), "skill should explicitly state UI-first behavior");
    assert.ok(
      skillText.includes("skill://engage-red-hat-support-headless/SKILL.md"),
      "skill should reference alternate headless placeholder URI",
    );
    assert.ok(
      skillText.includes("Out of Scope"),
      "skill should state no new headless skill implementation in this feature",
    );
  } finally {
    srv.close();
  }
});
