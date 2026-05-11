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
- vložit deterministický verification gate po Dev lanes,
- určit, že lint/typecheck/test spouští host workflow programaticky, ne agent ad hoc,
- předat krátký verification artefakt do další SDK fáze,
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
- oddělení agentní práce od deterministických nástrojových kroků,
- formát artefaktu, který putuje mezi fázemi,
- rozpočet a model policy,
- explicitní zákaz domýšlení enterprise integrací.

## Povinný orchestration pattern

V promptu musí být explicitně popsaný tento pattern:

1. SDK agent navrhne nebo provede úzkou Dev lane.
2. Host proces po lane programaticky spustí ověření, například lint/typecheck/test.
3. Host proces z výstupu vytvoří krátký strukturovaný artefakt:
   - command,
   - exit code,
   - relevantní chyby,
   - dotčené soubory,
   - doporučený další krok.
4. Tento artefakt se vloží do další SDK fáze.
5. QA/Docs lane smějí vycházet jen z diffu, artefaktu a existujícího kódu.

Tohle je hlavní rozdíl proti běžnému „nechám agenta něco zkusit a ono to nějak
dopadne“ stylu práce.

## Extra challenge

Přidej do promptu pravidlo:

> Pokud agent nemá evidence pro dokumentační tvrzení, musí napsat `evidence missing`
> a dokumentaci neupravovat.
