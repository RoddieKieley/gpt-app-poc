import { sanitizeForLog } from "./redaction.js";

export type SecurityEventAction =
  | "connect"
  | "verify"
  | "list_attachments"
  | "attach"
  | "revoke"
  | "expire";

export type SecurityEvent = {
  action: SecurityEventAction;
  outcome: "success" | "failed" | "denied";
  userId: string;
  connectionId?: string;
  errorCode?: string;
  requestId?: string;
  details?: Record<string, unknown>;
};

export const emitSecurityEvent = (event: SecurityEvent): void => {
  // Structured log output remains secret-safe by redacting all serialized payloads.
  const safe = sanitizeForLog({
    timestamp: new Date().toISOString(),
    ...event,
  });
  console.info(`[security_event] ${safe}`);
};

