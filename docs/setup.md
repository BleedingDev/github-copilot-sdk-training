# Setup

Lab podporuje tři způsoby spuštění:

1. lokálně přes `proto`,
2. lokálně přes `mise` tasky,
3. izolovaně v Dockeru.

## Varianta A: proto

Repo pinuje Node.js i pnpm v `.prototools`. Tohle je výchozí cesta.

```bash
proto install
proto run pnpm -- install --frozen-lockfile
proto run pnpm -- run lab:help
proto run pnpm -- run lab:dry-run
proto run pnpm -- run verify
```

## Varianta B: mise

Repo obsahuje `mise.toml` s krátkými tasky nad stejným setupem:

```bash
mise run start
mise run verify
```

Užitečné tasky:

```bash
mise run lab:help
mise run lab:dry-run
mise run lab:models
mise run docker:build
mise run docker:shell
mise run docker:verify
```

## Copilot autentizace

Živá SDK volání vyžadují funkční GitHub Copilot CLI autentizaci nebo token podle
toho, jak to má tým povolené. Pure části labu lze ověřit bez živého Copilota:

```bash
proto run pnpm -- run typecheck
proto run pnpm -- test
proto run pnpm -- run lab:dry-run
```
