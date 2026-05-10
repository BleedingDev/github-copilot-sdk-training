import { CopilotClient } from "@github/copilot-sdk";
import { buildChallengeBrief } from "./lib/challenge.js";
import { normalizeCliArgs, printCliError } from "./lib/cli.js";
import { readConfig } from "./lib/config.js";
import { buildControlPlaneConfig } from "./lib/control-plane.js";
import { loadIssue, loadRepoMap } from "./lib/data.js";
import { createObservedConsoleEventLogger } from "./lib/events.js";
import { buildFleetPrompt } from "./lib/fleet.js";
import { createGuardrailHooks } from "./lib/hooks.js";
import { guardedPermissionHandler } from "./lib/permissions.js";
import { buildIssuePlan } from "./lib/plan.js";

const [command = "help", ...args] = normalizeCliArgs(process.argv.slice(2));

const help = `
GitHub Copilot SDK Training

Aktuální větev: aktuální checkout

Dostupné příkazy:
  pnpm run lab:help       Vypíše tuto nápovědu
  pnpm run lab:dry-run    Vypíše cíl aktuálního cvičení bez volání Copilota
  pnpm run lab auth       Ověří Copilot SDK autentizaci
  pnpm run lab models     Vypíše modely dostupné pro aktuální Copilot účet
  pnpm run lab ask        Pošle krátký prompt do Copilot SDK session
  pnpm run lab plan       Zapíše a přečte SDK plan pro issue
  pnpm run lab fleet      Spustí programatický fleet pro issue
  pnpm run lab control-plane  Vypíše SDK pohled na agenty, skills, MCP a usage
  pnpm run lab challenge      Vypíše challenge brief bez řešení
  pnpm run typecheck      Ověří TypeScript

Další cvičení:
  Otevři prompts/06-challenge.md a napiš vlastní orchestration prompt.
`;

try {
  await main(command, args);
} catch (error) {
  printCliError(error);
  process.exitCode = 1;
}

