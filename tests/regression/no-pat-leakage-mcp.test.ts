import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";

test("MCP tool contracts contain no secret-bearing fields", async () => {
  const file = path.join(
    process.cwd(),
    "specs",
    "004-jira-attachment-pat",
    "contracts",
    "mcp-tools.json",
  );
  const raw = await fs.readFile(file, "utf8");
  const data = JSON.parse(raw) as {
    tools: Array<{ inputSchema?: { properties?: Record<string, unknown> } }>;
    forbiddenFields: string[];
  };
  for (const tool of data.tools) {
    const keys = Object.keys(tool.inputSchema?.properties ?? {});
    assert.equal(keys.includes("pat"), false);
    assert.equal(keys.includes("token"), false);
  }
  assert.ok(data.forbiddenFields.includes("pat"));
});

