export type AdapterFamily = "status" | "buttons" | "progress";
export type AdapterMode = "rhds";

const FAMILY_ENV: Record<AdapterFamily, string> = {
  status: "RHDS_STEP1_STATUS_MODE",
  buttons: "RHDS_STEP1_BUTTON_MODE",
  progress: "RHDS_STEP1_PROGRESS_MODE",
};

const DEFAULT_MODE_BY_FAMILY: Record<AdapterFamily, AdapterMode> = {
  status: "rhds",
  buttons: "rhds",
  progress: "rhds",
};

const toMode = (value: string | undefined): AdapterMode | null => {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "rhds") return "rhds";
  return null;
};

export const resolveAdapterMode = (
  family: AdapterFamily,
  explicitMode?: AdapterMode,
): AdapterMode => {
  if (explicitMode) return explicitMode;

  const perFamily = toMode(process.env[FAMILY_ENV[family]]);
  if (perFamily) return perFamily;

  const global = toMode(process.env.RHDS_STEP1_MODE);
  if (global) return global;

  return DEFAULT_MODE_BY_FAMILY[family];
};
