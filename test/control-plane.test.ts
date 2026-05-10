import { describe, expect, it } from "vitest";
import { buildControlPlaneConfig, buildCustomAgents, buildEnterpriseMcpServers } from "../src/lib/control-plane.js";

describe("control-plane config", () => {
  it("does not invent MCP servers when env is empty", () => {
    expect(buildEnterpriseMcpServers({})).toEqual({});
  });

  it("creates HTTP MCP config only from env", () => {
    const servers = buildEnterpriseMcpServers({
      TRAINING_JIRA_MCP_URL: "https://mcp.example.test/jira",
      TRAINING_JIRA_MCP_TOKEN: "secret",
    });

    expect(servers.jira).toMatchObject({
      type: "http",
      url: "https://mcp.example.test/jira",
      tools: ["*"],
    });
  });

  it("separates Dev, QA and Docs custom agents", () => {
    const names = buildCustomAgents().map((agent) => agent.name);

    expect(names).toEqual(["lab-planner", "lab-dev-api", "lab-dev-ui", "lab-qa", "lab-docs"]);
  });

  it("configures discovery, skills and instructions", () => {
    const config = buildControlPlaneConfig({});

    expect(config.enableConfigDiscovery).toBe(false);
    expect(config.skillDirectories).toEqual(["skills"]);
    expect(config.instructionDirectories).toEqual(["instructions/workshop"]);
  });
});
