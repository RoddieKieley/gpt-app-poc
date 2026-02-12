import test from "node:test";
import assert from "node:assert/strict";
import {
  listAttachmentsSchema,
  attachArtifactSchema,
} from "../../src/jira/jira-tool-schemas.js";

test("list attachments schema accepts connection_id + issue_key only", () => {
  const parsed = listAttachmentsSchema.safeParse({
    connection_id: "conn-1",
    issue_key: "SUP-123",
  });
  assert.equal(parsed.success, true);
});

test("attach schema requires artifact_ref and rejects empty fields", () => {
  const ok = attachArtifactSchema.safeParse({
    connection_id: "conn-1",
    issue_key: "SUP-123",
    artifact_ref: "/tmp/sosreport.tar.xz",
  });
  assert.equal(ok.success, true);

  const bad = attachArtifactSchema.safeParse({
    connection_id: "conn-1",
    issue_key: "SUP-123",
    artifact_ref: "",
  });
  assert.equal(bad.success, false);
});

