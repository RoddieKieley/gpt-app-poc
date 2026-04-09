export type CpuInfo = {
  model: string;
  logical_cores: number;
  physical_cores: number;
  frequency_mhz: number;
  load_avg_1m: number;
  load_avg_5m: number;
  load_avg_15m: number;
  cpu_line: string;
};

export type CpuInfoField = keyof CpuInfo;

export const CPU_INFO_REQUIRED_FIELDS: CpuInfoField[] = [
  "model",
  "logical_cores",
  "physical_cores",
  "frequency_mhz",
  "load_avg_1m",
  "load_avg_5m",
  "load_avg_15m",
  "cpu_line",
];

export type CpuInfoParseResult = {
  cpuInfo: Partial<CpuInfo>;
  missingFields: CpuInfoField[];
  parseWarnings: string[];
  rawText: string;
  isComplete: boolean;
};

export const isCompleteCpuInfo = (candidate: Partial<CpuInfo>): candidate is CpuInfo => {
  return (
    typeof candidate.model === "string"
    && typeof candidate.logical_cores === "number"
    && Number.isFinite(candidate.logical_cores)
    && typeof candidate.physical_cores === "number"
    && Number.isFinite(candidate.physical_cores)
    && typeof candidate.frequency_mhz === "number"
    && Number.isFinite(candidate.frequency_mhz)
    && typeof candidate.load_avg_1m === "number"
    && Number.isFinite(candidate.load_avg_1m)
    && typeof candidate.load_avg_5m === "number"
    && Number.isFinite(candidate.load_avg_5m)
    && typeof candidate.load_avg_15m === "number"
    && Number.isFinite(candidate.load_avg_15m)
    && typeof candidate.cpu_line === "string"
    && candidate.cpu_line.length > 0
  );
};
