import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";

test("mcp-app source uses four-step hash routing and troubleshooting gate", async () => {
  const source = await fs.readFile("src/mcp-app.ts", "utf8");

  assert.ok(source.includes('window.location.hash = "step-1"'));
  assert.ok(source.includes('window.location.hash = "step-2"'));
  assert.ok(source.includes('window.location.hash = "step-3"'));
  assert.ok(source.includes('window.location.hash = "step-4"'));

  assert.ok(source.includes('if (hash === "step-2")'));
  assert.ok(source.includes('navigateToStep("troubleshooting")'));
  assert.ok(source.includes('if (hash === "step-3")'));
  assert.ok(source.includes('if (hash === "step-4")'));
  assert.ok(source.includes("canEnterTroubleshootingStep"));
  assert.ok(source.includes("step_gate_troubleshooting"));
});

test("progress adapter exposes troubleshooting as step 2", async () => {
  const source = await fs.readFile("src/mcp-app/ui/progress-affordance-adapter.tsx", "utf8");
  assert.ok(source.includes("Step 2: Troubleshooting"));
  assert.ok(source.includes("Step 3: Generate + Fetch sos"));
  assert.ok(source.includes("Step 4: Connect + Verify + Attach"));
});

test("step content includes static troubleshooting CPU table and next handoff", async () => {
  const source = await fs.readFile("src/mcp-app/step-content.tsx", "utf8");
  assert.ok(source.includes("TROUBLESHOOTING_CPU_ROW"));
  assert.ok(source.includes('aria-label="CPU information snapshot"'));
  assert.ok(source.includes("Next: Step 3"));
});
