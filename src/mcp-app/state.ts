export type WorkflowStep =
  | "select_product"
  | "troubleshooting"
  | "sos_report"
  | "jira_attach"
  | "completed"
  | "failed";
export type JiraAuthMode = "basic_cloud" | "bearer_pat";

export type WorkflowState = {
  current_step: WorkflowStep;
  selected_product?: string;
  troubleshooting_reviewed: boolean;
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

export type CpuTelemetryRow = {
  sampled_at: string;
  model: string;
  logical_cores: number;
  physical_cores: number;
  frequency_mhz: number;
  load_avg_1m: number;
  load_avg_5m: number;
  load_avg_15m: number;
  cpu_line: string;
};

export type UiState = {
  statusMessage: string;
  statusVariant: StatusVariant;
  isGenerating: boolean;
  telemetry_resource_uri: string | null;
  telemetry_subscribed: boolean;
  telemetry_rows: CpuTelemetryRow[];
  telemetry_last_read_at: string | null;
};
