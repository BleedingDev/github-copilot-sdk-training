import { describe, expect, it } from "vitest";
import { readConfig } from "../src/lib/config.js";

describe("readConfig", () => {
  it("uses explicit beta-friendly defaults", () => {
    const config = readConfig({});

    expect(config.model).toBe("gpt-5.2-codex");
    expect(config.copilotHome).toContain(".copilot-lab");
    expect(config.timeoutMs).toBe(180_000);
  });

  it("accepts environment overrides", () => {
    const config = readConfig({
      COPILOT_MODEL: "claude-opus-4.5",
      COPILOT_HOME: ".tmp-copilot",
      COPILOT_TIMEOUT_MS: "12345",
    });

    expect(config.model).toBe("claude-opus-4.5");
    expect(config.copilotHome).toContain(".tmp-copilot");
    expect(config.timeoutMs).toBe(12_345);
  });
});

