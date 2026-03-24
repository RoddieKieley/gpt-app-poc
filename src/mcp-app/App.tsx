import { Alert, AlertVariant, PageSection, Title, Wizard, WizardStep } from "@patternfly/react-core";
import type { ReactElement } from "react";
import { Step1Content, Step2Content, Step3Content } from "./step-content";
import type { FormState, JiraAuthMode, UiState, WorkflowStep } from "./state";

type AppProps = {
  currentStep: WorkflowStep;
  formState: FormState;
  uiState: UiState;
  onNavigateStep1: () => void;
  onNavigateStep2: () => void;
  onNavigateStep3: () => void;
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
  onConnect: () => void;
  onVerify: () => void;
  onStatus: () => void;
  onList: () => void;
  onAttach: () => void;
  onDisconnect: () => void;
};

const statusToVariant = (variant: UiState["statusVariant"]): AlertVariant => {
  switch (variant) {
    case "success":
      return AlertVariant.success;
    case "warning":
      return AlertVariant.warning;
    case "danger":
      return AlertVariant.danger;
    default:
      return AlertVariant.info;
  }
};

const toStepIndex = (step: WorkflowStep): number => {
  if (step === "sos_report") return 2;
  if (step === "jira_attach") return 3;
  return 1;
};
const WizardAny = Wizard as unknown as (props: Record<string, unknown>) => ReactElement;

export function EngageWorkflowApp(props: AppProps) {
  const {
    currentStep,
    formState,
    uiState,
    onNavigateStep1,
    onNavigateStep2,
    onNavigateStep3,
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
    onConnect,
    onVerify,
    onStatus,
    onList,
    onAttach,
    onDisconnect,
  } = props;

  const stepIndex = toStepIndex(currentStep);

  return (
    <PageSection isFilled>
      <Title headingLevel="h1">Support Workflow Assistant</Title>
      <Alert
        id="status"
        isInline
        variant={statusToVariant(uiState.statusVariant)}
        title={uiState.statusMessage}
      />
      <WizardAny
        key={stepIndex}
        navAriaLabel="Workflow steps"
        startAtStep={stepIndex}
        onGoToStep={(_event: unknown, step: unknown) => {
          const stepId = Number((step as { id?: number }).id ?? 1);
          if (stepId === 1) onNavigateStep1();
          if (stepId === 2) onNavigateStep2();
          if (stepId === 3) onNavigateStep3();
        }}
        footer={<div />}
      >
        <WizardStep id={1} name="Step 1: Select Product">
          <Step1Content
            product={formState.product}
            onProductChange={onProductChange}
            onContinue={onStep1Continue}
          />
        </WizardStep>
        <WizardStep id={2} name="Step 2: Generate + Fetch sos">
          <Step2Content
            fetchReference={formState.fetchReference}
            artifactRef={formState.artifactRef}
            canFetch={formState.fetchReference.trim().length > 0}
            isGenerating={uiState.isGenerating}
            onFetchReferenceChange={onFetchReferenceChange}
            onArtifactRefChange={onArtifactRefChange}
            onGenerate={onGenerate}
            onFetch={onFetch}
            onContinue={onStep2Continue}
          />
        </WizardStep>
        <WizardStep id={3} name="Step 3: Connect + Verify + Attach">
          <Step3Content
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
        </WizardStep>
      </WizardAny>
    </PageSection>
  );
}
