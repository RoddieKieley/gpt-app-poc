import { spawn } from "node:child_process";
import type { GenerateSosreportInput } from "./sosreport-tool-schemas.js";
import { SosreportError } from "./sosreport-errors.js";

export const DEFAULT_GENERATE_TIMEOUT_MS = 600000;

export type CommandResult = {
  exitCode: number;
  stdout: string;
  stderr: string;
  timedOut: boolean;
};

export type ExecCommand = (command: string, args: string[], timeoutMs: number) => Promise<CommandResult>;

const runCommand: ExecCommand = (command, args, timeoutMs) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    let timedOut = false;

    child.stdout?.on("data", (chunk: Buffer | string) => {
      stdout += String(chunk);
    });
    child.stderr?.on("data", (chunk: Buffer | string) => {
      stderr += String(chunk);
    });
    child.on("error", reject);

    const timeout = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, timeoutMs).unref();

    child.on("close", (code) => {
      clearTimeout(timeout);
      resolve({
        exitCode: code ?? 1,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        timedOut,
      });
    });
  });

const buildGenerateArgs = (args: GenerateSosreportInput): string[] => {
  const sosArgs: string[] = [
    "-n",
    "sos",
    "report",
    "--batch",
    "--tmp-dir",
    "/var/tmp",
    "--name",
    "linux-mcp-sos",
  ];

  if (args.only_plugins?.length) {
    sosArgs.push("--only-plugins", args.only_plugins.join(","));
  }
  if (args.enable_plugins?.length) {
    sosArgs.push("--enable-plugins", args.enable_plugins.join(","));
  }
  if (args.disable_plugins?.length) {
    sosArgs.push("--skip-plugins", args.disable_plugins.join(","));
  }
  if (args.log_size) {
    sosArgs.push("--log-size", args.log_size);
  }
  if (args.redaction) {
    sosArgs.push("--clean");
  }
  return sosArgs;
};

export const assertSosAvailable = async (exec: ExecCommand = runCommand): Promise<void> => {
  const result = await exec("sh", ["-lc", "command -v sos"], 5000);
  if (result.exitCode !== 0 || !result.stdout) {
    throw new SosreportError("dependency_missing", "sos command is unavailable on this host.");
  }
};

export const mapGenerateExecutionFailure = (result: CommandResult): SosreportError => {
  if (result.timedOut) {
    return new SosreportError("timeout", "sosreport generation timed out after 600000ms.");
  }
  const stderr = result.stderr.toLowerCase();
  if (stderr.includes("a password is required") || stderr.includes("password is required")) {
    return new SosreportError("privilege_required", "sudo -n requires a password. Configure NOPASSWD sudoers entries.");
  }
  if (stderr.includes("not allowed") || stderr.includes("permission denied") || stderr.includes("sudoers")) {
    return new SosreportError("privilege_required", "Privileged command denied. Verify /etc/sudoers.d/mcp-sos configuration.");
  }
  return new SosreportError("unexpected_error", result.stderr || "sosreport command failed.");
};

export const runGenerateSosreport = async (
  args: GenerateSosreportInput,
  options?: { exec?: ExecCommand; timeoutMs?: number },
): Promise<CommandResult> => {
  const exec = options?.exec ?? runCommand;
  const timeoutMs = options?.timeoutMs ?? DEFAULT_GENERATE_TIMEOUT_MS;
  await assertSosAvailable(exec);
  const result = await exec("sudo", buildGenerateArgs(args), timeoutMs);
  if (result.exitCode !== 0) {
    throw mapGenerateExecutionFailure(result);
  }
  return result;
};
