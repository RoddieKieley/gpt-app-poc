import fs from "node:fs/promises";
import os from "node:os";
import { isCompleteCpuInfo } from "./cpu-info-model.js";
import { parseCpuInfoFromRaw } from "./cpu-info-parser.js";
import { getCpuInformationSchema } from "./cpu-info-tool-schema.js";

type ToolContent = { type: "text"; text: string };

type HandlerResult = {
  content: ToolContent[];
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
};

type CpuInfoDependencies = {
  readFile?: (path: string) => Promise<string>;
  getLoadavg?: () => number[];
  getCpuSnapshot?: () => os.CpuInfo[];
};

const text = (value: string): ToolContent[] => [{ type: "text", text: value }];

const formatLoadAverages = (values: number[]): string => {
  const [l1 = 0, l5 = 0, l15 = 0] = values;
  return `${l1.toFixed(2)} ${l5.toFixed(2)} ${l15.toFixed(2)}`;
};

const buildSyntheticCpuText = (deps: CpuInfoDependencies): string => {
  const cpus = deps.getCpuSnapshot?.() ?? os.cpus();
  const loadText = formatLoadAverages(deps.getLoadavg?.() ?? os.loadavg());
  if (cpus.length === 0) {
    return `load average: ${loadText}`;
  }
  const first = cpus[0];
  return [
    `model name\t: ${first.model}`,
    `siblings\t: ${cpus.length}`,
    `cpu cores\t: ${cpus.length}`,
    `cpu MHz\t: ${first.speed}`,
    `load average: ${loadText}`,
  ].join("\n");
};

const loadRawCpuText = async (deps: CpuInfoDependencies): Promise<string> => {
  const readFile = deps.readFile ?? (async (target: string) => fs.readFile(target, "utf-8"));
  try {
    const [cpuInfo, loadAvg] = await Promise.all([
      readFile("/proc/cpuinfo"),
      readFile("/proc/loadavg"),
    ]);
    return [cpuInfo.trim(), `load average: ${loadAvg.trim()}`].join("\n");
  } catch {
    return buildSyntheticCpuText(deps);
  }
};

const buildContentText = (payload: {
  model?: unknown;
  logical_cores?: unknown;
  physical_cores?: unknown;
  frequency_mhz?: unknown;
  load_avg_1m?: unknown;
  load_avg_5m?: unknown;
  load_avg_15m?: unknown;
  cpu_line?: unknown;
  warnings?: string[];
}): string => {
  const lines: string[] = ["CPU information collected from local host."];
  if (typeof payload.model === "string") lines.push(`model: ${payload.model}`);
  if (typeof payload.logical_cores === "number") lines.push(`logical_cores: ${payload.logical_cores}`);
  if (typeof payload.physical_cores === "number") lines.push(`physical_cores: ${payload.physical_cores}`);
  if (typeof payload.frequency_mhz === "number") lines.push(`frequency_mhz: ${payload.frequency_mhz}`);
  if (typeof payload.load_avg_1m === "number") lines.push(`load_avg_1m: ${payload.load_avg_1m}`);
  if (typeof payload.load_avg_5m === "number") lines.push(`load_avg_5m: ${payload.load_avg_5m}`);
  if (typeof payload.load_avg_15m === "number") lines.push(`load_avg_15m: ${payload.load_avg_15m}`);
  if (typeof payload.cpu_line === "string" && payload.cpu_line.length > 0) lines.push(`cpu_line: ${payload.cpu_line}`);
  if (payload.warnings && payload.warnings.length > 0) {
    lines.push("warnings:");
    lines.push(...payload.warnings.map((warning) => `- ${warning}`));
  }
  return lines.join("\n");
};

export const handleGetCpuInformation = async (
  input: unknown,
  dependencies: CpuInfoDependencies = {},
): Promise<HandlerResult> => {
  const parsedInput = getCpuInformationSchema.safeParse(input ?? {});
  if (!parsedInput.success) {
    return {
      isError: true,
      content: text("Invalid arguments for get_cpu_information. This tool is local-only and does not accept host or other input parameters."),
      structuredContent: {
        code: "validation_error",
        text: "get_cpu_information is local-only; call without arguments.",
      },
    };
  }

  try {
    const rawText = await loadRawCpuText(dependencies);
    const parsed = parseCpuInfoFromRaw(rawText);
    const baseContentText = buildContentText({
      ...parsed.cpuInfo,
      warnings: parsed.parseWarnings,
    });

    if (isCompleteCpuInfo(parsed.cpuInfo)) {
      return {
        content: text(baseContentText),
        structuredContent: parsed.cpuInfo,
      };
    }

    return {
      content: text(baseContentText),
      structuredContent: {
        ...parsed.cpuInfo,
        code: "partial_parse",
        missing_fields: parsed.missingFields,
        parse_warnings: parsed.parseWarnings,
        text: baseContentText,
      },
    };
  } catch {
    return {
      isError: true,
      content: text("Unable to collect CPU information from local host."),
      structuredContent: {
        code: "cpu_info_unavailable",
        text: "Unable to collect CPU information from local host.",
      },
    };
  }
};
