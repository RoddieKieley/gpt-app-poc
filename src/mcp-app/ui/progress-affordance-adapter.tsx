import { Wizard } from "@patternfly/react-core";
import type { ReactElement, ReactNode } from "react";
import { resolveStepNavigation } from "./adapter-contract";
import { resolveAdapterMode, type AdapterMode } from "./adapter-mode";

const WizardAny = Wizard as unknown as (props: Record<string, unknown>) => ReactElement;

type ProgressAffordanceAdapterProps = {
  stepIndex: number;
  onNavigateStep1: () => void;
  onNavigateStep2: () => void;
  onNavigateStep3: () => void;
  children: ReactNode;
  mode?: AdapterMode;
};

export const navigateByStepId = (
  stepId: number,
  onNavigateStep1: () => void,
  onNavigateStep2: () => void,
  onNavigateStep3: () => void,
): void => {
  resolveStepNavigation(stepId, onNavigateStep1, onNavigateStep2, onNavigateStep3);
};

export function ProgressAffordanceAdapter({
  stepIndex,
  onNavigateStep1,
  onNavigateStep2,
  onNavigateStep3,
  children,
  mode,
}: ProgressAffordanceAdapterProps) {
  const resolvedMode = resolveAdapterMode("progress", mode);
  const className =
    resolvedMode === "rhds" ? "rhds-shell__wizard rhds-shell__wizard--hybrid" : "rhds-shell__wizard";

  return (
    <WizardAny
      key={stepIndex}
      className={className}
      navAriaLabel="Workflow steps"
      startAtStep={stepIndex}
      onGoToStep={(_event: unknown, step: unknown) => {
        const nextStepId = Number((step as { id?: number }).id ?? 1);
        navigateByStepId(nextStepId, onNavigateStep1, onNavigateStep2, onNavigateStep3);
      }}
      footer={<div />}
    >
      {children}
    </WizardAny>
  );
}
