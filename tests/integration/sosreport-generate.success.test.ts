import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { handleGenerateSosreport } from "../../src/sosreport/sosreport-tool-handlers.js";
import { ConsentTokenService } from "../../src/security/consent-token-service.js";
import { authorizeSensitiveToolCall } from "../../src/security/sensitive-tool-policy.js";
import { mintConsentToken, startConsentTestServer } from "./consent-test-helpers.js";

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
