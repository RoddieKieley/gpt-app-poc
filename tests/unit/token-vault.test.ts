import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { TokenVault } from "../../src/security/token-vault.js";

test("TokenVault encrypts and resolves stored secrets", async () => {
  const file = path.join(process.cwd(), ".tmp-tests", `${randomUUID()}.json`);
  const vault = new TokenVault(file, "unit-test-master-key");
  await vault.store("conn-1", "super-secret-token");
  const resolved = await vault.resolve("conn-1");
  assert.equal(resolved, "super-secret-token");
});

