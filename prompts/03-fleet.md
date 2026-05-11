# Prompt 03: Programatický fleet

Implementuj třetí vrstvu labu: SDK ekvivalent `/fleet`.

Kontext:

- Pracuj pouze v aktuálním checkoutu.
- Už existuje `pnpm run lab plan LAB-101`.
- Tohle cvičení je o `session.rpc.fleet.start(...)`, task supervision, usage metrikách a task listu.
- Nepřidávej enterprise MCP integrace, custom agents ani guardrails.

Úkol:

1. Přidej příkaz:

   ```bash
   pnpm run lab fleet LAB-101
   pnpm run lab fleet LAB-101 --live
   ```

2. Příkaz bez `--live` je bezpečný preview režim:
   - nevytváří SDK session,
   - nespouští background agenty,
   - vypíše prompt, cost upozornění a přesný příkaz pro živý běh.
3. Příkaz s `--live` vytvoří session se stejným modelem jako ostatní příkazy.
4. Živý běh nejdřív zapíše plán přes existující `buildIssuePlan(...)`.
5. Pak spustí:

   ```ts
   await session.rpc.fleet.start({ prompt });
   ```

6. Fleet prompt musí výslovně rozdělit práci na nezávislé lanes:
   - Dev API,
   - Dev UI,
   - QA evidence,
   - Docs evidence.
7. Po živém spuštění vypiš:
   - výsledek `fleet.start`,
   - počáteční `session.rpc.tasks.list()`,
   - průběžný stav přes polling `session.rpc.tasks.list()`,
   - finální `session.rpc.tasks.list()`,
   - `session.rpc.usage.getMetrics()`,
   - skutečný dopad přes `git status --short` a `git diff --stat`.
8. Čekej na dokončení tasků s timeoutem:
   - timeout čti z `COPILOT_FLEET_TIMEOUT_MS`,
   - interval čti z `COPILOT_FLEET_POLL_MS`,
   - quiescence interval čti z `COPILOT_FLEET_IDLE_GRACE_MS`,
   - stav `running` považuj za aktivní,
   - stav `idle` považuj za settled background stav až poté, co task list zůstane stabilní po celý quiescence interval,
   - pokud task skončí `failed` nebo `cancelled`, příkaz musí selhat,
   - pokud timeout doběhne, aktivní tasky zruš přes `session.rpc.tasks.cancel(...)` a příkaz musí selhat.

Akceptace:

- `pnpm run typecheck` projde.
- `pnpm run lab fleet LAB-101` existuje a je preview bez živých agentů.
- `pnpm run lab fleet LAB-101 --live` spustí živý SDK fleet.
- Prompt jasně říká, že lanes nesmí přepisovat stejné soubory.
- Živý příkaz nekončí hned po `fleet.start`; buď vypíše finální task stav, nebo řízeně selže.
- Živý příkaz ověřuje změny přes Git, ne přes `usage.getMetrics().codeChanges`.