async function main(selectedCommand: string, selectedArgs: string[]): Promise<void> {
  if (selectedCommand === "help") {
    console.log(help.trim());
    return;
  }

  if (selectedCommand === "dry-run") {
    console.log("Cvičení 06: navrhni vlastní cost-aware Dev/QA orchestration prompt.");
    return;
  }

  if (selectedCommand === "challenge") {
    const issueKey = selectedArgs[0] ?? "LAB-101";
    const issue = await loadIssue(issueKey);
    console.log(buildChallengeBrief(issue));
    return;
  }

  if (selectedCommand === "auth") {
    await withClient(async (client) => {
      const authStatus = await client.getAuthStatus();
      const models = await client.listModels();

      console.log("[auth.getStatus]");
      console.log(JSON.stringify(authStatus, null, 2));
      console.log(`\n[models.list] ${models.length} models available`);
    });
    return;
  }

  if (selectedCommand === "models") {
    await withClient(async (client) => {
      const models = await client.listModels();
      for (const model of models) {
        const policy = model.policy?.state ? ` policy=${model.policy.state}` : "";
        const billing = model.billing ? ` multiplier=${model.billing.multiplier}` : "";
        console.log(`${model.id} - ${model.name}${policy}${billing}`);
      }
    });
    return;
  }

  if (selectedCommand === "ask") {
    const prompt = selectedArgs.join(" ").trim();
    if (!prompt) {
      throw new Error('Chybí prompt. Příklad: pnpm run lab ask "Shrň účel tohoto labu."');
    }

    const config = readConfig();
    await withClient(async (client) => {
      const events = createObservedConsoleEventLogger();
      const session = await client.createSession({
        clientName: "github-copilot-sdk-training",
        model: config.model,
        gitHubToken: config.gitHubToken,
        onPermissionRequest: guardedPermissionHandler,
        hooks: createGuardrailHooks(),
        streaming: true,
        workingDirectory: process.cwd(),
        onEvent: events.onEvent,
      });

      try {
        await session.sendAndWait({ prompt }, config.timeoutMs);
        events.assertNoSessionErrors();
      } finally {
        await session.disconnect();
      }
    });
    return;
  }

  if (selectedCommand === "plan") {
    const issueKey = selectedArgs[0] ?? "LAB-101";
    const [issue, repoMap] = await Promise.all([loadIssue(issueKey), loadRepoMap()]);
    const plan = buildIssuePlan(issue, repoMap);
    const config = readConfig();

    await withClient(async (client) => {
      const session = await client.createSession({
        clientName: "github-copilot-sdk-training",
        model: config.model,
        gitHubToken: config.gitHubToken,
        onPermissionRequest: guardedPermissionHandler,
        hooks: createGuardrailHooks(),
        streaming: false,
        workingDirectory: process.cwd(),
      });

      try {
        await session.rpc.mode.set({ mode: "plan" });
        await session.rpc.plan.update({ content: plan });
        const savedPlan = await session.rpc.plan.read();

        console.log(`Plan path: ${savedPlan.path ?? "(workspace path unavailable)"}`);
        console.log(savedPlan.content ?? "(plan is empty)");

        await session.rpc.mode.set({ mode: "interactive" });
      } finally {
        await session.disconnect();
      }
    });
    return;
  }

  if (selectedCommand === "fleet") {
    const issueKey = selectedArgs[0] ?? "LAB-101";
    const [issue, repoMap] = await Promise.all([loadIssue(issueKey), loadRepoMap()]);
    const plan = buildIssuePlan(issue, repoMap);
    const fleetPrompt = buildFleetPrompt(issue, repoMap);
    const config = readConfig();

    await withClient(async (client) => {
      const events = createObservedConsoleEventLogger();
      const session = await client.createSession({
        clientName: "github-copilot-sdk-training",
        model: config.model,
        gitHubToken: config.gitHubToken,
        includeSubAgentStreamingEvents: true,
        onPermissionRequest: guardedPermissionHandler,
        hooks: createGuardrailHooks(),
        streaming: true,
        workingDirectory: process.cwd(),
        onEvent: events.onEvent,
      });

      try {
        await session.rpc.plan.update({ content: plan });
        const fleetResult = await session.rpc.fleet.start({ prompt: fleetPrompt });
        const tasks = await session.rpc.tasks.list();
        const usage = await session.rpc.usage.getMetrics();

        console.log("\n[fleet.start]");
        console.log(JSON.stringify(fleetResult, null, 2));
        console.log("\n[tasks.list]");
        console.log(JSON.stringify(tasks, null, 2));
        console.log("\n[usage.getMetrics]");
        console.log(JSON.stringify(usage, null, 2));
        events.assertNoSessionErrors();
      } finally {
        await session.disconnect();
      }
    });
    return;
  }

  if (selectedCommand === "control-plane") {
    const config = readConfig();
    const controlPlane = buildControlPlaneConfig();

    console.log("[control-plane.config]");
    console.log(JSON.stringify(controlPlane, null, 2));

    await withClient(async (client) => {
      const session = await client.createSession({
        clientName: "github-copilot-sdk-training",
        model: config.model,
        gitHubToken: config.gitHubToken,
        ...controlPlane,
        onPermissionRequest: guardedPermissionHandler,
        hooks: createGuardrailHooks(),
        streaming: false,
        workingDirectory: process.cwd(),
      });

      try {
        const [agents, skills, mcpServers, usage] = await Promise.all([
          session.rpc.agent.list(),
          session.rpc.skills.list(),
          session.rpc.mcp.list(),
          session.rpc.usage.getMetrics(),
        ]);

        console.log("\n[agent.list]");
        console.log(JSON.stringify(agents, null, 2));
        console.log("\n[skills.list]");
        console.log(JSON.stringify(skills, null, 2));
        console.log("\n[mcp.list]");
        console.log(JSON.stringify(mcpServers, null, 2));
        console.log("\n[usage.getMetrics]");
        console.log(JSON.stringify(usage, null, 2));
      } finally {
        await session.disconnect();
      }
    });
    return;
  }

  console.error(`Neznámý příkaz: ${selectedCommand}`);
  console.error("Spusť: pnpm run lab:help");
  process.exitCode = 1;
}

async function withClient<T>(operation: (client: CopilotClient) => Promise<T>): Promise<T> {
  const config = readConfig();
  const client = new CopilotClient({
    ...(config.copilotHome ? { copilotHome: config.copilotHome } : {}),
    ...(config.gitHubToken ? { gitHubToken: config.gitHubToken } : {}),
    cwd: process.cwd(),
    useLoggedInUser: true,
  });

  try {
    await client.start();
    return await operation(client);
  } finally {
    const errors = await client.stop();
    for (const error of errors) {
      console.error(error.message);
    }
  }
}
