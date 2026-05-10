export function normalizeCliArgs(args: readonly string[]): string[] {
  if (args[0] === "--") {
    return args.slice(1);
  }

  return [...args];
}

export function printCliError(error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);

  if (isAuthError(message)) {
    console.error("GitHub Copilot SDK není autentizovaný.");
    console.error("");
    console.error("Ověř přihlášení přes GitHub Copilot CLI:");
    console.error("  pnpm exec copilot login");
    console.error("");
    console.error("Pro headless běh použij fine-grained token s Copilot Requests permission:");
    console.error("  COPILOT_GITHUB_TOKEN=github_pat_... pnpm run lab auth");
    console.error("");
    console.error("Nepoužívej classic PAT z `gh auth token`; Copilot endpoint ho odmítá.");
    console.error("");
    console.error(`Původní chyba: ${message}`);
    return;
  }

  console.error(message);
}

function isAuthError(message: string): boolean {
  return (
    message.includes("Not authenticated") ||
    message.includes("authentication") ||
    message.includes("auth token") ||
    message.includes("Personal Access Tokens are not supported") ||
    message.includes("Session was not created with authentication info")
  );
}
