# Prompt 06: Challenge

Tohle cvičení už nemá copy-paste prompt pro implementaci. Účastník má prompt
napsat sám.

## Zadání pro účastníka

Navrhni prompt pro GitHub Copilot SDK agenta, který z issue `LAB-101` spustí
cost-aware Dev/QA orchestration workflow.

Prompt musí:

- použít programatický plán před implementací,
- rozhodnout, jestli je vhodné použít `session.rpc.fleet.start(...)`,
- rozdělit práci na Dev API, Dev UI, QA a Docs lane,
- explicitně uvést ownership hranice,
- zakázat dvěma lanes editovat stejné soubory,
- použít existující MCP/knowledge-base kontext jen jako zdroj evidence,
- připravit second-brain update pouze z diffu a test evidence,
- vypsat usage/cost kontrolní body,
- obsahovat stop conditions.

## Kritéria dobrého promptu

Dobrý prompt není dlouhý román. Má hlavně:

- konkrétní artefakty,
- vlastnictví cest,
- závislosti mezi lanes,
- ověření,
- rozpočet a model policy,
- explicitní zákaz domýšlení enterprise integrací.

## Extra challenge

Přidej do promptu pravidlo:

> Pokud agent nemá evidence pro dokumentační tvrzení, musí napsat `evidence missing`
> a dokumentaci neupravovat.

