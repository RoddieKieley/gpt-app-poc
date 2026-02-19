export type JiraErrorCode =
  | "invalid_credentials"
  | "forbidden"
  | "not_found"
  | "artifact_invalid"
  | "connection_expired"
  | "connection_revoked"
  | "upstream_unavailable"
  | "validation_error"
  | "unexpected_error";

export type JiraMappedError = {
  code: JiraErrorCode;
  status: number;
  message: string;
};

export const mapJiraHttpError = (status: number): JiraMappedError => {
  if (status === 400 || status === 422) {
    return { code: "validation_error", status, message: "Invalid request for Jira operation." };
  }
  if (status === 401) {
    return { code: "invalid_credentials", status, message: "Jira credentials are invalid or expired." };
  }
  if (status === 403) {
    return { code: "forbidden", status, message: "You do not have permission for this Jira issue." };
  }
  if (status === 404) {
    return { code: "not_found", status, message: "Target Jira issue or attachment resource was not found." };
  }
  if (status === 413) {
    return { code: "artifact_invalid", status, message: "Selected artifact exceeds Jira upload limits." };
  }
  if (status >= 500) {
    return { code: "upstream_unavailable", status, message: "Jira is temporarily unavailable. Try again later." };
  }
  return { code: "unexpected_error", status, message: "Unexpected Jira integration error." };
};

export const mapJiraRedirectError = (location?: string | null): JiraMappedError => {
  const hasLocation = typeof location === "string" && location.trim().length > 0;
  const guidance = hasLocation
    ? `Jira redirected the API request to an interactive login URL (${location}).`
    : "Jira redirected the API request to an interactive login URL.";
  return {
    code: "invalid_credentials",
    status: 401,
    message: `${guidance} Use a Jira API base URL and a PAT that supports direct REST API access (non-SAML browser login).`,
  };
};

