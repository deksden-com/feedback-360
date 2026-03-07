import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

import {
  type XeScenarioSummary,
  invalidXeInputError,
  parseXeScenarioSummary,
} from "@feedback-360/api-contract";

import { scenariosRoot } from "./paths";
import type { XeScenarioDefinition } from "./types";

const ensureObject = (value: unknown, label: string): Record<string, unknown> => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`${label} must be an object.`);
  }
  return value as Record<string, unknown>;
};

const ensureString = (value: unknown, label: string): string => {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string.`);
  }
  return value.trim();
};

const ensureStringArray = (value: unknown, label: string): string[] => {
  if (!Array.isArray(value)) {
    throw new Error(`${label} must be an array.`);
  }
  return value.map((item, index) => ensureString(item, `${label}[${index}]`));
};

const parseScenarioDefinition = (value: unknown): XeScenarioDefinition => {
  const record = ensureObject(value, "scenario");
  const summary = parseXeScenarioSummary(record);
  const seed = ensureObject(record.seed, "scenario.seed");
  const artifacts = ensureObject(record.artifacts, "scenario.artifacts");
  const phasePolicy = ensureObject(record.phasePolicy, "scenario.phasePolicy");

  return {
    ...summary,
    description: ensureString(record.description, "scenario.description"),
    seed: {
      handle: ensureString(seed.handle, "scenario.seed.handle"),
      ...(seed.extends ? { extends: ensureString(seed.extends, "scenario.seed.extends") } : {}),
    },
    artifacts: {
      rootDir: ensureString(artifacts.rootDir, "scenario.artifacts.rootDir"),
      retainDays: Number(artifacts.retainDays ?? 30),
    },
    phasePolicy: {
      defaultFailurePolicy: ensureString(
        phasePolicy.defaultFailurePolicy,
        "scenario.phasePolicy.defaultFailurePolicy",
      ) as XeScenarioDefinition["phasePolicy"]["defaultFailurePolicy"],
    },
    phases: summary.phases.map((phase, index) => {
      const raw = (record.phases as unknown[])[index];
      const phaseRecord = ensureObject(raw, `scenario.phases[${index}]`);
      return {
        ...phase,
        handler: ensureString(phaseRecord.handler, `scenario.phases[${index}].handler`),
        requiredArtifacts: ensureStringArray(
          phaseRecord.requiredArtifacts ?? [],
          `scenario.phases[${index}].requiredArtifacts`,
        ),
      };
    }),
  };
};

const loadScenarioFile = async (scenarioDirectory: string): Promise<XeScenarioDefinition> => {
  const raw = await readFile(join(scenarioDirectory, "scenario.json"), "utf8");
  return parseScenarioDefinition(JSON.parse(raw));
};

export const listXeScenarios = async (): Promise<XeScenarioSummary[]> => {
  const entries = await readdir(scenariosRoot, { withFileTypes: true });
  const summaries: XeScenarioSummary[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const definition = await loadScenarioFile(join(scenariosRoot, entry.name));
    summaries.push({
      scenarioId: definition.scenarioId,
      version: definition.version,
      name: definition.name,
      allowedEnvironments: definition.allowedEnvironments,
      phases: definition.phases.map((phase) => ({
        phaseId: phase.phaseId,
        title: phase.title,
        failurePolicy: phase.failurePolicy,
      })),
    });
  }

  return summaries.sort((left, right) => left.scenarioId.localeCompare(right.scenarioId));
};

export const getXeScenarioDefinition = async (
  scenarioId: string,
): Promise<XeScenarioDefinition> => {
  try {
    return await loadScenarioFile(join(scenariosRoot, scenarioId));
  } catch (error) {
    throw invalidXeInputError(error, `XE scenario ${scenarioId} is not available.`);
  }
};
