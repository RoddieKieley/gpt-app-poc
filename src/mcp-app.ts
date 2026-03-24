import { App } from "@modelcontextprotocol/ext-apps";
import { createElement } from "react";
import { createRoot } from "react-dom/client";
import "@patternfly/react-core/dist/styles/base.css";
import { EngageWorkflowApp } from "./mcp-app/App";
import type { FormState, StatusVariant, UiState, WorkflowState, WorkflowStep } from "./mcp-app/state";

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

const workflowState: WorkflowState = {
  current_step: "select_product",
  issue_access_verified: false,
};
const formState: FormState = {
  product: "linux",
  jiraUrl: "https://redhat.atlassian.net",
  jiraAuthMode: "basic_cloud",
  jiraEmail: "",
  jiraApiToken: "",
  jiraPat: "",
  connectionId: "",
  issueKey: "",
  fetchReference: "",
  artifactRef: "",
};
const uiState: UiState = {
  statusMessage: "Ready.",
  statusVariant: "info",
  isGenerating: false,
};
let render: () => void = () => {};
const consentSessionId = `ui-${crypto.randomUUID()}`;
let workflowSessionId: string | null = null;
const appRoot = document.getElementById("app-root");
if (!appRoot) throw new Error("Missing app root element.");
const reactRoot = createRoot(appRoot);

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
  uiState.statusMessage = `Widget connection failed: ${message}`;
  uiState.statusVariant = "danger";
}

const hydrateWorkflowFromToolResult = (result: ToolResult): void => {
  const structured = result.structuredContent ?? {};
  const fetchReference = String(structured.fetch_reference ?? "").trim();
  if (fetchReference) {
    formState.fetchReference = fetchReference;
    workflowState.fetch_reference = fetchReference;
    workflowState.current_step = "sos_report";
  }

  const archivePath = String(structured.archive_path ?? "").trim();
  if (archivePath) {
    formState.artifactRef = archivePath;
    workflowState.artifact_ref = archivePath;
    workflowState.current_step = "sos_report";
  }
};

app.ontoolresult = (result) => {
  hydrateWorkflowFromToolResult(result as ToolResult);
  const text = result.content?.find((item) => item.type === "text")?.text;
  setStatus(text ?? "Tool executed.");
};

const setStatus = (message: string, variant: StatusVariant = "info") => {
  uiState.statusMessage = message;
  uiState.statusVariant = variant;
  render();
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
  render();
};

const widgetBuildId = document
  .querySelector('meta[name="gpt-app-build-id"]')
  ?.getAttribute("content")
  ?.trim();
if (widgetBuildId) {
  setStatus(`Widget loaded (${widgetBuildId}).`, "success");
}

const ensureLinuxSelection = (): boolean => {
  const selected = formState.product.trim().toLowerCase();
  if (selected !== "linux") {
    workflowState.last_error_code = "unsupported_product";
    setStatus("Only Red Hat Enterprise Linux is currently supported for Engage Red Hat Support.", "warning");
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
    setStatus("Complete step 1 with linux selection before step 2.", "warning");
    workflowState.last_error_code = "step_gate_select_product";
    return false;
  }
  if (step === "jira_attach" && !canEnterJiraStep()) {
    setStatus("Complete step 2 (generate + fetch) before step 3.", "warning");
    workflowState.last_error_code = "step_gate_sos_report";
    return false;
  }
  setCurrentStep(step);
  return true;
};

const getConnectionId = (): string => formState.connectionId.trim();
const getIssueKey = (): string => formState.issueKey.trim();
const getFetchReference = (): string => formState.fetchReference.trim();

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
      setStatus(text ?? "Operation completed.", result.isError ? "danger" : "success");
    }
    render();
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (options.redactErrorDetails) {
      const generic = "Connection failed. Verify URL and credentials.";
      setStatus(generic, "danger");
      return { isError: true, content: [{ type: "text", text: generic }] };
    }
    setStatus(`Operation failed: ${message}`, "danger");
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
    setStatus(parsed.text ?? "Connection verification failed.", "danger");
    return null;
  }
  if (status === "expired" || status === "revoked") {
    setStatus(`Connection is ${status}. Reconnect before continuing.`, "warning");
    return parsed;
  }
  setStatus(parsed.text ?? `Connection is ${status}.`, "success");
  return parsed;
};

