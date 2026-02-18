import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";

type JsonRpcResponse =
  | { jsonrpc: "2.0"; id: number; result: unknown }
  | { jsonrpc: "2.0"; id: number; error: { code: number; message: string } };

const ENGAGE_UI_URI = "ui://engage-red-hat-support/app.html";
const ENGAGE_SKILL_URI = "skill://engage-red-hat-support/SKILL.md";

test("engage resources are discoverable with required metadata", async () => {
  process.env.NODE_ENV = "test";
  const { createApp } = await import("../../server.js");
  const app = createApp();
  const srv = app.listen(0);
  const port = (srv.address() as { port: number }).port;
  const mcpUrl = `http://127.0.0.1:${port}/mcp`;
  let sessionId: string | undefined;
  let id = 1;

  const jsonRpc = async (method: string, params?: unknown) => {
    const response = await fetch(mcpUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
        ...(sessionId ? { "mcp-session-id": sessionId } : {}),
      },
      body: JSON.stringify({ jsonrpc: "2.0", id: id++, method, params }),
    });
    assert.equal(response.ok, true);
    if (!sessionId) {
      sessionId = response.headers.get("mcp-session-id") ?? undefined;
    }
    const payload = (await response.json()) as JsonRpcResponse;
    if ("error" in payload) {
      throw new Error(payload.error.message);
    }
    return payload.result;
  };

  try {
    await jsonRpc("initialize", {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "engage-contract", version: "1.0.0" },
    });
    await fetch(mcpUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
        ...(sessionId ? { "mcp-session-id": sessionId } : {}),
      },
      body: JSON.stringify({ jsonrpc: "2.0", method: "initialized" }),
    });

    const resources = (await jsonRpc("resources/list")) as {
      resources?: Array<{ uri?: string }>;
    };
    const uris = new Set((resources.resources ?? []).map((entry) => entry.uri));
    assert.ok(uris.has(ENGAGE_UI_URI), "missing engage ui resource");
    assert.ok(uris.has(ENGAGE_SKILL_URI), "missing engage skill resource");

    const uiRead = (await jsonRpc("resources/read", { uri: ENGAGE_UI_URI })) as {
      contents?: Array<{ mimeType?: string; _meta?: Record<string, unknown>; text?: string }>;
    };
    assert.equal(uiRead.contents?.[0]?.mimeType, "text/html;profile=mcp-app");
    assert.equal(
      uiRead.contents?.[0]?._meta?.["openai/widgetDomain"],
      "https://leisured-carina-unpromotable.ngrok-free.dev",
    );
    assert.ok(uiRead.contents?.[0]?._meta?.["openai/widgetCSP"]);

    const skillRead = (await jsonRpc("resources/read", { uri: ENGAGE_SKILL_URI })) as {
      contents?: Array<{ mimeType?: string; text?: string }>;
    };
    assert.equal(skillRead.contents?.[0]?.mimeType, "text/markdown");
    assert.ok(
      (skillRead.contents?.[0]?.text ?? "").includes("Engage Red Hat Support"),
      "engage skill markdown content mismatch",
    );

    const listedSkills = (await jsonRpc("tools/call", {
      name: "list_skills",
      arguments: {},
    })) as { content?: Array<{ type?: string; text?: string }> };
    const skillText = listedSkills.content?.find((entry) => entry.type === "text")?.text ?? "";
    assert.ok(skillText.includes(ENGAGE_SKILL_URI), "list_skills missing engage skill");

    const listedTools = (await jsonRpc("tools/list")) as {
      tools?: Array<{
        name?: string;
        annotations?: { readOnlyHint?: boolean; openWorldHint?: boolean; destructiveHint?: boolean };
      }>;
    };
    const getSkillTool = listedTools.tools?.find((tool) => tool.name === "get_skill");
    assert.ok(getSkillTool, "get_skill missing from tools/list");
    assert.equal(getSkillTool?.annotations?.readOnlyHint, true);
    assert.equal(getSkillTool?.annotations?.openWorldHint, false);
    assert.equal(getSkillTool?.annotations?.destructiveHint, false);

    const getSkillResult = (await jsonRpc("tools/call", {
      name: "get_skill",
      arguments: { uri: ENGAGE_SKILL_URI },
    })) as {
      content?: Array<{ type?: string; text?: string }>;
      structuredContent?: { uri?: string; mimeType?: string; text?: string };
      isError?: boolean;
    };
    assert.equal(getSkillResult.isError, undefined);
    const getSkillText = getSkillResult.content?.find((entry) => entry.type === "text")?.text ?? "";
    assert.ok(getSkillText.includes("URI: skill://engage-red-hat-support/SKILL.md"));
    assert.ok(getSkillText.includes("Engage Red Hat Support"));
    assert.equal(getSkillResult.structuredContent?.uri, ENGAGE_SKILL_URI);
    assert.equal(getSkillResult.structuredContent?.mimeType, "text/markdown");
    assert.equal(
      getSkillResult.structuredContent?.text ?? "",
      skillRead.contents?.[0]?.text ?? "",
      "get_skill markdown must match resources/read markdown",
    );

    const getSkillInvalid = (await jsonRpc("tools/call", {
      name: "get_skill",
      arguments: { uri: "invalid://uri" },
    })) as {
      isError?: boolean;
      content?: Array<{ type?: string; text?: string }>;
    };
    assert.equal(getSkillInvalid.isError, true);
    const invalidText = getSkillInvalid.content?.find((entry) => entry.type === "text")?.text ?? "";
    assert.ok(invalidText.includes("Provide a non-empty skill URI"));

    const getSkillUnsupported = (await jsonRpc("tools/call", {
      name: "get_skill",
      arguments: { uri: "skill://unknown/SKILL.md" },
    })) as {
      isError?: boolean;
      content?: Array<{ type?: string; text?: string }>;
    };
    assert.equal(getSkillUnsupported.isError, true);
    const unsupportedText = getSkillUnsupported.content?.find((entry) => entry.type === "text")?.text ?? "";
    assert.ok(unsupportedText.includes("Use list_skills to discover supported URIs"));
  } finally {
    srv.close();
  }
});

test("engage workflow contract enforces opaque connection_id and no PAT fields", async () => {
  const file = path.join(
    process.cwd(),
    "specs",
    "007-engage-red-hat-support",
    "contracts",
    "engage-workflow-contract.json",
  );
  const raw = await fs.readFile(file, "utf8");
  const contract = JSON.parse(raw) as {
    sequence: Array<{ step: number; name: string; requiredInputs?: string[] }>;
    securityBoundary: { forbiddenFields: string[]; opaqueReference: string };
  };

  assert.deepEqual(
    contract.sequence.map((step) => step.name),
    ["verify_connection", "generate_diagnostics", "fetch_diagnostics", "attach_to_jira_issue"],
  );
  assert.equal(contract.securityBoundary.opaqueReference, "connection_id");
  assert.ok(contract.securityBoundary.forbiddenFields.includes("pat"));

  for (const step of contract.sequence) {
    const keys = step.requiredInputs ?? [];
    assert.equal(keys.includes("pat"), false, `pat is forbidden in ${step.name}`);
    assert.equal(keys.includes("token"), false, `token is forbidden in ${step.name}`);
  }
});
