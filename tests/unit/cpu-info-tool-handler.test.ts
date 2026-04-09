import test from "node:test";
import assert from "node:assert/strict";
import { handleGetCpuInformation } from "../../src/linux/system-info/cpu-info-tool-handler.js";

test("handler returns complete structuredContent with expected field types", async () => {
  const cpuText = [
    "model name: Intel Xeon Platinum",
    "siblings: 8",
    "cpu cores: 4",
    "cpu MHz: 2100.25",
  ].join("\n");
  const loadText = "0.11 0.22 0.33 1/100 1000";

  const result = await handleGetCpuInformation(
    {},
    {
      readFile: async (path) => {
        if (path === "/proc/cpuinfo") return cpuText;
        if (path === "/proc/loadavg") return loadText;
        throw new Error("unexpected path");
      },
    },
  );

  assert.equal(result.isError, undefined);
  const structured = result.structuredContent as Record<string, unknown>;
  assert.equal(typeof structured.model, "string");
  assert.equal(typeof structured.logical_cores, "number");
  assert.equal(typeof structured.physical_cores, "number");
  assert.equal(typeof structured.frequency_mhz, "number");
  assert.equal(typeof structured.load_avg_1m, "number");
  assert.equal(typeof structured.load_avg_5m, "number");
  assert.equal(typeof structured.load_avg_15m, "number");
  assert.equal(typeof structured.cpu_line, "string");
  assert.ok((result.content[0]?.text ?? "").includes("CPU information collected from local host."));
});

test("handler returns partial parse metadata and fallback text when fields are missing", async () => {
  const cpuText = ["model name: Intel Xeon Platinum", "siblings: 8"].join("\n");
  const loadText = "not-a-loadavg";

  const result = await handleGetCpuInformation(
    {},
    {
      readFile: async (path) => {
        if (path === "/proc/cpuinfo") return cpuText;
        if (path === "/proc/loadavg") return loadText;
        throw new Error("unexpected path");
      },
    },
  );

  assert.equal(result.isError, undefined);
  const structured = result.structuredContent as Record<string, unknown>;
  assert.equal(structured.code, "partial_parse");
  assert.ok(Array.isArray(structured.missing_fields));
  assert.ok((result.content[0]?.text ?? "").includes("warnings:"));
});

test("handler rejects host argument to preserve local-only behavior", async () => {
  const result = await handleGetCpuInformation({ host: "remote.example.com" });
  assert.equal(result.isError, true);
  assert.ok((result.content[0]?.text ?? "").includes("local-only"));
  const structured = result.structuredContent as Record<string, unknown>;
  assert.equal(structured.code, "validation_error");
});
