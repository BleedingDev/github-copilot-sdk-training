const rawArgs = process.argv.slice(2);
const command = rawArgs[0] === "--" ? (rawArgs[1] ?? "help") : (rawArgs[0] ?? "help");

const help = `
GitHub Copilot SDK Training

Aktuální stav: lokální checkout

Dostupné příkazy:
  pnpm run lab:help       Vypíše tuto nápovědu
  pnpm run lab:dry-run    Vypíše cíl aktuálního cvičení bez volání Copilota
  pnpm run typecheck      Ověří TypeScript

Další cvičení:
  Otevři prompts/01-session.md a implementuj první SDK session.
`;

if (command === "help") {
  console.log(help.trim());
} else if (command === "dry-run") {
  console.log("Cvičení 01: vytvoř Copilot SDK session, vypiš modely a streamuj krátkou odpověď.");
} else {
  console.error(`Neznámý příkaz: ${command}`);
  console.error("Spusť: pnpm run lab:help");
  process.exitCode = 1;
}
