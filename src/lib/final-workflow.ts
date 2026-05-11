import { execFile } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { promisify } from "node:util";
import type { CopilotClient, CopilotSession, ModelInfo } from "@github/copilot-sdk";
import type { LabConfig } from "./config.js";
import { buildControlPlaneConfig } from "./control-plane.js";
import type { LabIssue, RepoMap } from "./data.js";
import { createObservedConsoleEventLogger } from "./events.js";
import { readWorktreeChangeSummary } from "./git.js";
import { createGuardrailHooks } from "./hooks.js";
import { guardedPermissionHandler } from "./permissions.js";
import { buildIssuePlan } from "./plan.js";
import {
  formatVerificationArtifact,
  runQualityGates,
  summarizeWorktree,
  type VerificationArtifact,
} from "./quality-gates.js";

const execFileAsync = promisify(execFile);

export type FinalWorkflowArgs = {
  readonly issueKey: string;
  readonly live: boolean;
  readonly runExpect: boolean;
  readonly maxAttempts?: number;
};

export type WorkflowModelPolicy = {
  readonly planModel: string;
  readonly implementModel: string;
  readonly reviewModel: string;
};

export type FinalWorkflowReport = {
  readonly issueKey: string;
  readonly live: boolean;
  readonly modelPolicy: WorkflowModelPolicy;
  readonly maxAttempts: number;
  readonly modelWarnings: readonly string[];
  readonly phases: readonly WorkflowPhaseReport[];
  readonly gates: readonly VerificationArtifact[];
  readonly reviewLoops: readonly ReviewLoopReport[];
  readonly expect?: ExpectReport;
  readonly finalWorktree: Awaited<ReturnType<typeof readWorktreeChangeSummary>>;
};

export type WorkflowPhaseReport = {
  readonly name: string;
  readonly model: string;
  readonly response: string;
};

export type ReviewLoopReport = {
  readonly review: WorkflowPhaseReport;
  readonly repaired: boolean;
  readonly gate?: VerificationArtifact;
};

export type ExpectReport = {
  readonly command: string;
  readonly exitCode: number;
  readonly ok: boolean;
  readonly stdout: string;
  readonly stderr: string;
};

export function parseFinalWorkflowArgs(args: readonly string[], config: LabConfig): FinalWorkflowArgs {
  let issueKey = "LAB-101";
  let live = false;
  let runExpect = true;
  let maxAttempts: number | undefined;

  for (const arg of args) {
    if (arg === "--live") {
      live = true;
      continue;
    }

    if (arg === "--expect") {
      runExpect = true;
      continue;
    }

    if (arg === "--no-expect") {
      runExpect = false;
      continue;
    }

    if (arg.startsWith("--max-attempts=")) {
      maxAttempts = readPositiveInteger(arg.slice("--max-attempts=".length), "--max-attempts");
      continue;
    }

    if (arg.startsWith("--")) {
      throw new Error(`Neznámý final-flow přepínač: ${arg}`);
    }

    issueKey = arg;
  }

  return {
    issueKey,
    live,
    runExpect,
    maxAttempts: maxAttempts ?? config.maxGateAttempts,
  };
}

export function buildFinalWorkflowPreview(issue: LabIssue, config: LabConfig): string {
  return `# Final workflow preview: ${issue.key}

${issue.title}

Tenhle příkaz je hotová ukázka programatické orchestrace nad Copilot SDK.
Bez \`--live\` pouze vypíše plán běhu a nespouští modely.

Live běh:

\`\`\`bash
pnpm run lab final-flow ${issue.key} --live
\`\`\`

Live běh bez Expect:

\`\`\`bash
pnpm run lab final-flow ${issue.key} --live --no-expect
\`\`\`

Model policy:

- analysis + plán: ${config.planModel}
- implementace + repair: ${config.implementModel}
- review: ${config.reviewModel}

Control loop:

1. ${config.planModel} udělá analýzu a plán.
2. ${config.implementModel} implementuje úzký scoped krok.
3. Host spustí quality gates.
4. Pokud gate neprojde, host pošle krátký artefakt zpět do ${config.implementModel}.
5. Loop se opakuje maximálně ${config.maxGateAttempts}x.
6. ${config.reviewModel} udělá fresh-context review z issue, plánu, diffu a gate artefaktů.
7. Pokud review najde blocker, ${config.implementModel} opravuje a host znovu gate loopuje.
8. Expect CLI otestuje změny a výsledek jde do detailního reportu.
`;
}

