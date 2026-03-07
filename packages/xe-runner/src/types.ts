import type {
  XeEnvironment,
  XeFailurePolicy,
  XeRunRecord,
  XeRunStatus,
  XeScenarioSummary,
} from "@feedback-360/api-contract";

export type XeScenarioPhaseDefinition = {
  phaseId: string;
  title: string;
  handler: string;
  failurePolicy: XeFailurePolicy;
  requiredArtifacts: string[];
};

export type XeScenarioDefinition = XeScenarioSummary & {
  description: string;
  seed: {
    handle: string;
    extends?: string;
  };
  artifacts: {
    rootDir: string;
    retainDays: number;
  };
  phasePolicy: {
    defaultFailurePolicy: XeFailurePolicy;
  };
  phases: XeScenarioPhaseDefinition[];
};

export type XePhaseState = {
  status: "pending" | "running" | "passed" | "failed";
  startedAt?: string;
  finishedAt?: string;
  artifacts: string[];
  error?: string;
};

export type XeRunState = {
  runId: string;
  scenarioId: string;
  scenarioVersion: string;
  environment: XeEnvironment;
  status: XeRunStatus;
  currentPhaseId?: string;
  baseUrl?: string;
  startedAt?: string;
  updatedAt: string;
  bindings: Record<string, unknown>;
  phases: Record<string, XePhaseState>;
  notes: string[];
};

export type XePhaseArtifactCapture = {
  path: string;
  label: string;
};

export type XePhaseContext = {
  run: XeRunRecord;
  scenario: XeScenarioDefinition;
  state: XeRunState;
  workspacePath: string;
  phaseWorkspacePath: string;
  artifactsDir: string;
  baseUrl: string;
  headless: boolean;
};

export type XePhaseResult = {
  bindings?: Record<string, unknown>;
  notes?: string[];
  artifacts?: XePhaseArtifactCapture[];
};
