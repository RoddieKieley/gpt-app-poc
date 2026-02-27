import { App } from "@modelcontextprotocol/ext-apps";

const statusEl = document.getElementById("status");
const step1Section = document.getElementById("step-select-product");
const step2Section = document.getElementById("step-sos-report");
const step3Section = document.getElementById("step-jira-attach");
const navStep1Btn = document.getElementById("nav-step-1");
const navStep2Btn = document.getElementById("nav-step-2");
const navStep3Btn = document.getElementById("nav-step-3");
const step1ContinueBtn = document.getElementById("step-1-continue-btn");
const step2ContinueBtn = document.getElementById("step-2-continue-btn");
const connectBtn = document.getElementById("connect-btn");
const verifyBtn = document.getElementById("verify-btn");
const statusBtn = document.getElementById("status-btn");
const generateBtn = document.getElementById("generate-btn");
const fetchBtn = document.getElementById("fetch-btn") as HTMLButtonElement | null;
const listBtn = document.getElementById("list-btn");
const attachBtn = document.getElementById("attach-btn");
const disconnectBtn = document.getElementById("disconnect-btn");
const productSelectEl = document.getElementById("product-select") as HTMLSelectElement | null;
const jiraUrlEl = document.getElementById("jira-url") as HTMLInputElement | null;
const jiraPatEl = document.getElementById("jira-pat") as HTMLInputElement | null;
const connectionIdEl = document.getElementById("connection-id") as HTMLInputElement | null;
const issueKeyEl = document.getElementById("issue-key") as HTMLInputElement | null;
const fetchReferenceEl = document.getElementById("fetch-reference") as HTMLInputElement | null;
const artifactRefEl = document.getElementById("artifact-ref") as HTMLInputElement | null;
const widgetBuildId = document
  .querySelector('meta[name="gpt-app-build-id"]')
  ?.getAttribute("content")
  ?.trim();

if (
  !statusEl || !step1Section || !step2Section || !step3Section ||
  !navStep1Btn || !navStep2Btn || !navStep3Btn || !step1ContinueBtn || !step2ContinueBtn ||
  !connectBtn || !verifyBtn || !statusBtn || !generateBtn || !fetchBtn ||
  !listBtn || !attachBtn || !disconnectBtn || !productSelectEl ||
  !jiraUrlEl || !jiraPatEl || !connectionIdEl || !issueKeyEl || !fetchReferenceEl || !artifactRefEl
) {
  throw new Error("Missing required UI elements.");
}

type ToolTextContent = { type: string; text?: string };
type ToolResult = {
  isError?: boolean;
  content?: ToolTextContent[];
  structuredContent?: Record<string, unknown>;
};

type CallToolOptions = {
  redactErrorDetails?: boolean;
  suppressStatusUpdate?: boolean;
};

type ConnectResponse = {
  connection_id?: string;
  status?: string;
  text?: string;
};

type VerifyResponse = {
  connection_id?: string;
  status?: string;
  text?: string;
};

type WorkflowStep = "select_product" | "sos_report" | "jira_attach" | "completed" | "failed";
type WorkflowState = {
  current_step: WorkflowStep;
  selected_product?: string;
  fetch_reference?: string;
  artifact_ref?: string;
  connection_id?: string;
  issue_key?: string;
  issue_access_verified: boolean;
  last_error_code?: string;
};

const workflowState: WorkflowState = {
  current_step: "select_product",
  issue_access_verified: false,
};
const consentSessionId = `ui-${crypto.randomUUID()}`;
let workflowSessionId: string | null = null;

const app = new App({ name: "MCP Apps Support Workflows", version: "1.0.0" });

type WindowWithApiBase = Window & typeof globalThis & { __GPT_APP_API_BASE_URL__?: string };
const configuredApiBase = (window as WindowWithApiBase).__GPT_APP_API_BASE_URL__;
const metaApiBase = document
  .querySelector('meta[name="gpt-app-api-base"]')
  ?.getAttribute("content");
const DEFAULT_API_BASE_URL = "https://leisured-carina-unpromotable.ngrok-free.dev";
const selectedApiBase = [configuredApiBase, metaApiBase, DEFAULT_API_BASE_URL]
  .find((value) => typeof value === "string" && value.trim().length > 0);
const apiBaseUrl = typeof selectedApiBase === "string" ? selectedApiBase.trim().replace(/\/$/, "") : "";
const apiUrl = (path: string): string => (apiBaseUrl ? `${apiBaseUrl}${path}` : path);

