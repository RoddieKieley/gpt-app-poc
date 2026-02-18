import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { handleFetchSosreport } from "../../src/sosreport/sosreport-tool-handlers.js";
import { resolveArtifactSelection } from "../../src/jira/artifact-selection.js";

test("fetch_sosreport copies archive into /tmp and returns checksum", async () => {
  const source = path.join("/tmp", "sosreport-fetch-success.tar.xz");
  await fs.writeFile(source, "sosreport-bytes", "utf8");

  const result = await handleFetchSosreport({ fetch_reference: source });
  assert.equal(result.isError, undefined);
  const archivePath = String(result.structuredContent?.archive_path ?? "");
  assert.equal(archivePath.startsWith("/tmp/"), true);
  assert.equal(Number(result.structuredContent?.size_bytes) > 0, true);
  const checksum = String(result.structuredContent?.sha256 ?? "");
  assert.equal(checksum.length, 64);
});

test("fetch output archive path is compatible with jira artifact selection", async () => {
  const source = path.join("/tmp", "sosreport-fetch-artifact.tar.xz");
  await fs.writeFile(source, "artifact-content", "utf8");
  const fetched = await handleFetchSosreport({ fetch_reference: source });
  assert.equal(fetched.isError, undefined);
  const archivePath = String(fetched.structuredContent?.archive_path ?? "");
  const selected = await resolveArtifactSelection(archivePath);
  assert.equal(selected.filePath, archivePath);
});

test("fetch_sosreport returns actionable error when source archive missing", async () => {
  const missing = await handleFetchSosreport({ fetch_reference: "/tmp/sosreport-missing-source.tar.xz" });
  assert.equal(missing.isError, true);
  assert.ok(
    missing.structuredContent?.code === "read_failed" || missing.structuredContent?.code === "privilege_required",
    "expected read_failed or privilege_required for missing source archive",
  );
});
