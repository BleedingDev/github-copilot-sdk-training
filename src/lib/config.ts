import { resolve } from "node:path";

export type LabConfig = {
  readonly model: string;
  readonly eventLogMode: EventLogMode;
  readonly copilotHome?: string;
  readonly timeoutMs: number;
  readonly startupTimeoutMs: number;
  readonly fleetTimeoutMs: number;
  readonly fleetPollMs: number;
  readonly fleetIdleGraceMs: number;
  readonly gitHubToken?: string;
};

export type EventLogMode = "compact" | "full";

const DEFAULT_MODEL = "gpt-5.2-codex";
const DEFAULT_EVENT_LOG_MODE: EventLogMode = "compact";
const DEFAULT_TIMEOUT_MS = 180_000;
const DEFAULT_STARTUP_TIMEOUT_MS = 30_000;
const DEFAULT_FLEET_TIMEOUT_MS = 180_000;
const DEFAULT_FLEET_POLL_MS = 5_000;
const DEFAULT_FLEET_IDLE_GRACE_MS = 30_000;

export function readConfig(env: NodeJS.ProcessEnv = process.env): LabConfig {
  const timeoutMs = Number(env.COPILOT_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS);
  const startupTimeoutMs = Number(env.COPILOT_START_TIMEOUT_MS ?? DEFAULT_STARTUP_TIMEOUT_MS);
  const fleetTimeoutMs = Number(env.COPILOT_FLEET_TIMEOUT_MS ?? DEFAULT_FLEET_TIMEOUT_MS);
  const fleetPollMs = Number(env.COPILOT_FLEET_POLL_MS ?? DEFAULT_FLEET_POLL_MS);
  const fleetIdleGraceMs = Number(env.COPILOT_FLEET_IDLE_GRACE_MS ?? DEFAULT_FLEET_IDLE_GRACE_MS);
  const copilotHome = env.COPILOT_HOME?.trim();
  const gitHubToken = env.COPILOT_GITHUB_TOKEN?.trim();
  const eventLogMode = readEventLogMode(env.COPILOT_EVENT_LOG);

  return {
    model: env.COPILOT_MODEL?.trim() || DEFAULT_MODEL,
    eventLogMode,
    copilotHome: copilotHome ? resolve(copilotHome) : undefined,
    timeoutMs: Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : DEFAULT_TIMEOUT_MS,
    startupTimeoutMs:
      Number.isFinite(startupTimeoutMs) && startupTimeoutMs > 0 ? startupTimeoutMs : DEFAULT_STARTUP_TIMEOUT_MS,
    fleetTimeoutMs: Number.isFinite(fleetTimeoutMs) && fleetTimeoutMs > 0 ? fleetTimeoutMs : DEFAULT_FLEET_TIMEOUT_MS,
    fleetPollMs: Number.isFinite(fleetPollMs) && fleetPollMs > 0 ? fleetPollMs : DEFAULT_FLEET_POLL_MS,
    fleetIdleGraceMs:
      Number.isFinite(fleetIdleGraceMs) && fleetIdleGraceMs >= 0 ? fleetIdleGraceMs : DEFAULT_FLEET_IDLE_GRACE_MS,
    gitHubToken: gitHubToken || undefined,
  };
}

function readEventLogMode(value: string | undefined): EventLogMode {
  if (value?.trim() === "full") {
    return "full";
  }

  return DEFAULT_EVENT_LOG_MODE;
}
