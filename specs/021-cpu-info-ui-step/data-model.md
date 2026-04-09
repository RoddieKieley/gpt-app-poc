# Data Model: Engage Troubleshooting Step Insertion

## Entity: WorkflowStepState

- **Purpose**: Canonical UI workflow-step discriminator and transition anchor.
- **Values**:
  - `select_product`
  - `troubleshooting`
  - `sos_report`
  - `jira_attach`
  - `completed`
  - `failed`
- **Validation rules**:
  - `troubleshooting` must be reachable only after successful linux product selection.
  - `sos_report` must be reachable only after troubleshooting step completion.
  - Existing terminal states (`completed`, `failed`) remain unchanged.

## Entity: WorkflowRouteHashMap

- **Purpose**: Browser hash routing map for deep-link and bootstrap behavior.
- **Fields**:
  - `select_product -> step-1`
  - `troubleshooting -> step-2`
  - `sos_report -> step-3`
  - `jira_attach -> step-4`
- **Validation rules**:
  - Hash labels must remain unique and deterministic.
  - Bootstrap must default to step 1 on unknown hashes.
  - Route map must be synchronized with progress navigation labels.

## Entity: ProgressNavigationModel

- **Purpose**: Defines the visible workflow step list and click-navigation callbacks.
- **Fields**:
  - `stepIndex` (1..4)
  - `stepLabels` in ordered sequence
  - `navigateByStepId` callbacks for steps 1..4
  - `contentByStep` map for rendered step components
- **Validation rules**:
  - Step index and label must match `WorkflowRouteHashMap`.
  - Active step highlighting must reflect current workflow state.
  - Navigation gates must prevent direct access to blocked downstream steps.

## Entity: TroubleshootingCpuRow

- **Purpose**: Static display row representing one `get_cpu_information` payload sample.
- **Fields**:
  - `model`
  - `logical_cores`
  - `physical_cores`
  - `frequency_mhz`
  - `load_avg_1m`
  - `load_avg_5m`
  - `load_avg_15m`
  - `cpu_line`
- **Validation rules**:
  - Exactly one row is rendered in this phase.
  - Column keys and ordering remain aligned with `CpuInfo`.
  - Missing values render explicit placeholders rather than blocking progression.

## Entity: EngageStepResourceEntry

- **Purpose**: Resource registration record for UI step discovery under `ui://engage-red-hat-support`.
- **Fields**:
  - `entryUri` (`ui://engage-red-hat-support/app.html`)
  - `stepUri` (including new troubleshooting URI)
  - `title`
  - `stepNumber`
  - metadata parity (`openai/widgetDomain`, `openai/widgetCSP`)
- **Validation rules**:
  - Entry URI remains stable.
  - Troubleshooting URI is added without removing existing URIs.
  - Registration function/pattern remains identical across all step URIs.

## Entity: SkillWorkflowSequence

- **Purpose**: Ordered instruction model for text/headless fallback guidance.
- **Fields**:
  - step 1: select product
  - step 2: troubleshooting (review CPU table output guidance)
  - step 3: consent + generate/fetch sos
  - step 4: Jira connect/verify/attach
- **Validation rules**:
  - Sequence order must mirror UI step order.
  - Deterministic fallback keys from existing workflow remain available.
  - Security boundary statements remain unchanged (no PAT/token leakage in MCP-visible payloads).
