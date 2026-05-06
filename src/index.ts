import { approveAll, CopilotClient } from "@github/copilot-sdk";
import { readConfig } from "./lib/config.js";
import { loadIssue, loadRepoMap } from "./lib/data.js";
import { createConsoleEventLogger } from "./lib/events.js";
import { buildIssuePlan } from "./lib/plan.js";

const [command = "help", ...args] = process.argv.slice(2);

const help = `
GitHub Copilot SDK Training

Aktuální větev: aktuální checkout

Dostupné příkazy:
  pnpm run lab:help       Vypíše tuto nápovědu
  pnpm run lab:dry-run    Vypíše cíl aktuálního cvičení bez volání Copilota
  pnpm run lab -- models  Vypíše modely dostupné pro aktuální Copilot účet
  pnpm run lab -- ask     Pošle krátký prompt do Copilot SDK session
  pnpm run lab -- plan    Zapíše a přečte SDK plan pro issue
  pnpm run typecheck      Ověří TypeScript

Další cvičení:
  Otevři prompts/02-plan.md a přidej programatické plan mode API.
`;

await main(command, args);

async function main(selectedCommand: string, selectedArgs: string[]): Promise<void> {
  if (selectedCommand === "help") {
    console.log(help.trim());
    return;
  }

  if (selectedCommand === "dry-run") {
    console.log("Cvičení 03: spusť programatický fleet přes session.rpc.fleet.start().");
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
      throw new Error('Chybí prompt. Příklad: pnpm run lab -- ask "Shrň účel tohoto labu."');
    }

    const config = readConfig();
    await withClient(async (client) => {
      const session = await client.createSession({
        clientName: "github-copilot-sdk-training",
        model: config.model,
        onPermissionRequest: approveAll,
        streaming: true,
        workingDirectory: process.cwd(),
        onEvent: createConsoleEventLogger(),
      });

      try {
        await session.sendAndWait({ prompt }, config.timeoutMs);
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

  console.error(`Neznámý příkaz: ${selectedCommand}`);
  console.error("Spusť: pnpm run lab:help");
  process.exitCode = 1;
}

async function withClient<T>(operation: (client: CopilotClient) => Promise<T>): Promise<T> {
  const config = readConfig();
  const client = new CopilotClient({
    copilotHome: config.copilotHome,
    cwd: process.cwd(),
  });

  try {
    return await operation(client);
  } finally {
    const errors = await client.stop();
    for (const error of errors) {
      console.error(error.message);
    }
  }
}
