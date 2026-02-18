import test from "node:test";
import assert from "node:assert/strict";
import { handleGenerateSosreport, handleFetchSosreport } from "../../src/sosreport/sosreport-tool-handlers.js";
import { SosreportError } from "../../src/sosreport/sosreport-errors.js";

test("generate_sosreport rejects conflicting options", async () => {
  const result = await handleGenerateSosreport({
    only_plugins: ["networking"],
    enable_plugins: ["logs"],
  });
  assert.equal(result.isError, true);
  assert.equal(result.structuredContent?.code, "validation_error");
});

test("generate_sosreport maps timeout failure", async () => {
  const result = await handleGenerateSosreport(
    { enable_plugins: ["networking"] },
    {
      runGenerate: async () => {
        throw new SosreportError("timeout", "sosreport generation timed out after 600000ms.");
      },
      findLatest: async () => null,
    },
  );
  assert.equal(result.isError, true);
  assert.equal(result.structuredContent?.code, "timeout");
});

test("generate_sosreport maps sudo password-required failure", async () => {
  const result = await handleGenerateSosreport(
    { enable_plugins: ["networking"] },
    {
      runGenerate: async () => {
        throw new SosreportError("privilege_required", "sudo -n requires a password. Configure NOPASSWD sudoers entries.");
      },
      findLatest: async () => null,
    },
  );
  assert.equal(result.isError, true);
  assert.equal(result.structuredContent?.code, "privilege_required");
});

test("generate_sosreport fails when output parse and fallback miss archive", async () => {
  const result = await handleGenerateSosreport(
    { enable_plugins: ["networking"] },
    {
      runGenerate: async () => ({
        exitCode: 0,
        stdout: "generation complete",
        stderr: "",
        timedOut: false,
      }),
      findLatest: async () => null,
    },
  );
  assert.equal(result.isError, true);
  assert.equal(result.structuredContent?.code, "archive_not_found");
});

test("fetch_sosreport rejects unsafe and non-absolute paths", async () => {
  const relative = await handleFetchSosreport({ fetch_reference: "relative.tar.xz" });
  assert.equal(relative.isError, true);

  const unsafe = await handleFetchSosreport({ fetch_reference: "/etc/passwd" });
  assert.equal(unsafe.isError, true);
});
