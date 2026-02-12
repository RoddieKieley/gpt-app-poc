const SECRET_PATTERNS: RegExp[] = [
  /(authorization\s*:\s*)(bearer\s+)?[a-z0-9._~+/=-]+/gi,
  /("authorization"\s*:\s*")(bearer\s+)?([^"]+)(")/gi,
  /("pat"\s*:\s*")([^"]+)(")/gi,
  /("token"\s*:\s*")([^"]+)(")/gi,
  /(pat\s*[:=]\s*)[^\s,]+/gi,
  /(token\s*[:=]\s*)[^\s,]+/gi,
  /(bearer\s+)[a-z0-9._~+/=-]+/gi,
];

export const redactSecrets = (value: string): string =>
  SECRET_PATTERNS.reduce(
    (text, pattern) =>
      text.replace(
        pattern,
        (...args: unknown[]) => {
          const match = String(args[0]);
          if (match.startsWith("\"authorization\"")) return "\"authorization\":\"[REDACTED]\"";
          if (match.startsWith("\"pat\"")) return "\"pat\":\"[REDACTED]\"";
          if (match.startsWith("\"token\"")) return "\"token\":\"[REDACTED]\"";
          const p1 = typeof args[1] === "string" ? args[1] : "";
          return `${p1}[REDACTED]`;
        },
      ),
    value,
  );

export const sanitizeForLog = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return redactSecrets(value);
  try {
    return redactSecrets(JSON.stringify(value));
  } catch {
    return "[UNSERIALIZABLE]";
  }
};

export const safeError = (error: unknown): { message: string } => {
  const message = error instanceof Error ? error.message : String(error);
  return { message: redactSecrets(message) };
};

