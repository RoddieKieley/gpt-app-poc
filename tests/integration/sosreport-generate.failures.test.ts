import test from "node:test";
import assert from "node:assert/strict";
import { createHmac, randomUUID } from "node:crypto";
import { handleGenerateSosreport, handleFetchSosreport } from "../../src/sosreport/sosreport-tool-handlers.js";
import { SosreportError } from "../../src/sosreport/sosreport-errors.js";
import { ConsentTokenService } from "../../src/security/consent-token-service.js";
import { authorizeSensitiveToolCall } from "../../src/security/sensitive-tool-policy.js";
import { createMcpJsonRpcClient, mintConsentToken, startConsentTestServer } from "./consent-test-helpers.js";

test("generate_sosreport rejects conflicting options", async () => {
  const result = await handleGenerateSosreport({
    consent_token: "test-consent-token",
    only_plugins: ["networking"],
    enable_plugins: ["logs"],
  });
  assert.equal(result.isError, true);
  assert.equal(result.structuredContent?.code, "validation_error");
});

test("generate_sosreport maps timeout failure", async () => {
  const result = await handleGenerateSosreport(
    { consent_token: "test-consent-token", enable_plugins: ["networking"] },
    {
      runGenerate: async () => {
        throw new SosreportError("timeout", "sosreport generation timed out after 600000ms.");
      },
      findLatest: async () => null,
    },
  );
  assert.equal(result.isError, true);
  assert.equal(result.structuredContent?.code, "timeout");
});

test("generate_sosreport maps sudo password-required failure", async () => {
  const result = await handleGenerateSosreport(
    { consent_token: "test-consent-token", enable_plugins: ["networking"] },
    {
      runGenerate: async () => {
        throw new SosreportError("privilege_required", "sudo -n requires a password. Configure NOPASSWD sudoers entries.");
      },
      findLatest: async () => null,
    },
  );
  assert.equal(result.isError, true);
  assert.equal(result.structuredContent?.code, "privilege_required");
});

test("generate_sosreport fails when output parse and fallback miss archive", async () => {
  const result = await handleGenerateSosreport(
    { consent_token: "test-consent-token", enable_plugins: ["networking"] },
    {
      runGenerate: async () => ({
        exitCode: 0,
        stdout: "generation complete",
        stderr: "",
        timedOut: false,
      }),
      findLatest: async () => null,
    },
  );
  assert.equal(result.isError, true);
  assert.equal(result.structuredContent?.code, "archive_not_found");
});

test("fetch_sosreport rejects unsafe and non-absolute paths", async () => {
  const relative = await handleFetchSosreport({ fetch_reference: "relative.tar.xz" });
  assert.equal(relative.isError, true);

  const unsafe = await handleFetchSosreport({ fetch_reference: "/etc/passwd" });
  assert.equal(unsafe.isError, true);
});

const createGenerateClient = async (base: string, userId: string) => {
  const client = createMcpJsonRpcClient(base, userId);
  await client.initialize();
  return client;
};

const callGenerateViaMcp = async (client: ReturnType<typeof createMcpJsonRpcClient>, consentToken?: string) => {
  const result = (await client.call("tools/call", {
    name: "generate_sosreport",
    arguments: consentToken ? { consent_token: consentToken } : {},
  })) as {
    isError?: boolean;
    structuredContent?: { code?: string };
    content?: Array<{ type?: string; text?: string }>;
  };
  return result;
};

test("generate_sosreport is denied without consent token via MCP path", async () => {
  const { srv, base } = await startConsentTestServer("missing-token");
  try {
    const client = await createGenerateClient(base, "default-user");
    const result = await callGenerateViaMcp(client);
    assert.equal(result.isError, true);
    assert.equal(result.structuredContent?.code, "consent_missing");
  } finally {
    srv.close();
  }
});

