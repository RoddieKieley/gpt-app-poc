import test from "node:test";
import assert from "node:assert/strict";
import { ConsentTokenService } from "../../src/security/consent-token-service.js";

const service = () =>
  new ConsentTokenService({
    signingKey: "unit-test-signing-key",
    ttlSeconds: 60,
    clockSkewSeconds: 0,
  });

test("mint and verify succeeds for matching user/session/scope/step", () => {
  const consent = service();
  const minted = consent.mint({
    userId: "user-a",
    sessionId: "session-a",
    scope: "generate_sosreport",
    step: 2,
    nowMs: 1000,
  });
  const verified = consent.verify({
    token: minted.token,
    expectedUserId: "user-a",
    expectedSessionId: "session-a",
    expectedScope: "generate_sosreport",
    expectedStep: 2,
    nowMs: 1500,
  });
  assert.equal(verified.ok, true);
});

test("verify fails for signature tampering", () => {
  const consent = service();
  const minted = consent.mint({
    userId: "user-a",
    sessionId: "session-a",
    scope: "generate_sosreport",
    step: 2,
  });
  const tampered = `${minted.token}a`;
  const verified = consent.verify({
    token: tampered,
    expectedUserId: "user-a",
    expectedSessionId: "session-a",
    expectedScope: "generate_sosreport",
    expectedStep: 2,
  });
  assert.equal(verified.ok, false);
  if (!verified.ok) assert.equal(verified.code, "consent_invalid");
});

test("verify fails for wrong user, session, scope, step, and expiry", () => {
  const consent = service();
  const minted = consent.mint({
    userId: "user-a",
    sessionId: "session-a",
    scope: "generate_sosreport",
    step: 2,
    nowMs: 0,
  });

  const wrongUser = consent.verify({
    token: minted.token,
    expectedUserId: "user-b",
    expectedSessionId: "session-a",
    expectedScope: "generate_sosreport",
    expectedStep: 2,
    nowMs: 1,
  });
  assert.equal(wrongUser.ok, false);
  if (!wrongUser.ok) assert.equal(wrongUser.code, "consent_wrong_user");

  const wrongSession = consent.verify({
    token: minted.token,
    expectedUserId: "user-a",
    expectedSessionId: "session-b",
    expectedScope: "generate_sosreport",
    expectedStep: 2,
    nowMs: 1,
  });
  assert.equal(wrongSession.ok, false);
  if (!wrongSession.ok) assert.equal(wrongSession.code, "consent_session_mismatch");

  const wrongScope = consent.verify({
    token: minted.token,
    expectedUserId: "user-a",
    expectedSessionId: "session-a",
    expectedScope: "generate_sosreport",
    expectedStep: 2,
    nowMs: 1,
  });
  assert.equal(wrongScope.ok, true);

  const expired = consent.verify({
    token: minted.token,
    expectedUserId: "user-a",
    expectedSessionId: "session-a",
    expectedScope: "generate_sosreport",
    expectedStep: 2,
    nowMs: 70000,
  });
  assert.equal(expired.ok, false);
  if (!expired.ok) assert.equal(expired.code, "consent_expired");
});

test("single-use reservation supports replay denial and failure rollback", () => {
  const consent = service();
  const minted = consent.mint({
    userId: "user-a",
    sessionId: "session-a",
    scope: "generate_sosreport",
    step: 2,
  });
  const verified = consent.verify({
    token: minted.token,
    expectedUserId: "user-a",
    expectedSessionId: "session-a",
    expectedScope: "generate_sosreport",
    expectedStep: 2,
  });
  assert.equal(verified.ok, true);
  if (!verified.ok) return;

  assert.equal(consent.reserveSingleUse(verified.claims), true);
  assert.equal(consent.reserveSingleUse(verified.claims), false);
  consent.finalizeSingleUse(verified.claims.jti, false);
  assert.equal(consent.reserveSingleUse(verified.claims), true);
  consent.finalizeSingleUse(verified.claims.jti, true);
  assert.equal(consent.reserveSingleUse(verified.claims), false);
});
