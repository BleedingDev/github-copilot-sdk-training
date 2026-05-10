import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export type WorktreeChangeSummary = {
  readonly status: string;
  readonly diffStat: string;
  readonly files: readonly string[];
};

export async function readWorktreeChangeSummary(cwd = process.cwd()): Promise<WorktreeChangeSummary> {
  const [status, diffStat] = await Promise.all([
    git(["status", "--short"], cwd),
    git(["diff", "--stat", "--", "."], cwd),
  ]);

  return {
    status,
    diffStat,
    files: parseStatusFiles(status),
  };
}

export function parseStatusFiles(status: string): readonly string[] {
  return status
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.slice(2).trim())
    .map((path) => path.replace(/^.* -> /, ""));
}

async function git(args: readonly string[], cwd: string): Promise<string> {
  const { stdout } = await execFileAsync("git", [...args], { cwd });
  return stdout.trim();
}
