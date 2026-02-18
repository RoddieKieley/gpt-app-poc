import test from "node:test";
import assert from "node:assert/strict";
import { mapGenerateExecutionFailure, runGenerateSosreport } from "../../src/sosreport/sosreport-command.js";
import { SosreportError } from "../../src/sosreport/sosreport-errors.js";

test("maps sudo password-required error to privilege_required", () => {
  const mapped = mapGenerateExecutionFailure({
    exitCode: 1,
    stdout: "",
    stderr: "sudo: a password is required",
    timedOut: false,
  });
  assert.equal(mapped.code, "privilege_required");
});

test("maps timeout to timeout error", () => {
  const mapped = mapGenerateExecutionFailure({
    exitCode: 1,
    stdout: "",
    stderr: "",
    timedOut: true,
  });
  assert.equal(mapped.code, "timeout");
});

test("runGenerateSosreport throws privilege_required when execution fails", async () => {
  const mockExec = async (command: string) => {
    if (command === "sh") {
      return { exitCode: 0, stdout: "/usr/bin/sos", stderr: "", timedOut: false };
    }
    return { exitCode: 1, stdout: "", stderr: "permission denied by sudoers", timedOut: false };
  };

  await assert.rejects(
    async () => runGenerateSosreport({}, { exec: mockExec }),
    (error: unknown) => error instanceof SosreportError && error.code === "privilege_required",
  );
});

test("runGenerateSosreport throws dependency_missing when sos unavailable", async () => {
  const mockExec = async () => ({ exitCode: 1, stdout: "", stderr: "", timedOut: false });
  await assert.rejects(
    async () => runGenerateSosreport({}, { exec: mockExec }),
    (error: unknown) => error instanceof SosreportError && error.code === "dependency_missing",
  );
});
