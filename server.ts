import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  RESOURCE_MIME_TYPE,
  registerAppResource,
  registerAppTool,
} from "@modelcontextprotocol/ext-apps/server";
import cors from "cors";
import express from "express";
import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { JiraClient } from "./src/jira/jira-client.js";
import {
  attachArtifactSchema,
  connectionIdSchema,
  connectSchema,
  listAttachmentsSchema,
} from "./src/jira/jira-tool-schemas.js";
import {
  handleAttachArtifact,
  handleConnectionStatus,
  handleDisconnect,
  handleListAttachments,
} from "./src/jira/jira-tool-handlers.js";
import { resolveArtifactSelection } from "./src/jira/artifact-selection.js";
import { mapJiraHttpError, JiraMappedError } from "./src/jira/jira-error-mapping.js";
import { ConnectionLifecycleStore } from "./src/security/connection-lifecycle.js";
import { sanitizeForLog, safeError } from "./src/security/redaction.js";
import { TokenVault } from "./src/security/token-vault.js";
import { emitSecurityEvent } from "./src/security/security-events.js";
import { fetchSosreportSchema, generateSosreportSchema } from "./src/sosreport/sosreport-tool-schemas.js";
import { handleFetchSosreport, handleGenerateSosreport } from "./src/sosreport/sosreport-tool-handlers.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const jiraClient = new JiraClient();
const lifecycleStore = new ConnectionLifecycleStore();
const tokenVault = new TokenVault();
const DEFAULT_USER_ID = "default-user";
const USER_ID_DEBUG_ENABLED = process.env.DEBUG_USER_ID_RESOLUTION === "1";

