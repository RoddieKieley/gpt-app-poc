import test from "node:test";
import assert from "node:assert/strict";
import { redactSecrets, sanitizeForLog } from "../../src/security/redaction.js";

test("redactSecrets removes PAT/token material", () => {
  const input = "authorization: Bearer abc.def token=xyz pat=qqq";
  const redacted = redactSecrets(input);
  assert.equal(redacted.includes("abc.def"), false);
  assert.equal(redacted.includes("xyz"), false);
  assert.equal(redacted.includes("qqq"), false);
  assert.equal(redacted.includes("[REDACTED]"), true);
});

test("sanitizeForLog handles objects", () => {
  const output = sanitizeForLog({ authorization: "Bearer top-secret" });
  assert.equal(output.includes("top-secret"), false);
});