export async function runFinalWorkflow(
  client: CopilotClient,
  issue: LabIssue,
  repoMap: RepoMap,
  config: LabConfig,
  args: FinalWorkflowArgs,
): Promise<FinalWorkflowReport> {
  const maxAttempts = args.maxAttempts ?? config.maxGateAttempts;
  const modelPolicy = {
    planModel: config.planModel,
    implementModel: config.implementModel,
    reviewModel: config.reviewModel,
  };
  const modelWarnings = await checkModelAvailability(client, modelPolicy);
  const phases: WorkflowPhaseReport[] = [];
  const gates: VerificationArtifact[] = [];
  const reviewLoops: ReviewLoopReport[] = [];

  const plan = await runAgentPhase(client, config, {
    name: "analysis-plan",
    model: modelPolicy.planModel,
    prompt: buildAnalysisPrompt(issue, repoMap),
  });
  phases.push(plan);

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const implementation = await runAgentPhase(client, config, {
      name: `implementation-attempt-${attempt}`,
      model: modelPolicy.implementModel,
      prompt: buildImplementationPrompt(issue, plan.response, attempt),
    });
    phases.push(implementation);

    const gate = await runQualityGates("implementation", attempt);
    gates.push(gate);

    if (gate.ok) {
      break;
    }

    if (attempt === maxAttempts) {
      const report = await buildReport({
        issueKey: issue.key,
        live: args.live,
        modelPolicy,
        maxAttempts,
        modelWarnings,
        phases,
        gates,
        reviewLoops,
        finalWorktree: await readWorktreeChangeSummary(),
      });
      throw new Error(`Implementation gates failed after ${maxAttempts} attempts.\nReport: ${report}`);
    }

    const repair = await runAgentPhase(client, config, {
      name: `implementation-repair-${attempt}`,
      model: modelPolicy.implementModel,
      prompt: buildRepairPrompt(issue, gate, "implementation"),
    });
    phases.push(repair);
  }

  const review = await runAgentPhase(client, config, {
    name: "fresh-context-review",
    model: modelPolicy.reviewModel,
    prompt: await buildReviewPrompt(issue, plan.response, gates),
  });
  phases.push(review);

  if (requiresRepair(review.response)) {
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      const repair = await runAgentPhase(client, config, {
        name: `review-repair-${attempt}`,
        model: modelPolicy.implementModel,
        prompt: buildReviewRepairPrompt(issue, review.response, attempt),
      });
      phases.push(repair);

      const gate = await runQualityGates("review-repair", attempt);
      gates.push(gate);
      reviewLoops.push({ review, repaired: true, gate });

      if (gate.ok) {
        break;
      }

      if (attempt === maxAttempts) {
        const report = await buildReport({
          issueKey: issue.key,
          live: args.live,
          modelPolicy,
          maxAttempts,
          modelWarnings,
          phases,
          gates,
          reviewLoops,
          finalWorktree: await readWorktreeChangeSummary(),
        });
        throw new Error(`Review repair gates failed after ${maxAttempts} attempts.\nReport: ${report}`);
      }
    }
  } else {
    reviewLoops.push({ review, repaired: false });
  }

  const expect = args.runExpect ? await runExpectCli(issue, config.expectTimeoutMs) : undefined;
  const report: FinalWorkflowReport = {
    issueKey: issue.key,
    live: args.live,
    modelPolicy,
    maxAttempts,
    modelWarnings,
    phases,
    gates,
    reviewLoops,
    expect,
    finalWorktree: await readWorktreeChangeSummary(),
  };

  const reportPath = await buildReport(report);
  console.log(`\n[final-flow.report]\n${reportPath}`);

  return report;
}

