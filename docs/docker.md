# Docker

Docker varianta je určená pro účastníky, kteří jsou zvyklí pouštět tooling v
kontejneru.

## Build

```bash
docker build -t github-copilot-sdk-training .
```

nebo přes mise:

```bash
mise run docker:build
```

## Shell

```bash
docker compose run --rm lab zsh
```

nebo:

```bash
mise run docker:shell
```

## Ověření

```bash
docker compose run --rm lab pnpm run verify
```

nebo:

```bash
mise run docker:verify
```

## Copilot uvnitř Dockeru

Docker image instaluje Node a pnpm přes proto podle `.prototools`. Docker setup
záměrně nemountuje hostitelské credential adresáře. Pro živá Copilot SDK volání
použijte fine-grained token s `Copilot Requests` permission nebo se přihlaste
uvnitř kontejneru podle interních pravidel.

Předané env proměnné:

- `COPILOT_MODEL`
- `COPILOT_TIMEOUT_MS`
- `COPILOT_START_TIMEOUT_MS`
- `COPILOT_FLEET_TIMEOUT_MS`
- `COPILOT_FLEET_POLL_MS`
- `COPILOT_FLEET_IDLE_GRACE_MS`
- `COPILOT_GITHUB_TOKEN`

`COPILOT_HOME` nastavujte jen záměrně, pokud chcete oddělený Copilot CLI config.
Bez této proměnné CLI používá standardní přihlášení v `~/.copilot`.

Bez autentizace pořád fungují:

```bash
pnpm run lab:dry-run
pnpm run typecheck
pnpm test
```
