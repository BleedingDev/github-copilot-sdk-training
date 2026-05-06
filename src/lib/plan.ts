import type { LabIssue, RepoMap } from "./data.js";

export function buildIssuePlan(issue: LabIssue, repoMap: RepoMap): string {
  const candidatePaths = issue.candidatePaths.map((path) => `- ${path}`).join("\n");
  const acceptance = issue.acceptanceCriteria.map((criterion) => `- ${criterion}`).join("\n");
  const nonGoals = issue.nonGoals.map((goal) => `- ${goal}`).join("\n");
  const modules = repoMap.modules
    .map((module) => `- ${module.name} (${module.language}): ${module.paths.join(", ")}`)
    .join("\n");

  return `# Plan for ${issue.key}: ${issue.title}

## Scope

${issue.summary}

## Candidate paths

${candidatePaths}

## Repo map

${modules}

## Work lanes

- Dev API: inspect the PHP booking-detail API path and expose segment warning metadata.
- Dev UI: inspect the Next.js booking-detail module and render existing warning metadata.
- QA: map affected Zephyr/Cypress/Codeception coverage and define verification commands.
- Docs: update second-brain notes only from diff and test evidence.

## Acceptance criteria

${acceptance}

## Non-goals

${nonGoals}
`;
}