try {
  app.connect();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  statusEl.textContent = `Widget connection failed: ${message}`;
}

const hydrateWorkflowFromToolResult = (result: ToolResult): void => {
  const structured = result.structuredContent ?? {};
  const fetchReference = String(structured.fetch_reference ?? "").trim();
  if (fetchReference) {
    fetchReferenceEl.value = fetchReference;
    workflowState.fetch_reference = fetchReference;
    workflowState.current_step = "sos_report";
  }

  const archivePath = String(structured.archive_path ?? "").trim();
  if (archivePath) {
    artifactRefEl.value = archivePath;
    workflowState.artifact_ref = archivePath;
    workflowState.current_step = "sos_report";
  }

  syncFetchButtonState();
};

app.ontoolresult = (result) => {
  hydrateWorkflowFromToolResult(result as ToolResult);
  const text = result.content?.find((item) => item.type === "text")?.text;
  statusEl.textContent = text ?? "Tool executed.";
};

const setStatus = (message: string) => {
  statusEl.textContent = message;
};

function syncFetchButtonState(): void {
  fetchBtn.disabled = fetchReferenceEl.value.trim().length === 0;
}

const setStepVisible = (step: WorkflowStep) => {
  step1Section.hidden = step !== "select_product";
  step2Section.hidden = step !== "sos_report";
  step3Section.hidden = step !== "jira_attach";
};

const setCurrentStep = (step: WorkflowStep) => {
  workflowState.current_step = step;
  if (step === "select_product") {
    window.location.hash = "step-1";
  } else if (step === "sos_report") {
    window.location.hash = "step-2";
  } else if (step === "jira_attach") {
    window.location.hash = "step-3";
  }
  setStepVisible(step);
};

if (widgetBuildId) {
  setStatus(`Widget loaded (${widgetBuildId}).`);
}

const ensureLinuxSelection = (): boolean => {
  const selected = productSelectEl.value.trim().toLowerCase();
  if (selected !== "linux") {
    workflowState.last_error_code = "unsupported_product";
    setStatus("Only Red Hat Enterprise Linux is currently supported for Engage Red Hat Support.");
    return false;
  }
  workflowState.selected_product = selected;
  return true;
};

const canEnterSosStep = (): boolean => workflowState.selected_product === "linux";
const canEnterJiraStep = (): boolean =>
  Boolean(workflowState.artifact_ref && workflowState.artifact_ref.trim().length > 0);

const navigateToStep = (step: WorkflowStep): boolean => {
  if (step === "sos_report" && !canEnterSosStep()) {
    setStatus("Complete step 1 with linux selection before step 2.");
    workflowState.last_error_code = "step_gate_select_product";
    return false;
  }
  if (step === "jira_attach" && !canEnterJiraStep()) {
    setStatus("Complete step 2 (generate + fetch) before step 3.");
    workflowState.last_error_code = "step_gate_sos_report";
    return false;
  }
  setCurrentStep(step);
  return true;
};

const getConnectionId = (): string => connectionIdEl.value.trim();
const getIssueKey = (): string => issueKeyEl.value.trim();
const getFetchReference = (): string => fetchReferenceEl.value.trim();

fetchReferenceEl.addEventListener("input", () => {
  const value = fetchReferenceEl.value.trim();
  workflowState.fetch_reference = value || undefined;
  syncFetchButtonState();
});

const callTool = async (
  name: string,
  args: Record<string, unknown>,
  options: CallToolOptions = {},
): Promise<ToolResult> => {
  try {
    const result = (await app.callServerTool({
      name,
      arguments: args,
    })) as ToolResult;
    hydrateWorkflowFromToolResult(result);
    const text = result.content?.find((item) => item.type === "text")?.text;
    if (!options.suppressStatusUpdate) {
      setStatus(text ?? "Operation completed.");
    }
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (options.redactErrorDetails) {
      const generic = "Connection failed. Verify URL and credentials.";
      setStatus(generic);
      return { isError: true, content: [{ type: "text", text: generic }] };
    }
    setStatus(`Operation failed: ${message}`);
    return { isError: true, content: [{ type: "text", text: message }] };
  }
};

const verifyConnectionViaTool = async (connectionId: string): Promise<VerifyResponse | null> => {
  const result = await callTool("jira_connection_status", { connection_id: connectionId });
  if (result.isError) {
    return null;
  }
  const structured = result.structuredContent ?? {};
  const status = String(structured.status ?? "");
  const parsed: VerifyResponse = {
    connection_id: String(structured.connection_id ?? connectionId),
    status,
    text: result.content?.find((item) => item.type === "text")?.text,
  };
  if (!status) {
    setStatus(parsed.text ?? "Connection verification failed.");
    return null;
  }
  if (status === "expired" || status === "revoked") {
    setStatus(`Connection is ${status}. Reconnect before continuing.`);
    return parsed;
  }
  setStatus(parsed.text ?? `Connection is ${status}.`);
  return parsed;
};

