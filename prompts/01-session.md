# Prompt 01: SDK Session

Implementuj první vrstvu GitHub Copilot SDK labu.

Kontext:

- Použij `@github/copilot-sdk@1.0.0-beta.2`.
- Pracuj pouze v aktuálním checkoutu.
- Nemám zájem o MCP ani enterprise integrace v této fázi.
- Chci jen malý, ovladatelný TypeScript CLI wrapper.

Úkol:

1. Přidej `src/lib/config.ts`, který načte:
   - `COPILOT_MODEL`,
   - volitelný `COPILOT_HOME`,
   - `COPILOT_TIMEOUT_MS`,
   - `COPILOT_START_TIMEOUT_MS`,
   - volitelný `COPILOT_GITHUB_TOKEN`.
2. Přidej `src/lib/events.ts`, který loguje jen užitečné session eventy:
   - streaming message delta,
   - final assistant message,
   - tool start/complete,
   - usage,
   - error.
3. Uprav `src/index.ts` tak, aby podporoval:
   - `auth` - ověří Copilot SDK autentizaci a dostupnost modelů,
   - `models` - vypíše dostupné modely přes `client.listModels()`,
   - `ask <prompt>` - vytvoří session, pošle prompt přes `sendAndWait`, streamuje odpověď.
4. Před `listModels()` explicitně spusť SDK klienta přes `await client.start()` a start/auth ověření obal timeoutem.
5. `copilotHome` nastav jen tehdy, když je `COPILOT_HOME` explicitně vyplněný. Default musí nechat Copilot CLI použít standardní lokální přihlášení.
6. Použij `clientName: "github-copilot-sdk-training"`.
7. Pokud je nastavený `COPILOT_GITHUB_TOKEN`, předej ho do `CopilotClient` i session configu jako `gitHubToken`.
8. Permission handler nastav konzervativně: shell/write/read/mcp nech zatím přes `approveAll`, protože guardrails budou až v další fázi.
9. Nepřidávej žádné další workflow, agenty, MCP ani plan API.

Akceptace:

- `pnpm run typecheck` projde.
- `pnpm run lab auth` existuje.
- `pnpm run lab models` existuje.
- `pnpm run lab ask "Summarize this lab in one paragraph."` existuje.
- Když chybí Copilot autentizace, CLI vypíše jasný postup a nespadne stack tracem.
- Když se headless Copilot proces zasekne při startu, CLI skončí timeoutem místo nekonečného čekání.