const connectJira = async (): Promise<ConnectResponse | null> => {
  if (!ensureLinuxSelection()) return null;
  const jiraBaseUrl = formState.jiraUrl.trim();
  const authMode = formState.jiraAuthMode;
  if (!jiraBaseUrl) {
    workflowState.last_error_code = "missing_jira_connect_inputs";
    setStatus("Jira URL is required.", "warning");
    return null;
  }
  let payload: Record<string, unknown>;
  if (authMode === "basic_cloud") {
    const accountEmail = formState.jiraEmail.trim();
    const apiToken = formState.jiraApiToken;
    if (!accountEmail || !apiToken) {
      workflowState.last_error_code = "missing_jira_connect_inputs";
      setStatus("Jira URL, account email, and API token are required.", "warning");
      return null;
    }
    payload = {
      jira_base_url: jiraBaseUrl,
      auth_mode: "basic_cloud",
      account_email: accountEmail,
      api_token: apiToken,
    };
  } else {
    const pat = formState.jiraPat;
    if (!pat) {
      workflowState.last_error_code = "missing_jira_connect_inputs";
      setStatus("Jira URL and PAT are required.", "warning");
      return null;
    }
    payload = {
      jira_base_url: jiraBaseUrl,
      auth_mode: "bearer_pat",
      pat,
    };
  }
  const result = await callTool("jira_connect_secure", payload, { redactErrorDetails: true });
  if (result.isError) {
    workflowState.last_error_code = "jira_connect_failed";
    return null;
  }
  const body = (result.structuredContent ?? {}) as ConnectResponse;
  if (body.connection_id) {
    formState.connectionId = body.connection_id;
    workflowState.connection_id = body.connection_id;
  }
  if (body.status) {
    setStatus(`Connected. Current lifecycle status: ${body.status}.`, "success");
  } else {
    setStatus(body.text ?? "Connected.", "success");
  }
  // Preserve credential security boundary: never keep secret values in local UI state after intake.
  formState.jiraApiToken = "";
  formState.jiraPat = "";
  render();
  return body;
};

const verifyConnection = async (): Promise<VerifyResponse | null> => {
  const connectionId = getConnectionId();
  if (!connectionId) {
    workflowState.last_error_code = "missing_connection_id";
    setStatus("connection_id is required.", "warning");
    return null;
  }
  try {
    const response = await fetch(apiUrl(`/api/jira/connections/${encodeURIComponent(connectionId)}`));
    const body = await response.json() as VerifyResponse;
    if (!response.ok) {
      const fallback = await verifyConnectionViaTool(connectionId);
      if (fallback) return fallback;
      setStatus(body.text ?? "Connection verification failed.", "danger");
      workflowState.last_error_code = "connection_verification_failed";
      return null;
    }
    const status = String(body.status ?? "");
    if (status === "expired" || status === "revoked") {
      setStatus(`Connection is ${status}. Reconnect before continuing.`, "warning");
      workflowState.last_error_code = `connection_${status}`;
      return body;
    }
    workflowState.connection_id = connectionId;
    setStatus(body.text ?? `Connection is ${status || "connected"}.`, "success");
    return body;
  } catch (error) {
    const fallback = await verifyConnectionViaTool(connectionId);
    if (fallback) return fallback;
    const message = error instanceof Error ? error.message : String(error);
    setStatus(`Connection verification request failed (${message}).`, "danger");
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
    setStatus("connection_id and issue key are required before issue access verification.", "warning");
    return false;
  }
  const listed = await callTool("jira_list_attachments", {
    connection_id: connectionId,
    issue_key: issueKey,
  });
  if (listed.isError) {
    workflowState.issue_access_verified = false;
    workflowState.last_error_code = "issue_access_denied";
    setStatus("Issue read verification failed. Resolve access before attach.", "danger");
    return false;
  }
  workflowState.issue_access_verified = true;
  workflowState.issue_key = issueKey;
  setStatus("Issue access verified. You can attach artifact.", "success");
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
      setStatus(body.text ?? "Consent mint failed. Retry Step 2 Generate.", "danger");
      return null;
    }
    return body.consent_token;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    setStatus(`Consent mint request failed (${message}).`, "danger");
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
      setStatus(body.text ?? "Unable to start workflow session.", "danger");
      return false;
    }
    workflowSessionId = body.workflow_session_id;
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    setStatus(`Workflow start failed (${message}).`, "danger");
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
      setStatus(body.text ?? "Step 1 product selection failed.", "danger");
      return false;
    }
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    setStatus(`Step 1 product submission failed (${message}).`, "danger");
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