async function runAgentPhase(
  client: CopilotClient,
  config: LabConfig,
  phase: { readonly name: string; readonly model: string; readonly prompt: string },
): Promise<WorkflowPhaseReport> {
  console.log(`\n[phase.start] ${phase.name} model=${phase.model}`);
  const session = await createWorkflowSession(client, config, phase.model);

  try {
    const response = await session.sendAndWait({ prompt: phase.prompt }, config.timeoutMs);
    const content = response?.data.content?.trim() ?? "";
    console.log(`\n[phase.done] ${phase.name}`);
    return {
      name: phase.name,
      model: phase.model,
      response: content,
    };
  } finally {
    await session.disconnect();
  }
}

async function createWorkflowSession(
  client: CopilotClient,
  config: LabConfig,
  model: string,
): Promise<CopilotSession> {
  const events = createObservedConsoleEventLogger({ mode: config.eventLogMode });

  return client.createSession({
    clientName: "github-copilot-sdk-training-final-flow",
    model,
    gitHubToken: config.gitHubToken,
    ...buildControlPlaneConfig(),
    onPermissionRequest: guardedPermissionHandler,
    hooks: createGuardrailHooks(),
    streaming: true,
    workingDirectory: process.cwd(),
    onEvent(event) {
      events.onEvent(event);
    },
  });
}

async function checkModelAvailability(
  client: CopilotClient,
  modelPolicy: WorkflowModelPolicy,
): Promise<readonly string[]> {
  const availableModels = await client.listModels();
  const availableIds = new Set(availableModels.map((model: ModelInfo) => model.id));
  const requiredModels = [modelPolicy.planModel, modelPolicy.implementModel, modelPolicy.reviewModel];

  return requiredModels
    .filter((model) => !availableIds.has(model))
    .map((model) => `Model '${model}' není v aktuálním Copilot účtu dostupný. Uprav COPILOT_*_MODEL env.`);
}

function buildAnalysisPrompt(issue: LabIssue, repoMap: RepoMap): string {
  return `Analyze issue ${issue.key} and write a concise implementation plan.

Issue:
${JSON.stringify(issue, null, 2)}

Repo map:
${JSON.stringify(repoMap, null, 2)}

Rules:
- Do not edit files.
- Produce scoped lanes, ownership boundaries, dependencies, risks and stop conditions.
- Mention exact candidate paths.
- Keep the plan compact enough to pass into the next SDK phase.`;
}

function buildImplementationPrompt(issue: LabIssue, plan: string, attempt: number): string {
  return `Implement issue ${issue.key}, attempt ${attempt}.

Use only this plan:
${plan}

Rules:
- Edit only files required by the issue.
- Keep the change incremental.
- Do not run lint, typecheck or tests yourself; the host workflow runs gates after your turn.
- Stop after implementation and summarize changed files.`;
}

function buildRepairPrompt(issue: LabIssue, artifact: VerificationArtifact, stage: string): string {
  return `Repair issue ${issue.key} after failed ${stage} quality gates.

You get only the structured gate artifact below. Do not restart the implementation.

Gate artifact:
${formatVerificationArtifact(artifact)}

Rules:
- Fix only errors shown in the artifact.
- Do not broaden scope.
- Do not run gates yourself; the host process will run them again.`;
}

async function buildReviewPrompt(issue: LabIssue, plan: string, gates: readonly VerificationArtifact[]): Promise<string> {
  const worktree = await readWorktreeChangeSummary();

  return `Review issue ${issue.key} in a fresh context.

Original plan:
${plan}

Worktree evidence:
${summarizeWorktree(worktree)}

Gate artifacts:
${gates.map(formatVerificationArtifact).join("\n\n")}

Rules:
- Review only against the issue, plan, diff summary and gate evidence.
- If there is a blocker, start the response with BLOCKER and list exact required fixes.
- If there is no blocker, start the response with PASS.
- Do not modify files.`;
}

