# GitHub Copilot SDK Training

Praktické TypeScript cvičení pro stavbu malého orchestration layeru nad
GitHub Copilot SDK. Repo je záměrně malé: cílem je pochopit SDK, řízení
workflow a guardrails, ne řešit frameworkovou nebo doménovou složitost.

## Co si vyzkoušíš

- inicializaci Copilot SDK klienta a session,
- výběr modelu, práci s event streamem a základní prompt flow,
- programatický plán nad lokálními fixtures,
- rozpad práce do paralelních agentních lane,
- permission hooks, audit a bezpečnostní hranice,
- napojení existujících instrukcí, skills, MCP slotů a vlastních agentů,
- otevřené orchestration zadání bez předpřipraveného řešení.

## Pravidla práce

- Pracuj pouze s aktuálním checkoutem.
- Nepátrej po hotových řešeních mimo zadání.
- Každou změnu drž v rozsahu aktuálního zadání.
- Pokud chybí další krok, vyžádej si ho od lektora.

## Setup

Repo používá `proto` pro pin Node.js a pnpm. Žádný `npm install`, žádný
Corepack.

```bash
proto install
eval "$(proto activate zsh)"
pnpm install --frozen-lockfile
pnpm run lab:help
pnpm run lab:dry-run
pnpm run verify
```

Před živými SDK voláními ověř Copilot CLI autentizaci:

```bash
pnpm run auth
```

`pnpm run lab auth` vznikne až v prvním cvičení.

Pokud používáš `mise`, nejdřív trustni lokální konfiguraci:

```bash
mise trust
mise run start
mise run verify
```

## Docker

```bash
docker compose run --rm lab pnpm run verify
```

Pro shell uvnitř kontejneru:

```bash
docker compose run --rm lab zsh
```

Živá volání do Copilot SDK vyžadují přihlášení nebo token podle pravidel týmu.
Bez přihlášení stále fungují suché běhy, typecheck a testy.

Přihlášení uvnitř Docker varianty:

```bash
docker compose run --rm lab pnpm run auth
```

Docker nemá system keychain. Auth script proto v Dockeru automaticky potvrdí
plaintext fallback. Token se uloží do Docker volume pro lab kontejner, ne do
repozitáře.

Fleet cvičení čeká na dokončení background lanes s timeoutem. Pokud se lane
zasekne, příkaz ji zruší a skončí chybou, aby běh nevypadal falešně úspěšně.
Výchozí `fleet` příkaz je bezpečný preview režim:

```bash
pnpm run lab fleet LAB-101
```

Živý fleet pouštěj explicitně:

```bash
pnpm run lab fleet LAB-101 --live
```

SDK usage metriky jsou užitečné pro náklady a timing, ale skutečné změny
ověřuj přes `git status --short` a `git diff --stat`. Pro raw event stream
nastav `COPILOT_EVENT_LOG=full`; výchozí režim je kompaktní.