test("generate_sosreport is denied for invalid and replayed consent token via MCP path", async () => {
  const { srv, base } = await startConsentTestServer("invalid-replay");
  try {
    const client = await createGenerateClient(base, "default-user");
    const sessionId = client.getSessionId();
    const minted = await mintConsentToken({
      base,
      userId: "default-user",
      sessionId,
    });
    assert.equal(minted.status, 201);
    const token = String(minted.body.consent_token ?? "");
    assert.ok(token.length > 0);

    const invalid = await callGenerateViaMcp(client, `${token}-tampered`);
    assert.equal(invalid.isError, true);
    assert.equal(invalid.structuredContent?.code, "consent_invalid");

    const replayService = new ConsentTokenService({
      signingKey: "test-consent-signing-key",
      ttlSeconds: 120,
      clockSkewSeconds: 0,
    });
    const replayToken = replayService.mint({
      userId: "default-user",
      sessionId,
      scope: "generate_sosreport",
      step: 2,
    }).token;
    const firstDecision = authorizeSensitiveToolCall({
      toolName: "generate_sosreport",
      consentToken: replayToken,
      userId: "default-user",
      sessionId,
      consentService: replayService,
    });
    assert.equal(firstDecision.allowed, true);
    const secondDecision = authorizeSensitiveToolCall({
      toolName: "generate_sosreport",
      consentToken: replayToken,
      userId: "default-user",
      sessionId,
      consentService: replayService,
    });
    assert.equal(secondDecision.allowed, false);
    if (!secondDecision.allowed) assert.equal(secondDecision.reasonCode, "consent_replayed");
  } finally {
    srv.close();
  }
});

test("generate_sosreport denies wrong-user and wrong-session token use", async () => {
  const { srv, base } = await startConsentTestServer("wrong-user-session");
  try {
    const client = await createGenerateClient(base, "default-user");
    const sessionId = client.getSessionId();
    const userMismatchService = new ConsentTokenService({
      signingKey: "test-consent-signing-key",
      ttlSeconds: 120,
      clockSkewSeconds: 0,
    });
    const wrongUserToken = userMismatchService.mint({
      userId: "other-user",
      sessionId,
      scope: "generate_sosreport",
      step: 2,
    }).token;

    const wrongUser = await callGenerateViaMcp(client, wrongUserToken);
    assert.equal(wrongUser.isError, true);
    assert.equal(wrongUser.structuredContent?.code, "consent_wrong_user");

    const minted = await mintConsentToken({
      base,
      userId: "default-user",
      sessionId: "other-session",
    });
    assert.equal(minted.status, 201);
    const sessionMismatchToken = String(minted.body.consent_token ?? "");
    assert.ok(sessionMismatchToken.length > 0);

    const wrongSession = await callGenerateViaMcp(client, sessionMismatchToken);
    assert.equal(wrongSession.isError, true);
    assert.equal(wrongSession.structuredContent?.code, "consent_session_mismatch");
  } finally {
    srv.close();
  }
});

test("generate_sosreport denies expired, wrong-scope, and wrong-step signed tokens", async () => {
  const { srv, base } = await startConsentTestServer("expired-scope");
  try {
    const client = await createGenerateClient(base, "default-user");
    const sessionId = client.getSessionId();
    const expiredService = new ConsentTokenService({
      signingKey: "test-consent-signing-key",
      ttlSeconds: 30,
      clockSkewSeconds: 0,
    });
    const expiredToken = expiredService.mint({
      userId: "default-user",
      sessionId,
      scope: "generate_sosreport",
      step: 2,
      nowMs: 1,
    }).token;
    const expired = await callGenerateViaMcp(client, expiredToken);
    assert.equal(expired.isError, true);
    assert.equal(expired.structuredContent?.code, "consent_expired");

    const now = Math.floor(Date.now() / 1000);
    const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
    const payload = Buffer.from(
      JSON.stringify({
        sub: "default-user",
        session_id: sessionId,
        scope: "other_scope",
        step: 2,
        iat: now,
        exp: now + 30,
        jti: randomUUID(),
      }),
    ).toString("base64url");
    const signature = Buffer.from(
      createHmac("sha256", "test-consent-signing-key")
        .update(`${header}.${payload}`)
        .digest(),
    ).toString("base64url");
    const wrongScopeToken = `${header}.${payload}.${signature}`;
    const wrongScope = await callGenerateViaMcp(client, wrongScopeToken);
    assert.equal(wrongScope.isError, true);
    assert.equal(wrongScope.structuredContent?.code, "consent_wrong_scope");

    const wrongStepPayload = Buffer.from(
      JSON.stringify({
        sub: "default-user",
        session_id: sessionId,
        scope: "generate_sosreport",
        step: 3,
        iat: now,
        exp: now + 30,
        jti: randomUUID(),
      }),
    ).toString("base64url");
    const wrongStepSignature = Buffer.from(
      createHmac("sha256", "test-consent-signing-key")
        .update(`${header}.${wrongStepPayload}`)
        .digest(),
    ).toString("base64url");
    const wrongStepToken = `${header}.${wrongStepPayload}.${wrongStepSignature}`;
    const wrongStep = await callGenerateViaMcp(client, wrongStepToken);
    assert.equal(wrongStep.isError, true);
    assert.equal(wrongStep.structuredContent?.code, "consent_wrong_step");
  } finally {
    srv.close();
  }
});
