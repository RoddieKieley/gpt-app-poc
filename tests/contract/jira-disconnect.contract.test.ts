import test from "node:test";
import assert from "node:assert/strict";
import { connectionIdSchema } from "../../src/jira/jira-tool-schemas.js";

test("disconnect schema requires connection_id", () => {
  const ok = connectionIdSchema.safeParse({ connection_id: "conn-9" });
  assert.equal(ok.success, true);

  const bad = connectionIdSchema.safeParse({});
  assert.equal(bad.success, false);
});

