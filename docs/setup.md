# Setup

Lab podporuje tři způsoby spuštění:

1. lokálně přes `proto`,
2. lokálně přes `mise` tasky,
3. izolovaně v Dockeru.

## Varianta A: proto

Repo pinuje Node.js i pnpm v `.prototools`. Tohle je výchozí cesta.

```bash
proto install
eval "$(proto activate zsh)"
pnpm install --frozen-lockfile
pnpm run lab:help
pnpm run lab:dry-run
pnpm run verify
```

Pro `bash` použij `eval "$(proto activate bash)"`.

## Varianta B: mise

Repo obsahuje `mise.toml` s krátkými tasky nad stejným setupem:

```bash
mise trust
mise run start
mise run verify
```

Užitečné tasky:

```bash
mise run lab:help
mise run lab:dry-run
mise run docker:build
mise run docker:shell
mise run docker:verify
```

## Copilot autentizace

Živá SDK volání vyžadují funkční GitHub Copilot CLI autentizaci:

```bash
pnpm exec copilot login
pnpm run lab auth
```

Headless varianta má používat fine-grained token s `Copilot Requests`
permission v proměnné `COPILOT_GITHUB_TOKEN`. Classic PAT z `gh auth token`
není pro Copilot endpoint podporovaný.

Pokud se headless Copilot proces v konkrétním prostředí startuje pomalu,
uprav `COPILOT_START_TIMEOUT_MS`. Výchozí hodnota je 30 sekund.

Fleet cvičení čeká na dokončení background lanes. Běh lze řídit přes
`COPILOT_FLEET_TIMEOUT_MS`, `COPILOT_FLEET_POLL_MS` a
`COPILOT_FLEET_IDLE_GRACE_MS`; při timeoutu lab aktivní tasky zruší a skončí
chybou místo tichého odpojení session.

`pnpm run lab fleet LAB-101` je záměrně jen preview. Živý běh, který spouští
background agenty a spotřebovává premium requesty, vyžaduje explicitní flag:

```bash
pnpm run lab fleet LAB-101 --live
```

Po živém běhu lab vypíše `git status` a `git diff --stat`, protože SDK
`usage.getMetrics().codeChanges` je telemetry snapshot a nemusí odpovídat
skutečnému pracovnímu stromu.

Event stream je výchozí kompaktní. Pro plný raw výpis nastav:

```bash
COPILOT_EVENT_LOG=full pnpm run lab ask "Shrň účel labu."
```

Pure části labu lze ověřit bez živého Copilota:

```bash
pnpm run typecheck
pnpm test
pnpm run lab:dry-run
```
