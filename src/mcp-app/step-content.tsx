import {
  ActionGroup,
  Button,
  Form,
  FormGroup,
  MenuToggle,
  MenuToggleElement,
  Select,
  SelectList,
  SelectOption,
  Spinner,
  TextInput,
} from "@patternfly/react-core";
import { useState } from "react";
import type { Ref } from "react";

type Step1Props = {
  product: string;
  onProductChange: (value: string) => void;
  onContinue: () => void;
};

type Step2Props = {
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

type Step3Props = {
  jiraUrl: string;
  jiraPat: string;
  connectionId: string;
  issueKey: string;
  artifactRef: string;
  onJiraUrlChange: (value: string) => void;
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
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Form>
      <FormGroup label="Supported product" fieldId="product-select">
        <Select
          selected={product}
          isOpen={isOpen}
          onSelect={(_e, value) => {
            onProductChange(String(value));
            setIsOpen(false);
          }}
          onOpenChange={(nextOpen: boolean) => setIsOpen(nextOpen)}
          toggle={(toggleRef: Ref<MenuToggleElement>) => (
            <MenuToggle ref={toggleRef} onClick={() => setIsOpen((prev) => !prev)}>
              {product === "linux" ? "Red Hat Enterprise Linux" : product}
            </MenuToggle>
          )}
        >
          <SelectList>
            <SelectOption value="linux">Red Hat Enterprise Linux</SelectOption>
            <SelectOption value="openshift">OpenShift (not yet supported)</SelectOption>
            <SelectOption value="ansible">Ansible (not yet supported)</SelectOption>
          </SelectList>
        </Select>
      </FormGroup>
      <ActionGroup>
        <Button id="step-1-continue-btn" onClick={onContinue}>Continue to Step 2</Button>
      </ActionGroup>
    </Form>
  );
}

export function Step2Content(props: Step2Props) {
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
    <Form>
      <FormGroup label="Generate and fetch sosreport" fieldId="generate-btn">
        <ActionGroup>
          <Button id="generate-btn" onClick={onGenerate}>Generate sosreport</Button>
          <Button id="fetch-btn" variant="secondary" isDisabled={!canFetch} onClick={onFetch}>
            Fetch sosreport
          </Button>
          {isGenerating ? <Spinner size="md" aria-label="Generating sosreport" /> : null}
        </ActionGroup>
      </FormGroup>
      <FormGroup label="Fetch reference" fieldId="fetch-reference">
        <TextInput
          id="fetch-reference"
          value={fetchReference}
          onChange={(_e, value) => onFetchReferenceChange(value)}
        />
      </FormGroup>
      <FormGroup label="Artifact path" fieldId="artifact-ref">
        <TextInput
          id="artifact-ref"
          value={artifactRef}
          onChange={(_e, value) => onArtifactRefChange(value)}
        />
      </FormGroup>
      <ActionGroup>
        <Button id="step-2-continue-btn" onClick={onContinue}>Continue to Step 3</Button>
      </ActionGroup>
    </Form>
  );
}

export function Step3Content(props: Step3Props) {
  const {
    jiraUrl,
    jiraPat,
    connectionId,
    issueKey,
    artifactRef,
    onJiraUrlChange,
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
    <Form>
      <FormGroup label="Jira base URL" fieldId="jira-url">
        <TextInput id="jira-url" value={jiraUrl} onChange={(_e, value) => onJiraUrlChange(value)} />
      </FormGroup>
      <FormGroup label="Jira PAT" fieldId="jira-pat">
        <TextInput
          id="jira-pat"
          type="password"
          value={jiraPat}
          onChange={(_e, value) => onJiraPatChange(value)}
        />
      </FormGroup>
      <FormGroup label="Connection ID" fieldId="connection-id">
        <TextInput
          id="connection-id"
          value={connectionId}
          onChange={(_e, value) => onConnectionIdChange(value)}
        />
      </FormGroup>
      <FormGroup label="Issue key" fieldId="issue-key">
        <TextInput id="issue-key" value={issueKey} onChange={(_e, value) => onIssueKeyChange(value)} />
      </FormGroup>
      <FormGroup label="Artifact reference" fieldId="step3-artifact-ref">
        <TextInput id="step3-artifact-ref" value={artifactRef} readOnly />
      </FormGroup>
      <ActionGroup>
        <Button id="connect-btn" onClick={onConnect}>Connect</Button>
        <Button id="verify-btn" variant="secondary" onClick={onVerify}>Verify connection</Button>
        <Button id="status-btn" variant="secondary" onClick={onStatus}>Check status tool</Button>
        <Button id="list-btn" variant="secondary" onClick={onList}>List attachments</Button>
        <Button id="attach-btn" variant="secondary" onClick={onAttach}>Attach artifact</Button>
        <Button id="disconnect-btn" variant="link" onClick={onDisconnect}>Disconnect</Button>
      </ActionGroup>
    </Form>
  );
}
