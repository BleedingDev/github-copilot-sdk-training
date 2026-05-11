import { resolve } from "node:path";

export type LabConfig = {
  readonly model: string;
  readonly planModel: string;
  readonly implementModel: string;
  readonly reviewModel: string;
  readonly eventLogMode: EventLogMode;
  readonly copilotHome?: string;
  readonly timeoutMs: number;
  readonly startupTimeoutMs: number;
  readonly fleetTimeoutMs: number;
  readonly fleetPollMs: number;
  readonly fleetIdleGraceMs: number;
  readonly maxGateAttempts: number;
  readonly expectTimeoutMs: number;
  readonly gitHubToken?: string;
};

export type EventLogMode = "compact" | "full";

const DEFAULT_MODEL = "gpt-5.2-codex";
const DEFAULT_PLAN_MODEL = "gpt-5.3-codex";
const DEFAULT_IMPLEMENT_MODEL = "gpt-5.4-mini";
const DEFAULT_REVIEW_MODEL = "gpt-5.5";
const DEFAULT_EVENT_LOG_MODE: EventLogMode = "compact";
const DEFAULT_TIMEOUT_MS = 180_000;
const DEFAULT_STARTUP_TIMEOUT_MS = 30_000;
const DEFAULT_FLEET_TIMEOUT_MS = 180_000;
const DEFAULT_FLEET_POLL_MS = 5_000;
const DEFAULT_FLEET_IDLE_GRACE_MS = 30_000;
const DEFAULT_MAX_GATE_ATTEMPTS = 3;
const DEFAULT_EXPECT_TIMEOUT_MS = 1_800_000;

export function readConfig(env: NodeJS.ProcessEnv = process.env): LabConfig {
  const timeoutMs = Number(env.COPILOT_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS);
  const startupTimeoutMs = Number(env.COPILOT_START_TIMEOUT_MS ?? DEFAULT_STARTUP_TIMEOUT_MS);
  const fleetTimeoutMs = Number(env.COPILOT_FLEET_TIMEOUT_MS ?? DEFAULT_FLEET_TIMEOUT_MS);
  const fleetPollMs = Number(env.COPILOT_FLEET_POLL_MS ?? DEFAULT_FLEET_POLL_MS);
  const fleetIdleGraceMs = Number(env.COPILOT_FLEET_IDLE_GRACE_MS ?? DEFAULT_FLEET_IDLE_GRACE_MS);
  const maxGateAttempts = Number(env.COPILOT_MAX_GATE_ATTEMPTS ?? DEFAULT_MAX_GATE_ATTEMPTS);
  const expectTimeoutMs = Number(env.COPILOT_EXPECT_TIMEOUT_MS ?? DEFAULT_EXPECT_TIMEOUT_MS);
  const copilotHome = env.COPILOT_HOME?.trim();
  const gitHubToken = env.COPILOT_GITHUB_TOKEN?.trim();
  const eventLogMode = readEventLogMode(env.COPILOT_EVENT_LOG);

  return {
    model: env.COPILOT_MODEL?.trim() || DEFAULT_MODEL,
    planModel: env.COPILOT_PLAN_MODEL?.trim() || DEFAULT_PLAN_MODEL,
    implementModel: env.COPILOT_IMPLEMENT_MODEL?.trim() || DEFAULT_IMPLEMENT_MODEL,
    reviewModel: env.COPILOT_REVIEW_MODEL?.trim() || DEFAULT_REVIEW_MODEL,
    eventLogMode,
    copilotHome: copilotHome ? resolve(copilotHome) : undefined,
    timeoutMs: Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : DEFAULT_TIMEOUT_MS,
    startupTimeoutMs:
      Number.isFinite(startupTimeoutMs) && startupTimeoutMs > 0 ? startupTimeoutMs : DEFAULT_STARTUP_TIMEOUT_MS,
    fleetTimeoutMs: Number.isFinite(fleetTimeoutMs) && fleetTimeoutMs > 0 ? fleetTimeoutMs : DEFAULT_FLEET_TIMEOUT_MS,
    fleetPollMs: Number.isFinite(fleetPollMs) && fleetPollMs > 0 ? fleetPollMs : DEFAULT_FLEET_POLL_MS,
    fleetIdleGraceMs:
      Number.isFinite(fleetIdleGraceMs) && fleetIdleGraceMs >= 0 ? fleetIdleGraceMs : DEFAULT_FLEET_IDLE_GRACE_MS,
    maxGateAttempts:
      Number.isFinite(maxGateAttempts) && maxGateAttempts > 0 ? maxGateAttempts : DEFAULT_MAX_GATE_ATTEMPTS,
    expectTimeoutMs: Number.isFinite(expectTimeoutMs) && expectTimeoutMs > 0 ? expectTimeoutMs : DEFAULT_EXPECT_TIMEOUT_MS,
    gitHubToken: gitHubToken || undefined,
  };
}

function readEventLogMode(value: string | undefined): EventLogMode {
  if (value?.trim() === "full") {
    return "full";
  }

  return DEFAULT_EVENT_LOG_MODE;
}
