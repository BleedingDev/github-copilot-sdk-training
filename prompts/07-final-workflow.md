# Prompt 07: Final workflow

Tohle je referenční finální flow pro lektorskou ukázku. Účastníci ho nemají
implementovat od nuly během hlavních cvičení; slouží jako hotový checkpoint.

## Cíl

Postav programatickou orchestraci nad GitHub Copilot SDK:

- analýzu a plán provede `gpt-5.3-codex`,
- implementaci a repair kroky provede `gpt-5.4-mini`,
- quality gates spouští host proces ve for-loopu,
- loop končí zeleným gatem nebo po maximálním počtu pokusů,
- fresh-context review provede `gpt-5.5`,
- review blockery opraví zpět `gpt-5.4-mini`,
- repair po review opět prochází quality-gate loopem,
- Expect CLI otestuje změny přes `expect-cli`,
- uživatel dostane detailní report v `reports/final-workflow-report.md`.

## Spuštění

Preview bez volání modelů:

```bash
pnpm run lab final-flow LAB-101
```

Živý běh:

```bash
pnpm run lab final-flow LAB-101 --live
```

Živý běh bez Expect:

```bash
pnpm run lab final-flow LAB-101 --live --no-expect
```

## Model policy

Modely lze přepsat přes env:

```bash
COPILOT_PLAN_MODEL=gpt-5.3-codex
COPILOT_IMPLEMENT_MODEL=gpt-5.4-mini
COPILOT_REVIEW_MODEL=gpt-5.5
COPILOT_MAX_GATE_ATTEMPTS=3
```

## Důležitý pattern

Agent nesmí nést celý checklist v hlavě. Host proces drží:

- model routing,
- pořadí fází,
- quality gates,
- retry budget,
- Expect CLI test,
- strukturovaný report.