const onGenerate = async () => {
  if (!navigateToStep("sos_report")) return;
  if (!ensureLinuxSelection()) return;
  uiState.isGenerating = true;
  render();
  // Prevent stale fetch actions while a new generate is in-flight.
  formState.fetchReference = "";
  workflowState.fetch_reference = undefined;
  // Diagnostic collection must only occur on explicit user action in Step 2.
  const consentToken = await mintGenerateConsentToken();
  if (!consentToken) {
    workflowState.last_error_code = "consent_mint_failed";
    workflowState.current_step = "failed";
    uiState.isGenerating = false;
    render();
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
    setStatus(`Generate step failed. ${reason}`, "danger");
    uiState.isGenerating = false;
    render();
    return;
  }
  if (fetchReference) {
    formState.fetchReference = fetchReference;
    workflowState.fetch_reference = fetchReference;
    workflowState.current_step = "sos_report";
    setStatus("Generate succeeded. Proceed to fetch_sosreport.", "success");
    uiState.isGenerating = false;
    render();
    return;
  }
  if (!generateJobId) {
    setStatus("Generate accepted. Waiting for completion status...", "info");
    uiState.isGenerating = false;
    render();
    return;
  }

  setStatus("Generate started. Waiting for completion status...", "info");
  const finalState = await pollGenerateJobUntilTerminal(generateJobId);
  if (!finalState) {
    setStatus("Generate is still running. Keep this page open and retry in a few seconds.", "warning");
    uiState.isGenerating = false;
    render();
    return;
  }
  if (String(finalState.status ?? "") === "failed") {
    workflowState.last_error_code = String(finalState.error_code ?? "generate_failed");
    workflowState.current_step = "failed";
    setStatus(finalState.text ?? "Generate failed. Retry Step 2 Generate.", "danger");
    uiState.isGenerating = false;
    render();
    return;
  }
  const polledFetchReference = String(finalState.fetch_reference ?? "").trim();
  if (!polledFetchReference) {
    workflowState.last_error_code = "missing_fetch_reference_after_generate";
    setStatus("Generate completed but no fetch reference was returned. Retry generate.", "warning");
    uiState.isGenerating = false;
    render();
    return;
  }
  formState.fetchReference = polledFetchReference;
  workflowState.fetch_reference = polledFetchReference;
  setStatus("Generate completed. Fetch is now enabled.", "success");
  uiState.isGenerating = false;
  render();
};

const onFetch = async () => {
  if (!navigateToStep("sos_report")) return;
  if (!ensureLinuxSelection()) return;
  const fetchReference = getFetchReference();
  if (!fetchReference) {
    workflowState.last_error_code = "missing_fetch_reference";
    setStatus("fetch_reference is required before fetch.", "warning");
    return;
  }
  const fetched = await callTool("fetch_sosreport", { fetch_reference: fetchReference });
  const archivePath = String(fetched.structuredContent?.archive_path ?? "");
  if (fetched.isError || !archivePath) {
    workflowState.last_error_code = "fetch_failed";
    workflowState.current_step = "failed";
    setStatus("Fetch step failed. Fix the error and retry fetch.", "danger");
    return;
  }
  formState.artifactRef = archivePath;
  workflowState.artifact_ref = archivePath;
  workflowState.current_step = "sos_report";
  setStatus("Fetch succeeded. Use the returned archive_path for attach.", "success");
  render();
};

