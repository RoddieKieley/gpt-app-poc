import { JiraClient } from "./jira-client.js";
import { resolveArtifactSelection } from "./artifact-selection.js";
import { ConnectionLifecycleStore } from "../security/connection-lifecycle.js";
import { TokenVault } from "../security/token-vault.js";
import { emitSecurityEvent } from "../security/security-events.js";
import { JiraMappedError } from "./jira-error-mapping.js";

type ToolContent = { type: "text"; text: string };

export type JiraToolContext = {
  userId: string;
  lifecycle: ConnectionLifecycleStore;
  vault: TokenVault;
  client: JiraClient;
};

const text = (message: string): ToolContent[] => [{ type: "text", text: message }];

const activeConnection = async (
  ctx: JiraToolContext,
  connectionId: string,
): Promise<{ baseUrl: string; pat: string }> => {
  const conn = await ctx.lifecycle.getOwned(ctx.userId, connectionId);
  if (!conn) {
    throw <JiraMappedError>{
      code: "not_found",
      status: 404,
      message: "Connection not found.",
    };
  }
  if (conn.status === "revoked") {
    throw <JiraMappedError>{
      code: "connection_revoked",
      status: 401,
      message: "Connection has been revoked. Reconnect to continue.",
    };
  }
  if (conn.status === "expired") {
    throw <JiraMappedError>{
      code: "connection_expired",
      status: 401,
      message: "Connection has expired. Reconnect to continue.",
    };
  }
  const pat = await ctx.vault.resolve(connectionId);
  if (!pat) {
    throw <JiraMappedError>{
      code: "invalid_credentials",
      status: 401,
      message: "Stored credentials are unavailable.",
    };
  }
  return { baseUrl: conn.jiraBaseUrl, pat };
};

export const handleConnectionStatus = async (
  ctx: JiraToolContext,
  connectionId: string,
) => {
  const conn = await ctx.lifecycle.getOwned(ctx.userId, connectionId);
  if (!conn) {
    return { isError: true, content: text("Connection not found for the current user.") };
  }
  emitSecurityEvent({
    action: "verify",
    outcome: "success",
    userId: ctx.userId,
    connectionId,
  });
  return {
    content: text(
      `Connection ${conn.connectionId} is ${conn.status}. Expires at ${conn.expiresAt}.`,
    ),
    structuredContent: {
      connection_id: conn.connectionId,
      jira_base_url: conn.jiraBaseUrl,
      status: conn.status,
      expires_at: conn.expiresAt,
      last_verified_at: conn.lastVerifiedAt,
    },
  };
};

export const handleListAttachments = async (
  ctx: JiraToolContext,
  connectionId: string,
  issueKey: string,
) => {
  const creds = await activeConnection(ctx, connectionId);
  const attachments = await ctx.client.listAttachments(creds.baseUrl, creds.pat, issueKey);
  emitSecurityEvent({
    action: "list_attachments",
    outcome: "success",
    userId: ctx.userId,
    connectionId,
  });
  return {
    content: text(`Found ${attachments.length} attachment(s) on issue ${issueKey}.`),
    structuredContent: { issue_key: issueKey, attachments },
  };
};

export const handleAttachArtifact = async (
  ctx: JiraToolContext,
  connectionId: string,
  issueKey: string,
  artifactRef: string,
) => {
  const creds = await activeConnection(ctx, connectionId);
  const artifact = await resolveArtifactSelection(artifactRef);
  const uploaded = await ctx.client.attachArtifact(
    creds.baseUrl,
    creds.pat,
    issueKey,
    artifact.filePath,
    artifact.filename,
  );
  emitSecurityEvent({
    action: "attach",
    outcome: "success",
    userId: ctx.userId,
    connectionId,
  });
  return {
    content: text(`Attached ${uploaded.filename} to issue ${issueKey}.`),
    structuredContent: uploaded,
  };
};

export const handleDisconnect = async (
  ctx: JiraToolContext,
  connectionId: string,
) => {
  const revoked = await ctx.lifecycle.revoke(ctx.userId, connectionId);
  await ctx.vault.revoke(connectionId);
  if (!revoked) {
    return { isError: true, content: text("Connection not found for revoke.") };
  }
  emitSecurityEvent({
    action: "revoke",
    outcome: "success",
    userId: ctx.userId,
    connectionId,
  });
  return {
    content: text(`Connection ${connectionId} revoked.`),
    structuredContent: { connection_id: connectionId, status: "revoked" },
  };
};

