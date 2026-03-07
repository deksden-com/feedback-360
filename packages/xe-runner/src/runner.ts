import { mkdir } from "node:fs/promises";
import { join } from "node:path";

import {
  type XeEnvironment,
  type XeRunRecord,
  createOperationError,
} from "@feedback-360/api-contract";

import { defaultRunsRoot } from "./paths";
import {
  acquireXeEnvironmentLock,
  assertScenarioAllowedEnvironment,
  createManagedXeRun,
  getXeEnvironmentLock,
  getXeRunRegistry,
  releaseXeEnvironmentLock,
  updateXeRunRegistry,
} from "./run-registry";
import { getXeScenarioDefinition, listXeScenarios } from "./scenario-registry";
import {
  runXe001PhaseBootstrapSessions,
  runXe001PhaseFillQuestionnaires,
  runXe001PhaseSeed,
  runXe001PhaseStartCampaign,
  runXe001PhaseVerifyResults,
} from "./scenarios/xe-001";
import type { XePhaseContext, XePhaseResult, XeRunState, XeScenarioDefinition } from "./types";
import {
  createInitialXeState,
  ensureXeWorkspace,
  readXeState,
  writeXeArtifactJson,
  writeXeState,
} from "./workspace";

const phaseHandlers: Record<string, (ctx: XePhaseContext) => Promise<XePhaseResult>> = {
  "XE-001:phase-01-seed": runXe001PhaseSeed,
  "XE-001:phase-02-start-campaign": runXe001PhaseStartCampaign,
  "XE-001:phase-03-bootstrap-sessions": runXe001PhaseBootstrapSessions,
  "XE-001:phase-04-fill-questionnaires": runXe001PhaseFillQuestionnaires,
  "XE-001:phase-05-verify-results": runXe001PhaseVerifyResults,
};

const resolvePhaseHandler = (
  scenario: XeScenarioDefinition,
  phaseId: string,
): ((ctx: XePhaseContext) => Promise<XePhaseResult>) => {
  const handler = phaseHandlers[`${scenario.scenarioId}:${phaseId}`];
  if (!handler) {
    throw createOperationError("not_found", "XE phase handler is not implemented.", {
      scenarioId: scenario.scenarioId,
      phaseId,
    });
  }
  return handler;
};

const createPhaseContext = (
  run: XeRunRecord,
  scenario: XeScenarioDefinition,
  state: XeRunState,
  baseUrl: string,
  headless: boolean,
  phaseId: string,
): XePhaseContext => ({
  run,
  scenario,
  state,
  workspacePath: run.workspacePath,
  phaseWorkspacePath: join(run.workspacePath, phaseId),
  artifactsDir: join(run.workspacePath, phaseId),
  baseUrl,
  headless,
});

export const listAvailableXeScenarios = listXeScenarios;

export const createXeRunWorkspace = async (input: {
  scenarioId: string;
  environment: XeEnvironment;
  owner: string;
  rootDir?: string;
}): Promise<XeRunRecord> => {
  await assertScenarioAllowedEnvironment(input.scenarioId, input.environment);
  return createManagedXeRun({
    ...input,
    rootDir: input.rootDir ?? defaultRunsRoot,
  });
};