const normalizeUserId = (candidate: unknown): string | null => {
  if (typeof candidate !== "string") return null;
  const trimmed = candidate.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const resolveUserId = (sources: { mcpUserId?: unknown; httpHeaderUserId?: unknown }): string => {
  return (
    normalizeUserId(sources.mcpUserId)
    ?? normalizeUserId(sources.httpHeaderUserId)
    ?? DEFAULT_USER_ID
  );
};

const debugResolvedUserId = (
  channel: "http" | "mcp",
  raw: { mcpUserId?: unknown; httpHeaderUserId?: unknown },
  resolvedUserId: string,
) => {
  if (!USER_ID_DEBUG_ENABLED) return;
  console.log(
    `[user_id_debug] channel=${channel} resolved=${resolvedUserId} raw=${JSON.stringify({
      mcpUserId: raw.mcpUserId,
      httpHeaderUserId: raw.httpHeaderUserId,
    })}`,
  );
};

const resolveMcpUserId = (authInfo: unknown): string => {
  const auth = authInfo as { userId?: unknown; extra?: { userId?: unknown } } | undefined;
  const raw = { mcpUserId: auth?.extra?.userId ?? auth?.userId };
  const resolved = resolveUserId(raw);
  debugResolvedUserId("mcp", raw, resolved);
  return resolved;
};

type JiraConnectionResponse = {
  connection_id: string;
  jira_base_url: string;
  status: string;
  expires_at: string;
  last_verified_at: string | null;
  text: string;
};

const createSecureJiraConnection = async (
  userId: string,
  jiraBaseUrl: string,
  pat: string,
): Promise<JiraConnectionResponse> => {
  const conn = await lifecycleStore.create(userId, jiraBaseUrl);
  await tokenVault.store(conn.connectionId, pat);
  try {
    await jiraClient.verifyConnection(jiraBaseUrl, pat);
    await lifecycleStore.markVerified(userId, conn.connectionId);
  } catch (error) {
    const mapped = error as JiraMappedError;
    await lifecycleStore.markError(userId, conn.connectionId, mapped.code ?? "unexpected_error");
  }
  emitSecurityEvent({
    action: "connect",
    outcome: "success",
    userId,
    connectionId: conn.connectionId,
  });
  const current = await lifecycleStore.getOwned(userId, conn.connectionId);
  const effective = current ?? conn;
  return {
    connection_id: effective.connectionId,
    jira_base_url: effective.jiraBaseUrl,
    status: effective.status,
    expires_at: effective.expiresAt,
    last_verified_at: effective.lastVerifiedAt,
    text: "Jira connection created successfully.",
  };
};

const server = new McpServer({
  name: "GPT App POC",
  version: "1.0.0",
});

const ENGAGE_SKILL_RESOURCE_URI = "skill://engage-red-hat-support/SKILL.md";
const ENGAGE_SKILL_RESOURCE_SOURCE_PATH = path.join(
  __dirname,
  "skills",
  "engage-red-hat-support",
  "SKILL.md",
);
const SKILL_RESOURCE_MIME_TYPE = "text/markdown";
const ENGAGE_SKILL_RESOURCE_FALLBACK = `# Engage Red Hat Support

Skill content is temporarily unavailable from the repository.
URI: ${ENGAGE_SKILL_RESOURCE_URI}`;
const widgetResourceVersion = process.env.WIDGET_RESOURCE_VERSION?.trim();
const engageResourceUri = widgetResourceVersion
  ? `ui://engage-red-hat-support/app.html?v=${encodeURIComponent(widgetResourceVersion)}`
  : "ui://engage-red-hat-support/app.html";
const widgetBuildId = widgetResourceVersion || `build-${Date.now()}`;
const DEFAULT_WIDGET_DOMAIN = "https://leisured-carina-unpromotable.ngrok-free.dev";

const loadSkillMarkdown = async (sourcePath: string, fallback: string): Promise<string> => {
  try {
    return await fs.readFile(sourcePath, "utf-8");
  } catch (_error) {
    return fallback;
  }
};

const loadEngageSkillMarkdown = async (): Promise<string> => {
  return loadSkillMarkdown(ENGAGE_SKILL_RESOURCE_SOURCE_PATH, ENGAGE_SKILL_RESOURCE_FALLBACK);
};

const GET_SKILL_INPUT_SCHEMA = z.object({ uri: z.string().min(1, "skill URI is required") });

registerAppTool(
  server,
  "list_skills",
  {
    title: "List Available Skills",
    description: "Returns canonical URI(s) for repo-local skills.",
    inputSchema: z.object({}),
    annotations: {
      readOnlyHint: true,
      openWorldHint: false,
      destructiveHint: false,
    },
    _meta: {
      ui: { resourceUri: engageResourceUri },
      "openai/outputTemplate": engageResourceUri,
      "openai/widgetAccessible": true,
    },
  },
  async () => ({
    content: [
      {
        type: "text",
        text: [
          `Available skill: ${ENGAGE_SKILL_RESOURCE_URI}`,
          "Use resources/read with that URI to load markdown skill content.",
        ].join("\n"),
      },
    ],
  }),
);

registerAppTool(
  server,
  "get_skill",
  {
    title: "Get Skill Markdown",
    description: "Returns markdown content for a registered skill URI.",
    inputSchema: GET_SKILL_INPUT_SCHEMA,
    annotations: {
      readOnlyHint: true,
      openWorldHint: false,
      destructiveHint: false,
    },
    _meta: {
      ui: { resourceUri: engageResourceUri },
      "openai/outputTemplate": engageResourceUri,
      "openai/widgetAccessible": true,
    },
  },
  async (args) => {
    const normalizedUri = args.uri.trim();
    if (!normalizedUri.startsWith("skill://")) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: "Invalid URI. Provide a non-empty skill URI like skill://engage-red-hat-support/SKILL.md.",
          },
        ],
      };
    }

    if (normalizedUri !== ENGAGE_SKILL_RESOURCE_URI) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: [
              `Unsupported skill URI: ${normalizedUri}`,
              `Use list_skills to discover supported URIs. Currently supported: ${ENGAGE_SKILL_RESOURCE_URI}`,
            ].join("\n"),
          },
        ],
      };
    }

    const markdown = await loadEngageSkillMarkdown();
    return {
      content: [
        {
          type: "text",
          text: [`URI: ${ENGAGE_SKILL_RESOURCE_URI}`, "", markdown].join("\n"),
        },
      ],
      structuredContent: {
        uri: ENGAGE_SKILL_RESOURCE_URI,
        mimeType: SKILL_RESOURCE_MIME_TYPE,
        text: markdown,
      },
    };
  },
);

