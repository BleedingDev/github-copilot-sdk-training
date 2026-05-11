import { describe, expect, it } from "vitest";
import { readConfig } from "../src/lib/config.js";

describe("readConfig", () => {
  it("uses explicit beta-friendly defaults", () => {
    const config = readConfig({});

    expect(config.model).toBe("gpt-5.2-codex");
    expect(config.planModel).toBe("gpt-5.3-codex");
    expect(config.implementModel).toBe("gpt-5.4-mini");
    expect(config.reviewModel).toBe("gpt-5.5");
    expect(config.eventLogMode).toBe("compact");
    expect(config.copilotHome).toBeUndefined();
    expect(config.timeoutMs).toBe(180_000);
    expect(config.startupTimeoutMs).toBe(30_000);
    expect(config.fleetTimeoutMs).toBe(180_000);
    expect(config.fleetPollMs).toBe(5_000);
    expect(config.fleetIdleGraceMs).toBe(30_000);
    expect(config.maxGateAttempts).toBe(3);
    expect(config.expectTimeoutMs).toBe(1_800_000);
    expect(config.gitHubToken).toBeUndefined();
  });

  it("accepts environment overrides", () => {
    const config = readConfig({
      COPILOT_MODEL: "claude-opus-4.5",
      COPILOT_PLAN_MODEL: "gpt-5.3-codex",
      COPILOT_IMPLEMENT_MODEL: "gpt-5.4-mini",
      COPILOT_REVIEW_MODEL: "gpt-5.5",
      COPILOT_HOME: ".tmp-copilot",
      COPILOT_TIMEOUT_MS: "12345",
      COPILOT_START_TIMEOUT_MS: "23456",
      COPILOT_FLEET_TIMEOUT_MS: "34567",
      COPILOT_FLEET_POLL_MS: "4567",
      COPILOT_FLEET_IDLE_GRACE_MS: "6789",
      COPILOT_MAX_GATE_ATTEMPTS: "4",
      COPILOT_EXPECT_TIMEOUT_MS: "789000",
      COPILOT_GITHUB_TOKEN: "github_pat_test",
      COPILOT_EVENT_LOG: "full",
    });

    expect(config.model).toBe("claude-opus-4.5");
    expect(config.planModel).toBe("gpt-5.3-codex");
    expect(config.implementModel).toBe("gpt-5.4-mini");
    expect(config.reviewModel).toBe("gpt-5.5");
    expect(config.eventLogMode).toBe("full");
    expect(config.copilotHome).toContain(".tmp-copilot");
    expect(config.timeoutMs).toBe(12_345);
    expect(config.startupTimeoutMs).toBe(23_456);
    expect(config.fleetTimeoutMs).toBe(34_567);
    expect(config.fleetPollMs).toBe(4_567);
    expect(config.fleetIdleGraceMs).toBe(6_789);
    expect(config.maxGateAttempts).toBe(4);
    expect(config.expectTimeoutMs).toBe(789_000);
    expect(config.gitHubToken).toBe("github_pat_test");
  });
});
