export type WorkflowStep = "select_product" | "sos_report" | "jira_attach" | "completed" | "failed";
export type JiraAuthMode = "basic_cloud" | "bearer_pat";

export type WorkflowState = {
  current_step: WorkflowStep;
  selected_product?: string;
  fetch_reference?: string;
  artifact_ref?: string;
  connection_id?: string;
  issue_key?: string;
  issue_access_verified: boolean;
  last_error_code?: string;
};

export type FormState = {
  product: string;
  jiraUrl: string;
  jiraAuthMode: JiraAuthMode;
  jiraEmail: string;
  jiraApiToken: string;
  jiraPat: string;
  connectionId: string;
  issueKey: string;
  fetchReference: string;
  artifactRef: string;
};

export type StatusVariant = "info" | "success" | "warning" | "danger";

export type UiState = {
  statusMessage: string;
  statusVariant: StatusVariant;
  isGenerating: boolean;
};
