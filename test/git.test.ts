import { describe, expect, it } from "vitest";
import { parseStatusFiles } from "../src/lib/git.js";

describe("parseStatusFiles", () => {
  it("extracts touched paths from git short status", () => {
    expect(parseStatusFiles(" M src/index.ts\n?? reports/sdk-audit.jsonl\nR  old.ts -> new.ts")).toEqual([
      "src/index.ts",
      "reports/sdk-audit.jsonl",
      "new.ts",
    ]);
  });
});