export const runXeScenario = async (input: {
  runId: string;
  baseUrl: string;
  headless?: boolean;
}): Promise<XeRunRecord> => {
  const run = await getXeRunRegistry(input.runId);
  const scenario = await getXeScenarioDefinition(run.scenarioId);
  const workspacePath = await ensureXeWorkspace(run, scenario);
  await mkdir(workspacePath, { recursive: true });
  const headless = input.headless ?? true;

  const existingState = (await readXeState(workspacePath)) ?? createInitialXeState(run);
  existingState.baseUrl = input.baseUrl;
  existingState.status = "running";
  existingState.updatedAt = new Date().toISOString();
  await writeXeState(workspacePath, existingState);

  const existingLock = await getXeEnvironmentLock(run.environment);
  if (
    existingLock &&
    existingLock.runId !== run.runId &&
    new Date(existingLock.expiresAt) > new Date()
  ) {
    throw createOperationError("invalid_transition", "Another XE run is already active.", {
      environment: run.environment,
      activeRunId: existingLock.runId,
    });
  }

  await acquireXeEnvironmentLock({
    environment: run.environment,
    runId: run.runId,
    owner: String(run.summary.owner ?? "xe-runner"),
  });

  await updateXeRunRegistry({
    runId: run.runId,
    status: "running",
    startedAt: new Date(),
    summary: {
      ...run.summary,
      baseUrl: input.baseUrl,
      currentPhaseId: null,
    },
  });

  const currentState = existingState;
  try {
    for (const phase of scenario.phases) {
      const previous = currentState.phases[phase.phaseId];
      if (previous?.status === "passed") {
        continue;
      }

      currentState.currentPhaseId = phase.phaseId;
      currentState.phases[phase.phaseId] = {
        status: "running",
        startedAt: new Date().toISOString(),
        artifacts: [],
      };
      currentState.updatedAt = new Date().toISOString();
      await writeXeState(workspacePath, currentState);

      const ctx = createPhaseContext(
        run,
        scenario,
        currentState,
        input.baseUrl,
        headless,
        phase.phaseId,
      );
      await mkdir(ctx.phaseWorkspacePath, { recursive: true });

      try {
        const result = await resolvePhaseHandler(scenario, phase.phaseId)(ctx);
        currentState.bindings = {
          ...currentState.bindings,
          ...(result.bindings ?? {}),
        };
        currentState.notes.push(...(result.notes ?? []));
        currentState.phases[phase.phaseId] = {
          status: "passed",
          startedAt: currentState.phases[phase.phaseId]?.startedAt,
          finishedAt: new Date().toISOString(),
          artifacts: (result.artifacts ?? []).map((artifact) => artifact.path),
        };
        await writeXeArtifactJson(ctx.phaseWorkspacePath, "assertions.json", {
          ok: true,
          phaseId: phase.phaseId,
          requiredArtifacts: phase.requiredArtifacts,
          artifacts: result.artifacts ?? [],
        });
      } catch (error) {
        currentState.status = "failed";
        currentState.phases[phase.phaseId] = {
          status: "failed",
          startedAt: currentState.phases[phase.phaseId]?.startedAt,
          finishedAt: new Date().toISOString(),
          artifacts: currentState.phases[phase.phaseId]?.artifacts ?? [],
          error: error instanceof Error ? error.message : String(error),
        };
        currentState.updatedAt = new Date().toISOString();
        await writeXeArtifactJson(ctx.phaseWorkspacePath, "assertions.json", {
          ok: false,
          phaseId: phase.phaseId,
          error: error instanceof Error ? error.message : String(error),
        });
        await writeXeState(workspacePath, currentState);
        await updateXeRunRegistry({
          runId: run.runId,
          status: "failed",
          finishedAt: new Date(),
          lastError: error instanceof Error ? error.message : String(error),
          bindings: currentState.bindings,
          summary: {
            ...run.summary,
            currentPhaseId: phase.phaseId,
          },
        });
        throw error;
      }

      currentState.updatedAt = new Date().toISOString();
      await writeXeState(workspacePath, currentState);
      await updateXeRunRegistry({
        runId: run.runId,
        bindings: currentState.bindings,
        summary: {
          ...run.summary,
          currentPhaseId: phase.phaseId,
        },
      });
    }

    currentState.status = "passed";
    currentState.currentPhaseId = undefined;
    currentState.updatedAt = new Date().toISOString();
    await writeXeState(workspacePath, currentState);
    return await updateXeRunRegistry({
      runId: run.runId,
      status: "passed",
      finishedAt: new Date(),
      lastError: "",
      bindings: currentState.bindings,
      summary: {
        ...run.summary,
        currentPhaseId: null,
        phasesCompleted: scenario.phases.length,
      },
    });
  } finally {
    await releaseXeEnvironmentLock({
      environment: run.environment,
      runId: run.runId,
    });
  }
};

export const runXeScenarioById = async (input: {
  scenarioId: string;
  environment: XeEnvironment;
  owner: string;
  baseUrl: string;
  headless?: boolean;
  rootDir?: string;
}): Promise<XeRunRecord> => {
  const existingLock = await getXeEnvironmentLock(input.environment);
  if (existingLock && new Date(existingLock.expiresAt) > new Date()) {
    throw createOperationError("invalid_transition", "Another XE run is already active.", {
      environment: input.environment,
      activeRunId: existingLock.runId,
    });
  }

  const run = await createXeRunWorkspace({
    scenarioId: input.scenarioId,
    environment: input.environment,
    owner: input.owner,
    rootDir: input.rootDir,
  });
  return runXeScenario({
    runId: run.runId,
    baseUrl: input.baseUrl,
    headless: input.headless,
  });
};
