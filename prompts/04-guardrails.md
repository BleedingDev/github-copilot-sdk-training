# Prompt 04: Guardrails, hooks a audit

Implementuj čtvrtou vrstvu labu: kontrolu agenta přes SDK hooks a permission policy.

Kontext:

- Pracuj pouze v aktuálním checkoutu.
- Už existuje programatický `fleet`.
- Tohle cvičení je jen o bezpečnostní a auditní vrstvě.
- Nepřidávej custom agents, MCP konfigurace ani nové enterprise integrace.

Úkol:

1. Přidej `src/lib/audit.ts`, který zapisuje JSONL do `reports/sdk-audit.jsonl`.
2. Přidej `src/lib/permissions.ts`, který:
   - povolí read-only operace,
   - zamítne destruktivní shell příkazy (`rm -rf`, `git reset --hard`, `git checkout --`, `git clean`),
   - pro write/shell/mcp/custom-tool vrátí konzervativní `approve-once`, pokud nejsou blokované.
3. Přidej `src/lib/hooks.ts`, který:
   - přes `onUserPromptSubmitted` přidá krátký scope reminder,
   - přes `onPreToolUse` zamítne destruktivní příkazy,
   - přes `onPostToolUse` zapíše auditní záznam,
   - přes `onErrorOccurred` zapíše chybu.
4. Zapoj guardrails do příkazů `ask`, `plan` a `fleet`.
5. Pokud SDK emituje `session.error` nebo `model.call_failure`, příkaz nesmí skončit jako úspěšný běh.
6. Nepřepisuj existující SDK tok, jen přidej kontrolní vrstvu.

Akceptace:

- `pnpm run typecheck` projde.
- `pnpm test` projde.
- V `reports/` vzniká JSONL audit při živém běhu.
- Destruktivní příkazy jsou odmítnuté jak permission handlerem, tak hookem.
