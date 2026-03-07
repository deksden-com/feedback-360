import { type XeEnvironment, createOperationError } from "@feedback-360/api-contract";
import {
  acquireXeLock,
  applyXeNamedSeed,
  cleanupExpiredXeRuns,
  createXeRun,
  deleteXeRun,
  getXeLock,
  getXeRun,
  listXeNotifications,
  listXeRuns,
  releaseXeLock,
  updateXeRunState,
} from "@feedback-360/db";

import { defaultRunsRoot } from "./paths";
import { getXeScenarioDefinition } from "./scenario-registry";
import { ensureXeWorkspace, getXeWorkspacePath, removeXeWorkspace } from "./workspace";

export const createManagedXeRun = async (input: {
  scenarioId: string;
  environment: XeEnvironment;
  owner: string;
  rootDir?: string;
}): Promise<Awaited<ReturnType<typeof getXeRun>>> => {
  const scenario = await getXeScenarioDefinition(input.scenarioId);
  const workspaceRoot = input.rootDir ?? defaultRunsRoot;
  const workspacePath = getXeWorkspacePath(
    `pending-${Date.now()}`,
    scenario.scenarioId,
    workspaceRoot,
  );
  const run = await createXeRun({
    scenarioId: scenario.scenarioId,
    scenarioVersion: scenario.version,
    environment: input.environment,
    owner: input.owner,
    workspacePath,
  });
  const actualWorkspacePath = getXeWorkspacePath(run.runId, scenario.scenarioId, workspaceRoot);
  await updateXeRunState({
    runId: run.runId,
    workspacePath: actualWorkspacePath,
    summary: {
      owner: input.owner,
      scenarioName: scenario.name,
    },
  });
  const refreshed = await getXeRun(run.runId);
  await ensureXeWorkspace(refreshed, scenario);
  return refreshed;
};

export const getXeRunRegistry = getXeRun;
export const listXeRunRegistry = listXeRuns;
export const updateXeRunRegistry = updateXeRunState;
export const applyXeSeed = applyXeNamedSeed;
export const listXeRunNotifications = listXeNotifications;
export const getXeEnvironmentLock = getXeLock;

export const acquireXeEnvironmentLock = acquireXeLock;
export const releaseXeEnvironmentLock = releaseXeLock;

export const deleteManagedXeRun = async (runId: string): Promise<{ deleted: boolean }> => {
  const run = await getXeRun(runId).catch(() => undefined);
  const result = await deleteXeRun(runId);
  if (result.deleted && run?.workspacePath) {
    await removeXeWorkspace(run.workspacePath);
  }
  return result;
};

export const cleanupExpiredManagedXeRuns = async (input?: {
  before?: Date;
  since?: Date;
}): Promise<{ deletedRunIds: string[] }> => {
  const runs = await cleanupExpiredXeRuns(input);
  return runs;
};

export const assertScenarioAllowedEnvironment = async (
  scenarioId: string,
  environment: XeEnvironment,
): Promise<void> => {
  const scenario = await getXeScenarioDefinition(scenarioId);
  if (!scenario.allowedEnvironments.includes(environment)) {
    throw createOperationError(
      "forbidden",
      `Scenario ${scenarioId} is not allowed in ${environment}.`,
      { scenarioId, environment },
    );
  }
};
