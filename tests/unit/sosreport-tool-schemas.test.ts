import test from "node:test";
import assert from "node:assert/strict";
import { fetchSosreportSchema, generateSosreportSchema } from "../../src/sosreport/sosreport-tool-schemas.js";

test("generate schema accepts valid options", () => {
  const parsed = generateSosreportSchema.parse({
    only_plugins: ["networking", "kernel-1"],
    log_size: "25m",
    redaction: true,
  });
  assert.deepEqual(parsed.only_plugins, ["networking", "kernel-1"]);
  assert.equal(parsed.log_size, "25m");
  assert.equal(parsed.redaction, true);
});

test("generate schema rejects only_plugins conflicts", () => {
  const result = generateSosreportSchema.safeParse({
    only_plugins: ["networking"],
    enable_plugins: ["logs"],
  });
  assert.equal(result.success, false);
});

test("generate schema rejects invalid plugin name", () => {
  const result = generateSosreportSchema.safeParse({
    enable_plugins: ["net*work"],
  });
  assert.equal(result.success, false);
});

test("generate schema rejects invalid log_size", () => {
  const result = generateSosreportSchema.safeParse({
    log_size: "20mb",
  });
  assert.equal(result.success, false);
});

test("fetch schema requires fetch_reference", () => {
  const result = fetchSosreportSchema.safeParse({});
  assert.equal(result.success, false);
});
