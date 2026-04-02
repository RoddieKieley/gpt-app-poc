import assert from "node:assert/strict";
import test from "node:test";
import { mapStatusVariantToken } from "../../../src/mcp-app/ui/adapter-contract";
import { resolveAdapterMode } from "../../../src/mcp-app/ui/adapter-mode";

test("B1 status adapter preserves status variant token mapping", () => {
  assert.equal(mapStatusVariantToken("info"), "info");
  assert.equal(mapStatusVariantToken("success"), "success");
  assert.equal(mapStatusVariantToken("warning"), "warning");
  assert.equal(mapStatusVariantToken("danger"), "danger");
});

test("B1 status adapter resolves explicit fallback mode", () => {
  assert.equal(resolveAdapterMode("status", "patternfly"), "patternfly");
});

test("B1 status adapter defaults to RHDS mode for incremental migration", () => {
  assert.equal(resolveAdapterMode("status"), "rhds");
});
