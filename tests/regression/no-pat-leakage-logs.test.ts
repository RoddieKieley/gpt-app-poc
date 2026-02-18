import test from "node:test";
import assert from "node:assert/strict";
import { sanitizeForLog } from "../../src/security/redaction.js";

test("log sanitizer redacts auth headers and token-like values", () => {
  const msg = sanitizeForLog({
    authorization: "Bearer super-secret",
    pat: "pat-value",
    token: "token-value",
  });
  assert.equal(msg.includes("super-secret"), false);
  assert.equal(msg.includes("pat-value"), false);
  assert.equal(msg.includes("token-value"), false);
});

test("log sanitizer redacts attach-step error details with token content", () => {
  const msg = sanitizeForLog(
    "Attach failed for SUP-7: Authorization: Bearer abc123, pat=super-secret, token=xyz",
  );
  assert.equal(msg.includes("abc123"), false);
  assert.equal(msg.includes("super-secret"), false);
  assert.equal(msg.includes("token=xyz"), false);
});

