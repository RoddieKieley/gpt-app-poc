import type { JiraAuthMode } from "./state";
import { ActionButtonAdapter } from "./ui/action-button-adapter";

type Step1Props = {
  product: string;
  onProductChange: (value: string) => void;
  onContinue: () => void;
};

type Step2Props = {
  rows: Array<{
    sampled_at: string;
    model: string;
    logical_cores: number;
    physical_cores: number;
    frequency_mhz: number;
    load_avg_1m: number;
    load_avg_5m: number;
    load_avg_15m: number;
    cpu_line: string;
  }>;
  onContinue: () => void;
};

type Step3Props = {
  fetchReference: string;
  artifactRef: string;
  canFetch: boolean;
  isGenerating: boolean;
  onFetchReferenceChange: (value: string) => void;
  onArtifactRefChange: (value: string) => void;
  onGenerate: () => void;
  onFetch: () => void;
  onContinue: () => void;
};

type Step4Props = {
  jiraUrl: string;
  jiraAuthMode: JiraAuthMode;
  jiraEmail: string;
  jiraApiToken: string;
  jiraPat: string;
  connectionId: string;
  issueKey: string;
  artifactRef: string;
  onJiraUrlChange: (value: string) => void;
  onJiraAuthModeChange: (value: JiraAuthMode) => void;
  onJiraEmailChange: (value: string) => void;
  onJiraApiTokenChange: (value: string) => void;
  onJiraPatChange: (value: string) => void;
  onConnectionIdChange: (value: string) => void;
  onIssueKeyChange: (value: string) => void;
  onConnect: () => void;
  onVerify: () => void;
  onStatus: () => void;
  onList: () => void;
  onAttach: () => void;
  onDisconnect: () => void;
};

export function Step1Content(props: Step1Props) {
  const { product, onProductChange, onContinue } = props;

  return (
    <form className="rhds-step-form rhds-step-form--step1">
      <div className="rhds-field-group">
        <label htmlFor="product-select" className="rhds-field-label">Supported product</label>
        <select
          id="product-select"
          className="rhds-input"
          value={product}
          onChange={(event) => onProductChange(event.target.value)}
        >
          <option value="linux">Red Hat Enterprise Linux</option>
          <option value="openshift">OpenShift (not yet supported)</option>
          <option value="ansible">Ansible (not yet supported)</option>
        </select>
      </div>
      <div className="rhds-step-action-group">
        <ActionButtonAdapter id="step-1-continue-btn" onClick={onContinue}>
          Continue to Step 2
        </ActionButtonAdapter>
      </div>
    </form>
  );
}

export function Step2Content(props: Step2Props) {
  const { rows, onContinue } = props;
  const latestRow = rows.length > 0 ? rows[rows.length - 1] : null;

  return (
    <section className="rhds-step-form rhds-step-form--step2">
      <div className="rhds-field-group">
        <h2 className="rhds-step-heading">Troubleshooting: CPU information</h2>
        <p className="rhds-input-hint">
          Review the rolling local CPU telemetry before generating sosreport.
        </p>
      </div>
      <div className="rhds-cpu-static">
        <h3 className="rhds-cpu-static__title">CPU summary</h3>
        {latestRow ? (
          <dl className="rhds-cpu-static__list">
            <dt>Model</dt>
            <dd>{latestRow.model}</dd>
            <dt>Logical cores</dt>
            <dd>{latestRow.logical_cores}</dd>
            <dt>Physical cores</dt>
            <dd>{latestRow.physical_cores}</dd>
          </dl>
        ) : (
          <p className="rhds-input-hint">Waiting for first sample to populate CPU summary...</p>
        )}
      </div>
      <div className="rhds-table-wrap">
        <table className="rhds-table" aria-label="CPU information telemetry">
          <thead>
            <tr>
              <th scope="col">Sampled at</th>
              <th scope="col">Frequency (MHz)</th>
              <th scope="col">Load avg (1m)</th>
              <th scope="col">Load avg (5m)</th>
              <th scope="col">Load avg (15m)</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5}>Waiting for telemetry samples...</td>
              </tr>
            ) : rows.map((row) => (
              <tr key={row.sampled_at}>
                <td>{row.sampled_at}</td>
                <td>{row.frequency_mhz}</td>
                <td>{row.load_avg_1m}</td>
                <td>{row.load_avg_5m}</td>
                <td>{row.load_avg_15m}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="rhds-step-action-group">
        <ActionButtonAdapter id="step-2-continue-btn" onClick={onContinue}>
          Next: Step 3
        </ActionButtonAdapter>
      </div>
    </section>
  );
}