registerAppTool(
  server,
  "generate_sosreport",
  {
    title: "Generate Local Sosreport",
    description: "Generates a local sosreport archive using non-interactive sudo execution.",
    inputSchema: generateSosreportSchema,
    annotations: {
      readOnlyHint: false,
      openWorldHint: false,
      destructiveHint: false,
    },
    _meta: {
      ui: { resourceUri: engageResourceUri },
      "openai/outputTemplate": engageResourceUri,
      "openai/widgetAccessible": true,
    },
  },
  async (args) => handleGenerateSosreport(args),
);

registerAppTool(
  server,
  "fetch_sosreport",
  {
    title: "Fetch Local Sosreport Archive",
    description: "Fetches generated sosreport archive metadata and copies file to /tmp.",
    inputSchema: fetchSosreportSchema,
    annotations: {
      readOnlyHint: true,
      openWorldHint: false,
      destructiveHint: false,
    },
    _meta: {
      ui: { resourceUri: engageResourceUri },
      "openai/outputTemplate": engageResourceUri,
      "openai/widgetAccessible": true,
    },
  },
  async (args) => handleFetchSosreport(args),
);

registerAppTool(
  server,
  "jira_connect_secure",
  {
    title: "Connect Jira Securely",
    description: "Creates Jira connection and stores PAT in backend vault.",
    inputSchema: connectSchema,
    annotations: {
      readOnlyHint: false,
      openWorldHint: false,
      destructiveHint: false,
    },
    _meta: {
      ui: { resourceUri: engageResourceUri },
      "openai/outputTemplate": engageResourceUri,
      "openai/widgetAccessible": true,
    },
  },
  async (args, extra) => {
    const userId = resolveMcpUserId(extra?.authInfo);
    try {
      const created = await createSecureJiraConnection(userId, args.jira_base_url, args.pat);
      return {
        content: [{ type: "text", text: created.text }],
        structuredContent: created,
      };
    } catch (_error) {
      emitSecurityEvent({ action: "connect", outcome: "failed", userId });
      return {
        isError: true,
        content: [{
          type: "text",
          text: "Connection failed. Verify URL and credentials.",
        }],
      };
    }
  },
);

registerAppTool(
  server,
  "jira_connection_status",
  {
    title: "Jira Connection Status",
    description: "Returns non-sensitive Jira connection status.",
    inputSchema: connectionIdSchema,
    annotations: {
      readOnlyHint: true,
      openWorldHint: false,
      destructiveHint: false,
    },
    _meta: {
      ui: { resourceUri: engageResourceUri },
      "openai/outputTemplate": engageResourceUri,
      "openai/widgetAccessible": true,
    },
  },
  async (args, extra) => {
    const userId = resolveMcpUserId(extra?.authInfo);
    return handleConnectionStatus(
      { userId, lifecycle: lifecycleStore, vault: tokenVault, client: jiraClient },
      args.connection_id,
    );
  },
);

registerAppTool(
  server,
  "jira_list_attachments",
  {
    title: "List Jira Issue Attachments",
    description: "Lists attachment metadata for a Jira issue by opaque connection reference.",
    inputSchema: listAttachmentsSchema,
    annotations: {
      readOnlyHint: true,
      openWorldHint: false,
      destructiveHint: false,
    },
    _meta: {
      ui: { resourceUri: engageResourceUri },
      "openai/outputTemplate": engageResourceUri,
      "openai/widgetAccessible": true,
    },
  },
  async (args, extra) => {
    const userId = resolveMcpUserId(extra?.authInfo);
    try {
      return await handleListAttachments(
        { userId, lifecycle: lifecycleStore, vault: tokenVault, client: jiraClient },
        args.connection_id,
        args.issue_key,
      );
    } catch (error) {
      const mapped = error as JiraMappedError;
      return {
        isError: true,
        content: [{ type: "text", text: mapped.message ?? "Failed to list attachments." }],
      };
    }
  },
);

registerAppTool(
  server,
  "jira_attach_artifact",
  {
    title: "Attach Local Artifact to Jira Issue",
    description: "Uploads a selected local artifact using opaque Jira connection reference.",
    inputSchema: attachArtifactSchema,
    annotations: {
      readOnlyHint: false,
      openWorldHint: false,
      destructiveHint: false,
    },
    _meta: {
      ui: { resourceUri: engageResourceUri },
      "openai/outputTemplate": engageResourceUri,
      "openai/widgetAccessible": true,
    },
  },
  async (args, extra) => {
    const userId = resolveMcpUserId(extra?.authInfo);
    try {
      return await handleAttachArtifact(
        { userId, lifecycle: lifecycleStore, vault: tokenVault, client: jiraClient },
        args.connection_id,
        args.issue_key,
        args.artifact_ref,
      );
    } catch (error) {
      const mapped = error as JiraMappedError;
      return {
        isError: true,
        content: [{ type: "text", text: mapped.message ?? "Failed to attach artifact." }],
      };
    }
  },
);

