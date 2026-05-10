import type { CustomAgentConfig, MCPServerConfig, SessionConfig } from "@github/copilot-sdk";

export type ControlPlaneConfig = Pick<
  SessionConfig,
  "mcpServers" | "skillDirectories" | "instructionDirectories" | "customAgents" | "defaultAgent" | "enableConfigDiscovery"
>;

export function buildControlPlaneConfig(env: NodeJS.ProcessEnv = process.env): ControlPlaneConfig {
  return {
    enableConfigDiscovery: false,
    instructionDirectories: ["instructions/workshop"],
    skillDirectories: ["skills"],
    mcpServers: buildEnterpriseMcpServers(env),
    customAgents: buildCustomAgents(),
    defaultAgent: {
      excludedTools: ["bash", "str_replace_editor"],
    },
  };
}

export function buildEnterpriseMcpServers(env: NodeJS.ProcessEnv): Record<string, MCPServerConfig> {
  const servers: Record<string, MCPServerConfig> = {};

  addHttpMcpServer(servers, "jira", env.TRAINING_JIRA_MCP_URL, env.TRAINING_JIRA_MCP_TOKEN);
  addHttpMcpServer(servers, "zephyr", env.TRAINING_ZEPHYR_MCP_URL, env.TRAINING_ZEPHYR_MCP_TOKEN);
  addHttpMcpServer(servers, "grafana", env.TRAINING_GRAFANA_MCP_URL, env.TRAINING_GRAFANA_MCP_TOKEN);
  addHttpMcpServer(servers, "knowledge-base", env.TRAINING_KB_MCP_URL, env.TRAINING_KB_MCP_TOKEN);

  return servers;
}

export function buildCustomAgents(): CustomAgentConfig[] {
  return [
    {
      name: "lab-planner",
      displayName: "Sample Booking App Planner",
      description: "Rozseká Jira issue na malé lanes s jasným ownershipem a závislostmi.",
      tools: ["grep", "glob", "view"],
      skills: ["workshop-dev-workflow"],
      prompt:
        "Jsi planner pro Sample Booking App. Vytvářej krátký plán, explicitní lanes, vlastníky souborů, stop conditions a rizika. Neimplementuj.",
    },
    {
      name: "lab-dev-api",
      displayName: "Sample Booking App API Dev",
      description: "Řeší pouze PHP/API lane pro booking-detail a pricing související změny.",
      tools: ["grep", "glob", "view", "str_replace_editor"],
      skills: ["workshop-dev-workflow"],
      prompt:
        "Jsi senior API vývojář. Drž se existujících PHP struktur, neměň UI, QA ani dokumentaci mimo explicitní zadání.",
    },
    {
      name: "lab-dev-ui",
      displayName: "Sample Booking App UI Dev",
      description: "Řeší pouze Next.js UI lane pro booking-detail.",
      tools: ["grep", "glob", "view", "str_replace_editor"],
      skills: ["workshop-dev-workflow"],
      prompt:
        "Jsi senior frontend vývojář pro Sample Booking App. Respektuj existující design systém, nevymýšlej nový layout a neměň API lane.",
    },
    {
      name: "lab-qa",
      displayName: "Sample Booking App QA",
      description: "Mapuje Cypress, Codeception a Zephyr dopady bez zásahů do implementace.",
      tools: ["grep", "glob", "view"],
      skills: ["qa-evidence"],
      prompt:
        "Jsi QA agent. Sbírej evidence, testovací dopady a ověřovací příkazy. Neimplementuj produkční kód.",
    },
    {
      name: "lab-docs",
      displayName: "Sample Booking App Docs",
      description: "Připravuje second-brain update pouze z diffu a ověřené evidence.",
      tools: ["grep", "glob", "view"],
      skills: ["second-brain"],
      prompt:
        "Jsi documentation agent. Popisuj jen fakta doložená diffem, testy nebo existujícím kódem. Nevymýšlej endpointy, classy ani procesy.",
    },
  ];
}

function addHttpMcpServer(
  servers: Record<string, MCPServerConfig>,
  name: string,
  url: string | undefined,
  token: string | undefined,
): void {
  if (!url) {
    return;
  }

  servers[name] = {
    type: "http",
    url,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    tools: ["*"],
    timeout: 30_000,
  };
}
