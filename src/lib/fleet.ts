import type { LabIssue, RepoMap } from "./data.js";

export function buildFleetPrompt(issue: LabIssue, repoMap: RepoMap): string {
  const paths = issue.candidatePaths.map((path) => `- ${path}`).join("\n");
  const modules = repoMap.modules
    .map((module) => `- ${module.name}: ${module.paths.join(", ")}`)
    .join("\n");

  return `Use fleet mode for ${issue.key}: ${issue.title}.

Split the work into independent lanes. Do not let two lanes edit the same files.

Known candidate paths:
${paths}

Known module map:
${modules}

Lanes:

1. Dev API lane
   - Owns only PHP booking-detail API files.
   - Output: implementation notes and exact files that would change.

2. Dev UI lane
   - Owns only Next.js booking-detail UI files.
   - Output: implementation notes and exact files that would change.

3. QA evidence lane
   - Owns only test planning and verification commands.
   - Output: Cypress/Codeception/Zephyr evidence checklist.

4. Docs evidence lane
   - Owns only second-brain update notes.
   - Output: documentation claims supported by code diff and test evidence only.

Stop conditions:

- If a lane needs files owned by another lane, report the dependency instead of editing.
- Do not redesign unrelated modules.
- Do not invent Jira, Zephyr, Grafana, MCP, or Google Docs integrations.
- Keep final synthesis short and include unresolved risks.`;
}

