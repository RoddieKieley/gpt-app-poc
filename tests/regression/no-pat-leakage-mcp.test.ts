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

test("engage workflow contract forbids PAT fields beyond secure intake", async () => {
  const file = path.join(
    process.cwd(),
    "specs",
    "007-engage-red-hat-support",
    "contracts",
    "engage-workflow-contract.json",
  );
  const raw = await fs.readFile(file, "utf8");
  const data = JSON.parse(raw) as {
    sequence: Array<{ requiredInputs?: string[]; requiredOperations?: string[] }>;
    securityBoundary: { forbiddenFields: string[]; secretInputsAllowedInMcpTools: boolean };
  };

  assert.equal(data.securityBoundary.secretInputsAllowedInMcpTools, false);
  assert.ok(data.securityBoundary.forbiddenFields.includes("pat"));
  assert.ok(data.securityBoundary.forbiddenFields.includes("token"));

  for (const step of data.sequence) {
    const keys = step.requiredInputs ?? [];
    assert.equal(keys.includes("pat"), false);
    assert.equal(keys.includes("token"), false);
    const operations = step.requiredOperations ?? [];
    assert.equal(operations.some((value) => value.toLowerCase().includes("pat")), false);
    assert.equal(operations.some((value) => value.toLowerCase().includes("token")), false);
  }
});

test("pat secrecy validation contract enforces no secret leakage surfaces", async () => {
  const file = path.join(
    process.cwd(),
    "specs",
    "010-engage-support-workflow",
    "contracts",
    "pat-secrecy-validation.v2.json",
  );
  const raw = await fs.readFile(file, "utf8");
  const data = JSON.parse(raw) as {
    boundary: { secretInputsAllowedOnlyAt: string[]; forbiddenSecretFields: string[] };
    mustNotAppearIn: string[];
    validationMatrix: Array<{ assertions?: string[] }>;
  };
  assert.deepEqual(data.boundary.secretInputsAllowedOnlyAt, ["POST /api/jira/connections"]);
  assert.ok(data.boundary.forbiddenSecretFields.includes("pat"));
  assert.ok(data.mustNotAppearIn.includes("mcp_tool_arguments"));
  assert.ok(data.mustNotAppearIn.includes("mcp_tool_results"));
  const assertions = data.validationMatrix.flatMap((entry) => entry.assertions ?? []);
  assert.ok(assertions.some((entry) => entry.includes("jira_list_attachments")));
  assert.ok(assertions.some((entry) => entry.includes("do not echo PAT")));
});

