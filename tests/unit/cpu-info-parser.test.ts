import test from "node:test";
import assert from "node:assert/strict";
import { parseCpuInfoFromRaw } from "../../src/linux/system-info/cpu-info-parser.js";

test("parser returns complete CpuInfo for full linux-style payload", () => {
  const raw = [
    "processor\t: 0",
    "model name\t: Intel(R) Xeon(R) CPU",
    "cpu MHz\t\t: 2593.906",
    "siblings\t: 16",
    "cpu cores\t: 8",
    "load average: 0.10 0.20 0.30",
  ].join("\n");

  const parsed = parseCpuInfoFromRaw(raw);
  assert.equal(parsed.isComplete, true);
  assert.equal(parsed.missingFields.length, 0);
  assert.equal(parsed.cpuInfo.model, "Intel(R) Xeon(R) CPU");
  assert.equal(parsed.cpuInfo.logical_cores, 16);
  assert.equal(parsed.cpuInfo.physical_cores, 8);
  assert.equal(parsed.cpuInfo.frequency_mhz, 2593.906);
  assert.equal(parsed.cpuInfo.load_avg_1m, 0.10);
  assert.equal(parsed.cpuInfo.load_avg_5m, 0.20);
  assert.equal(parsed.cpuInfo.load_avg_15m, 0.30);
  assert.equal(parsed.cpuInfo.cpu_line, "model name\t: Intel(R) Xeon(R) CPU");
});

test("parser falls back physical_cores to logical_cores when physical is missing", () => {
  const raw = [
    "model name: AMD EPYC",
    "cpu MHz: 3200.0",
    "siblings: 32",
    "load average: 0.01 0.02 0.03",
  ].join("\n");
  const parsed = parseCpuInfoFromRaw(raw);
  assert.equal(parsed.cpuInfo.logical_cores, 32);
  assert.equal(parsed.cpuInfo.physical_cores, 32);
  assert.ok(parsed.parseWarnings.some((warning) => warning.includes("physical_cores unavailable")));
});

test("parser reports missing frequency and malformed load-average values", () => {
  const raw = [
    "model name: ARM Neoverse",
    "siblings: 8",
    "cpu cores: 4",
    "load average: one two three",
  ].join("\n");
  const parsed = parseCpuInfoFromRaw(raw);
  assert.equal(parsed.isComplete, false);
  assert.ok(parsed.missingFields.includes("frequency_mhz"));
  assert.ok(parsed.missingFields.includes("load_avg_1m"));
  assert.ok(parsed.missingFields.includes("load_avg_5m"));
  assert.ok(parsed.missingFields.includes("load_avg_15m"));
});

test("parser supports proc-loadavg format without label", () => {
  const raw = [
    "model name: Intel i7",
    "siblings: 12",
    "cpu cores: 6",
    "cpu MHz: 1200.50",
    "0.55 0.66 0.77 1/100 1000",
  ].join("\n");
  const parsed = parseCpuInfoFromRaw(raw);
  assert.equal(parsed.cpuInfo.load_avg_1m, 0.55);
  assert.equal(parsed.cpuInfo.load_avg_5m, 0.66);
  assert.equal(parsed.cpuInfo.load_avg_15m, 0.77);
});

test("parser prefers model name over generic model id lines", () => {
  const raw = [
    "processor\t: 0",
    "model\t\t: 116",
    "model name\t: AMD Ryzen 7 PRO 7840U w/ Radeon 780M Graphics",
    "siblings\t: 16",
    "cpu cores\t: 8",
    "cpu MHz\t\t: 2300.0",
    "load average: 0.10 0.20 0.30",
  ].join("\n");
  const parsed = parseCpuInfoFromRaw(raw);
  assert.equal(parsed.cpuInfo.model, "AMD Ryzen 7 PRO 7840U w/ Radeon 780M Graphics");
  assert.equal(parsed.cpuInfo.cpu_line, "model name\t: AMD Ryzen 7 PRO 7840U w/ Radeon 780M Graphics");
});
