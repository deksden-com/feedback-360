import { createOperationError, errorFromUnknown } from "./shared";

export type XeEnvironment = "local" | "beta";
export type XeRunStatus = "created" | "running" | "passed" | "failed" | "aborted" | "cleaned";
export type XeFailurePolicy = "fail_run" | "rerun_with_reset";
export type XeAuthFormat = "storage-state" | "token";

export type XeRunRecord = {
  runId: string;
  scenarioId: string;
  scenarioVersion: string;
  environment: XeEnvironment;
  status: XeRunStatus;
  workspacePath: string;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
  expiresAt: string;
  cleanupStatus: "active" | "cleaned";
  summary: Record<string, unknown>;
  bindings: Record<string, unknown>;
  lastError?: string;
};

export type XeScenarioSummary = {
  scenarioId: string;
  version: string;
  name: string;
  allowedEnvironments: XeEnvironment[];
  phases: Array<{
    phaseId: string;
    title: string;
    failurePolicy: XeFailurePolicy;
  }>;
};

export type XeLockRecord = {
  environment: XeEnvironment;
  runId: string;
  owner: string;
  acquiredAt: string;
  expiresAt: string;
  updatedAt: string;
};

export type XeAuthIssueOutput = {
  actor: string;
  format: XeAuthFormat;
  path?: string;
  token?: string;
  baseUrl: string;
};

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

export const parseXeScenarioSummary = (value: unknown): XeScenarioSummary => {
  const record = ensureObject(value, "xe scenario summary");
  const phasesRaw = record.phases;
  if (!Array.isArray(phasesRaw)) {
    throw new Error("xe scenario summary.phases must be an array.");
  }

  return {
    scenarioId: ensureString(record.scenarioId, "xe scenario summary.scenarioId"),
    version: ensureString(record.version, "xe scenario summary.version"),
    name: ensureString(record.name, "xe scenario summary.name"),
    allowedEnvironments: ensureStringArray(
      record.allowedEnvironments,
      "xe scenario summary.allowedEnvironments",
    ) as XeEnvironment[],
    phases: phasesRaw.map((phase, index) => {
      const phaseRecord = ensureObject(phase, `xe scenario summary.phases[${index}]`);
      const failurePolicy = ensureString(
        phaseRecord.failurePolicy,
        `xe scenario summary.phases[${index}].failurePolicy`,
      );
      if (failurePolicy !== "fail_run" && failurePolicy !== "rerun_with_reset") {
        throw new Error(`Invalid failurePolicy at phase ${index}.`);
      }
      return {
        phaseId: ensureString(phaseRecord.phaseId, `xe scenario summary.phases[${index}].phaseId`),
        title: ensureString(phaseRecord.title, `xe scenario summary.phases[${index}].title`),
        failurePolicy,
      };
    }),
  };
};

export const parseXeRunRecord = (value: unknown): XeRunRecord => {
  const record = ensureObject(value, "xe run");
  const summary = ensureObject(record.summary ?? {}, "xe run.summary");
  const bindings = ensureObject(record.bindings ?? {}, "xe run.bindings");

  return {
    runId: ensureString(record.runId, "xe run.runId"),
    scenarioId: ensureString(record.scenarioId, "xe run.scenarioId"),
    scenarioVersion: ensureString(record.scenarioVersion, "xe run.scenarioVersion"),
    environment: ensureString(record.environment, "xe run.environment") as XeEnvironment,
    status: ensureString(record.status, "xe run.status") as XeRunStatus,
    workspacePath: ensureString(record.workspacePath, "xe run.workspacePath"),
    createdAt: ensureString(record.createdAt, "xe run.createdAt"),
    ...(record.startedAt ? { startedAt: ensureString(record.startedAt, "xe run.startedAt") } : {}),
    ...(record.finishedAt
      ? { finishedAt: ensureString(record.finishedAt, "xe run.finishedAt") }
      : {}),
    expiresAt: ensureString(record.expiresAt, "xe run.expiresAt"),
    cleanupStatus: ensureString(record.cleanupStatus, "xe run.cleanupStatus") as
      | "active"
      | "cleaned",
    summary,
    bindings,
    ...(record.lastError ? { lastError: ensureString(record.lastError, "xe run.lastError") } : {}),
  };
};

export const parseXeRunListOutput = (value: unknown): { items: XeRunRecord[] } => {
  const record = ensureObject(value, "xe run list");
  if (!Array.isArray(record.items)) {
    throw new Error("xe run list.items must be an array.");
  }
  return { items: record.items.map(parseXeRunRecord) };
};

export const parseXeLockRecord = (value: unknown): XeLockRecord => {
  const record = ensureObject(value, "xe lock");
  return {
    environment: ensureString(record.environment, "xe lock.environment") as XeEnvironment,
    runId: ensureString(record.runId, "xe lock.runId"),
    owner: ensureString(record.owner, "xe lock.owner"),
    acquiredAt: ensureString(record.acquiredAt, "xe lock.acquiredAt"),
    expiresAt: ensureString(record.expiresAt, "xe lock.expiresAt"),
    updatedAt: ensureString(record.updatedAt, "xe lock.updatedAt"),
  };
};

export const parseXeAuthIssueOutput = (value: unknown): XeAuthIssueOutput => {
  const record = ensureObject(value, "xe auth issue output");
  const format = ensureString(record.format, "xe auth issue output.format");
  if (format !== "storage-state" && format !== "token") {
    throw new Error("xe auth issue output.format must be storage-state|token.");
  }

  return {
    actor: ensureString(record.actor, "xe auth issue output.actor"),
    format,
    ...(record.path ? { path: ensureString(record.path, "xe auth issue output.path") } : {}),
    ...(record.token ? { token: ensureString(record.token, "xe auth issue output.token") } : {}),
    baseUrl: ensureString(record.baseUrl, "xe auth issue output.baseUrl"),
  };
};

export const invalidXeInputError = (error: unknown, message: string) =>
  createOperationError("invalid_input", errorFromUnknown(error, "invalid_input", message).message);
