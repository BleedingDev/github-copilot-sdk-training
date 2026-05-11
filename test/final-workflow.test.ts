import { describe, expect, it } from "vitest";
import { readConfig } from "../src/lib/config.js";
import { buildFinalWorkflowPreview, parseFinalWorkflowArgs } from "../src/lib/final-workflow.js";
import type { LabIssue } from "../src/lib/data.js";

describe("final workflow", () => {
  it("parses explicit live arguments", () => {
    const config = readConfig({});
    const args = parseFinalWorkflowArgs(["LAB-101", "--live", "--no-expect", "--max-attempts=5"], config);

    expect(args).toEqual({
      issueKey: "LAB-101",
      live: true,
      runExpect: false,
      maxAttempts: 5,
    });
  });

  it("documents the model policy and control loop without running models", () => {
    const config = readConfig({});
    const issue: LabIssue = {
      key: "LAB-101",
      title: "Expose warnings",
      type: "Story",
      priority: "High",
      module: "booking-detail",
      summary: "Show warnings.",
      acceptanceCriteria: [],
      candidatePaths: [],
      nonGoals: [],
    };

    const preview = buildFinalWorkflowPreview(issue, config);

    expect(preview).toContain("gpt-5.3-codex");
    expect(preview).toContain("gpt-5.4-mini");
    expect(preview).toContain("gpt-5.5");
    expect(preview).toContain("Loop se opakuje maximálně 3x");
    expect(preview).toContain("Expect CLI otestuje změny");
  });
});
