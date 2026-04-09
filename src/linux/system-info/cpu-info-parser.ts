import { CPU_INFO_REQUIRED_FIELDS, type CpuInfo, type CpuInfoField, type CpuInfoParseResult } from "./cpu-info-model.js";

const MODEL_NAME_LINE_RE = /^\s*model name\s*:\s*(.+)\s*$/im;
const HARDWARE_LINE_RE = /^\s*hardware\s*:\s*(.+)\s*$/im;
const MODEL_LINE_RE = /^\s*model\s*:\s*(.+)\s*$/im;
const LOGICAL_CORES_RE = /^\s*(siblings|cpu\(s\))\s*:\s*(\d+)\s*$/im;
const PHYSICAL_CORES_RE = /^\s*(cpu cores|core\(s\) per socket)\s*:\s*(\d+)\s*$/im;
const FREQUENCY_RE = /^\s*(cpu mhz|max mhz|min mhz)\s*:\s*([0-9.]+)\s*$/im;
const LOAD_AVG_LABEL_RE = /load average[s]?\s*:\s*([0-9.]+)[,\s]+([0-9.]+)[,\s]+([0-9.]+)/i;

const parseFloatValue = (value: string | undefined): number | undefined => {
  if (!value) return undefined;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const parseIntValue = (value: string | undefined): number | undefined => {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const firstMatch = (value: string, regex: RegExp): RegExpMatchArray | null => value.match(regex);

const parseLoadAverages = (
  rawText: string,
): { load_avg_1m?: number; load_avg_5m?: number; load_avg_15m?: number } => {
  const labeled = firstMatch(rawText, LOAD_AVG_LABEL_RE);
  if (labeled) {
    return {
      load_avg_1m: parseFloatValue(labeled[1]),
      load_avg_5m: parseFloatValue(labeled[2]),
      load_avg_15m: parseFloatValue(labeled[3]),
    };
  }

  const procLoadMatch = firstMatch(rawText, /^\s*([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)\s+\d+\/\d+/m);
  if (procLoadMatch) {
    return {
      load_avg_1m: parseFloatValue(procLoadMatch[1]),
      load_avg_5m: parseFloatValue(procLoadMatch[2]),
      load_avg_15m: parseFloatValue(procLoadMatch[3]),
    };
  }

  return {};
};

export const parseCpuInfoFromRaw = (rawText: string): CpuInfoParseResult => {
  const normalized = rawText.trim();
  const cpuInfo: Partial<CpuInfo> = {};
  const parseWarnings: string[] = [];

  // Prefer "model name" over generic "model" lines (which may be numeric IDs).
  const modelNameMatch = firstMatch(normalized, MODEL_NAME_LINE_RE);
  const hardwareMatch = firstMatch(normalized, HARDWARE_LINE_RE);
  const modelMatch = firstMatch(normalized, MODEL_LINE_RE);
  const selectedModelMatch = modelNameMatch ?? hardwareMatch ?? modelMatch;
  if (selectedModelMatch) {
    cpuInfo.model = selectedModelMatch[1].trim();
    cpuInfo.cpu_line = selectedModelMatch[0].trim();
  }

  const logicalMatch = firstMatch(normalized, LOGICAL_CORES_RE);
  const physicalMatch = firstMatch(normalized, PHYSICAL_CORES_RE);
  const frequencyMatch = firstMatch(normalized, FREQUENCY_RE);
  const loadAverages = parseLoadAverages(normalized);

  const logical = parseIntValue(logicalMatch?.[2]);
  if (logical !== undefined) cpuInfo.logical_cores = logical;

  const physical = parseIntValue(physicalMatch?.[2]);
  if (physical !== undefined) cpuInfo.physical_cores = physical;

  if (cpuInfo.physical_cores === undefined && cpuInfo.logical_cores !== undefined) {
    cpuInfo.physical_cores = cpuInfo.logical_cores;
    parseWarnings.push("physical_cores unavailable; using logical_cores fallback.");
  }

  const frequency = parseFloatValue(frequencyMatch?.[2]);
  if (frequency !== undefined) cpuInfo.frequency_mhz = frequency;

  if (loadAverages.load_avg_1m !== undefined) cpuInfo.load_avg_1m = loadAverages.load_avg_1m;
  if (loadAverages.load_avg_5m !== undefined) cpuInfo.load_avg_5m = loadAverages.load_avg_5m;
  if (loadAverages.load_avg_15m !== undefined) cpuInfo.load_avg_15m = loadAverages.load_avg_15m;

  const missingFields = CPU_INFO_REQUIRED_FIELDS.filter((field: CpuInfoField) => cpuInfo[field] === undefined);
  if (missingFields.length > 0) {
    parseWarnings.push(`Missing fields: ${missingFields.join(", ")}.`);
  }

  return {
    cpuInfo,
    missingFields,
    parseWarnings,
    rawText: normalized,
    isComplete: missingFields.length === 0,
  };
};
