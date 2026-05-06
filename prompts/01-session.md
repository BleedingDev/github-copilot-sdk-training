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
   - `COPILOT_HOME`,
   - `COPILOT_TIMEOUT_MS`.
2. Přidej `src/lib/events.ts`, který loguje jen užitečné session eventy:
   - streaming message delta,
   - final assistant message,
   - tool start/complete,
   - usage,
   - error.
3. Uprav `src/index.ts` tak, aby podporoval:
   - `models` - vypíše dostupné modely přes `client.listModels()`,
   - `ask <prompt>` - vytvoří session, pošle prompt přes `sendAndWait`, streamuje odpověď.
4. Použij `copilotHome` z configu a `clientName: "github-copilot-sdk-training"`.
5. Permission handler nastav konzervativně: shell/write/read/mcp nech zatím přes `approveAll`, protože guardrails budou až v další fázi.
6. Nepřidávej žádné další workflow, agenty, MCP ani plan API.

Akceptace:

- `pnpm run typecheck` projde.
- `pnpm run lab -- models` existuje.
- `pnpm run lab -- ask "Summarize this lab in one paragraph."` existuje.
