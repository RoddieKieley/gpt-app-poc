import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { ConnectionLifecycleStore } from "../../src/security/connection-lifecycle.js";

test("ConnectionLifecycleStore enforces user ownership and revoke", async () => {
  const file = path.join(process.cwd(), ".tmp-tests", `${randomUUID()}.json`);
  const store = new ConnectionLifecycleStore(file, 120);
  const conn = await store.create("alice", "https://jira.example.com");
  const owned = await store.getOwned("alice", conn.connectionId);
  assert.ok(owned);
  const denied = await store.getOwned("bob", conn.connectionId);
  assert.equal(denied, null);
  await store.revoke("alice", conn.connectionId);
  const revoked = await store.getOwned("alice", conn.connectionId);
  assert.equal(revoked?.status, "revoked");
});

