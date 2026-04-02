import type { StatusVariant } from "../state";

export type ActionButtonVariant = "primary" | "secondary" | "link";

export const mapStatusVariantToken = (variant: StatusVariant): StatusVariant => variant;

export const normalizeActionButtonVariant = (variant?: ActionButtonVariant): ActionButtonVariant => {
  if (variant === "secondary") return "secondary";
  if (variant === "link") return "link";
  return "primary";
};

export const resolveStepNavigation = (
  stepId: number,
  onNavigateStep1: () => void,
  onNavigateStep2: () => void,
  onNavigateStep3: () => void,
): void => {
  if (stepId === 1) onNavigateStep1();
  if (stepId === 2) onNavigateStep2();
  if (stepId === 3) onNavigateStep3();
};
