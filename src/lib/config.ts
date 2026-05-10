import { resolve } from "node:path";

export type LabConfig = {
  readonly model: string;
  readonly copilotHome?: string;
  readonly timeoutMs: number;
  readonly startupTimeoutMs: number;
  readonly gitHubToken?: string;
};

const DEFAULT_MODEL = "gpt-5.2-codex";
const DEFAULT_TIMEOUT_MS = 180_000;
const DEFAULT_STARTUP_TIMEOUT_MS = 30_000;

export function readConfig(env: NodeJS.ProcessEnv = process.env): LabConfig {
  const timeoutMs = Number(env.COPILOT_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS);
  const startupTimeoutMs = Number(env.COPILOT_START_TIMEOUT_MS ?? DEFAULT_STARTUP_TIMEOUT_MS);
  const copilotHome = env.COPILOT_HOME?.trim();
  const gitHubToken = env.COPILOT_GITHUB_TOKEN?.trim();

  return {
    model: env.COPILOT_MODEL?.trim() || DEFAULT_MODEL,
    copilotHome: copilotHome ? resolve(copilotHome) : undefined,
    timeoutMs: Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : DEFAULT_TIMEOUT_MS,
    startupTimeoutMs:
      Number.isFinite(startupTimeoutMs) && startupTimeoutMs > 0 ? startupTimeoutMs : DEFAULT_STARTUP_TIMEOUT_MS,
    gitHubToken: gitHubToken || undefined,
  };
}
