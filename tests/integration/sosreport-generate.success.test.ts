import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { handleGenerateSosreport } from "../../src/sosreport/sosreport-tool-handlers.js";
import { ConsentTokenService } from "../../src/security/consent-token-service.js";
import { authorizeSensitiveToolCall } from "../../src/security/sensitive-tool-policy.js";
import {
  asTextOnlyToolResult,
  createMcpJsonRpcClient,
  mintConsentToken,
  mintConsentTokenViaMcp,
  parseDeterministicKey,
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
    const mintedText = minted.content?.find((entry) => entry.type === "text")?.text ?? "";
    const fallbackTokenMatch = mintedText.match(/^consent_token:\s*(.+)$/m);
    const fallbackExpiresMatch = mintedText.match(/^expires_at:\s*(.+)$/m);
    const fallbackWorkflowMatch = mintedText.match(/^workflow_session_id:\s*(.+)$/m);
    assert.ok(fallbackTokenMatch?.[1]?.trim(), "text fallback must include consent_token");
    assert.ok(fallbackExpiresMatch?.[1]?.trim(), "text fallback must include expires_at");
    assert.ok(fallbackWorkflowMatch?.[1]?.trim(), "text fallback must include workflow_session_id");
    assert.equal(fallbackTokenMatch?.[1]?.trim(), consentToken);
    assert.equal(
      String(minted.structuredContent?.consent_token ?? "").trim(),
      consentToken,
      "structuredContent must remain the primary token source",
    );
    assert.ok(mintedText.includes(`consent_token: ${consentToken}`));
    assert.ok(mintedText.includes("single-use, short-lived"));

    const generated = (await client.call("tools/call", {
      name: "generate_sosreport",
      arguments: {
        consent_token: consentToken,
        workflow_session_id: workflowSessionId,
      },
    })) as { structuredContent?: { job_id?: string; status?: string }; content?: Array<{ type?: string; text?: string }> };
    const jobId = String(generated.structuredContent?.job_id ?? "");
    assert.ok(jobId.length > 0);
    const generatedText = generated.content?.find((entry) => entry.type === "text")?.text ?? "";
    assert.equal(parseDeterministicKey(generatedText, "job_id"), jobId);
    assert.equal(parseDeterministicKey(generatedText, "status"), "queued");

    const pollLimit = 60;
    let fetchReference = "";
    let statusTextValue = "";
    for (let attempt = 0; attempt < pollLimit; attempt += 1) {
      const statusResult = (await client.call("tools/call", {
        name: "get_generate_sosreport_status",
        arguments: { job_id: jobId },
      })) as {
        structuredContent?: { status?: string; fetch_reference?: string };
        content?: Array<{ type?: string; text?: string }>;
      };
      const status = String(statusResult.structuredContent?.status ?? "");
      const statusText = statusResult.content?.find((entry) => entry.type === "text")?.text ?? "";
      statusTextValue = parseDeterministicKey(statusText, "status");
      const statusTextJob = parseDeterministicKey(statusText, "job_id");
      assert.equal(statusTextJob, jobId);
      assert.equal(statusTextValue, status);
      if (status === "succeeded") {
        fetchReference = String(statusResult.structuredContent?.fetch_reference ?? "");
        assert.equal(parseDeterministicKey(statusText, "fetch_reference"), fetchReference);
        break;
      }
      if (status === "failed") {
        assert.fail("generate_sosreport job failed");
      }
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    assert.ok(fetchReference.length > 0);
    assert.equal(statusTextValue, "succeeded");

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

test("text-only bridge can complete mint and generate handoffs without structuredContent", async () => {
  const archivePath = "/tmp/sosreport-mcp-text-only.tar.xz";
  await fs.writeFile(archivePath, "mcp-text-only", "utf8");
  process.env.SOSREPORT_TEST_ARCHIVE_PATH = archivePath;
  const { srv, base } = await startConsentTestServer("mcp-text-only");

  try {
    const client = createMcpJsonRpcClient(base, "mcp-text-only-user");
    await client.initialize();

    await client.call("tools/call", {
      name: "start_engage_red_hat_support",
      arguments: {},
    });
    await client.call("tools/call", {
      name: "select_engage_product",
      arguments: { product: "linux" },
    });

    const mintedRaw = (await client.call("tools/call", {
      name: "mint_engage_consent_token",
      arguments: { permission_granted: true },
    })) as {
      isError?: boolean;
      content?: Array<{ type?: string; text?: string }>;
      structuredContent?: { consent_token?: string; expires_at?: string; workflow_session_id?: string };
    };
    const mintedTextOnly = asTextOnlyToolResult(mintedRaw);
    assert.equal(mintedTextOnly.isError, undefined);
    const consentToken = parseDeterministicKey(mintedTextOnly.text, "consent_token");
    const expiresAt = parseDeterministicKey(mintedTextOnly.text, "expires_at");
    const workflowSessionId = parseDeterministicKey(mintedTextOnly.text, "workflow_session_id");
    assert.ok(consentToken.length > 0);
    assert.ok(expiresAt.length > 0);
    assert.ok(workflowSessionId.length > 0);

    const generatedRaw = (await client.call("tools/call", {
      name: "generate_sosreport",
      arguments: {
        consent_token: consentToken,
      },
    })) as { content?: Array<{ type?: string; text?: string }>; structuredContent?: { job_id?: string } };
    const generatedTextOnly = asTextOnlyToolResult(generatedRaw);
    const jobId = parseDeterministicKey(generatedTextOnly.text, "job_id");
    assert.ok(jobId.length > 0);
    assert.equal(parseDeterministicKey(generatedTextOnly.text, "status"), "queued");

    let fetchReference = "";
    const pollLimit = 60;
    for (let attempt = 0; attempt < pollLimit; attempt += 1) {
      const statusRaw = (await client.call("tools/call", {
        name: "get_generate_sosreport_status",
        arguments: { job_id: jobId },
      })) as { content?: Array<{ type?: string; text?: string }> };
      const statusTextOnly = asTextOnlyToolResult(statusRaw);
      const status = parseDeterministicKey(statusTextOnly.text, "status");
      assert.equal(parseDeterministicKey(statusTextOnly.text, "job_id"), jobId);
      if (status === "succeeded") {
        fetchReference = parseDeterministicKey(statusTextOnly.text, "fetch_reference");
        break;
      }
      if (status === "failed") {
        assert.fail("generate_sosreport job failed for text-only flow");
      }
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    assert.ok(fetchReference.length > 0);

    const fetchedRaw = (await client.call("tools/call", {
      name: "fetch_sosreport",
      arguments: { fetch_reference: fetchReference },
    })) as { structuredContent?: { archive_path?: string } };
    assert.ok(String(fetchedRaw.structuredContent?.archive_path ?? "").startsWith("/tmp/"));
  } finally {
    delete process.env.SOSREPORT_TEST_ARCHIVE_PATH;
    srv.close();
  }
});
