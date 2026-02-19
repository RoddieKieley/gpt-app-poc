import { App } from "@modelcontextprotocol/ext-apps";

const statusEl = document.getElementById("status");
const connectBtn = document.getElementById("connect-btn");
const verifyBtn = document.getElementById("verify-btn");
const statusBtn = document.getElementById("status-btn");
const generateBtn = document.getElementById("generate-btn");
const fetchBtn = document.getElementById("fetch-btn");
const listBtn = document.getElementById("list-btn");
const attachBtn = document.getElementById("attach-btn");
const disconnectBtn = document.getElementById("disconnect-btn");
const engageRunBtn = document.getElementById("engage-run-btn");
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
  !statusEl || !connectBtn || !verifyBtn || !statusBtn || !generateBtn || !fetchBtn ||
  !listBtn || !attachBtn || !disconnectBtn || !engageRunBtn || !productSelectEl ||
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

app.ontoolresult = (result) => {
  const text = result.content?.find((item) => item.type === "text")?.text;
  statusEl.textContent = text ?? "Tool executed.";
};

const setStatus = (message: string) => {
  statusEl.textContent = message;
};

if (widgetBuildId) {
  setStatus(`Widget loaded (${widgetBuildId}).`);
}

const ensureLinuxSelection = (): boolean => {
  const selected = productSelectEl.value.trim().toLowerCase();
  if (selected !== "linux") {
    setStatus("Only linux is supported for Engage Red Hat Support.");
    return false;
  }
  return true;
};

const getConnectionId = (): string => connectionIdEl.value.trim();
const getIssueKey = (): string => issueKeyEl.value.trim();
const getFetchReference = (): string => fetchReferenceEl.value.trim();

const callTool = async (name: string, args: Record<string, unknown>): Promise<ToolResult> => {
  try {
    const result = (await app.callServerTool({
      name,
      arguments: args,
    })) as ToolResult;
    const text = result.content?.find((item) => item.type === "text")?.text;
    setStatus(text ?? "Operation completed.");
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
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
    setStatus("Jira URL and PAT are required.");
    return null;
  }
  const result = await callTool("jira_connect_secure", {
    jira_base_url: jiraBaseUrl,
    pat,
  });
  if (result.isError) {
    return null;
  }
  const body = (result.structuredContent ?? {}) as ConnectResponse;
  if (body.connection_id) {
    connectionIdEl.value = body.connection_id;
  }
  if (body.status) {
    setStatus(`Connected. Current lifecycle status: ${body.status}.`);
  } else {
    setStatus(body.text ?? "Connected.");
  }
  jiraPatEl.value = "";
  return body;
};

const verifyConnection = async (): Promise<VerifyResponse | null> => {
  const connectionId = getConnectionId();
  if (!connectionId) {
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
      return null;
    }
    const status = String(body.status ?? "");
    if (status === "expired" || status === "revoked") {
      setStatus(`Connection is ${status}. Reconnect before continuing.`);
      return body;
    }
    setStatus(body.text ?? `Connection is ${status || "connected"}.`);
    return body;
  } catch (error) {
    const fallback = await verifyConnectionViaTool(connectionId);
    if (fallback) return fallback;
    const message = error instanceof Error ? error.message : String(error);
    setStatus(`Connection verification request failed (${message}).`);
    return null;
  }
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
  if (!ensureLinuxSelection()) return;
  const connectionId = getConnectionId();
  if (!connectionId) {
    setStatus("connection_id is required before generate.");
    return;
  }
  const verified = await verifyConnection();
  if (!verified) {
    return;
  }
  if (verified.status !== "connected") {
    return;
  }
  const generated = await callTool("generate_sosreport", {});
  const fetchReference = String(generated.structuredContent?.fetch_reference ?? "");
  if (generated.isError || !fetchReference) {
    setStatus("Generate step failed. Fix the error and retry generate.");
    return;
  }
  fetchReferenceEl.value = fetchReference;
  setStatus("Generate succeeded. Proceed to fetch_sosreport.");
});

fetchBtn.addEventListener("click", async () => {
  if (!ensureLinuxSelection()) return;
  const fetchReference = getFetchReference();
  if (!fetchReference) {
    setStatus("fetch_reference is required before fetch.");
    return;
  }
  const fetched = await callTool("fetch_sosreport", { fetch_reference: fetchReference });
  const archivePath = String(fetched.structuredContent?.archive_path ?? "");
  if (fetched.isError || !archivePath) {
    setStatus("Fetch step failed. Fix the error and retry fetch.");
    return;
  }
  artifactRefEl.value = archivePath;
  setStatus("Fetch succeeded. Use the returned archive_path for attach.");
});

listBtn.addEventListener("click", async () => {
  const connectionId = getConnectionId();
  const issueKey = getIssueKey();
  if (!connectionId || !issueKey) {
    setStatus("connection_id and issue key are required.");
    return;
  }
  await callTool("jira_list_attachments", {
    connection_id: connectionId,
    issue_key: issueKey,
  });
});

attachBtn.addEventListener("click", async () => {
  const connectionId = getConnectionId();
  const issueKey = getIssueKey();
  const artifactRef = artifactRefEl.value.trim();
  if (!connectionId || !issueKey || !artifactRef) {
    setStatus("connection_id, issue key, and artifact path are required.");
    return;
  }
  const result = await callTool("jira_attach_artifact", {
    connection_id: connectionId,
    issue_key: issueKey,
    artifact_ref: artifactRef,
  });
  if (result.isError) {
    setStatus("Attach step failed. Verify issue key, connection status, and artifact path.");
  }
});

disconnectBtn.addEventListener("click", async () => {
  const connectionId = getConnectionId();
  if (!connectionId) {
    setStatus("connection_id is required.");
    return;
  }
  await callTool("jira_disconnect", { connection_id: connectionId });
});

engageRunBtn.addEventListener("click", async () => {
  if (!ensureLinuxSelection()) return;
  const issueKey = getIssueKey();
  if (!issueKey) {
    setStatus("issue key is required before running end-to-end flow.");
    return;
  }

  const connected = await connectJira();
  if (!connected?.connection_id) {
    setStatus("End-to-end stopped at connect step.");
    return;
  }

  const verified = await verifyConnection();
  if (!verified) {
    return;
  }
  if (verified.status !== "connected") {
    setStatus(`End-to-end stopped at verify step (${verified.status ?? "unknown"}). Reconnect and retry.`);
    return;
  }

  const generated = await callTool("generate_sosreport", {});
  const fetchReference = String(generated.structuredContent?.fetch_reference ?? "");
  if (generated.isError || !fetchReference) {
    setStatus("End-to-end stopped at generate step.");
    return;
  }
  fetchReferenceEl.value = fetchReference;

  const fetched = await callTool("fetch_sosreport", { fetch_reference: fetchReference });
  const archivePath = String(fetched.structuredContent?.archive_path ?? "");
  if (fetched.isError || !archivePath) {
    setStatus("End-to-end stopped at fetch step.");
    return;
  }
  artifactRefEl.value = archivePath;

  const attached = await callTool("jira_attach_artifact", {
    connection_id: connected.connection_id,
    issue_key: issueKey,
    artifact_ref: archivePath,
  });
  if (attached.isError) {
    setStatus("End-to-end stopped at attach step.");
    return;
  }
  setStatus("End-to-end workflow completed: connect -> verify -> generate -> fetch -> attach.");
});