function buildReviewRepairPrompt(issue: LabIssue, review: string, attempt: number): string {
  return `Fix review blockers for issue ${issue.key}, attempt ${attempt}.

Review result:
${review}

Rules:
- Fix only blockers explicitly listed by the reviewer.
- Do not rewrite unrelated code.
- Do not run gates yourself; the host process will run them again.`;
}

async function runExpectCli(issue: LabIssue, timeoutMs: number): Promise<ExpectReport> {
  const args = [
    "exec",
    "expect-cli",
    "tui",
    "--ci",
    "--yes",
    "--agent",
    "copilot",
    "--target",
    "changes",
    "--output",
    "json",
    "--timeout",
    String(timeoutMs),
    "--message",
    `Test git changes for issue ${issue.key}. Focus on regressions, broken UI flows, missing validation and evidence quality. Return actionable findings.`,
  ];
  const command = ["pnpm", ...args].join(" ");

  try {
    const { stdout, stderr } = await execFileAsync("pnpm", args, {
      cwd: process.cwd(),
      maxBuffer: 1024 * 1024 * 20,
      env: process.env,
    });

    return {
      command,
      exitCode: 0,
      ok: true,
      stdout: stdout.trim(),
      stderr: stderr.trim(),
    };
  } catch (error) {
    const failure = error as { code?: number; stdout?: string; stderr?: string; message?: string };
    return {
      command,
      exitCode: typeof failure.code === "number" ? failure.code : 1,
      ok: false,
      stdout: (failure.stdout ?? "").trim(),
      stderr: (failure.stderr ?? failure.message ?? "").trim(),
    };
  }
}

async function buildReport(report: FinalWorkflowReport): Promise<string> {
  const reportPath = resolve(process.cwd(), "reports/final-workflow-report.json");
  await mkdir(dirname(reportPath), { recursive: true });
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  const markdownPath = resolve(process.cwd(), "reports/final-workflow-report.md");
  await writeFile(markdownPath, buildMarkdownReport(report), "utf8");
  return markdownPath;
}

function buildMarkdownReport(report: FinalWorkflowReport): string {
  return `# Final workflow report

Issue: ${report.issueKey}

## Model policy

- Plan: ${report.modelPolicy.planModel}
- Implement + repair: ${report.modelPolicy.implementModel}
- Review: ${report.modelPolicy.reviewModel}
- Max gate attempts: ${report.maxAttempts}

## Model warnings

${report.modelWarnings.length > 0 ? report.modelWarnings.map((warning) => `- ${warning}`).join("\n") : "- none"}

## Phases

${report.phases.map((phase) => `- ${phase.name}: ${phase.model}`).join("\n")}

## Gates

${report.gates
  .map((gate) => `- ${gate.stage} attempt ${gate.attempt}: ${gate.ok ? "PASS" : "FAIL"} -> ${gate.nextStep}`)
  .join("\n")}

## Review loop

${report.reviewLoops
  .map((loop) => `- ${loop.review.name}: ${loop.repaired ? "repair requested" : "pass/no blocker"}`)
  .join("\n")}

## Expect

${
  report.expect
    ? `- command: \`${report.expect.command}\`
- result: ${report.expect.ok ? "PASS" : "FAIL"}
- exit code: ${report.expect.exitCode}`
    : "- skipped"
}

## Final worktree

\`\`\`
${report.finalWorktree.status || "(clean)"}
\`\`\`

\`\`\`
${report.finalWorktree.diffStat || "(no tracked file diff)"}
\`\`\`
`;
}

function requiresRepair(review: string): boolean {
  return review.trim().toUpperCase().startsWith("BLOCKER");
}

function readPositiveInteger(value: string, label: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${label} musí být kladné celé číslo.`);
  }

  return parsed;
}
