import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
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
import { SubscribeRequestSchema, UnsubscribeRequestSchema } from "@modelcontextprotocol/sdk/types.js";
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
import { ConsentTokenService } from "./src/security/consent-token-service.js";
import { authorizeSensitiveToolCall } from "./src/security/sensitive-tool-policy.js";
import {
  fetchSosreportSchema,
  generateSosreportSchema,
  type GenerateSosreportInput,
} from "./src/sosreport/sosreport-tool-schemas.js";
import { handleFetchSosreport, handleGenerateSosreport } from "./src/sosreport/sosreport-tool-handlers.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const jiraClient = new JiraClient();
const lifecycleStore = new ConnectionLifecycleStore();
const tokenVault = new TokenVault();
const DEFAULT_USER_ID = "default-user";
const DEFAULT_TEST_CONSENT_SIGNING_KEY = "test-consent-signing-key";
const DEFAULT_CONSENT_TTL_SECONDS = 120;
const USER_ID_DEBUG_ENABLED = process.env.DEBUG_USER_ID_RESOLUTION === "1";

const parsePositiveInteger = (value: string | undefined, fallback: number): number => {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
};

const resolveConsentSigningKey = (): string => {
  const configured = process.env.CONSENT_TOKEN_SIGNING_KEY?.trim();
  if (configured && configured.length > 0) return configured;
  if (process.env.NODE_ENV === "test") return DEFAULT_TEST_CONSENT_SIGNING_KEY;
  throw new Error("CONSENT_TOKEN_SIGNING_KEY is required in non-test environments.");
};

const consentTokenService = new ConsentTokenService({
  signingKey: resolveConsentSigningKey(),
  ttlSeconds: parsePositiveInteger(process.env.CONSENT_TOKEN_TTL_SECONDS, DEFAULT_CONSENT_TTL_SECONDS),
});

type EngageWorkflowState = {
  workflowSessionId: string;
  userId: string;
  sessionId: string;
  selectedProduct: "linux" | null;
  step1CompletedAt: string | null;
  updatedAt: string;
};

const engageWorkflowStates = new Map<string, EngageWorkflowState>();

type GenerateJobStatus = "queued" | "running" | "succeeded" | "failed";
type GenerateSosreportJob = {
  jobId: string;
  userId: string;
  sessionId: string;
  status: GenerateJobStatus;
  createdAt: string;
  updatedAt: string;
  fetchReference?: string;
  errorCode?: string;
  errorText?: string;
};

const generateSosreportJobs = new Map<string, GenerateSosreportJob>();
const GENERATE_JOB_TTL_MS = 30 * 60 * 1000;
const resourceSubscriptions = new Set<string>();
const toGenerateJobResourceUri = (jobId: string): string => `resource://engage/sosreport/jobs/${jobId}`;

const buildWorkflowKey = (userId: string, sessionId: string): string => `${userId}:${sessionId}`;

const getOrCreateWorkflowState = (userId: string, sessionId: string): EngageWorkflowState => {
  const key = buildWorkflowKey(userId, sessionId);
  const existing = engageWorkflowStates.get(key);
  if (existing) return existing;
  const created: EngageWorkflowState = {
    workflowSessionId: randomUUID(),
    userId,
    sessionId,
    selectedProduct: null,
    step1CompletedAt: null,
    updatedAt: new Date().toISOString(),
  };
  engageWorkflowStates.set(key, created);
  return created;
};

