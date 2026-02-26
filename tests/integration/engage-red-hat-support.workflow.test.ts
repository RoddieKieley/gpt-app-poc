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
    {},
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
      {},
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