const onList = async () => {
  await verifyIssueReadAccess();
};

const onAttach = async () => {
  if (!navigateToStep("jira_attach")) return;
  const connectionId = getConnectionId();
  const issueKey = getIssueKey();
  const artifactRef = formState.artifactRef.trim();
  if (!connectionId || !issueKey || !artifactRef) {
    workflowState.last_error_code = "missing_attach_inputs";
    setStatus("connection_id, issue key, and artifact path are required.", "warning");
    return;
  }
  const verified = await verifyConnection();
  if (!verified || verified.status !== "connected") {
    workflowState.last_error_code = "connection_not_verified_for_attach";
    setStatus("Attach blocked: verify an active connection before attaching.", "warning");
    return;
  }
  const issueAccessOk = await verifyIssueReadAccess();
  if (!issueAccessOk) {
    workflowState.last_error_code = "issue_access_not_verified";
    setStatus("Attach blocked: verify issue read access before attaching.", "warning");
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
    setStatus("Attach step failed. Verify issue key, connection status, and artifact path.", "danger");
    return;
  }
  workflowState.current_step = "completed";
  setStatus("Attach succeeded. Workflow completed.", "success");
};

const onDisconnect = async () => {
  const connectionId = getConnectionId();
  if (!connectionId) {
    setStatus("connection_id is required.", "warning");
    return;
  }
  await callTool("jira_disconnect", { connection_id: connectionId });
};

const onStep1Continue = async () => {
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
  setStatus("Step 1 complete. Continue with generate + fetch.", "success");
};

const onStep2Continue = () => {
  if (!workflowState.artifact_ref) {
    setStatus("Complete generate + fetch to continue to step 3.", "warning");
    workflowState.last_error_code = "missing_artifact_ref_for_step3";
    return;
  }
  navigateToStep("jira_attach");
  setStatus("Step 2 complete. Continue with connect, verify, and attach.", "success");
};

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

render = () => {
  reactRoot.render(
    createElement(EngageWorkflowApp, {
      currentStep: workflowState.current_step,
      formState,
      uiState,
      onNavigateStep1: () => navigateToStep("select_product"),
      onNavigateStep2: () => navigateToStep("sos_report"),
      onNavigateStep3: () => navigateToStep("jira_attach"),
      onProductChange: (value: string) => {
        formState.product = value;
        render();
      },
      onFetchReferenceChange: (value: string) => {
        formState.fetchReference = value;
        workflowState.fetch_reference = value.trim() || undefined;
        render();
      },
      onArtifactRefChange: (value: string) => {
        formState.artifactRef = value;
        workflowState.artifact_ref = value.trim() || undefined;
        render();
      },
      onJiraUrlChange: (value: string) => {
        formState.jiraUrl = value;
        render();
      },
      onJiraAuthModeChange: (value) => {
        formState.jiraAuthMode = value;
        render();
      },
      onJiraEmailChange: (value: string) => {
        formState.jiraEmail = value;
        render();
      },
      onJiraApiTokenChange: (value: string) => {
        formState.jiraApiToken = value;
        render();
      },
      onJiraPatChange: (value: string) => {
        formState.jiraPat = value;
        render();
      },
      onConnectionIdChange: (value: string) => {
        formState.connectionId = value;
        workflowState.connection_id = value.trim() || undefined;
        render();
      },
      onIssueKeyChange: (value: string) => {
        formState.issueKey = value;
        workflowState.issue_key = value.trim() || undefined;
        render();
      },
      onStep1Continue,
      onGenerate,
      onFetch,
      onStep2Continue,
      onConnect: async () => { await connectJira(); },
      onVerify: async () => { await verifyConnection(); },
      onStatus: async () => {
        const connectionId = getConnectionId();
        if (!connectionId) {
          setStatus("connection_id is required.", "warning");
          return;
        }
        await callTool("jira_connection_status", { connection_id: connectionId });
      },
      onList,
      onAttach,
      onDisconnect,
    }),
  );
};

bootstrapRoute();
render();
