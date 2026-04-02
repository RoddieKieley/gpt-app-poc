import { Alert, AlertVariant } from "@patternfly/react-core";
import type { StatusVariant } from "../state";
import { mapStatusVariantToken } from "./adapter-contract";
import { resolveAdapterMode, type AdapterMode } from "./adapter-mode";

export const toPatternflyAlertVariant = (variant: StatusVariant): AlertVariant => {
  const token = mapStatusVariantToken(variant);
  switch (token) {
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

type StatusDisplayAdapterProps = {
  message: string;
  variant: StatusVariant;
  mode?: AdapterMode;
};

const toRhdsClassName = (variant: StatusVariant): string => {
  const token = mapStatusVariantToken(variant);
  if (token === "success") return "rhds-status rhds-status--success";
  if (token === "warning") return "rhds-status rhds-status--warning";
  if (token === "danger") return "rhds-status rhds-status--danger";
  return "rhds-status rhds-status--info";
};

export function StatusDisplayAdapter({ message, variant, mode }: StatusDisplayAdapterProps) {
  const resolvedMode = resolveAdapterMode("status", mode);

  if (resolvedMode === "patternfly") {
    return (
      <Alert
        id="status"
        isInline
        className="rhds-shell__status-alert"
        variant={toPatternflyAlertVariant(variant)}
        title={message}
      />
    );
  }

  return (
    <div
      id="status"
      className={`rhds-shell__status-alert ${toRhdsClassName(variant)}`}
      role="status"
      aria-live="polite"
    >
      {message}
    </div>
  );
}
