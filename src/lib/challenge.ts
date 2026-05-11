import type { LabIssue } from "./data.js";

export function buildChallengeBrief(issue: LabIssue): string {
  return `# Challenge brief: ${issue.key}

${issue.title}

Napiš vlastní prompt pro GitHub Copilot SDK orchestration workflow.

Povinné části promptu:

- nejdřív programatický plán,
- rozhodnutí, jestli použít fleet,
- Dev API lane,
- Dev UI lane,
- QA evidence lane,
- Docs/second-brain lane,
- deterministický verification gate po Dev lanes,
- vložení verification artefaktu do další SDK fáze,
- ownership hranice,
- zákaz paralelních editací stejných souborů,
- usage/cost kontrolní body,
- stop conditions,
- zákaz vymýšlení enterprise integrací.

Candidate paths:

${issue.candidatePaths.map((path) => `- ${path}`).join("\n")}

Non-goals:

${issue.nonGoals.map((goal) => `- ${goal}`).join("\n")}

Verification gate:

- Agent nemá sám donekonečna spouštět linter/testy.
- Host workflow po Dev lanes programaticky spustí ověření.
- Výstup z ověření se normalizuje na krátký artefakt.
- Artefakt se pošle do další SDK fáze pro QA/Docs rozhodnutí.
`;
}
