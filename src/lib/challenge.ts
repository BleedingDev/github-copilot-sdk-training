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
- ownership hranice,
- zákaz paralelních editací stejných souborů,
- usage/cost kontrolní body,
- stop conditions,
- zákaz vymýšlení enterprise integrací.

Candidate paths:

${issue.candidatePaths.map((path) => `- ${path}`).join("\n")}

Non-goals:

${issue.nonGoals.map((goal) => `- ${goal}`).join("\n")}
`;
}

