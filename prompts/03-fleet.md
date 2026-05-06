# Prompt 03: Programatický fleet

Implementuj třetí vrstvu labu: SDK ekvivalent `/fleet`.

Kontext:

- Pracuj pouze v aktuálním checkoutu.
- Už existuje `pnpm run lab -- plan LAB-101`.
- Tohle cvičení je jen o `session.rpc.fleet.start(...)`, usage metrikách a task listu.
- Nepřidávej enterprise MCP integrace, custom agents ani guardrails.

Úkol:

1. Přidej příkaz:

   ```bash
   pnpm run lab -- fleet LAB-101
   ```

2. Příkaz vytvoří session se stejným modelem jako ostatní příkazy.
3. Nejdřív zapíše plán přes existující `buildIssuePlan(...)`.
4. Pak spustí:

   ```ts
   await session.rpc.fleet.start({ prompt });
   ```

5. Fleet prompt musí výslovně rozdělit práci na nezávislé lanes:
   - Dev API,
   - Dev UI,
   - QA evidence,
   - Docs evidence.
6. Po spuštění vypiš:
   - výsledek `fleet.start`,
   - `session.rpc.tasks.list()`,
   - `session.rpc.usage.getMetrics()`.

Akceptace:

- `pnpm run typecheck` projde.
- `pnpm run lab -- fleet LAB-101` existuje.
- Prompt jasně říká, že lanes nesmí přepisovat stejné soubory.