const connectJira = async (): Promise<ConnectResponse | null> => {
  if (!ensureLinuxSelection()) return null;
  const jiraBaseUrl = jiraUrlEl.value.trim();
  const pat = jiraPatEl.value;
  if (!jiraBaseUrl || !pat) {
    workflowState.last_error_code = "missing_jira_connect_inputs";
    setStatus("Jira URL and PAT are required.");
    return null;
  }
  const result = await callTool("jira_connect_secure", {
    jira_base_url: jiraBaseUrl,
    pat,
  }, { redactErrorDetails: true });
  if (result.isError) {
    workflowState.last_error_code = "jira_connect_failed";
    return null;
  }
  const body = (result.structuredContent ?? {}) as ConnectResponse;
  if (body.connection_id) {
    connectionIdEl.value = body.connection_id;
    workflowState.connection_id = body.connection_id;
  }
  if (body.status) {
    setStatus(`Connected. Current lifecycle status: ${body.status}.`);
  } else {
    setStatus(body.text ?? "Connected.");
  }
  // Preserve PAT security boundary: never keep PAT in local UI state after intake.
  jiraPatEl.value = "";
  return body;
};

const verifyConnection = async (): Promise<VerifyResponse | null> => {
  const connectionId = getConnectionId();
  if (!connectionId) {
    workflowState.last_error_code = "missing_connection_id";
    setStatus("connection_id is required.");
    return null;
  }
  try {
    const response = await fetch(apiUrl(`/api/jira/connections/${encodeURIComponent(connectionId)}`));
    const body = await response.json() as VerifyResponse;
    if (!response.ok) {
      const fallback = await verifyConnectionViaTool(connectionId);
      if (fallback) return fallback;
      setStatus(body.text ?? "Connection verification failed.");
      workflowState.last_error_code = "connection_verification_failed";
      return null;
    }
    const status = String(body.status ?? "");
    if (status === "expired" || status === "revoked") {
      setStatus(`Connection is ${status}. Reconnect before continuing.`);
      workflowState.last_error_code = `connection_${status}`;
      return body;
    }
    workflowState.connection_id = connectionId;
    setStatus(body.text ?? `Connection is ${status || "connected"}.`);
    return body;
  } catch (error) {
    const fallback = await verifyConnectionViaTool(connectionId);
    if (fallback) return fallback;
    const message = error instanceof Error ? error.message : String(error);
    setStatus(`Connection verification request failed (${message}).`);
    workflowState.last_error_code = "connection_verify_request_failed";
    return null;
  }
};

const verifyIssueReadAccess = async (): Promise<boolean> => {
  const connectionId = getConnectionId();
  const issueKey = getIssueKey();
  if (!connectionId || !issueKey) {
    workflowState.issue_access_verified = false;
    workflowState.last_error_code = "missing_issue_verification_inputs";
    setStatus("connection_id and issue key are required before issue access verification.");
    return false;
  }
  const listed = await callTool("jira_list_attachments", {
    connection_id: connectionId,
    issue_key: issueKey,
  });
  if (listed.isError) {
    workflowState.issue_access_verified = false;
    workflowState.last_error_code = "issue_access_denied";
    setStatus("Issue read verification failed. Resolve access before attach.");
    return false;
  }
  workflowState.issue_access_verified = true;
  workflowState.issue_key = issueKey;
  setStatus("Issue access verified. You can attach artifact.");
  return true;
};

const mintGenerateConsentToken = async (): Promise<string | null> => {
  try {
    const response = await fetch(apiUrl("/api/engage/consent-tokens"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-session-id": consentSessionId,
      },
      body: JSON.stringify({
        workflow: "engage_red_hat_support",
        step: 2,
        requested_scope: "generate_sosreport",
        session_id: consentSessionId,
        workflow_session_id: workflowSessionId ?? undefined,
        client_action_id: `step2-generate-${Date.now()}`,
      }),
    });
    const body = await response.json() as { consent_token?: string; text?: string };
    if (!response.ok || !body.consent_token) {
      setStatus(body.text ?? "Consent mint failed. Retry Step 2 Generate.");
      return null;
    }
    return body.consent_token;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    setStatus(`Consent mint request failed (${message}).`);
    return null;
  }
};

