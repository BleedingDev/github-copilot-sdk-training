import { describe, expect, it } from "vitest";
import { buildChallengeBrief } from "../src/lib/challenge.js";
import type { LabIssue } from "../src/lib/data.js";

describe("buildChallengeBrief", () => {
  it("does not include a ready-made solution", () => {
    const issue: LabIssue = {
      key: "LAB-101",
      title: "Expose warnings",
      type: "Story",
      priority: "High",
      module: "booking-detail",
      summary: "Show warnings.",
      acceptanceCriteria: [],
      candidatePaths: ["apps/web/src/modules/booking-detail"],
      nonGoals: ["Do not redesign."],
    };

    const brief = buildChallengeBrief(issue);

    expect(brief).toContain("Napiš vlastní prompt");
    expect(brief).toContain("usage/cost kontrolní body");
    expect(brief).toContain("deterministický verification gate");
    expect(brief).toContain("normalizuje na krátký artefakt");
    expect(brief).not.toContain("await session.rpc.fleet.start");
  });
});
