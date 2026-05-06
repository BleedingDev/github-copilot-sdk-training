import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

export type LabIssue = {
  readonly key: string;
  readonly title: string;
  readonly type: string;
  readonly priority: string;
  readonly module: string;
  readonly summary: string;
  readonly acceptanceCriteria: readonly string[];
  readonly candidatePaths: readonly string[];
  readonly nonGoals: readonly string[];
};

export type RepoMap = {
  readonly repository: string;
  readonly note: string;
  readonly modules: readonly {
    readonly name: string;
    readonly language: string;
    readonly paths: readonly string[];
  }[];
};

export async function loadIssue(issueKey: string): Promise<LabIssue> {
  return readJson<LabIssue>(`data/issues/${issueKey}.json`);
}

export async function loadRepoMap(): Promise<RepoMap> {
  return readJson<RepoMap>("data/repo-map.json");
}

async function readJson<T>(relativePath: string): Promise<T> {
  const filePath = resolve(process.cwd(), relativePath);
  const content = await readFile(filePath, "utf8");
  return JSON.parse(content) as T;
}