const startWorkflowSession = async (): Promise<boolean> => {
  try {
    const response = await fetch(apiUrl("/api/engage/workflow/start"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-session-id": consentSessionId,
      },
      body: JSON.stringify({ session_id: consentSessionId }),
    });
    const body = await response.json() as { workflow_session_id?: string; text?: string };
    if (!response.ok || !body.workflow_session_id) {
      setStatus(body.text ?? "Unable to start workflow session.");
      return false;
    }
    workflowSessionId = body.workflow_session_id;
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    setStatus(`Workflow start failed (${message}).`);
    return false;
  }
};

const submitProductSelection = async (): Promise<boolean> => {
  try {
    const response = await fetch(apiUrl("/api/engage/workflow/select-product"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-session-id": consentSessionId,
      },
      body: JSON.stringify({
        session_id: consentSessionId,
        workflow_session_id: workflowSessionId ?? undefined,
        product: "linux",
      }),
    });
    const body = await response.json() as { text?: string };
    if (!response.ok) {
      setStatus(body.text ?? "Step 1 product selection failed.");
      return false;
    }
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    setStatus(`Step 1 product submission failed (${message}).`);
    return false;
  }
};

type GenerateJobResponse = {
  status?: string;
  fetch_reference?: string;
  text?: string;
  error_code?: string;
};

