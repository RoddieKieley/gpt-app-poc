import type { ReactNode } from "react";
import { resolveStepNavigation } from "./adapter-contract";
import type { AdapterMode } from "./adapter-mode";

type ProgressAffordanceAdapterProps = {
  stepIndex: number;
  onNavigateStep1: () => void;
  onNavigateStep2: () => void;
  onNavigateStep3: () => void;
  onNavigateStep4: () => void;
  step1Content: ReactNode;
  step2Content: ReactNode;
  step3Content: ReactNode;
  step4Content: ReactNode;
  mode?: AdapterMode;
};

export const navigateByStepId = (
  stepId: number,
  onNavigateStep1: () => void,
  onNavigateStep2: () => void,
  onNavigateStep3: () => void,
  onNavigateStep4: () => void,
): void => {
  resolveStepNavigation(stepId, onNavigateStep1, onNavigateStep2, onNavigateStep3, onNavigateStep4);
};

export function ProgressAffordanceAdapter({
  stepIndex,
  onNavigateStep1,
  onNavigateStep2,
  onNavigateStep3,
  onNavigateStep4,
  step1Content,
  step2Content,
  step3Content,
  step4Content,
  mode: _mode,
}: ProgressAffordanceAdapterProps) {
  const contentByStep: Record<number, ReactNode> = {
    1: step1Content,
    2: step2Content,
    3: step3Content,
    4: step4Content,
  };

  return (
    <section className="rhds-shell__wizard" aria-label="Workflow steps">
      <nav className="rhds-step-nav" aria-label="Workflow step navigation">
        <button
          type="button"
          className={`rhds-step-nav__item ${stepIndex === 1 ? "rhds-step-nav__item--active" : ""}`}
          aria-current={stepIndex === 1 ? "step" : undefined}
          onClick={() => navigateByStepId(1, onNavigateStep1, onNavigateStep2, onNavigateStep3, onNavigateStep4)}
        >
          Step 1: Select Product
        </button>
        <button
          type="button"
          className={`rhds-step-nav__item ${stepIndex === 2 ? "rhds-step-nav__item--active" : ""}`}
          aria-current={stepIndex === 2 ? "step" : undefined}
          onClick={() => navigateByStepId(2, onNavigateStep1, onNavigateStep2, onNavigateStep3, onNavigateStep4)}
        >
          Step 2: Troubleshooting
        </button>
        <button
          type="button"
          className={`rhds-step-nav__item ${stepIndex === 3 ? "rhds-step-nav__item--active" : ""}`}
          aria-current={stepIndex === 3 ? "step" : undefined}
          onClick={() => navigateByStepId(3, onNavigateStep1, onNavigateStep2, onNavigateStep3, onNavigateStep4)}
        >
          Step 3: Generate + Fetch sos
        </button>
        <button
          type="button"
          className={`rhds-step-nav__item ${stepIndex === 4 ? "rhds-step-nav__item--active" : ""}`}
          aria-current={stepIndex === 4 ? "step" : undefined}
          onClick={() => navigateByStepId(4, onNavigateStep1, onNavigateStep2, onNavigateStep3, onNavigateStep4)}
        >
          Step 4: Connect + Verify + Attach
        </button>
      </nav>
      <div className="rhds-step-panel">
        {contentByStep[stepIndex] ?? step1Content}
      </div>
    </section>
  );
}
