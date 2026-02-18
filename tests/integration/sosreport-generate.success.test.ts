import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { handleGenerateSosreport } from "../../src/sosreport/sosreport-tool-handlers.js";

test("generate_sosreport returns metadata and fetch_reference", async () => {
  const archivePath = "/tmp/sosreport-host-2026.tar.xz";
  await fs.writeFile(archivePath, "generated-archive-bytes", "utf8");
  const result = await handleGenerateSosreport(
    {
      enable_plugins: ["networking"],
      log_size: "20m",
      redaction: true,
    },
    {
      runGenerate: async () => ({
        exitCode: 0,
        stdout: `Archive: ${archivePath}`,
        stderr: "",
        timedOut: false,
      }),
      findLatest: async () => null,
    },
  );

  assert.equal(result.isError, undefined);
  assert.equal(result.structuredContent?.archive_path, archivePath);
  assert.equal(result.structuredContent?.fetch_reference, archivePath);
  assert.equal(result.structuredContent?.execution_mode, "local");
  assert.equal(result.structuredContent?.timeout_ms, 600000);
  const text = result.content[0]?.text ?? "";
  assert.ok(text.includes("fetch_sosreport"), "expected fetch guidance in text fallback");
});
