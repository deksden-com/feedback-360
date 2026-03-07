import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import type { XeRunRecord } from "@feedback-360/api-contract";

import { defaultRunsRoot } from "./paths";
import type { XeRunState, XeScenarioDefinition } from "./types";

const writeJsonFile = async (path: string, value: unknown): Promise<void> => {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
};

export const getXeWorkspacePath = (
  runId: string,
  scenarioId: string,
  rootDir = defaultRunsRoot,
) => {
  return join(rootDir, `${runId}__${scenarioId}`);
};

export const ensureXeWorkspace = async (
  run: XeRunRecord,
  scenario: XeScenarioDefinition,
): Promise<string> => {
  await mkdir(run.workspacePath, { recursive: true });
  await mkdir(join(run.workspacePath, "storage-state"), { recursive: true });
  await mkdir(join(run.workspacePath, "artifacts"), { recursive: true });

  await writeJsonFile(join(run.workspacePath, "run.json"), {
    runId: run.runId,
    scenarioId: run.scenarioId,
    scenarioVersion: run.scenarioVersion,
    environment: run.environment,
    workspacePath: run.workspacePath,
  });
  await writeJsonFile(join(run.workspacePath, "scenario.json"), scenario);
  return run.workspacePath;
};

export const createInitialXeState = (run: XeRunRecord): XeRunState => ({
  runId: run.runId,
  scenarioId: run.scenarioId,
  scenarioVersion: run.scenarioVersion,
  environment: run.environment,
  status: run.status,
  updatedAt: new Date().toISOString(),
  bindings: run.bindings,
  phases: {},
  notes: [],
});

export const readXeState = async (workspacePath: string): Promise<XeRunState | undefined> => {
  try {
    const raw = await readFile(join(workspacePath, "state.json"), "utf8");
    return JSON.parse(raw) as XeRunState;
  } catch {
    return undefined;
  }
};

export const writeXeState = async (workspacePath: string, state: XeRunState): Promise<void> => {
  await writeJsonFile(join(workspacePath, "state.json"), state);
  await writeJsonFile(join(workspacePath, "bindings.json"), state.bindings);
};

export const writeXeArtifactJson = async (
  workspacePath: string,
  relativePath: string,
  value: unknown,
): Promise<void> => {
  await writeJsonFile(join(workspacePath, relativePath), value);
};

export const removeXeWorkspace = async (workspacePath: string): Promise<void> => {
  await rm(workspacePath, { recursive: true, force: true });
};