export function Step3Content(props: Step3Props) {
  const {
    fetchReference,
    artifactRef,
    canFetch,
    isGenerating,
    onFetchReferenceChange,
    onArtifactRefChange,
    onGenerate,
    onFetch,
    onContinue,
  } = props;

  return (
    <form className="rhds-step-form rhds-step-form--step3">
      <div className="rhds-field-group">
        <label htmlFor="generate-btn" className="rhds-field-label">Generate and fetch sosreport</label>
        <div className="rhds-step-action-group">
          <ActionButtonAdapter id="generate-btn" onClick={onGenerate}>
            Generate sosreport
          </ActionButtonAdapter>
          <ActionButtonAdapter id="fetch-btn" variant="secondary" isDisabled={!canFetch} onClick={onFetch}>
            Fetch sosreport
          </ActionButtonAdapter>
          {isGenerating ? <span className="rhds-step2-spinner" role="status" aria-live="polite">Generating...</span> : null}
        </div>
      </div>
      <div className="rhds-field-group">
        <label htmlFor="fetch-reference" className="rhds-field-label">Fetch reference</label>
        <input
          id="fetch-reference"
          className="rhds-input"
          value={fetchReference}
          onChange={(event) => onFetchReferenceChange(event.target.value)}
        />
      </div>
      <div className="rhds-field-group">
        <label htmlFor="artifact-ref" className="rhds-field-label">Artifact path</label>
        <input
          id="artifact-ref"
          className="rhds-input"
          value={artifactRef}
          onChange={(event) => onArtifactRefChange(event.target.value)}
        />
      </div>
      <div className="rhds-step-action-group">
        <ActionButtonAdapter id="step-3-continue-btn" onClick={onContinue}>
          Continue to Step 4
        </ActionButtonAdapter>
      </div>
    </form>
  );
}

export function Step4Content(props: Step4Props) {
  const {
    jiraUrl,
    jiraAuthMode,
    jiraEmail,
    jiraApiToken,
    jiraPat,
    connectionId,
    issueKey,
    artifactRef,
    onJiraUrlChange,
    onJiraAuthModeChange,
    onJiraEmailChange,
    onJiraApiTokenChange,
    onJiraPatChange,
    onConnectionIdChange,
    onIssueKeyChange,
    onConnect,
    onVerify,
    onStatus,
    onList,
    onAttach,
    onDisconnect,
  } = props;

  return (
    <form className="rhds-step-form rhds-step-form--step4">
      <div className="rhds-field-group">
        <label htmlFor="jira-url" className="rhds-field-label">Jira base URL</label>
        <input
          id="jira-url"
          className="rhds-input"
          value={jiraUrl}
          onChange={(event) => onJiraUrlChange(event.target.value)}
        />
      </div>
      <div className="rhds-field-group">
        <label htmlFor="jira-auth-mode" className="rhds-field-label">Jira auth mode</label>
        <select
          id="jira-auth-mode"
          className="rhds-input"
          value={jiraAuthMode}
          onChange={(event) => onJiraAuthModeChange(event.target.value as JiraAuthMode)}
        >
          <option value="basic_cloud">Atlassian Cloud (email + API token)</option>
          <option value="bearer_pat">Legacy bearer PAT</option>
        </select>
      </div>
      {jiraAuthMode === "basic_cloud" ? (
        <>
          <div className="rhds-field-group">
            <label htmlFor="jira-email" className="rhds-field-label">Atlassian account email</label>
            <input
              id="jira-email"
              className="rhds-input"
              value={jiraEmail}
              onChange={(event) => onJiraEmailChange(event.target.value)}
            />
          </div>
          <div className="rhds-field-group">
            <label htmlFor="jira-api-token" className="rhds-field-label">Jira API token</label>
            <input
              id="jira-api-token"
              type="password"
              className="rhds-input"
              value={jiraApiToken}
              onChange={(event) => onJiraApiTokenChange(event.target.value)}
            />
          </div>
        </>
      ) : (
        <div className="rhds-field-group">
          <label htmlFor="jira-pat" className="rhds-field-label">Jira PAT</label>
          <input
            id="jira-pat"
            type="password"
            className="rhds-input"
            value={jiraPat}
            onChange={(event) => onJiraPatChange(event.target.value)}
          />
        </div>
      )}
      <div className="rhds-field-group">
        <label htmlFor="connection-id" className="rhds-field-label">Connection ID</label>
        <input
          id="connection-id"
          className="rhds-input"
          value={connectionId}
          onChange={(event) => onConnectionIdChange(event.target.value)}
        />
      </div>
      <div className="rhds-field-group">
        <label htmlFor="issue-key" className="rhds-field-label">Issue key</label>
        <input
          id="issue-key"
          className="rhds-input"
          value={issueKey}
          onChange={(event) => onIssueKeyChange(event.target.value)}
        />
      </div>
      <div className="rhds-field-group">
        <label htmlFor="step3-artifact-ref" className="rhds-field-label">Artifact reference</label>
        <input id="step3-artifact-ref" className="rhds-input" value={artifactRef} readOnly />
      </div>
      <div className="rhds-step-action-group">
        <ActionButtonAdapter id="connect-btn" onClick={onConnect}>Connect</ActionButtonAdapter>
        <ActionButtonAdapter id="verify-btn" variant="secondary" onClick={onVerify}>
          Verify connection
        </ActionButtonAdapter>
        <ActionButtonAdapter id="status-btn" variant="secondary" onClick={onStatus}>
          Check status tool
        </ActionButtonAdapter>
        <ActionButtonAdapter id="list-btn" variant="secondary" onClick={onList}>
          List attachments
        </ActionButtonAdapter>
        <ActionButtonAdapter id="attach-btn" variant="secondary" onClick={onAttach}>
          Attach artifact
        </ActionButtonAdapter>
        <ActionButtonAdapter id="disconnect-btn" variant="link" onClick={onDisconnect}>
          Disconnect
        </ActionButtonAdapter>
      </div>
    </form>
  );
}
