import { ZodError } from "zod";
type ToolContent = { type: "text"; text: string };

export type SosreportErrorCode =
  | "validation_error"
  | "dependency_missing"
  | "privilege_required"
  | "timeout"
  | "archive_not_found"
  | "path_unsafe"
  | "read_failed"
  | "copy_failed"
  | "unexpected_error";

export class SosreportError extends Error {
  code: SosreportErrorCode;

  constructor(code: SosreportErrorCode, message: string) {
    super(message);
    this.name = "SosreportError";
    this.code = code;
  }
}

const errorTextFallback: Record<SosreportErrorCode, string> = {
  validation_error: "Request validation failed. Fix the input and try again.",
  dependency_missing: "sos is not available locally. Install sos before retrying.",
  privilege_required: "Privileged execution failed. Verify sudoers NOPASSWD configuration for sudo -n.",
  timeout: "sosreport generation timed out after 10 minutes. Retry with reduced scope.",
  archive_not_found: "Could not locate generated archive. Verify sos output and local archive directories.",
  path_unsafe: "fetch_reference is not an approved absolute local sosreport archive path.",
  read_failed: "Failed to read sosreport archive from local filesystem.",
  copy_failed: "Failed to copy archive into /tmp. Check permissions and disk space.",
  unexpected_error: "Unexpected sosreport failure. Review server logs for non-sensitive details.",
};

export const normalizeSosreportError = (error: unknown): SosreportError => {
  if (error instanceof SosreportError) {
    return error;
  }
  if (error instanceof ZodError) {
    return new SosreportError("validation_error", error.issues[0]?.message ?? "Request validation failed.");
  }
  if (error instanceof Error) {
    return new SosreportError("unexpected_error", error.message);
  }
  return new SosreportError("unexpected_error", "Unknown sosreport error.");
};

export const toSosreportToolError = (error: unknown) => {
  const normalized = normalizeSosreportError(error);
  const fallback = errorTextFallback[normalized.code] ?? errorTextFallback.unexpected_error;
  const textMessage = `${normalized.message}\n${fallback}`;
  return {
    isError: true,
    content: <ToolContent[]>[{ type: "text", text: textMessage }],
    structuredContent: { code: normalized.code, message: normalized.message, text: fallback },
  };
};
