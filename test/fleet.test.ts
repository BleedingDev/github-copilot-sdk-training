import { describe, expect, it } from "vitest";
import { buildFleetPrompt } from "../src/lib/fleet.js";
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
});

