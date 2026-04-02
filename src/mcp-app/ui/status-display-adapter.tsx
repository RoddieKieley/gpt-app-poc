import type { StatusVariant } from "../state";
import { mapStatusVariantToken } from "./adapter-contract";
import type { AdapterMode } from "./adapter-mode";

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

export function StatusDisplayAdapter({ message, variant, mode: _mode }: StatusDisplayAdapterProps) {
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