registerAppTool(
  server,
  "jira_disconnect",
  {
    title: "Disconnect Jira Connection",
    description: "Revokes a Jira connection by opaque reference.",
    inputSchema: connectionIdSchema,
    annotations: {
      readOnlyHint: false,
      openWorldHint: false,
      destructiveHint: true,
    },
    _meta: {
      ui: { resourceUri: engageResourceUri },
      "openai/outputTemplate": engageResourceUri,
      "openai/widgetAccessible": true,
    },
  },
  async (args, extra) => {
    const userId = resolveMcpUserId(extra?.authInfo);
    return handleDisconnect(
      { userId, lifecycle: lifecycleStore, vault: tokenVault, client: jiraClient },
      args.connection_id,
    );
  },
);

server.registerResource(
  "engage-red-hat-support-skill",
  ENGAGE_SKILL_RESOURCE_URI,
  { mimeType: SKILL_RESOURCE_MIME_TYPE },
  async () => ({
    contents: [
      {
        uri: ENGAGE_SKILL_RESOURCE_URI,
        mimeType: SKILL_RESOURCE_MIME_TYPE,
        text: await loadEngageSkillMarkdown(),
      },
    ],
  }),
);

registerAppResource(
  server,
  engageResourceUri,
  engageResourceUri,
  { mimeType: RESOURCE_MIME_TYPE },
  async () => {
    let html: string;
    try {
      html = await fs.readFile(
        path.join(__dirname, "dist", "mcp-app.html"),
        "utf-8",
      );
    } catch (_error) {
      html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Engage Red Hat Support</title>
  </head>
  <body>
    <p>UI bundle unavailable. Use text fallbacks for connect, generate, fetch, and attach steps.</p>
  </body>
</html>`;
    }
    const widgetDomain = process.env.WIDGET_DOMAIN?.trim() || DEFAULT_WIDGET_DOMAIN;
    const escapedWidgetDomain = widgetDomain
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    const escapedWidgetBuildId = widgetBuildId
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    const apiBaseInjection = [
      `<meta name="gpt-app-api-base" content="${escapedWidgetDomain}" />`,
      `<meta name="gpt-app-build-id" content="${escapedWidgetBuildId}" />`,
    ].join("");
    html = html.includes("</head>")
      ? html.replace("</head>", `${apiBaseInjection}</head>`)
      : `${apiBaseInjection}${html}`;
    return {
      contents: [
        {
          uri: engageResourceUri,
          mimeType: RESOURCE_MIME_TYPE,
          _meta: {
            "openai/widgetDomain": widgetDomain,
            "openai/widgetCSP": {
              connect_domains: [widgetDomain],
            },
          },
          text: html,
        },
      ],
    };
  },
);

export const createApp = () => {
  const app = express();
  const mcpTransports = new Map<string, StreamableHTTPServerTransport>();
  app.use(cors());
  app.use(express.json({ limit: "1mb" }));

  app.use((req, _res, next) => {
    const raw = { httpHeaderUserId: req.header("x-user-id") };
    req.userId = resolveUserId(raw);
    debugResolvedUserId("http", raw, req.userId);
    next();
  });

  if (USER_ID_DEBUG_ENABLED) {
    app.get("/debug/user-id", (req, res) => {
      const rawHeader = req.header("x-user-id");
      return res.status(200).json({
        debug_enabled: true,
        default_user_id: DEFAULT_USER_ID,
        header_x_user_id: rawHeader ?? null,
        resolved_user_id: req.userId,
      });
    });
  }

  app.get("/privacy", (_req, res) => {
    res
      .status(200)
      .type("text/plain")
      .send(
        [
          "Privacy Policy",
          "",
          "This app only processes the minimum data required to fulfill requests.",
          "PAT credentials are handled in backend-only encrypted storage.",
          "No secret values are exposed in MCP payloads, prompts, transcripts, or logs.",
          "For details on data categories, purposes, recipients, and user controls,",
          "provide a full policy at https://leisured-carina-unpromotable.ngrok-free.dev/privacy.",
        ].join("\n"),
      );
  });

  app.get("/support", (_req, res) => {
    res
      .status(200)
      .type("text/plain")
      .send(
        [
          "Support",
          "",
          "For help, visit https://leisured-carina-unpromotable.ngrok-free.dev/support.",
        ].join("\n"),
      );
  });

  app.post("/api/jira/connection", (_req, res) => {
    return res.status(404).json({
      code: "not_found",
      message: "Endpoint not found.",
      text: "Use POST /api/jira/connections (plural) with JSON body { jira_base_url, pat }.",
    });
  });

  app.post("/api/jira/connections", async (req, res) => {
    try {
      const parsed = connectSchema.parse(req.body);
      const created = await createSecureJiraConnection(req.userId, parsed.jira_base_url, parsed.pat);
      return res.status(201).json(created);
    } catch (error) {
      const message = safeError(error).message;
      emitSecurityEvent({ action: "connect", outcome: "failed", userId: req.userId });
      return res.status(422).json({
        code: "validation_error",
        message,
        text: "Connection failed. Verify URL and credentials.",
      });
    }
  });

  app.get("/api/jira/connections/:connection_id", async (req, res) => {
    const conn = await lifecycleStore.getOwned(req.userId, req.params.connection_id);
    if (!conn) {
      return res.status(404).json({
        code: "not_found",
        message: "Connection not found.",
        text: "No Jira connection found for the current user.",
      });
    }
    emitSecurityEvent({
      action: "verify",
      outcome: "success",
      userId: req.userId,
      connectionId: conn.connectionId,
    });
    return res.status(200).json({
      connection_id: conn.connectionId,
      jira_base_url: conn.jiraBaseUrl,
      status: conn.status,
      expires_at: conn.expiresAt,
      last_verified_at: conn.lastVerifiedAt,
      text: `Connection is ${conn.status}.`,
    });
  });

  app.delete("/api/jira/connections/:connection_id", async (req, res) => {
    const conn = await lifecycleStore.revoke(req.userId, req.params.connection_id);
    if (!conn) {
      return res.status(404).json({
        code: "not_found",
        message: "Connection not found.",
        text: "No Jira connection found to revoke.",
      });
    }
    await tokenVault.revoke(conn.connectionId);
    emitSecurityEvent({
      action: "revoke",
      outcome: "success",
      userId: req.userId,
      connectionId: conn.connectionId,
    });
    return res.status(204).send();
  });

  app.get("/api/jira/issues/:issue_key/attachments", async (req, res) => {
    const connectionId = String(req.header("x-connection-id") ?? "");
    if (!connectionId) {
      return res.status(400).json({
        code: "validation_error",
        message: "Missing X-Connection-Id header.",
        text: "Provide an opaque connection reference.",
      });
    }
    const conn = await lifecycleStore.getOwned(req.userId, connectionId);
    if (!conn) {
      emitSecurityEvent({ action: "list_attachments", outcome: "denied", userId: req.userId });
      return res.status(404).json({ code: "not_found", message: "Connection not found.", text: "Reconnect and try again." });
    }
    if (conn.status === "expired" || conn.status === "revoked") {
      const code = conn.status === "expired" ? "connection_expired" : "connection_revoked";
      return res.status(401).json({ code, message: "Connection is not active.", text: "Reconnect before listing attachments." });
    }
    const pat = await tokenVault.resolve(connectionId);
    if (!pat) {
      return res.status(401).json({ code: "invalid_credentials", message: "Credentials missing.", text: "Reconnect before listing attachments." });
    }
    try {
      const attachments = await jiraClient.listAttachments(conn.jiraBaseUrl, pat, req.params.issue_key);
      emitSecurityEvent({
        action: "list_attachments",
        outcome: "success",
        userId: req.userId,
        connectionId,
      });
      return res.status(200).json({
        issue_key: req.params.issue_key,
        attachments,
        text: `Found ${attachments.length} attachment(s).`,
      });
    } catch (error) {
      const mapped = error as JiraMappedError;
      await lifecycleStore.markError(req.userId, connectionId, mapped.code ?? "unexpected_error");
      return res.status(mapped.status ?? 500).json({
        code: mapped.code ?? "unexpected_error",
        message: sanitizeForLog(mapped.message ?? "Failed to list attachments."),
        text: "Could not list attachments.",
      });
    }
  });

  app.post("/api/jira/issues/:issue_key/attachments", async (req, res) => {
    const connectionId = String(req.header("x-connection-id") ?? "");
    if (!connectionId) {
      return res.status(400).json({
        code: "validation_error",
        message: "Missing X-Connection-Id header.",
        text: "Provide an opaque connection reference.",
      });
    }
    const parsed = attachArtifactSchema.safeParse({
      connection_id: connectionId,
      issue_key: req.params.issue_key,
      artifact_ref: req.body?.artifact_ref,
    });
    if (!parsed.success) {
      return res.status(422).json({
        code: "validation_error",
        message: "Invalid attachment request.",
        text: "Provide issue and artifact details.",
      });
    }
    const conn = await lifecycleStore.getOwned(req.userId, connectionId);
    if (!conn) {
      return res.status(404).json({ code: "not_found", message: "Connection not found.", text: "Reconnect and try again." });
    }
    if (conn.status === "expired" || conn.status === "revoked") {
      const code = conn.status === "expired" ? "connection_expired" : "connection_revoked";
      return res.status(401).json({ code, message: "Connection is not active.", text: "Reconnect before attaching files." });
    }
    const pat = await tokenVault.resolve(connectionId);
    if (!pat) {
      return res.status(401).json({ code: "invalid_credentials", message: "Credentials missing.", text: "Reconnect before attaching files." });
    }
    try {
      const artifactRef = String(req.body.artifact_ref);
      const artifact = await resolveArtifactSelection(artifactRef);
      const uploaded = await jiraClient.attachArtifact(
        conn.jiraBaseUrl,
        pat,
        req.params.issue_key,
        artifact.filePath,
        artifact.filename,
      );
      emitSecurityEvent({
        action: "attach",
        outcome: "success",
        userId: req.userId,
        connectionId,
      });
      return res.status(201).json({
        ...uploaded,
        text: `Attached ${uploaded.filename} to ${req.params.issue_key}.`,
      });
    } catch (error) {
      const mapped = error as JiraMappedError;
      await lifecycleStore.markError(req.userId, connectionId, mapped.code ?? "unexpected_error");
      return res.status(mapped.status ?? 500).json({
        code: mapped.code ?? "unexpected_error",
        message: sanitizeForLog(mapped.message ?? "Attachment failed."),
        text: "Could not attach artifact.",
      });
    }
  });

  app.all("/mcp", async (req, res) => {
    try {
      const headerValue = req.header("mcp-session-id");
      const sessionId = typeof headerValue === "string" && headerValue.trim().length > 0
        ? headerValue
        : undefined;

      let transport: StreamableHTTPServerTransport | undefined;
      if (sessionId) {
        transport = mcpTransports.get(sessionId);
      } else if (req.method === "POST") {
        let registeredSessionId: string | undefined;
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          enableJsonResponse: true,
          onsessioninitialized: (newSessionId) => {
            registeredSessionId = newSessionId;
            mcpTransports.set(newSessionId, transport!);
          },
        });

        transport.onclose = () => {
          if (registeredSessionId) {
            mcpTransports.delete(registeredSessionId);
          }
        };

        await server.connect(transport);
      }

      if (!transport) {
        if (!sessionId && req.method !== "POST") {
          return res.status(400).json({
            code: "invalid_request",
            message: "Session required for non-POST MCP requests.",
          });
        }

        return res.status(404).json({
          code: "session_not_found",
          message: "MCP session not found.",
        });
      }

      await transport.handleRequest(req, res, req.body);
      return;
    } catch (error) {
      return res.status(500).json({
        code: "internal_error",
        message: safeError(error).message,
      });
    }
  });

  return app;
};

declare global {
  namespace Express {
    interface Request {
      userId: string;
    }
  }
}

const port = Number.parseInt(process.env.PORT ?? "", 10) || 3001;
const app = createApp();

if (process.env.NODE_ENV !== "test") {
  app.listen(port, (err) => {
    if (err) {
      console.error("Error starting server:", safeError(err).message);
      process.exit(1);
    }
    console.log(`Server listening on http://localhost:${port}/mcp`);
  });
}
