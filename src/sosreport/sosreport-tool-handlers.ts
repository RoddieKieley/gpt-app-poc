import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { fetchSosreportSchema, generateSosreportSchema, type FetchSosreportInput, type GenerateSosreportInput } from "./sosreport-tool-schemas.js";
import {
  assertSafeFetchReference,
  buildTmpCopyPath,
  findLatestMatchingArchive,
  parseArchivePathFromOutput,
} from "./sosreport-paths.js";
import { runGenerateSosreport, type CommandResult } from "./sosreport-command.js";
import { SosreportError, toSosreportToolError } from "./sosreport-errors.js";

type ToolContent = { type: "text"; text: string };

type HandlerResult = {
  content: ToolContent[];
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
};

type FetchDependencies = {
  readArchiveBytes?: (sourcePath: string) => Promise<Buffer>;
};

type GenerateDependencies = {
  runGenerate?: (args: GenerateSosreportInput) => Promise<CommandResult>;
  findLatest?: () => Promise<string | null>;
};

const text = (value: string): ToolContent[] => [{ type: "text", text: value }];

const runSudoCat = async (sourcePath: string): Promise<Buffer> => {
  const candidates = ["/usr/bin/cat", "/usr/sbin/cat"];
  for (const candidate of candidates) {
    const outcome = await new Promise<
      { ok: true; bytes: Buffer } | { ok: false; stderr: string; code: number | null }
    >((resolve, reject) => {
      const child = spawn("sudo", ["-n", candidate, sourcePath], { stdio: ["ignore", "pipe", "pipe"] });
      const stdoutChunks: Buffer[] = [];
      const stderrChunks: Buffer[] = [];

      child.stdout?.on("data", (chunk: Buffer) => stdoutChunks.push(chunk));
      child.stderr?.on("data", (chunk: Buffer) => stderrChunks.push(chunk));
      child.on("error", reject);
      child.on("close", (code) => {
        if (code !== 0) {
          resolve({
            ok: false,
            code,
            stderr: Buffer.concat(stderrChunks).toString("utf8").toLowerCase(),
          });
          return;
        }
        resolve({ ok: true, bytes: Buffer.concat(stdoutChunks) });
      });
    });

    if (outcome.ok) {
      return outcome.bytes;
    }

    if (
      outcome.stderr.includes("password is required") ||
      outcome.stderr.includes("permission denied") ||
      outcome.stderr.includes("sudoers")
    ) {
      throw new SosreportError("privilege_required", "sudo -n cannot read archive. Verify sudoers NOPASSWD cat entries.");
    }
  }

  throw new SosreportError("read_failed", `Failed to read sosreport archive at ${sourcePath}.`);
};

const readArchiveBytes = async (sourcePath: string): Promise<Buffer> => {
  try {
    return await fs.readFile(sourcePath);
  } catch {
    return runSudoCat(sourcePath);
  }
};

export const handleGenerateSosreport = async (
  input: unknown,
  dependencies: GenerateDependencies = {},
): Promise<HandlerResult> => {
  try {
    const args = generateSosreportSchema.parse(input);
    const result = await (dependencies.runGenerate ?? runGenerateSosreport)(args);
    const parsedPath = parseArchivePathFromOutput(result.stdout, result.stderr);
    const archivePath = parsedPath ?? (await (dependencies.findLatest ?? findLatestMatchingArchive)());
    if (!archivePath) {
      throw new SosreportError("archive_not_found", "Unable to locate generated sosreport archive.");
    }

    const stats = await fs.stat(archivePath);
    const structuredContent = {
      archive_path: archivePath,
      archive_name: path.basename(archivePath),
      size_bytes: stats.size,
      generated_at: new Date().toISOString(),
      fetch_reference: archivePath,
      execution_mode: "local",
      timeout_ms: 600000,
    };
    return {
      content: text(
        `sosreport generated successfully at ${archivePath}. Use fetch_sosreport with fetch_reference to retrieve artifact metadata.`,
      ),
      structuredContent,
    };
  } catch (error) {
    return toSosreportToolError(error);
  }
};

export const handleFetchSosreport = async (input: unknown, dependencies: FetchDependencies = {}): Promise<HandlerResult> => {
  try {
    const args: FetchSosreportInput = fetchSosreportSchema.parse(input);
    const sourcePath = assertSafeFetchReference(args.fetch_reference);

    let sourceBytes: Buffer;
    try {
      sourceBytes = await (dependencies.readArchiveBytes ?? readArchiveBytes)(sourcePath);
    } catch (error) {
      if (error instanceof SosreportError) {
        throw error;
      }
      throw new SosreportError("read_failed", `Failed to read sosreport archive at ${sourcePath}.`);
    }

    const destination = buildTmpCopyPath(sourcePath);
    try {
      await fs.writeFile(destination, sourceBytes);
    } catch {
      throw new SosreportError("copy_failed", `Failed to copy archive to ${destination}.`);
    }

    const checksum = createHash("sha256").update(sourceBytes).digest("hex");
    const stats = await fs.stat(destination);
    const structuredContent = {
      archive_path: destination,
      size_bytes: stats.size,
      sha256: checksum,
      source_archive_path: sourcePath,
      fetched_at: new Date().toISOString(),
    };
    return {
      content: text(`Fetched sosreport archive to ${destination}.`),
      structuredContent,
    };
  } catch (error) {
    return toSosreportToolError(error);
  }
};
