import { App } from "@modelcontextprotocol/ext-apps";

const statusEl = document.getElementById("status");
const connectBtn = document.getElementById("connect-btn");
const statusBtn = document.getElementById("status-btn");
const listBtn = document.getElementById("list-btn");
const attachBtn = document.getElementById("attach-btn");
const disconnectBtn = document.getElementById("disconnect-btn");
const jiraUrlEl = document.getElementById("jira-url") as HTMLInputElement | null;
const jiraPatEl = document.getElementById("jira-pat") as HTMLInputElement | null;
const connectionIdEl = document.getElementById("connection-id") as HTMLInputElement | null;
const issueKeyEl = document.getElementById("issue-key") as HTMLInputElement | null;
const artifactRefEl = document.getElementById("artifact-ref") as HTMLInputElement | null;

if (
  !statusEl || !connectBtn || !statusBtn || !listBtn || !attachBtn || !disconnectBtn ||
  !jiraUrlEl || !jiraPatEl || !connectionIdEl || !issueKeyEl || !artifactRefEl
) {
  throw new Error("Missing required UI elements.");
}

const app = new App({ name: "MCP Apps Jira Attachments", version: "1.0.0" });

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

const callTool = async (name: string, args: Record<string, unknown>) => {
  try {
    const result = await app.callServerTool({
      name,
      arguments: args,
    });
    const text = result.content?.find((item) => item.type === "text")?.text;
    statusEl.textContent = text ?? "Operation completed.";
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    statusEl.textContent = `Operation failed: ${message}`;
  }
};

connectBtn.addEventListener("click", async () => {
  const jiraBaseUrl = jiraUrlEl.value.trim();
  const pat = jiraPatEl.value;
  if (!jiraBaseUrl || !pat) {
    statusEl.textContent = "Jira URL and PAT are required.";
    return;
  }
  try {
    const response = await fetch("/api/jira/connections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jira_base_url: jiraBaseUrl, pat }),
    });
    const body = await response.json() as { connection_id?: string; text?: string };
    if (!response.ok) {
      statusEl.textContent = body.text ?? "Connection failed.";
      return;
    }
    if (body.connection_id) {
      connectionIdEl.value = body.connection_id;
    }
    jiraPatEl.value = "";
    statusEl.textContent = body.text ?? "Connected.";
  } catch {
    statusEl.textContent = "Connection request failed.";
  }
});

statusBtn.addEventListener("click", async () => {
  const connectionId = connectionIdEl.value.trim();
  if (!connectionId) {
    statusEl.textContent = "connection_id is required.";
    return;
  }
  await callTool("jira_connection_status", { connection_id: connectionId });
});

listBtn.addEventListener("click", async () => {
  const connectionId = connectionIdEl.value.trim();
  const issueKey = issueKeyEl.value.trim();
  if (!connectionId || !issueKey) {
    statusEl.textContent = "connection_id and issue key are required.";
    return;
  }
  await callTool("jira_list_attachments", {
    connection_id: connectionId,
    issue_key: issueKey,
  });
});

attachBtn.addEventListener("click", async () => {
  const connectionId = connectionIdEl.value.trim();
  const issueKey = issueKeyEl.value.trim();
  const artifactRef = artifactRefEl.value.trim();
  if (!connectionId || !issueKey || !artifactRef) {
    statusEl.textContent = "connection_id, issue key, and artifact path are required.";
    return;
  }
  await callTool("jira_attach_artifact", {
    connection_id: connectionId,
    issue_key: issueKey,
    artifact_ref: artifactRef,
  });
});

disconnectBtn.addEventListener("click", async () => {
  const connectionId = connectionIdEl.value.trim();
  if (!connectionId) {
    statusEl.textContent = "connection_id is required.";
    return;
  }
  await callTool("jira_disconnect", { connection_id: connectionId });
});
