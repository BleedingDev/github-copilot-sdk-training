import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readWorktreeChangeSummary, type WorktreeChangeSummary } from "./git.js";

const execFileAsync = promisify(execFile);
const MAX_OUTPUT_CHARS = 4_000;

export type QualityGateCommand = {
  readonly command: string;
  readonly args: readonly string[];
};

export type GateResult = {
  readonly command: string;
  readonly exitCode: number;
  readonly ok: boolean;
  readonly durationMs: number;
  readonly stdout: string;
  readonly stderr: string;
};

export type VerificationArtifact = {
  readonly stage: string;
  readonly attempt: number;
  readonly ok: boolean;
  readonly nextStep: "continue" | "repair" | "stop";
  readonly changedFiles: readonly string[];
  readonly diffStat: string;
  readonly gates: readonly GateResult[];
};

export const DEFAULT_QUALITY_GATES: readonly QualityGateCommand[] = [
  { command: "pnpm", args: ["run", "typecheck"] },
  { command: "pnpm", args: ["test"] },
];

export async function runQualityGates(
  stage: string,
  attempt: number,
  commands: readonly QualityGateCommand[] = DEFAULT_QUALITY_GATES,
): Promise<VerificationArtifact> {
  const gates: GateResult[] = [];

  for (const gate of commands) {
    gates.push(await runGate(gate));
  }

  const worktree = await readWorktreeChangeSummary();
  const ok = gates.every((gate) => gate.ok);

  return {
    stage,
    attempt,
    ok,
    nextStep: ok ? "continue" : "repair",
    changedFiles: worktree.files,
    diffStat: worktree.diffStat,
    gates,
  };
}

export function formatVerificationArtifact(artifact: VerificationArtifact): string {
  return JSON.stringify(
    {
      stage: artifact.stage,
      attempt: artifact.attempt,
      ok: artifact.ok,
      nextStep: artifact.nextStep,
      changedFiles: artifact.changedFiles,
      diffStat: artifact.diffStat,
      gates: artifact.gates.map((gate) => ({
        command: gate.command,
        exitCode: gate.exitCode,
        ok: gate.ok,
        stdout: gate.stdout,
        stderr: gate.stderr,
      })),
    },
    null,
    2,
  );
}

export function summarizeWorktree(worktree: WorktreeChangeSummary): string {
  return JSON.stringify(
    {
      changedFiles: worktree.files,
      status: worktree.status,
      diffStat: worktree.diffStat,
    },
    null,
    2,
  );
}

async function runGate(gate: QualityGateCommand): Promise<GateResult> {
  const startedAt = Date.now();
  const commandText = [gate.command, ...gate.args].join(" ");

  try {
    const { stdout, stderr } = await execFileAsync(gate.command, [...gate.args], {
      cwd: process.cwd(),
      maxBuffer: 1024 * 1024 * 20,
      env: process.env,
    });

    return {
      command: commandText,
      exitCode: 0,
      ok: true,
      durationMs: Date.now() - startedAt,
      stdout: tail(stdout),
      stderr: tail(stderr),
    };
  } catch (error) {
    const failure = error as {
      code?: number;
      signal?: NodeJS.Signals;
      stdout?: string;
      stderr?: string;
      message?: string;
    };

    return {
      command: commandText,
      exitCode: typeof failure.code === "number" ? failure.code : 1,
      ok: false,
      durationMs: Date.now() - startedAt,
      stdout: tail(failure.stdout ?? ""),
      stderr: tail(failure.stderr ?? failure.message ?? ""),
    };
  }
}

function tail(value: string): string {
  if (value.length <= MAX_OUTPUT_CHARS) {
    return value.trim();
  }

  return value.slice(value.length - MAX_OUTPUT_CHARS).trim();
}
