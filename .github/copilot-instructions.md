# GitHub Copilot SDK Training Instructions

Pracuješ ve staged tréninkové větvi.

Rules:

- Nekoukej do jiných git větví, pokud o to uživatel výslovně nepožádá.
- Nehledej checkpoint ani solution větve.
- Drž změny v rozsahu aktuálního promptu.
- Preferuj malé inkrementální úpravy a po TypeScript změnách spusť `pnpm run typecheck`.
- Pokud prompt žádá programatické workflow, použij `@github/copilot-sdk@1.0.0-beta.2`.
- Nevymýšlej MCP servery ani externí integrace. Použij lokální fixtures a SDK konfigurační sloty z daného cvičení.
- Custom MCP, Google Docs sync, Jira, Zephyr a interní knowledge-base systémy ber jako existující enterprise schopnosti, ne jako začátečnická témata k výuce.
