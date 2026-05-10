# Prompt 02: Programatický plan mode

Implementuj druhou vrstvu labu: SDK ekvivalent pro práci s plánem.

Kontext:

- Pracuj pouze v aktuálním checkoutu.
- Už existují příkazy `models` a `ask`.
- Tohle cvičení je jen o `session.rpc.mode.*` a `session.rpc.plan.*`.
- Nepřidávej `/fleet`, tasky, agenty, MCP ani guardrails.

Úkol:

1. Přidej příkaz:

   ```bash
   pnpm run lab plan LAB-101
   ```

2. Příkaz vytvoří session, přepne ji do `plan` módu a přes `session.rpc.plan.update(...)`
   zapíše malý plán pro issue `LAB-101`.
3. Plán musí vycházet pouze z `data/issues/LAB-101.json` a `data/repo-map.json`.
4. Po zápisu plán znovu přečti přes `session.rpc.plan.read()` a vypiš:
   - cestu k `plan.md`,
   - obsah plánu.
5. Nakonec přepni session zpět do `interactive` módu.

Akceptace:

- `pnpm run typecheck` projde.
- `pnpm run lab plan LAB-101` existuje.
- Plán je krátký, konkrétní a rozděluje práci na Dev, QA a Docs část.

