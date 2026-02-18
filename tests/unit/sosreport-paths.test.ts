import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { assertSafeFetchReference, buildTmpCopyPath, findLatestMatchingArchive, parseArchivePathFromOutput } from "../../src/sosreport/sosreport-paths.js";
import { SosreportError } from "../../src/sosreport/sosreport-errors.js";

test("parseArchivePathFromOutput extracts archive path", () => {
  const archive = "/tmp/sosreport-node1-2026-02-18-abcd.tar.xz";
  const parsed = parseArchivePathFromOutput(`Created: ${archive}`, "");
  assert.equal(parsed, archive);
});

test("findLatestMatchingArchive picks newest matching file", async () => {
  const tempDir = path.join(process.cwd(), ".tmp-tests", "sosreport-latest");
  await fs.mkdir(tempDir, { recursive: true });
  const older = path.join(tempDir, "sosreport-old.tar.xz");
  const newer = path.join(tempDir, "sosreport-new.tar.xz");
  await fs.writeFile(older, "old", "utf8");
  await new Promise((resolve) => setTimeout(resolve, 10));
  await fs.writeFile(newer, "new", "utf8");
  const found = await findLatestMatchingArchive([tempDir]);
  assert.equal(found, newer);
});

test("assertSafeFetchReference rejects non-absolute path", () => {
  assert.throws(
    () => assertSafeFetchReference("relative/path.tar.xz"),
    (error: unknown) => error instanceof SosreportError && error.code === "validation_error",
  );
});

test("assertSafeFetchReference rejects invalid naming", () => {
  assert.throws(
    () => assertSafeFetchReference("/tmp/not-a-sos.tar"),
    (error: unknown) => error instanceof SosreportError && error.code === "validation_error",
  );
});

test("buildTmpCopyPath returns /tmp destination", () => {
  const value = buildTmpCopyPath("/tmp/sosreport-host-1.tar.xz");
  assert.equal(value.startsWith("/tmp/"), true);
});
