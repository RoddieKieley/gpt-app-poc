import fs from "node:fs/promises";
import path from "node:path";
import { SosreportError } from "./sosreport-errors.js";

const REPORT_PATH_PATTERN = /(\/[^\s]*sosreport-[^\s]*\.tar(?:\.[^\s]+)?)/i;
const REPORT_NAME_PATTERN = /^sosreport-.+\.tar(\..+)?$/i;

const DEFAULT_SEARCH_DIRS = ["/var/tmp", "/tmp"];

const allowedRoots = [process.cwd(), "/tmp", "/var/tmp"];

const isAllowedPath = (candidate: string): boolean => {
  const resolved = path.resolve(candidate);
  return allowedRoots.some((root) => resolved.startsWith(path.resolve(root)));
};

export const parseArchivePathFromOutput = (stdout: string, stderr: string): string | null => {
  const combined = `${stdout}\n${stderr}`;
  const match = combined.match(REPORT_PATH_PATTERN);
  return match?.[1] ?? null;
};

export const findLatestMatchingArchive = async (
  searchDirs: string[] = DEFAULT_SEARCH_DIRS,
): Promise<string | null> => {
  const found: Array<{ fullPath: string; mtimeMs: number }> = [];
  for (const dir of searchDirs) {
    let entries: string[] = [];
    try {
      entries = await fs.readdir(dir);
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (!REPORT_NAME_PATTERN.test(entry)) {
        continue;
      }
      const fullPath = path.join(dir, entry);
      try {
        const stat = await fs.stat(fullPath);
        if (stat.isFile()) {
          found.push({ fullPath, mtimeMs: stat.mtimeMs });
        }
      } catch {
        // ignore unreadable candidates
      }
    }
  }
  found.sort((a, b) => b.mtimeMs - a.mtimeMs);
  return found[0]?.fullPath ?? null;
};

export const assertSafeFetchReference = (fetchReference: string): string => {
  if (!path.isAbsolute(fetchReference)) {
    throw new SosreportError("validation_error", "fetch_reference must be an absolute local path.");
  }
  if (!isAllowedPath(fetchReference)) {
    throw new SosreportError("path_unsafe", "fetch_reference is outside approved local boundaries.");
  }
  if (!REPORT_NAME_PATTERN.test(path.basename(fetchReference))) {
    throw new SosreportError("validation_error", "fetch_reference must target a sosreport archive file.");
  }
  return path.resolve(fetchReference);
};

export const buildTmpCopyPath = (sourceArchivePath: string): string => {
  const base = path.basename(sourceArchivePath);
  return path.join("/tmp", `${Date.now()}-${base}`);
};
