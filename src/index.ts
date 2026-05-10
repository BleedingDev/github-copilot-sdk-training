import { approveAll, CopilotClient } from "@github/copilot-sdk";
import { normalizeCliArgs, printCliError } from "./lib/cli.js";
import { readConfig } from "./lib/config.js";
import { loadIssue, loadRepoMap } from "./lib/data.js";
import { createObservedConsoleEventLogger } from "./lib/events.js";
import { buildFleetPrompt } from "./lib/fleet.js";
import { buildIssuePlan } from "./lib/plan.js";

const [command = "help", ...args] = normalizeCliArgs(process.argv.slice(2));

const help = `
GitHub Copilot SDK Training

Aktuální stav: lokální checkout

Dostupné příkazy:
  pnpm run lab:help       Vypíše tuto nápovědu
  pnpm run lab:dry-run    Vypíše cíl aktuálního cvičení bez volání Copilota
  pnpm run lab auth       Ověří Copilot SDK autentizaci
  pnpm run lab models     Vypíše modely dostupné pro aktuální Copilot účet
  pnpm run lab ask        Pošle krátký prompt do Copilot SDK session
  pnpm run lab plan       Zapíše a přečte SDK plan pro issue
  pnpm run lab fleet      Spustí programatický fleet pro issue
  pnpm run typecheck      Ověří TypeScript

Další cvičení:
  Otevři prompts/04-guardrails.md a přidej hooks, permission policy a audit.
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
    console.log("Cvičení 04: přidej guardrails přes hooks, permission policy a audit log.");
    return;
  }

  if (selectedCommand === "auth") {
    const config = readConfig();
    await withClient(async (client) => {
      const [authStatus, models] = await withTimeout(
        "Copilot auth check",
        Promise.all([client.getAuthStatus(), client.listModels()]),
        config.startupTimeoutMs,
      );

      console.log("[auth.getStatus]");
      console.log(JSON.stringify(authStatus, null, 2));
      console.log(`\n[models.list] ${models.length} models available`);
    });
    return;
  }

  if (selectedCommand === "models") {
    const config = readConfig();
    await withClient(async (client) => {
      const models = await withTimeout("Copilot model list", client.listModels(), config.startupTimeoutMs);
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
        onPermissionRequest: approveAll,
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
        onPermissionRequest: approveAll,
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
        onPermissionRequest: approveAll,
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
    await withTimeout("Copilot client start", client.start(), config.startupTimeoutMs);
    return await operation(client);
  } finally {
    const errors = await client.stop();
    for (const error of errors) {
      console.error(error.message);
    }
  }
}

async function withTimeout<T>(label: string, promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => {
      reject(new Error(`${label} timed out after ${timeoutMs} ms.`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}
