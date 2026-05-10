import { describe, expect, it } from "vitest";
import { normalizeCliArgs } from "../src/lib/cli.js";

describe("normalizeCliArgs", () => {
  it("accepts plain pnpm script args", () => {
    expect(normalizeCliArgs(["plan", "LAB-101"])).toEqual(["plan", "LAB-101"]);
  });

  it("accepts legacy pnpm separator args", () => {
    expect(normalizeCliArgs(["--", "plan", "LAB-101"])).toEqual(["plan", "LAB-101"]);
  });
});
