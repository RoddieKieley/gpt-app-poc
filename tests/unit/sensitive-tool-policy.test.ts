import test from "node:test";
import assert from "node:assert/strict";
import { ConsentTokenService } from "../../src/security/consent-token-service.js";
import { authorizeSensitiveToolCall } from "../../src/security/sensitive-tool-policy.js";

const consentService = () =>
  new ConsentTokenService({
    signingKey: "policy-test-signing-key",
    ttlSeconds: 60,
    clockSkewSeconds: 0,
  });

const mint = (service: ConsentTokenService, userId = "policy-user", sessionId = "policy-session") =>
  service.mint({
    userId,
    sessionId,
    scope: "generate_sosreport",
    step: 2,
  }).token;

test("denies missing token with safe text", () => {
  const decision = authorizeSensitiveToolCall({
    toolName: "generate_sosreport",
    consentToken: undefined,
    userId: "policy-user",
    sessionId: "policy-session",
    consentService: consentService(),
  });
  assert.equal(decision.allowed, false);
  if (!decision.allowed) {
    assert.equal(decision.reasonCode, "consent_missing");
    assert.ok(decision.safeText.includes("Step 1"));
  }
});

test("denies invalid or mismatched token", () => {
  const service = consentService();
  const token = mint(service);
  const invalid = authorizeSensitiveToolCall({
    toolName: "generate_sosreport",
    consentToken: `${token}broken`,
    userId: "policy-user",
    sessionId: "policy-session",
    consentService: service,
  });
  assert.equal(invalid.allowed, false);
  if (!invalid.allowed) assert.equal(invalid.reasonCode, "consent_invalid");

  const wrongUser = authorizeSensitiveToolCall({
    toolName: "generate_sosreport",
    consentToken: token,
    userId: "other-user",
    sessionId: "policy-session",
    consentService: service,
  });
  assert.equal(wrongUser.allowed, false);
  if (!wrongUser.allowed) assert.equal(wrongUser.reasonCode, "consent_wrong_user");
});

test("authorizes valid token then denies replay", () => {
  const service = consentService();
  const token = mint(service);
  const first = authorizeSensitiveToolCall({
    toolName: "generate_sosreport",
    consentToken: token,
    userId: "policy-user",
    sessionId: "policy-session",
    consentService: service,
  });
  assert.equal(first.allowed, true);

  const second = authorizeSensitiveToolCall({
    toolName: "generate_sosreport",
    consentToken: token,
    userId: "policy-user",
    sessionId: "policy-session",
    consentService: service,
  });
  assert.equal(second.allowed, false);
  if (!second.allowed) assert.equal(second.reasonCode, "consent_replayed");
});
