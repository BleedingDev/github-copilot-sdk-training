# Prompt 05: Control-plane nad existujícím enterprise kontextem

Implementuj pátou vrstvu labu: orchestrace nad existujícími MCP, skills,
instrukcemi a custom agenty.

Kontext:

- Pracuj pouze v aktuálním checkoutu.
- Tým už MCP a znalostní bázi používá. Nevysvětluj MCP od nuly.
- Cílem je ukázat, jak SDK dostane existující enterprise kontext pod programatickou kontrolu.

Úkol:

1. Přidej `src/lib/control-plane.ts`.
2. Funkce v něm mají vracet konfigurační části pro `createSession(...)`:
   - `mcpServers` placeholder pro existující enterprise MCP endpointy,
   - `skillDirectories`,
   - `instructionDirectories`,
   - `customAgents`,
   - `enableConfigDiscovery: false`,
   - `defaultAgent.excludedTools`.
3. Přidej příkaz:

   ```bash
   pnpm run lab control-plane LAB-101
   ```

4. Příkaz vytvoří session a vypíše:
   - dostupné agenty přes `session.rpc.agent.list()`,
   - dostupné skills přes `session.rpc.skills.list()`,
   - dostupné MCP servery přes `session.rpc.mcp.list()`,
   - aktuální usage metriky.
5. Nepřidávej žádný mock MCP server. Jen ukaž, kam se jejich existující MCP konfigurace zapojí.
6. `instructionDirectories` musí mířit jen na lokální workshop instrukce v `instructions/workshop`.
7. `skillDirectories` musí mířit jen na lokální `skills`, aby se do cvičení nemíchal globální uživatelský kontext.

Akceptace:

- `pnpm run typecheck` projde.
- `pnpm test` projde.
- Konfigurace explicitně odděluje Dev, QA a Docs agenty.
- Default agent nemá vidět drahé nebo rizikové nástroje, pokud jsou určené jen pro specializované agenty.
