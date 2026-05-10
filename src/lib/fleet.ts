import type { LabIssue, RepoMap } from "./data.js";

export type FleetTaskStatus = "running" | "idle" | "completed" | "failed" | "cancelled";

export type FleetTask = {
  readonly id: string;
  readonly description?: string;
  readonly status: FleetTaskStatus | string;
  readonly error?: string;
  readonly result?: string;
  readonly latestResponse?: string;
};

export type FleetTaskList = {
  readonly tasks: readonly FleetTask[];
};

export type FleetWaitOptions = {
  readonly timeoutMs: number;
  readonly pollMs: number;
  readonly idleGraceMs: number;
  readonly onProgress?: (snapshot: FleetTaskList, elapsedMs: number) => void;
};

export function buildFleetPrompt(issue: LabIssue, repoMap: RepoMap): string {
  const paths = issue.candidatePaths.map((path) => `- ${path}`).join("\n");
  const modules = repoMap.modules
    .map((module) => `- ${module.name}: ${module.paths.join(", ")}`)
    .join("\n");

  return `Use fleet mode for ${issue.key}: ${issue.title}.

Split the work into independent lanes. Do not let two lanes edit the same files.

Known candidate paths:
${paths}

Known module map:
${modules}

Lanes:

1. Dev API lane
   - Owns only PHP booking-detail API files.
   - Output: implementation notes and exact files that would change.

2. Dev UI lane
   - Owns only Next.js booking-detail UI files.
   - Output: implementation notes and exact files that would change.

3. QA evidence lane
   - Owns only test planning and verification commands.
   - Output: Cypress/Codeception/Zephyr evidence checklist.

4. Docs evidence lane
   - Owns only second-brain update notes.
   - Output: documentation claims supported by code diff and test evidence only.

Stop conditions:

- If a lane needs files owned by another lane, report the dependency instead of editing.
- Do not redesign unrelated modules.
- Do not invent Jira, Zephyr, Grafana, MCP, or Google Docs integrations.
- Keep final synthesis short and include unresolved risks.`;
}

export async function waitForFleetTasksToSettle(
  listTasks: () => Promise<FleetTaskList>,
  options: FleetWaitOptions,
): Promise<FleetTaskList> {
  const startedAt = Date.now();
  let snapshot = await listTasks();
  let settledSince: number | undefined;
  let settledSignature: string | undefined;
  options.onProgress?.(snapshot, 0);

  while (true) {
    assertFleetTasksSucceeded(snapshot);

    if (!hasActiveFleetTasks(snapshot)) {
      const signature = fleetTaskSignature(snapshot);
      if (settledSignature !== signature) {
        settledSignature = signature;
        settledSince = Date.now();
      }

      if (settledSince !== undefined && Date.now() - settledSince >= options.idleGraceMs) {
        return snapshot;
      }
    } else {
      settledSince = undefined;
      settledSignature = undefined;
    }

    const elapsedMs = Date.now() - startedAt;
    if (elapsedMs >= options.timeoutMs) {
      throw new Error(
        `Fleet tasks did not settle within ${options.timeoutMs} ms. Last status: ${formatFleetTaskSummary(snapshot)}`,
      );
    }

    await sleep(Math.min(options.pollMs, options.timeoutMs - elapsedMs));
    snapshot = await listTasks();
    options.onProgress?.(snapshot, Date.now() - startedAt);
  }
}

export function assertFleetTasksSucceeded(snapshot: FleetTaskList): void {
  const failedTasks = snapshot.tasks.filter((task) => task.status === "failed" || task.status === "cancelled");
  if (failedTasks.length === 0) {
    return;
  }

  const details = failedTasks
    .map((task) => `${task.id}:${task.status}${task.error ? ` (${task.error})` : ""}`)
    .join(", ");
  throw new Error(`Fleet tasks failed: ${details}`);
}

export function assertFleetTasksStarted(snapshot: FleetTaskList): void {
  if (snapshot.tasks.length > 0) {
    return;
  }

  throw new Error(
    "Fleet start returned no background tasks. Check Copilot authentication, model access, and CLI fleet support.",
  );
}

export function hasActiveFleetTasks(snapshot: FleetTaskList): boolean {
  return snapshot.tasks.some((task) => task.status === "running");
}

export function formatFleetTaskSummary(snapshot: FleetTaskList): string {
  if (snapshot.tasks.length === 0) {
    return "no tasks";
  }

  return snapshot.tasks.map((task) => `${task.id}:${task.status}`).join(", ");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fleetTaskSignature(snapshot: FleetTaskList): string {
  return snapshot.tasks.map((task) => `${task.id}:${task.status}`).join("|");
}
