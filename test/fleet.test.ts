import { describe, expect, it } from "vitest";
import {
  assertFleetTasksStarted,
  assertFleetTasksSucceeded,
  buildFleetPrompt,
  formatFleetTaskSummary,
  waitForFleetTasksToSettle,
  type FleetTaskList,
} from "../src/lib/fleet.js";
import type { LabIssue, RepoMap } from "../src/lib/data.js";

describe("buildFleetPrompt", () => {
  it("forces independent lane ownership", () => {
    const issue: LabIssue = {
      key: "LAB-101",
      title: "Expose warnings",
      type: "Story",
      priority: "High",
      module: "booking-detail",
      summary: "Show warnings.",
      acceptanceCriteria: [],
      candidatePaths: ["apps/web/src/modules/booking-detail", "services/php/src/BookingDetail"],
      nonGoals: [],
    };
    const repoMap: RepoMap = {
      repository: "fixture",
      note: "test",
      modules: [],
    };

    const prompt = buildFleetPrompt(issue, repoMap);

    expect(prompt).toContain("Do not let two lanes edit the same files");
    expect(prompt).toContain("Dev API lane");
    expect(prompt).toContain("QA evidence lane");
    expect(prompt).toContain("Do not invent Jira");
  });

  it("waits until active tasks settle", async () => {
    const snapshots: FleetTaskList[] = [
      { tasks: [{ id: "api", status: "running" }] },
      { tasks: [{ id: "api", status: "completed" }] },
    ];

    const finalSnapshot = await waitForFleetTasksToSettle(() => Promise.resolve(snapshots.shift()!), {
      timeoutMs: 100,
      pollMs: 1,
      idleGraceMs: 0,
    });

    expect(finalSnapshot.tasks[0]?.status).toBe("completed");
  });

  it("treats idle background tasks as settled", async () => {
    const finalSnapshot = await waitForFleetTasksToSettle(
      () =>
        Promise.resolve({
          tasks: [{ id: "api", status: "idle", latestResponse: "blocked on missing fixture" }],
        }),
      {
        timeoutMs: 100,
        pollMs: 1,
        idleGraceMs: 0,
      },
    );

    expect(finalSnapshot.tasks[0]?.status).toBe("idle");
  });

  it("waits for a stable idle period before returning", async () => {
    const snapshots: FleetTaskList[] = [
      { tasks: [{ id: "api", status: "idle" }] },
      { tasks: [{ id: "api", status: "running" }] },
      { tasks: [{ id: "api", status: "idle" }] },
      { tasks: [{ id: "api", status: "idle" }] },
    ];
    let calls = 0;

    const finalSnapshot = await waitForFleetTasksToSettle(
      () => Promise.resolve(snapshots[Math.min(calls++, snapshots.length - 1)]!),
      {
        timeoutMs: 100,
        pollMs: 2,
        idleGraceMs: 3,
      },
    );

    expect(calls).toBeGreaterThanOrEqual(4);
    expect(finalSnapshot.tasks[0]?.status).toBe("idle");
  });

  it("fails when a task fails", async () => {
    expect(() =>
      assertFleetTasksSucceeded({
        tasks: [{ id: "api", status: "failed", error: "missing fixture" }],
      }),
    ).toThrow("api:failed");
  });

  it("fails when fleet start returns no tasks", () => {
    expect(() => assertFleetTasksStarted({ tasks: [] })).toThrow("no background tasks");
  });

  it("fails instead of hanging when tasks do not settle", async () => {
    await expect(
      waitForFleetTasksToSettle(
        () =>
          Promise.resolve({
            tasks: [{ id: "api", status: "running" }],
          }),
        {
          timeoutMs: 5,
          pollMs: 1,
          idleGraceMs: 0,
        },
      ),
    ).rejects.toThrow("did not settle");
  });

  it("formats task status for progress output", () => {
    expect(
      formatFleetTaskSummary({
        tasks: [
          { id: "api", status: "completed" },
          { id: "ui", status: "running" },
        ],
      }),
    ).toBe("api:completed, ui:running");
  });
});
