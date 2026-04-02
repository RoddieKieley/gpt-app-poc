import assert from "node:assert/strict";
import test from "node:test";
import { normalizeActionButtonVariant } from "../../../src/mcp-app/ui/adapter-contract";
import { resolveAdapterMode } from "../../../src/mcp-app/ui/adapter-mode";

test("B2 action adapter normalizes button variants to safe values", () => {
  assert.equal(normalizeActionButtonVariant(), "primary");
  assert.equal(normalizeActionButtonVariant("primary"), "primary");
  assert.equal(normalizeActionButtonVariant("secondary"), "secondary");
  assert.equal(normalizeActionButtonVariant("link"), "link");
});

test("B2 action adapter resolves explicit fallback mode", () => {
  assert.equal(resolveAdapterMode("buttons", "patternfly"), "patternfly");
});

test("B2 action adapter defaults to RHDS mode for low-coupling buttons", () => {
  assert.equal(resolveAdapterMode("buttons"), "rhds");
});
