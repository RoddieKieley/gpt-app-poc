import test from "node:test";
import assert from "node:assert/strict";
import { createMcpJsonRpcClient, mintConsentToken, startConsentTestServer } from "./consent-test-helpers.js";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

test("generate job state is readable via MCP resource subscribe/read flow", async () => {
  const { srv, base } = await startConsentTestServer("resource-subscribe");
  try {
    const client = createMcpJsonRpcClient(base, "default-user");
    await client.initialize();
    const sessionId = client.getSessionId();

    await client.call("tools/call", {
      name: "start_engage_red_hat_support",
      arguments: {},
    });
    await client.call("tools/call", {
      name: "select_engage_product",
      arguments: { product: "linux" },
    });

    const minted = await mintConsentToken({
      base,
      userId: "default-user",
      sessionId,
    });
    assert.equal(minted.status, 201);
    const consentToken = String(minted.body.consent_token ?? "");
    assert.ok(consentToken.length > 0);

    const generate = await client.call("tools/call", {
      name: "generate_sosreport",
      arguments: { consent_token: consentToken },
    }) as {
      structuredContent?: { job_id?: string };
    };
    const jobId = String(generate.structuredContent?.job_id ?? "");
    assert.ok(jobId.length > 0, "generate_sosreport should return job_id");

    const uri = `resource://engage/sosreport/jobs/${jobId}`;
    await client.call("resources/subscribe", { uri });

    let observedStatus: string | null = null;
    let terminalState: "succeeded" | "failed" | null = null;
    for (let attempt = 0; attempt < 40; attempt += 1) {
      const read = await client.call("resources/read", { uri }) as {
        contents?: Array<{ text?: string }>;
      };
      const body = JSON.parse(String(read.contents?.[0]?.text ?? "{}")) as { status?: string };
      observedStatus = String(body.status ?? "") || observedStatus;
      if (body.status === "succeeded" || body.status === "failed") {
        terminalState = body.status;
        break;
      }
      await sleep(250);
    }
    assert.ok(
      observedStatus === "queued" || observedStatus === "running" || terminalState !== null,
      "resource should expose in-flight or terminal status via resources/read",
    );

    await client.call("resources/unsubscribe", { uri });
  } finally {
    srv.close();
  }
});