const pollGenerateJobUntilTerminal = async (jobId: string): Promise<GenerateJobResponse | null> => {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    const result = await callTool(
      "get_generate_sosreport_status",
      { job_id: jobId },
      { suppressStatusUpdate: true },
    );
    if (!result.isError) {
      const body = (result.structuredContent ?? {}) as GenerateJobResponse;
      const status = String(body.status ?? "").trim();
      if (status === "succeeded" || status === "failed") {
        return body;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  return null;
};

connectBtn.addEventListener("click", async () => {
  await connectJira();
});

verifyBtn.addEventListener("click", async () => {
  await verifyConnection();
});

statusBtn.addEventListener("click", async () => {
  const connectionId = getConnectionId();
  if (!connectionId) {
    setStatus("connection_id is required.");
    return;
  }
  await callTool("jira_connection_status", { connection_id: connectionId });
});

generateBtn.addEventListener("click", async () => {
  if (!navigateToStep("sos_report")) return;
  if (!ensureLinuxSelection()) return;
  // Prevent stale fetch actions while a new generate is in-flight.
  fetchReferenceEl.value = "";
  workflowState.fetch_reference = undefined;
  syncFetchButtonState();
  // Diagnostic collection must only occur on explicit user action in Step 2.
  const consentToken = await mintGenerateConsentToken();
  if (!consentToken) {
    workflowState.last_error_code = "consent_mint_failed";
    workflowState.current_step = "failed";
    return;
  }
  const generated = await callTool("generate_sosreport", {
    consent_token: consentToken,
    workflow_session_id: workflowSessionId ?? undefined,
  });
  const fetchReference = String(generated.structuredContent?.fetch_reference ?? "").trim();
  const generateJobId = String(generated.structuredContent?.job_id ?? "").trim();
  if (generated.isError) {
    const reason =
      generated.content?.find((item) => item.type === "text")?.text
      ?? "Fix the error and retry generate.";
    workflowState.last_error_code = "generate_failed";
    workflowState.current_step = "failed";
    setStatus(`Generate step failed. ${reason}`);
    return;
  }
  if (fetchReference) {
    fetchReferenceEl.value = fetchReference;
    workflowState.fetch_reference = fetchReference;
    syncFetchButtonState();
    workflowState.current_step = "sos_report";
    setStatus("Generate succeeded. Proceed to fetch_sosreport.");
    return;
  }
  if (!generateJobId) {
    setStatus("Generate accepted. Waiting for completion status...");
    return;
  }

  setStatus("Generate started. Waiting for completion status...");
  const finalState = await pollGenerateJobUntilTerminal(generateJobId);
  if (!finalState) {
    setStatus("Generate is still running. Keep this page open and retry in a few seconds.");
    return;
  }
  if (String(finalState.status ?? "") === "failed") {
    workflowState.last_error_code = String(finalState.error_code ?? "generate_failed");
    workflowState.current_step = "failed";
    setStatus(finalState.text ?? "Generate failed. Retry Step 2 Generate.");
    return;
  }
  const polledFetchReference = String(finalState.fetch_reference ?? "").trim();
  if (!polledFetchReference) {
    workflowState.last_error_code = "missing_fetch_reference_after_generate";
    setStatus("Generate completed but no fetch reference was returned. Retry generate.");
    return;
  }
  fetchReferenceEl.value = polledFetchReference;
  workflowState.fetch_reference = polledFetchReference;
  syncFetchButtonState();
  setStatus("Generate completed. Fetch is now enabled.");
});

fetchBtn.addEventListener("click", async () => {
  if (!navigateToStep("sos_report")) return;
  if (!ensureLinuxSelection()) return;
  const fetchReference = getFetchReference();
  if (!fetchReference) {
    workflowState.last_error_code = "missing_fetch_reference";
    setStatus("fetch_reference is required before fetch.");
    return;
  }
  const fetched = await callTool("fetch_sosreport", { fetch_reference: fetchReference });
  const archivePath = String(fetched.structuredContent?.archive_path ?? "");
  if (fetched.isError || !archivePath) {
    workflowState.last_error_code = "fetch_failed";
    workflowState.current_step = "failed";
    setStatus("Fetch step failed. Fix the error and retry fetch.");
    return;
  }
  artifactRefEl.value = archivePath;
  workflowState.artifact_ref = archivePath;
  workflowState.current_step = "sos_report";
  setStatus("Fetch succeeded. Use the returned archive_path for attach.");
});

listBtn.addEventListener("click", async () => {
  await verifyIssueReadAccess();
});

attachBtn.addEventListener("click", async () => {
  if (!navigateToStep("jira_attach")) return;
  const connectionId = getConnectionId();
  const issueKey = getIssueKey();
  const artifactRef = artifactRefEl.value.trim();
  if (!connectionId || !issueKey || !artifactRef) {
    workflowState.last_error_code = "missing_attach_inputs";
    setStatus("connection_id, issue key, and artifact path are required.");
    return;
  }
  const verified = await verifyConnection();
  if (!verified || verified.status !== "connected") {
    workflowState.last_error_code = "connection_not_verified_for_attach";
    setStatus("Attach blocked: verify an active connection before attaching.");
    return;
  }
  const issueAccessOk = await verifyIssueReadAccess();
  if (!issueAccessOk) {
    workflowState.last_error_code = "issue_access_not_verified";
    setStatus("Attach blocked: verify issue read access before attaching.");
    return;
  }
  const result = await callTool("jira_attach_artifact", {
    connection_id: connectionId,
    issue_key: issueKey,
    artifact_ref: artifactRef,
  });
  if (result.isError) {
    workflowState.last_error_code = "attach_failed";
    workflowState.current_step = "failed";
    setStatus("Attach step failed. Verify issue key, connection status, and artifact path.");
    return;
  }
  workflowState.current_step = "completed";
  setStatus("Attach succeeded. Workflow completed.");
});

disconnectBtn.addEventListener("click", async () => {
  const connectionId = getConnectionId();
  if (!connectionId) {
    setStatus("connection_id is required.");
    return;
  }
  await callTool("jira_disconnect", { connection_id: connectionId });
});

navStep1Btn.addEventListener("click", () => {
  navigateToStep("select_product");
});

navStep2Btn.addEventListener("click", () => {
  navigateToStep("sos_report");
});

navStep3Btn.addEventListener("click", () => {
  navigateToStep("jira_attach");
});

step1ContinueBtn.addEventListener("click", async () => {
  if (!ensureLinuxSelection()) return;
  if (!workflowSessionId) {
    const started = await startWorkflowSession();
    if (!started) {
      workflowState.last_error_code = "workflow_start_failed";
      return;
    }
  }
  const submitted = await submitProductSelection();
  if (!submitted) {
    workflowState.last_error_code = "product_selection_submit_failed";
    return;
  }
  navigateToStep("sos_report");
  setStatus("Step 1 complete. Continue with generate + fetch.");
});

step2ContinueBtn.addEventListener("click", () => {
  if (!workflowState.artifact_ref) {
    setStatus("Complete generate + fetch to continue to step 3.");
    workflowState.last_error_code = "missing_artifact_ref_for_step3";
    return;
  }
  navigateToStep("jira_attach");
  setStatus("Step 2 complete. Continue with connect, verify, and attach.");
});

const bootstrapRoute = () => {
  const hash = window.location.hash.replace("#", "");
  if (hash === "step-2") {
    navigateToStep("sos_report");
  } else if (hash === "step-3") {
    navigateToStep("jira_attach");
  } else {
    navigateToStep("select_product");
  }
};

bootstrapRoute();
syncFetchButtonState();
