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

test("troubleshooting CPU telemetry resource supports subscribe/read updates and rolling cap", async () => {
  const { srv, base } = await startConsentTestServer("cpu-telemetry-subscribe");
  try {
    const client = createMcpJsonRpcClient(base, "default-user");
    await client.initialize();

    const started = await client.call("tools/call", {
      name: "start_engage_red_hat_support",
      arguments: {},
    }) as { structuredContent?: { workflow_session_id?: string } };
    const workflowSessionId = String(started.structuredContent?.workflow_session_id ?? "");
    assert.ok(workflowSessionId.length > 0, "workflow_session_id should be present");

    await client.call("tools/call", {
      name: "select_engage_product",
      arguments: { product: "linux" },
    });

    const uri = `resource://engage/troubleshooting/cpu/${workflowSessionId}`;
    await client.call("resources/subscribe", { uri });

    let observedMaxRows = 0;
    let sawIncrement = false;
    let previousSampleCount = -1;
    let validatedFieldTypes = false;
    for (let attempt = 0; attempt < 55; attempt += 1) {
      const read = await client.call("resources/read", { uri }) as {
        contents?: Array<{ text?: string }>;
      };
      const body = JSON.parse(String(read.contents?.[0]?.text ?? "{}")) as {
        sample_count?: number;
        samples?: Array<Record<string, unknown>>;
      };
      const sampleCount = Number(body.sample_count ?? 0);
      const samples = Array.isArray(body.samples) ? body.samples : [];
      observedMaxRows = Math.max(observedMaxRows, samples.length);
      if (previousSampleCount >= 0 && sampleCount > previousSampleCount) {
        sawIncrement = true;
      }
      previousSampleCount = sampleCount;
      if (samples.length > 0 && !validatedFieldTypes) {
        const row = samples[samples.length - 1] ?? {};
        assert.equal(typeof row.sampled_at, "string");
        assert.equal(typeof row.model, "string");
        assert.equal(typeof row.logical_cores, "number");
        assert.equal(typeof row.physical_cores, "number");
        assert.equal(typeof row.frequency_mhz, "number");
        assert.equal(typeof row.load_avg_1m, "number");
        assert.equal(typeof row.load_avg_5m, "number");
        assert.equal(typeof row.load_avg_15m, "number");
        assert.equal(typeof row.cpu_line, "string");
        validatedFieldTypes = true;
      }
      if (samples.length === 5 && attempt >= 10) {
        break;
      }
      await sleep(500);
    }

    assert.equal(sawIncrement, true, "sample_count should increment after subscribe");
    assert.equal(validatedFieldTypes, true, "telemetry row fields should match CPU shape");
    assert.equal(observedMaxRows <= 5, true, "telemetry samples must be capped at 5 rows");

    await client.call("resources/unsubscribe", { uri });
  } finally {
    srv.close();
  }
});

