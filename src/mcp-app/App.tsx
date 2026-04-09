import { Step1Content, Step2Content, Step3Content, Step4Content } from "./step-content";
import type { FormState, JiraAuthMode, UiState, WorkflowStep } from "./state";
import { ProgressAffordanceAdapter } from "./ui/progress-affordance-adapter";
import { StatusDisplayAdapter } from "./ui/status-display-adapter";

type AppProps = {
  currentStep: WorkflowStep;
  formState: FormState;
  uiState: UiState;
  onNavigateStep1: () => void;
  onNavigateStep2: () => void;
  onNavigateStep3: () => void;
  onNavigateStep4: () => void;
  onProductChange: (value: string) => void;
  onFetchReferenceChange: (value: string) => void;
  onArtifactRefChange: (value: string) => void;
  onJiraUrlChange: (value: string) => void;
  onJiraAuthModeChange: (value: JiraAuthMode) => void;
  onJiraEmailChange: (value: string) => void;
  onJiraApiTokenChange: (value: string) => void;
  onJiraPatChange: (value: string) => void;
  onConnectionIdChange: (value: string) => void;
  onIssueKeyChange: (value: string) => void;
  onStep1Continue: () => void;
  onGenerate: () => void;
  onFetch: () => void;
  onStep2Continue: () => void;
  onStep3Continue: () => void;
  onConnect: () => void;
  onVerify: () => void;
  onStatus: () => void;
  onList: () => void;
  onAttach: () => void;
  onDisconnect: () => void;
};

const toStepIndex = (step: WorkflowStep): number => {
  if (step === "troubleshooting") return 2;
  if (step === "sos_report") return 3;
  if (step === "jira_attach") return 4;
  return 1;
};

export function EngageWorkflowApp(props: AppProps) {
  const {
    currentStep,
    formState,
    uiState,
    onNavigateStep1,
    onNavigateStep2,
    onNavigateStep3,
    onNavigateStep4,
    onProductChange,
    onFetchReferenceChange,
    onArtifactRefChange,
    onJiraUrlChange,
    onJiraAuthModeChange,
    onJiraEmailChange,
    onJiraApiTokenChange,
    onJiraPatChange,
    onConnectionIdChange,
    onIssueKeyChange,
    onStep1Continue,
    onGenerate,
    onFetch,
    onStep2Continue,
    onStep3Continue,
    onConnect,
    onVerify,
    onStatus,
    onList,
    onAttach,
    onDisconnect,
  } = props;

  const stepIndex = toStepIndex(currentStep);

  return (
    <section className="rhds-shell__page-section">
      <h1 className="rhds-shell__title">Support Workflow Assistant</h1>
      <StatusDisplayAdapter
        message={uiState.statusMessage}
        variant={uiState.statusVariant}
      />
      <ProgressAffordanceAdapter
        stepIndex={stepIndex}
        onNavigateStep1={onNavigateStep1}
        onNavigateStep2={onNavigateStep2}
        onNavigateStep3={onNavigateStep3}
        onNavigateStep4={onNavigateStep4}
        step1Content={(
          <Step1Content
            product={formState.product}
            onProductChange={onProductChange}
            onContinue={onStep1Continue}
          />
        )}
        step2Content={(
          <Step2Content
            onContinue={onStep2Continue}
          />
        )}
        step3Content={(
          <Step3Content
            fetchReference={formState.fetchReference}
            artifactRef={formState.artifactRef}
            canFetch={formState.fetchReference.trim().length > 0}
            isGenerating={uiState.isGenerating}
            onFetchReferenceChange={onFetchReferenceChange}
            onArtifactRefChange={onArtifactRefChange}
            onGenerate={onGenerate}
            onFetch={onFetch}
            onContinue={onStep3Continue}
          />
        )}
        step4Content={(
          <Step4Content
            jiraUrl={formState.jiraUrl}
            jiraAuthMode={formState.jiraAuthMode}
            jiraEmail={formState.jiraEmail}
            jiraApiToken={formState.jiraApiToken}
            jiraPat={formState.jiraPat}
            connectionId={formState.connectionId}
            issueKey={formState.issueKey}
            artifactRef={formState.artifactRef}
            onJiraUrlChange={onJiraUrlChange}
            onJiraAuthModeChange={onJiraAuthModeChange}
            onJiraEmailChange={onJiraEmailChange}
            onJiraApiTokenChange={onJiraApiTokenChange}
            onJiraPatChange={onJiraPatChange}
            onConnectionIdChange={onConnectionIdChange}
            onIssueKeyChange={onIssueKeyChange}
            onConnect={onConnect}
            onVerify={onVerify}
            onStatus={onStatus}
            onList={onList}
            onAttach={onAttach}
            onDisconnect={onDisconnect}
          />
        )}
      />
    </section>
  );
}
