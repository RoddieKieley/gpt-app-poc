import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { createMcpJsonRpcClient, startConsentTestServer } from "../integration/consent-test-helpers.js";

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

test("consent deny paths do not echo raw token material", async () => {
  const rawToken = "raw-secret-consent-token-value";
  const { srv, base } = await startConsentTestServer("no-token-echo");
  try {
    const client = createMcpJsonRpcClient(base, "no-token-user");
    await client.initialize();
    const result = (await client.call("tools/call", {
      name: "generate_sosreport",
      arguments: { consent_token: `${rawToken}-tampered` },
    })) as {
      isError?: boolean;
      content?: Array<{ type?: string; text?: string }>;
      structuredContent?: Record<string, unknown>;
    };
    assert.equal(result.isError, true);
    const text = result.content?.find((entry) => entry.type === "text")?.text ?? "";
    assert.equal(text.includes(rawToken), false);
    const serialized = JSON.stringify(result.structuredContent ?? {});
    assert.equal(serialized.includes(rawToken), false);
  } finally {
    srv.close();
  }
});

