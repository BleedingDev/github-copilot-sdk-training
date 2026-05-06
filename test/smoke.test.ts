import { describe, expect, it } from "vitest";

describe("training repo", () => {
  it("has a deliberately small starter test", () => {
    expect("github-copilot-sdk-training").toContain("copilot");
  });
});