const markWorkflowProductSelection = (userId: string, sessionId: string, product: "linux"): EngageWorkflowState => {
  const current = getOrCreateWorkflowState(userId, sessionId);
  const updated: EngageWorkflowState = {
    ...current,
    selectedProduct: product,
    step1CompletedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  engageWorkflowStates.set(buildWorkflowKey(userId, sessionId), updated);
  return updated;
};

const hasCompletedStep1LinuxSelection = (userId: string, sessionId: string): boolean => {
  const current = engageWorkflowStates.get(buildWorkflowKey(userId, sessionId));
  return current?.selectedProduct === "linux" && Boolean(current.step1CompletedAt);
};

const pruneExpiredGenerateJobs = () => {
  const now = Date.now();
  for (const [jobId, job] of generateSosreportJobs.entries()) {
    const updatedAtMs = Date.parse(job.updatedAt);
    if (Number.isNaN(updatedAtMs)) continue;
    if (now - updatedAtMs > GENERATE_JOB_TTL_MS) {
      generateSosreportJobs.delete(jobId);
    }
  }
};

const createGenerateJob = (input: { userId: string; sessionId: string }): GenerateSosreportJob => {
  const now = new Date().toISOString();
  const job: GenerateSosreportJob = {
    jobId: randomUUID(),
    userId: input.userId,
    sessionId: input.sessionId,
    status: "queued",
    createdAt: now,
    updatedAt: now,
  };
  generateSosreportJobs.set(job.jobId, job);
  void notifyGenerateJobResourceUpdated(job.jobId).catch(() => {});
  return job;
};

const updateGenerateJob = (jobId: string, patch: Partial<GenerateSosreportJob>) => {
  const existing = generateSosreportJobs.get(jobId);
  if (!existing) return;
  const updated: GenerateSosreportJob = {
    ...existing,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  generateSosreportJobs.set(jobId, updated);
  void notifyGenerateJobResourceUpdated(jobId).catch(() => {});
};

const getOwnedGenerateJob = (input: {
  jobId: string;
  userId: string;
  sessionId: string;
}): GenerateSosreportJob | null => {
  const job = generateSosreportJobs.get(input.jobId);
  if (!job) return null;
  if (job.userId === input.userId || job.sessionId === input.sessionId) {
    return job;
  }
  return null;
};

const mapGenerateJobState = (job: GenerateSosreportJob) => {
  if (job.status === "succeeded") {
    return {
      job_id: job.jobId,
      status: job.status,
      fetch_reference: job.fetchReference,
      text: "Generate completed successfully.",
    };
  }
  if (job.status === "failed") {
    return {
      job_id: job.jobId,
      status: job.status,
      error_code: job.errorCode ?? "generate_failed",
      text: job.errorText ?? "Generate failed.",
    };
  }
  return {
    job_id: job.jobId,
    status: job.status,
    text: "Generate in progress.",
  };
};

const notifyGenerateJobResourceUpdated = async (jobId: string): Promise<void> => {
  const uri = toGenerateJobResourceUri(jobId);
  if (!resourceSubscriptions.has(uri)) return;
  await server.server.sendResourceUpdated({ uri });
};

const runGenerateJob = (input: {
  jobId: string;
  userId: string;
  args: GenerateSosreportInput;
  consentJti: string;
  consentScope: string;
  consentStep: number;
}) => {
  queueMicrotask(async () => {
    updateGenerateJob(input.jobId, { status: "running", errorCode: undefined, errorText: undefined });
    try {
      const result = await handleGenerateSosreport(input.args);
      const fetchReference = String(result.structuredContent?.fetch_reference ?? "").trim();
      if (result.isError || fetchReference.length === 0) {
        const errorCode = String(result.structuredContent?.code ?? "generate_failed");
        const errorText = result.content?.find((item) => item.type === "text")?.text ?? "Generate failed.";
        updateGenerateJob(input.jobId, {
          status: "failed",
          errorCode,
          errorText,
          fetchReference: undefined,
        });
        consentTokenService.finalizeSingleUse(input.consentJti, false);
        emitSecurityEvent({
          action: "consent_authorize",
          outcome: "failed",
          userId: input.userId,
          errorCode: "generate_failed",
          details: { scope: input.consentScope, step: input.consentStep },
        });
        return;
      }
      updateGenerateJob(input.jobId, {
        status: "succeeded",
        fetchReference,
        errorCode: undefined,
        errorText: undefined,
      });
      consentTokenService.finalizeSingleUse(input.consentJti, true);
      emitSecurityEvent({
        action: "consent_authorize",
        outcome: "success",
        userId: input.userId,
        details: { scope: input.consentScope, step: input.consentStep },
      });
    } catch (_error) {
      updateGenerateJob(input.jobId, {
        status: "failed",
        errorCode: "generate_failed",
        errorText: "Generate failed unexpectedly.",
      });
      consentTokenService.finalizeSingleUse(input.consentJti, false);
      emitSecurityEvent({
        action: "consent_authorize",
        outcome: "failed",
        userId: input.userId,
        errorCode: "generate_failed",
        details: { scope: input.consentScope, step: input.consentStep },
      });
    }
  });
};

const getWorkflowStateByWorkflowSessionId = (
  userId: string,
  workflowSessionId: string,
): EngageWorkflowState | null => {
  for (const state of engageWorkflowStates.values()) {
    if (state.userId === userId && state.workflowSessionId === workflowSessionId) {
      return state;
    }
  }
  return null;
};

const normalizeUserId = (candidate: unknown): string | null => {
  if (typeof candidate !== "string") return null;
  const trimmed = candidate.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const normalizeSessionId = (candidate: unknown): string | null => {
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

const resolveMcpSessionId = (extra: unknown, userId: string): string => {
  const details = extra as
    | {
        sessionId?: unknown;
        session_id?: unknown;
        requestInfo?: { sessionId?: unknown; session_id?: unknown };
      }
    | undefined;
  return (
    normalizeSessionId(details?.sessionId)
    ?? normalizeSessionId(details?.session_id)
    ?? normalizeSessionId(details?.requestInfo?.sessionId)
    ?? normalizeSessionId(details?.requestInfo?.session_id)
    ?? `mcp-session:${userId}`
  );
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
const engageStepSelectUri = "ui://engage-red-hat-support/steps/select-product.html";
const engageStepSosUri = "ui://engage-red-hat-support/steps/sos-report.html";
const engageStepJiraUri = "ui://engage-red-hat-support/steps/jira-attach.html";
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

const loadEngageWidgetHtml = async (): Promise<string> => {
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
    <p>UI bundle unavailable. Follow text fallback steps:</p>
    <ol>
      <li>Start workflow and select supported product (linux only).</li>
      <li>Request explicit consent token, then run generate_sosreport and fetch_sosreport to produce artifact_ref.</li>
      <li>Use secure Jira intake to obtain connection_id, verify issue access, then attach artifact.</li>
    </ol>
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

  return html;
};

const GET_SKILL_INPUT_SCHEMA = z.object({ uri: z.string().min(1, "skill URI is required") });
const SELECT_ENGAGE_PRODUCT_SCHEMA = z.object({
  product: z.literal("linux"),
});
const CONSENT_MINT_SCHEMA = z.object({
  workflow: z.literal("engage_red_hat_support"),
  step: z.literal(2),
  requested_scope: z.literal("generate_sosreport"),
  session_id: z.string().min(1).optional(),
  workflow_session_id: z.string().min(1).optional(),
  client_action_id: z.string().min(1).optional(),
});
const GENERATE_JOB_STATUS_SCHEMA = z.object({
  job_id: z.string().min(1),
});

registerAppTool(
  server,
  "start_engage_red_hat_support",
  {
    title: "Start Engage Red Hat Support Workflow",
    description: "Starts workflow and returns explicit step 1 product-selection guidance.",
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
  async (_args, extra) => {
    const userId = resolveMcpUserId(extra?.authInfo);
    const sessionId = resolveMcpSessionId(extra, userId);
    const state = getOrCreateWorkflowState(userId, sessionId);
    return {
      content: [
        {
          type: "text",
          text: [
            "Engage workflow started.",
            "Step 1: select product linux before requesting consent or generating diagnostics.",
            `UI entrypoint: ${engageResourceUri}`,
          ].join("\n"),
        },
      ],
      structuredContent: {
        workflow: "engage_red_hat_support",
        workflow_session_id: state.workflowSessionId,
        current_step: "select_product",
        compatibility_entry_uri: engageResourceUri,
      },
    };
  },
);

registerAppTool(
  server,
  "select_engage_product",
  {
    title: "Select Engage Workflow Product",
    description: "Completes step 1 product selection for Engage workflow (linux only).",
    inputSchema: SELECT_ENGAGE_PRODUCT_SCHEMA,
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
    const sessionId = resolveMcpSessionId(extra, userId);
    const state = markWorkflowProductSelection(userId, sessionId, args.product);
    return {
      content: [{
        type: "text",
        text: "Step 1 complete: linux selected. You can now request consent and run generate_sosreport.",
      }],
      structuredContent: {
        workflow: "engage_red_hat_support",
        workflow_session_id: state.workflowSessionId,
        selected_product: "linux",
        current_step: "sos_report",
      },
    };
  },
);

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
  async (args, extra) => {
    const userId = resolveMcpUserId(extra?.authInfo);
    const requestedWorkflowSessionId = normalizeSessionId(args.workflow_session_id);
    const workflowState = requestedWorkflowSessionId
      ? getWorkflowStateByWorkflowSessionId(userId, requestedWorkflowSessionId)
      : null;
    const sessionId = workflowState?.sessionId ?? resolveMcpSessionId(extra, userId);
    if (!hasCompletedStep1LinuxSelection(userId, sessionId)) {
      return {
        isError: true,
        content: [{
          type: "text",
          text: [
            "Step 1 required before diagnostics.",
            "Select product linux first, then request consent token and run generate_sosreport.",
            "If using tools directly: call start_engage_red_hat_support, then select_engage_product with product=linux.",
          ].join("\n"),
        }],
        structuredContent: { code: "product_selection_required", next_step: "select_product" },
      };
    }
    const decision = authorizeSensitiveToolCall({
      toolName: "generate_sosreport",
      consentToken: args.consent_token,
      userId,
      sessionId,
      consentService: consentTokenService,
    });
    if (!decision.allowed) {
      emitSecurityEvent({
        action: "consent_authorize",
        outcome: "denied",
        userId,
        errorCode: decision.reasonCode,
      });
      return {
        isError: true,
        content: [{ type: "text", text: decision.safeText }],
        structuredContent: {
          code: decision.reasonCode,
          next_step: "mint_consent_then_generate",
        },
      };
    }
    pruneExpiredGenerateJobs();
    const job = createGenerateJob({ userId, sessionId });
    runGenerateJob({
      jobId: job.jobId,
      userId,
      args,
      consentJti: decision.claims.jti,
      consentScope: decision.claims.scope,
      consentStep: decision.claims.step,
    });
    return {
      content: [
        {
          type: "text",
          text: "Generate started. Poll status until completed, then fetch using returned fetch_reference.",
        },
      ],
      structuredContent: {
        job_id: job.jobId,
        status: "queued",
        next_step: "poll_generate_status",
      },
    };
  },
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
  "get_generate_sosreport_status",
  {
    title: "Get Generate Sosreport Status",
    description: "Returns async generate_sosreport job status and fetch_reference when completed.",
    inputSchema: GENERATE_JOB_STATUS_SCHEMA,
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
    pruneExpiredGenerateJobs();
    const userId = resolveMcpUserId(extra?.authInfo);
    const sessionId = resolveMcpSessionId(extra, userId);
    const job = getOwnedGenerateJob({ jobId: args.job_id, userId, sessionId });
    if (!job) {
      return {
        isError: true,
        content: [{ type: "text", text: "Generate job not found. Start generate again." }],
        structuredContent: {
          code: "job_not_found",
          job_id: args.job_id,
        },
      };
    }
    return {
      content: [{ type: "text", text: mapGenerateJobState(job).text }],
      structuredContent: mapGenerateJobState(job),
    };
  },
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

server.registerResource(
  "engage-sosreport-generate-job",
  new ResourceTemplate("resource://engage/sosreport/jobs/{jobId}", { list: undefined }),
  {
    title: "Engage sosreport generate job state",
    description: "Reports async generate_sosreport job status and fetch_reference when completed.",
    mimeType: "application/json",
  },
  async (_uri, params) => {
    pruneExpiredGenerateJobs();
    const jobId = String(params.jobId ?? "").trim();
    const job = generateSosreportJobs.get(jobId);
    if (!job) {
      return {
        contents: [
          {
            uri: toGenerateJobResourceUri(jobId),
            mimeType: "application/json",
            text: JSON.stringify({
              job_id: jobId,
              status: "missing",
              error_code: "job_not_found",
              text: "Generate job not found.",
            }),
          },
        ],
      };
    }
    return {
      contents: [
        {
          uri: toGenerateJobResourceUri(job.jobId),
          mimeType: "application/json",
          text: JSON.stringify({
            job_id: job.jobId,
            status: job.status,
            fetch_reference: job.fetchReference,
            error_code: job.errorCode,
            text:
              job.status === "succeeded"
                ? "Generate completed successfully."
                : job.status === "failed"
                  ? (job.errorText ?? "Generate failed.")
                  : "Generate in progress.",
          }),
        },
      ],
    };
  },
);

server.server.setRequestHandler(SubscribeRequestSchema, async (request) => {
  const uri = String(request.params.uri ?? "").trim();
  if (uri.startsWith("resource://engage/sosreport/jobs/")) {
    resourceSubscriptions.add(uri);
  }
  return {};
});

server.server.setRequestHandler(UnsubscribeRequestSchema, async (request) => {
  const uri = String(request.params.uri ?? "").trim();
  if (uri.startsWith("resource://engage/sosreport/jobs/")) {
    resourceSubscriptions.delete(uri);
  }
  return {};
});

const registerEngageUiResource = (uri: string) => registerAppResource(
  server,
  uri,
  uri,
  { mimeType: RESOURCE_MIME_TYPE },
  async () => {
    const html = await loadEngageWidgetHtml();
    const widgetDomain = process.env.WIDGET_DOMAIN?.trim() || DEFAULT_WIDGET_DOMAIN;
    return {
      contents: [
        {
          uri,
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

registerEngageUiResource(engageResourceUri);
registerEngageUiResource(engageStepSelectUri);
registerEngageUiResource(engageStepSosUri);
registerEngageUiResource(engageStepJiraUri);

export const createApp = () => {
  const app = express();
  const mcpTransports = new Map<string, StreamableHTTPServerTransport>();
  app.use(cors());
  app.use(express.json({ limit: "1mb" }));

  app.use((req, _res, next) => {
    const raw = { httpHeaderUserId: req.header("x-user-id") };
    req.userId = resolveUserId(raw);
    req.sessionId = normalizeSessionId(req.header("x-session-id")) ?? `http-session:${req.userId}`;
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

  app.post("/api/engage/consent-tokens", (req, res) => {
    const parsed = CONSENT_MINT_SCHEMA.safeParse(req.body);
    if (!parsed.success) {
      emitSecurityEvent({
        action: "consent_mint",
        outcome: "failed",
        userId: req.userId,
        errorCode: "validation_error",
      });
      return res.status(400).json({
        code: "validation_error",
        message: "Invalid consent mint request.",
        text: "Consent mint request is invalid. Retry Step 2 Generate.",
      });
    }
    const requestedWorkflowSessionId = normalizeSessionId(parsed.data.workflow_session_id);
    const workflowState = requestedWorkflowSessionId
      ? getWorkflowStateByWorkflowSessionId(req.userId, requestedWorkflowSessionId)
      : null;
    if (requestedWorkflowSessionId && !workflowState) {
      return res.status(409).json({
        code: "workflow_session_invalid",
        message: "Workflow session is invalid or no longer active.",
        text: "Restart Step 1 and retry Step 2 generate.",
      });
    }
    const sessionId = workflowState?.sessionId ?? normalizeSessionId(parsed.data.session_id) ?? req.sessionId;
    if (!hasCompletedStep1LinuxSelection(req.userId, sessionId)) {
      return res.status(409).json({
        code: "product_selection_required",
        message: "Step 1 product selection is required before consent mint.",
        text: "Select product linux first, then request permission to generate diagnostics.",
      });
    }
    const minted = consentTokenService.mint({
      userId: req.userId,
      sessionId,
      scope: "generate_sosreport",
      step: 2,
    });
    emitSecurityEvent({
      action: "consent_mint",
      outcome: "success",
      userId: req.userId,
      details: {
        scope: minted.claims.scope,
        step: minted.claims.step,
        sessionId,
        clientActionId: parsed.data.client_action_id,
      },
    });
    return res.status(201).json({
      consent_token: minted.token,
      expires_at: minted.expiresAt,
      scope: minted.claims.scope,
      step: minted.claims.step,
      text: "Consent token minted for Step 2 generate_sosreport.",
    });
  });

  app.post("/api/engage/workflow/start", (req, res) => {
    const sessionId = normalizeSessionId(req.body?.session_id) ?? req.sessionId;
    const state = getOrCreateWorkflowState(req.userId, sessionId);
    return res.status(200).json({
      workflow: "engage_red_hat_support",
      workflow_session_id: state.workflowSessionId,
      current_step: "select_product",
      text: "Step 1: select product linux to continue.",
    });
  });

  app.post("/api/engage/workflow/select-product", (req, res) => {
    const product = String(req.body?.product ?? "").trim().toLowerCase();
    if (product !== "linux") {
      return res.status(422).json({
        code: "unsupported_product",
        message: "Only linux is supported in this workflow.",
        text: "Select linux to continue.",
      });
    }
    const requestedWorkflowSessionId = normalizeSessionId(req.body?.workflow_session_id);
    const workflowState = requestedWorkflowSessionId
      ? getWorkflowStateByWorkflowSessionId(req.userId, requestedWorkflowSessionId)
      : null;
    if (requestedWorkflowSessionId && !workflowState) {
      return res.status(409).json({
        code: "workflow_session_invalid",
        message: "Workflow session is invalid or no longer active.",
        text: "Restart Step 1 and retry product selection.",
      });
    }
    const sessionId = workflowState?.sessionId ?? normalizeSessionId(req.body?.session_id) ?? req.sessionId;
    const state = markWorkflowProductSelection(req.userId, sessionId, "linux");
    return res.status(200).json({
      workflow: "engage_red_hat_support",
      workflow_session_id: state.workflowSessionId,
      selected_product: "linux",
      current_step: "sos_report",
      text: "Step 1 complete. You can now request consent and run generate_sosreport.",
    });
  });

  app.get("/api/sosreport/jobs/:job_id", (req, res) => {
    pruneExpiredGenerateJobs();
    const jobId = String(req.params.job_id ?? "").trim();
    if (!jobId) {
      return res.status(400).json({
        code: "validation_error",
        message: "Missing job id.",
        text: "Provide a valid sosreport generate job id.",
      });
    }
    const job = getOwnedGenerateJob({ jobId, userId: req.userId, sessionId: req.sessionId });
    if (!job) {
      return res.status(404).json({
        code: "job_not_found",
        message: "Generate job not found.",
        text: "Start generate again to obtain a valid job id.",
      });
    }
    return res.status(200).json(mapGenerateJobState(job));
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
      sessionId: string;
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
