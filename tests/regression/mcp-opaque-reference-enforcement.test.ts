import test from "node:test";
import assert from "node:assert/strict";
import {
  listAttachmentsSchema,
  attachArtifactSchema,
} from "../../src/jira/jira-tool-schemas.js";

test("tool schemas require opaque connection_id and reject secret-style fields", () => {
  const listInput = listAttachmentsSchema.safeParse({
    connection_id: "conn-1",
    issue_key: "SUP-1",
    pat: "secret",
  });
  assert.equal(listInput.success, true);
  if (listInput.success) {
    assert.equal("pat" in listInput.data, false);
  }

  const attachInput = attachArtifactSchema.safeParse({
    connection_id: "conn-1",
    issue_key: "SUP-1",
    artifact_ref: "/tmp/artifact.txt",
    token: "secret",
  });
  assert.equal(attachInput.success, true);
  if (attachInput.success) {
    assert.equal("token" in attachInput.data, false);
  }
});

