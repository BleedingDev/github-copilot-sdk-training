import { describe, expect, it } from "vitest";
import { buildIssuePlan } from "../src/lib/plan.js";
import type { LabIssue, RepoMap } from "../src/lib/data.js";

describe("buildIssuePlan", () => {
  it("creates scoped Dev/QA/Docs lanes", () => {
    const issue: LabIssue = {
      key: "LAB-101",
      title: "Expose fare-family warnings",
      type: "Story",
      priority: "High",
      module: "booking-detail",
      summary: "Show warning metadata.",
      acceptanceCriteria: ["API response contains warning codes."],
      candidatePaths: ["services/php/src/BookingDetail"],
      nonGoals: ["Do not redesign the page."],
    };
    const repoMap: RepoMap = {
      repository: "fixture",
      note: "test",
      modules: [
        {
          name: "booking-detail-api",
          language: "PHP",
          paths: ["services/php/src/BookingDetail"],
        },
      ],
    };

    const plan = buildIssuePlan(issue, repoMap);

    expect(plan).toContain("Dev API");
    expect(plan).toContain("QA");
    expect(plan).toContain("Docs");
    expect(plan).toContain("services/php/src/BookingDetail");
  });
});

