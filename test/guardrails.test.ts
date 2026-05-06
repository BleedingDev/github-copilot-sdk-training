import { describe, expect, it } from "vitest";
import { redact } from "../src/lib/audit.js";
import { containsDestructiveCommand, guardedPermissionHandler } from "../src/lib/permissions.js";

describe("guardrails", () => {
  it("redacts secrets from audit payloads", () => {
    expect(redact({ token: "abc", nested: { password: "def", ok: true } })).toEqual({
      token: "[redacted]",
      nested: { password: "[redacted]", ok: true },
    });
  });

  it("detects destructive commands", () => {
    expect(containsDestructiveCommand({ command: "git reset --hard HEAD" })).toBe(true);
    expect(containsDestructiveCommand({ command: "pnpm test" })).toBe(false);
  });

  it("rejects destructive shell permission requests", () => {
    const result = guardedPermissionHandler(
      { kind: "shell", fullCommandText: "rm -rf tests" } as never,
      { sessionId: "test" },
    );

    expect(result).toEqual({
      kind: "reject",
      feedback: expect.stringContaining("Destruktivní"),
    });
  });
});

