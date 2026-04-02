import type { ReactNode } from "react";
import { normalizeActionButtonVariant, type ActionButtonVariant } from "./adapter-contract";
import type { AdapterMode } from "./adapter-mode";

type ActionButtonAdapterProps = {
  id: string;
  variant?: ActionButtonVariant;
  isDisabled?: boolean;
  onClick: () => void;
  children: ReactNode;
  mode?: AdapterMode;
};

const toRhdsButtonClassName = (variant: ActionButtonVariant): string => {
  if (variant === "secondary") return "rhds-btn rhds-btn--secondary";
  if (variant === "link") return "rhds-btn rhds-btn--link";
  return "rhds-btn rhds-btn--primary";
};

export function ActionButtonAdapter({
  id,
  variant = "primary",
  isDisabled = false,
  onClick,
  children,
  mode: _mode,
}: ActionButtonAdapterProps) {
  const resolvedVariant = normalizeActionButtonVariant(variant);

  return (
    <button
      id={id}
      type="button"
      className={toRhdsButtonClassName(resolvedVariant)}
      disabled={isDisabled}
      onClick={onClick}
      data-rhds-button="true"
    >
      {children}
    </button>
  );
}
