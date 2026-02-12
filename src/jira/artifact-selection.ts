import fs from "node:fs/promises";
import path from "node:path";
import { JiraMappedError } from "./jira-error-mapping.js";

export type ArtifactSelection = {
  artifactRef: string;
  filePath: string;
  filename: string;
  sizeBytes: number;
};

const MAX_SIZE_BYTES = Number.parseInt(
  process.env.JIRA_ATTACHMENT_MAX_BYTES ?? String(25 * 1024 * 1024),
  10,
);

const allowedRoots = [process.cwd(), "/tmp", "/var/tmp"];

const asError = (code: JiraMappedError["code"], message: string): JiraMappedError => ({
  code,
  status: code === "not_found" ? 404 : 400,
  message,
});

export const resolveArtifactSelection = async (
  artifactRef: string,
): Promise<ArtifactSelection> => {
  const resolved = path.resolve(artifactRef);
  if (!allowedRoots.some((root) => resolved.startsWith(path.resolve(root)))) {
    throw asError("artifact_invalid", "Artifact path is outside approved local boundaries.");
  }

  let stats;
  try {
    stats = await fs.stat(resolved);
  } catch {
    throw asError("not_found", "Selected artifact was not found.");
  }

  if (!stats.isFile()) {
    throw asError("artifact_invalid", "Selected artifact must be a file.");
  }
  if (stats.size <= 0) {
    throw asError("artifact_invalid", "Selected artifact is empty.");
  }
  if (stats.size > MAX_SIZE_BYTES) {
    throw asError("artifact_invalid", "Selected artifact exceeds configured upload size.");
  }

  await fs.access(resolved);
  return {
    artifactRef: artifactRef,
    filePath: resolved,
    filename: path.basename(resolved),
    sizeBytes: stats.size,
  };
};

