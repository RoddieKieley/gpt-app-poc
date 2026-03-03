import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { handleGenerateSosreport } from "../../src/sosreport/sosreport-tool-handlers.js";
import { ConsentTokenService } from "../../src/security/consent-token-service.js";
import { authorizeSensitiveToolCall } from "../../src/security/sensitive-tool-policy.js";
import {
  createMcpJsonRpcClient,
  mintConsentToken,
  mintConsentTokenViaMcp,
  startConsentTestServer,
} from "./consent-test-helpers.js";

test("generate_sosreport returns metadata and fetch_reference", async () => {
  const archivePath = "/tmp/sosreport-host-2026.tar.xz";
  await fs.writeFile(archivePath, "generated-archive-bytes", "utf8");
  const result = await handleGenerateSosreport(
    {
      consent_token: "test-consent-token",
      enable_plugins: ["networking"],
      log_size: "20m",
      redaction: true,
    },
    {
      runGenerate: async () => ({
        exitCode: 0,
        stdout: `Archive: ${archivePath}`,
        stderr: "",
        timedOut: false,
      }),
      findLatest: async () => null,
    },
  );

  assert.equal(result.isError, undefined);
  assert.equal(result.structuredContent?.archive_path, archivePath);
  assert.equal(result.structuredContent?.fetch_reference, archivePath);
  assert.equal(result.structuredContent?.execution_mode, "local");
  assert.equal(result.structuredContent?.timeout_ms, 600000);
  const text = result.content[0]?.text ?? "";
  assert.ok(text.includes("fetch_sosreport"), "expected fetch guidance in text fallback");
});

test("consent mint endpoint returns token for explicit Step 2 action", async () => {
  const { srv, base } = await startConsentTestServer("mint-success");
  try {
    const minted = await mintConsentToken({
      base,
      userId: "mint-user",
      sessionId: "mint-session",
    });
    assert.equal(minted.status, 201);
    assert.ok(String(minted.body.consent_token ?? "").length > 0);
  } finally {
    srv.close();
  }
});

test("valid consent authorizes generate once then replay is denied", async () => {
  const consentService = new ConsentTokenService({
    signingKey: "test-consent-signing-key",
    ttlSeconds: 120,
  });
  const minted = consentService.mint({
    userId: "happy-user",
    sessionId: "happy-session",
    scope: "generate_sosreport",
    step: 2,
  });

  const firstDecision = authorizeSensitiveToolCall({
    toolName: "generate_sosreport",
    consentToken: minted.token,
    userId: "happy-user",
    sessionId: "happy-session",
    consentService,
  });
  assert.equal(firstDecision.allowed, true);
  if (!firstDecision.allowed) return;

  const archivePath = "/tmp/sosreport-consent-happy.tar.xz";
  await fs.writeFile(archivePath, "consent-happy", "utf8");
  const generated = await handleGenerateSosreport(
    {
      consent_token: minted.token,
    },
    {
      runGenerate: async () => ({
        exitCode: 0,
        stdout: `Archive: ${archivePath}`,
        stderr: "",
        timedOut: false,
      }),
      findLatest: async () => null,
    },
  );
  consentService.finalizeSingleUse(firstDecision.claims.jti, !generated.isError);
  assert.equal(generated.isError, undefined);

  const replayDecision = authorizeSensitiveToolCall({
    toolName: "generate_sosreport",
    consentToken: minted.token,
    userId: "happy-user",
    sessionId: "happy-session",
    consentService,
  });
  assert.equal(replayDecision.allowed, false);
  if (!replayDecision.allowed) assert.equal(replayDecision.reasonCode, "consent_replayed");
});

test("headless MCP flow mints consent then generates and fetches", async () => {
  const archivePath = "/tmp/sosreport-mcp-happy-path.tar.xz";
  await fs.writeFile(archivePath, "mcp-happy-path", "utf8");
  process.env.SOSREPORT_TEST_ARCHIVE_PATH = archivePath;
  const { srv, base } = await startConsentTestServer("mcp-happy-path");

  try {
    const client = createMcpJsonRpcClient(base, "mcp-happy-user");
    await client.initialize();

    await client.call("tools/call", {
      name: "start_engage_red_hat_support",
      arguments: {},
    });
    const selected = (await client.call("tools/call", {
      name: "select_engage_product",
      arguments: { product: "linux" },
    })) as { structuredContent?: { workflow_session_id?: string } };
    const workflowSessionId = String(selected.structuredContent?.workflow_session_id ?? "");
    assert.ok(workflowSessionId.length > 0);

    const minted = await mintConsentTokenViaMcp(client, workflowSessionId);
    assert.equal(minted.isError, undefined);
    const consentToken = String(minted.structuredContent?.consent_token ?? "");
    assert.ok(consentToken.length > 0);
    assert.equal(String(minted.structuredContent?.workflow_session_id ?? ""), workflowSessionId);

    const generated = (await client.call("tools/call", {
      name: "generate_sosreport",
      arguments: {
        consent_token: consentToken,
        workflow_session_id: workflowSessionId,
      },
    })) as { structuredContent?: { job_id?: string; status?: string } };
    const jobId = String(generated.structuredContent?.job_id ?? "");
    assert.ok(jobId.length > 0);

    const pollLimit = 60;
    let fetchReference = "";
    for (let attempt = 0; attempt < pollLimit; attempt += 1) {
      const statusResult = (await client.call("tools/call", {
        name: "get_generate_sosreport_status",
        arguments: { job_id: jobId },
      })) as { structuredContent?: { status?: string; fetch_reference?: string } };
      const status = String(statusResult.structuredContent?.status ?? "");
      if (status === "succeeded") {
        fetchReference = String(statusResult.structuredContent?.fetch_reference ?? "");
        break;
      }
      if (status === "failed") {
        assert.fail("generate_sosreport job failed");
      }
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    assert.ok(fetchReference.length > 0);

    const fetched = (await client.call("tools/call", {
      name: "fetch_sosreport",
      arguments: { fetch_reference: fetchReference },
    })) as { structuredContent?: { archive_path?: string } };
    const archiveCopyPath = String(fetched.structuredContent?.archive_path ?? "");
    assert.ok(archiveCopyPath.startsWith("/tmp/"));
  } finally {
    delete process.env.SOSREPORT_TEST_ARCHIVE_PATH;
    srv.close();
  }
});
