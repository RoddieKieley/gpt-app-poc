import fs from "node:fs/promises";
import { mapJiraHttpError, mapJiraRedirectError, JiraMappedError } from "./jira-error-mapping.js";

export type JiraAttachment = {
  issue_key: string;
  attachment_id: string;
  filename: string;
  size_bytes: number;
  created_at: string;
};

type FetchLike = typeof fetch;

const jiraAuthHeader = (pat: string) => `Bearer ${pat}`;

const throwMapped = async (res: Response): Promise<never> => {
  const mapped = mapJiraHttpError(res.status);
  throw mapped;
};

const throwRedirectIfPresent = (res: Response): void => {
  if (res.status < 300 || res.status >= 400) return;
  throw mapJiraRedirectError(res.headers.get("location"));
};

export class JiraClient {
  constructor(private readonly fetchImpl: FetchLike = fetch) {}

  async verifyConnection(baseUrl: string, pat: string): Promise<void> {
    if (process.env.JIRA_MOCK_MODE === "1") {
      if (pat === "bad-token") {
        throw mapJiraHttpError(401);
      }
      return;
    }
    const url = `${baseUrl.replace(/\/$/, "")}/rest/api/2/myself`;
    const res = await this.fetchImpl(url, {
      method: "GET",
      redirect: "manual",
      headers: {
        Authorization: jiraAuthHeader(pat),
        Accept: "application/json",
      },
    });
    throwRedirectIfPresent(res);
    if (!res.ok) await throwMapped(res);
  }

  async listAttachments(
    baseUrl: string,
    pat: string,
    issueKey: string,
  ): Promise<JiraAttachment[]> {
    if (process.env.JIRA_MOCK_MODE === "1") {
      if (issueKey === "FORBIDDEN-1") throw mapJiraHttpError(403);
      if (issueKey === "MISSING-1") throw mapJiraHttpError(404);
      return [
        {
          issue_key: issueKey,
          attachment_id: "2001",
          filename: "existing.txt",
          size_bytes: 128,
          created_at: new Date().toISOString(),
        },
      ];
    }
    const url = `${baseUrl.replace(/\/$/, "")}/rest/api/2/issue/${encodeURIComponent(issueKey)}?fields=attachment`;
    const res = await this.fetchImpl(url, {
      method: "GET",
      redirect: "manual",
      headers: {
        Authorization: jiraAuthHeader(pat),
        Accept: "application/json",
      },
    });
    throwRedirectIfPresent(res);
    if (!res.ok) await throwMapped(res);
    const body = (await res.json()) as {
      fields?: { attachment?: Array<{ id: string; filename: string; size: number; created: string }> };
    };
    return (body.fields?.attachment ?? []).map((item) => ({
      issue_key: issueKey,
      attachment_id: item.id,
      filename: item.filename,
      size_bytes: item.size,
      created_at: item.created,
    }));
  }

  async attachArtifact(
    baseUrl: string,
    pat: string,
    issueKey: string,
    filePath: string,
    filename: string,
  ): Promise<JiraAttachment> {
    if (process.env.JIRA_MOCK_MODE === "1") {
      const stats = await fs.stat(filePath);
      if (issueKey === "FORBIDDEN-1") throw mapJiraHttpError(403);
      if (issueKey === "MISSING-1") throw mapJiraHttpError(404);
      if (stats.size > Number.parseInt(process.env.JIRA_ATTACHMENT_MAX_BYTES ?? "26214400", 10)) {
        throw mapJiraHttpError(413);
      }
      return {
        issue_key: issueKey,
        attachment_id: "3001",
        filename,
        size_bytes: stats.size,
        created_at: new Date().toISOString(),
      };
    }
    const content = await fs.readFile(filePath);
    const form = new FormData();
    form.append("file", new Blob([content]), filename);
    const url = `${baseUrl.replace(/\/$/, "")}/rest/api/2/issue/${encodeURIComponent(issueKey)}/attachments`;
    const res = await this.fetchImpl(url, {
      method: "POST",
      redirect: "manual",
      headers: {
        Authorization: jiraAuthHeader(pat),
        "X-Atlassian-Token": "no-check",
      },
      body: form,
    });
    throwRedirectIfPresent(res);
    if (!res.ok) await throwMapped(res);
    const body = (await res.json()) as Array<{
      id: string;
      filename: string;
      size: number;
      created: string;
    }>;
    const first = body[0];
    if (!first) {
      const err: JiraMappedError = {
        code: "unexpected_error",
        status: 502,
        message: "Jira upload returned no attachment record.",
      };
      throw err;
    }
    return {
      issue_key: issueKey,
      attachment_id: first.id,
      filename: first.filename,
      size_bytes: first.size,
      created_at: first.created,
    };
  }
}

