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

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const jiraClient = new JiraClient();
const lifecycleStore = new ConnectionLifecycleStore();
const tokenVault = new TokenVault();

const server = new McpServer({
  name: "MCP Apps Hello World",
  version: "1.0.0",
});

const resourceUri = "ui://hello-world/app.html";

registerAppTool(
  server,
  "hello-world",
  {
    title: "Hello World",
    description:
      "Returns a greeting and renders a Hello World UI in MCP Apps hosts.",
    inputSchema: z.object({
      name: z.string().optional().describe("Optional name to greet."),
    }),
    annotations: {
      readOnlyHint: true,
      openWorldHint: false,
      destructiveHint: false,
    },
    _meta: {
      ui: { resourceUri },
      "openai/outputTemplate": resourceUri,
      "openai/widgetAccessible": true,
    },
  },
  async (args) => {
    const name = typeof args?.name === "string" && args.name.trim()
      ? args.name.trim()
      : "World";
    return {
      content: [
        {
          type: "text",
          text: `Hello, ${name}! If the UI is not available, this text confirms the tool ran successfully.`,
        },
      ],
    };
  },
);

const jiraResourceUri = "ui://jira-attachments/app.html";

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
      ui: { resourceUri: jiraResourceUri },
      "openai/outputTemplate": jiraResourceUri,
      "openai/widgetAccessible": true,
    },
  },
  async (args, extra) => {
    const userId = String(extra?.authInfo?.extra?.userId ?? "default-user");
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
      ui: { resourceUri: jiraResourceUri },
      "openai/outputTemplate": jiraResourceUri,
      "openai/widgetAccessible": true,
    },
  },
  async (args, extra) => {
    const userId = String(extra?.authInfo?.extra?.userId ?? "default-user");
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
      ui: { resourceUri: jiraResourceUri },
      "openai/outputTemplate": jiraResourceUri,
      "openai/widgetAccessible": true,
    },
  },
  async (args, extra) => {
    const userId = String(extra?.authInfo?.extra?.userId ?? "default-user");
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
      ui: { resourceUri: jiraResourceUri },
      "openai/outputTemplate": jiraResourceUri,
      "openai/widgetAccessible": true,
    },
  },
  async (args, extra) => {
    const userId = String(extra?.authInfo?.extra?.userId ?? "default-user");
    return handleDisconnect(
      { userId, lifecycle: lifecycleStore, vault: tokenVault, client: jiraClient },
      args.connection_id,
    );
  },
);

registerAppResource(
  server,
  resourceUri,
  resourceUri,
  { mimeType: RESOURCE_MIME_TYPE },
  async () => {
    let html: string;
    try {
      html = await fs.readFile(
        path.join(__dirname, "dist", "mcp-app.html"),
        "utf-8",
      );
    } catch (error) {
      html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>MCP Apps Hello World</title>
  </head>
  <body>
    <p>UI bundle unavailable. Use the text response as fallback.</p>
  </body>
</html>`;
    }
    return {
      contents: [
        {
          uri: resourceUri,
          mimeType: RESOURCE_MIME_TYPE,
          _meta: {
            "openai/widgetDomain": "https://gptapppoc.kieley.io",
            "openai/widgetCSP": {
              connect_domains: ["https://gptapppoc.kieley.io"],
            },
          },
          text: html,
        },
      ],
    };
  },
);

registerAppResource(
  server,
  jiraResourceUri,
  jiraResourceUri,
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
    <title>Jira Attachments</title>
  </head>
  <body>
    <p>UI bundle unavailable. Use Jira text tool responses as fallback.</p>
  </body>
</html>`;
    }
    return {
      contents: [
        {
          uri: jiraResourceUri,
          mimeType: RESOURCE_MIME_TYPE,
          _meta: {
            "openai/widgetDomain": "https://gptapppoc.kieley.io",
            "openai/widgetCSP": {
              connect_domains: ["https://gptapppoc.kieley.io"],
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
    req.userId = String(req.header("x-user-id") ?? "default-user");
    next();
  });

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
          "provide a full policy at https://gptapppoc.kieley.io/privacy.",
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
          "For help, visit https://gptapppoc.kieley.io/support.",
        ].join("\n"),
      );
  });

  app.post("/api/jira/connections", async (req, res) => {
    try {
      const parsed = connectSchema.parse(req.body);
      const conn = await lifecycleStore.create(req.userId, parsed.jira_base_url);
      await tokenVault.store(conn.connectionId, parsed.pat);
      try {
        await jiraClient.verifyConnection(parsed.jira_base_url, parsed.pat);
        await lifecycleStore.markVerified(req.userId, conn.connectionId);
      } catch (error) {
        const mapped = error as JiraMappedError;
        await lifecycleStore.markError(req.userId, conn.connectionId, mapped.code ?? "unexpected_error");
      }
      emitSecurityEvent({
        action: "connect",
        outcome: "success",
        userId: req.userId,
        connectionId: conn.connectionId,
      });
      return res.status(201).json({
        connection_id: conn.connectionId,
        jira_base_url: conn.jiraBaseUrl,
        status: conn.status,
        expires_at: conn.expiresAt,
        last_verified_at: conn.lastVerifiedAt,
        text: "Jira connection created successfully.",
      });
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
