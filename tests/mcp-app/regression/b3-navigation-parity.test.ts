import assert from "node:assert/strict";
import test from "node:test";
import { resolveStepNavigation } from "../../../src/mcp-app/ui/adapter-contract";
import { resolveAdapterMode } from "../../../src/mcp-app/ui/adapter-mode";

test("B3 step navigation resolves existing callbacks without payload changes", () => {
  const calls: number[] = [];
  const onStep1 = () => calls.push(1);
  const onStep2 = () => calls.push(2);
  const onStep3 = () => calls.push(3);

  resolveStepNavigation(1, onStep1, onStep2, onStep3);
  resolveStepNavigation(2, onStep1, onStep2, onStep3);
  resolveStepNavigation(3, onStep1, onStep2, onStep3);

  assert.deepEqual(calls, [1, 2, 3]);
});

test("B3 progress adapter remains PatternFly-first by default", () => {
  assert.equal(resolveAdapterMode("progress"), "patternfly");
});
