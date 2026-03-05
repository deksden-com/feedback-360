export const seedScenarios = [
  "S0_empty",
  "S1_company_min",
  "S1_multi_tenant_min",
  "S2_org_basic",
  "S4_campaign_draft",
  "S5_campaign_started_no_answers",
  "S7_campaign_started_some_submitted",
  "S8_campaign_ended",
] as const;

export type SeedScenario = (typeof seedScenarios)[number];

export const operationErrorCodes = [
  "invalid_input",
  "unauthenticated",
  "forbidden",
  "not_found",
  "invalid_transition",
  "campaign_started_immutable",
  "campaign_locked",
  "campaign_ended_readonly",
  "webhook_invalid_signature",
  "webhook_timestamp_invalid",
  "ai_job_conflict",
] as const;

export type OperationErrorCode = (typeof operationErrorCodes)[number];

export type OperationError = {
  code: OperationErrorCode;
  message: string;
  details?: Record<string, unknown>;
};

export type OperationResult<Output> =
  | {
      ok: true;
      data: Output;
    }
  | {
      ok: false;
      error: OperationError;
    };

export const membershipRoles = ["hr_admin", "hr_reader", "manager", "employee"] as const;
export type MembershipRole = (typeof membershipRoles)[number];

export type OperationContext = {
  userId?: string;
  companyId?: string;
  role?: MembershipRole;
};

export type DispatchOperationInput = {
  operation: string;
  input: unknown;
  context?: OperationContext;
};

export const knownOperations = [
  "seed.run",
  "system.ping",
  "company.updateProfile",
  "model.version.create",
  "campaign.create",
  "campaign.start",
  "campaign.stop",
  "campaign.end",
  "campaign.setModelVersion",
  "campaign.weights.set",
  "campaign.participants.add",
  "campaign.participants.remove",
  "campaign.progress.get",
  "results.getHrView",
  "employee.upsert",
  "employee.listActive",
  "org.department.move",
  "org.manager.set",
  "campaign.snapshot.list",
  "campaign.participants.addFromDepartments",
  "matrix.generateSuggested",
  "matrix.set",
  "ai.runForCampaign",
  "client.setActiveCompany",
  "questionnaire.listAssigned",
  "questionnaire.saveDraft",
  "questionnaire.submit",
] as const;
export type KnownOperation = (typeof knownOperations)[number];

export type SystemPingInput = Record<string, never>;
export type SystemPingOutput = {
  pong: "ok";
  timestamp: string;
};

export type CompanyUpdateProfileInput = {
  companyId: string;
  name: string;
};

export type CompanyUpdateProfileOutput = {
  companyId: string;
  name: string;
  updatedAt: string;
};

export type ModelIndicatorInput = {
  text: string;
  order?: number;
};

export type ModelLevelInput = {
  level: number;
  text: string;
};

export type ModelCompetencyInput = {
  name: string;
  indicators?: ModelIndicatorInput[];
  levels?: ModelLevelInput[];
};

export type ModelGroupInput = {
  name: string;
  weight: number;
  competencies: ModelCompetencyInput[];
};

export type ModelVersionCreateInput = {
  name: string;
  kind: "indicators" | "levels";
  groups: ModelGroupInput[];
};

export type ModelVersionCreateOutput = {
  modelVersionId: string;
  companyId: string;
  name: string;
  kind: "indicators" | "levels";
  version: number;
  createdAt: string;
  groupCount: number;
  competencyCount: number;
  indicatorCount: number;
  levelCount: number;
};

export type CampaignCreateInput = {
  name: string;
  modelVersionId: string;
  startAt: string;
  endAt: string;
  timezone?: string;
};

export type CampaignCreateOutput = {
  campaignId: string;
  companyId: string;
  modelVersionId: string;
  name: string;
  status: "draft";
  startAt: string;
  endAt: string;
  timezone: string;
  createdAt: string;
};

export const campaignLifecycleStatuses = [
  "draft",
  "started",
  "ended",
  "processing_ai",
  "ai_failed",
  "completed",
] as const;

export type CampaignLifecycleStatus = (typeof campaignLifecycleStatuses)[number];

export type CampaignTransitionInput = {
  campaignId: string;
};

export type CampaignTransitionOutput = {
  campaignId: string;
  previousStatus: CampaignLifecycleStatus;
  status: CampaignLifecycleStatus;
  changed: boolean;
  updatedAt: string;
};

export type CampaignSetModelVersionInput = {
  campaignId: string;
  modelVersionId: string;
};

export type CampaignSetModelVersionOutput = {
  campaignId: string;
  modelVersionId: string;
  changed: boolean;
  updatedAt: string;
};

export type CampaignParticipantsMutationInput = {
  campaignId: string;
  employeeIds: string[];
};

export type CampaignParticipantsMutationOutput = {
  campaignId: string;
  changedEmployeeIds: string[];
  totalParticipants: number;
};

export type CampaignWeightsSetInput = {
  campaignId: string;
  manager: number;
  peers: number;
  subordinates: number;
};

export type CampaignWeightsSetOutput = {
  campaignId: string;
  manager: number;
  peers: number;
  subordinates: number;
  self: 0;
  changed: boolean;
  updatedAt: string;
};

export type EmployeeUpsertInput = {
  employeeId: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  isActive?: boolean;
};

export type EmployeeUpsertOutput = {
  employeeId: string;
  companyId: string;
  isActive: boolean;
  deletedAt?: string;
  updatedAt: string;
  created: boolean;
};

export type EmployeeListActiveInput = {
  companyId?: string;
};

export type EmployeeListActiveItem = {
  employeeId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isActive: boolean;
};

export type EmployeeListActiveOutput = {
  items: EmployeeListActiveItem[];
};

export type OrgDepartmentMoveInput = {
  employeeId: string;
  toDepartmentId: string;
};

export type OrgDepartmentMoveOutput = {
  employeeId: string;
  previousDepartmentId?: string;
  departmentId: string;
  changed: boolean;
  effectiveAt: string;
};

export type OrgManagerSetInput = {
  employeeId: string;
  managerEmployeeId: string;
};

export type OrgManagerSetOutput = {
  employeeId: string;
  previousManagerEmployeeId?: string;
  managerEmployeeId: string;
  changed: boolean;
  effectiveAt: string;
};

export type CampaignSnapshotListInput = {
  campaignId: string;
};

export type CampaignSnapshotListItem = {
  snapshotId: string;
  companyId: string;
  campaignId: string;
  employeeId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  departmentId?: string;
  managerEmployeeId?: string;
  positionTitle?: string;
  positionLevel?: number;
  snapshotAt: string;
};

export type CampaignSnapshotListOutput = {
  items: CampaignSnapshotListItem[];
};

export type CampaignProgressGetInput = {
  campaignId: string;
};

export type CampaignProgressStatusCounts = {
  notStarted: number;
  inProgress: number;
  submitted: number;
};

export type CampaignProgressPendingItem = {
  questionnaireId: string;
  campaignId: string;
  companyId: string;
  subjectEmployeeId: string;
  raterEmployeeId: string;
  status: "not_started" | "in_progress";
  firstDraftAt?: string;
  submittedAt?: string;
};

export type CampaignProgressPendingGroupItem = {
  employeeId: string;
  pendingCount: number;
};

export type CampaignProgressGetOutput = {
  campaignId: string;
  companyId: string;
  totalQuestionnaires: number;
  statusCounts: CampaignProgressStatusCounts;
  campaignLockedAt?: string;
  pendingQuestionnaires: CampaignProgressPendingItem[];
  pendingByRater: CampaignProgressPendingGroupItem[];
  pendingBySubject: CampaignProgressPendingGroupItem[];
};

export const resultsGroupKeys = ["manager", "peers", "subordinates", "self"] as const;
export type ResultsGroupKey = (typeof resultsGroupKeys)[number];
export const resultsGroupVisibilityStates = ["shown", "hidden", "merged"] as const;
export type ResultsGroupVisibilityState = (typeof resultsGroupVisibilityStates)[number];
export const smallGroupPolicies = ["hide", "merge_to_other"] as const;
export type SmallGroupPolicy = (typeof smallGroupPolicies)[number];

export type ResultsGetHrViewInput = {
  campaignId: string;
  subjectEmployeeId: string;
  smallGroupPolicy?: SmallGroupPolicy;
  anonymityThreshold?: number;
};

export type ResultsHrViewRaterScore = {
  raterEmployeeId: string;
  group: ResultsGroupKey;
  competencyId: string;
  score?: number;
  validIndicatorCount: number;
  totalIndicatorCount: number;
};

export type ResultsHrViewLevelDistribution = {
  level1: number;
  level2: number;
  level3: number;
  level4: number;
};

export type ResultsHrViewLevelSummary = {
  modeLevel: 1 | 2 | 3 | 4 | null;
  distribution: ResultsHrViewLevelDistribution;
  nValid: number;
  nUnsure: number;
};

export type ResultsHrViewCompetencyScore = {
  competencyId: string;
  competencyName: string;
  groupId: string;
  groupName: string;
  managerScore?: number;
  managerRaters: number;
  peersScore?: number;
  peersRaters: number;
  subordinatesScore?: number;
  subordinatesRaters: number;
  selfScore?: number;
  selfRaters: number;
  otherScore?: number;
  otherRaters: number;
  managerVisibility: "shown";
  peersVisibility: ResultsGroupVisibilityState;
  subordinatesVisibility: ResultsGroupVisibilityState;
  selfVisibility: "shown";
  otherVisibility?: "shown" | "hidden";
  managerLevels?: ResultsHrViewLevelSummary;
  peersLevels?: ResultsHrViewLevelSummary;
  subordinatesLevels?: ResultsHrViewLevelSummary;
  selfLevels?: ResultsHrViewLevelSummary;
  otherLevels?: ResultsHrViewLevelSummary;
};

export type ResultsHrViewGroupOverall = {
  manager?: number;
  peers?: number;
  subordinates?: number;
  self?: number;
  other?: number;
};

export type ResultsHrViewGroupWeights = {
  manager: number;
  peers: number;
  subordinates: number;
  self: number;
  other: number;
};

export type ResultsHrViewGroupVisibility = {
  manager: "shown";
  peers: ResultsGroupVisibilityState;
  subordinates: ResultsGroupVisibilityState;
  self: "shown";
  other?: "shown" | "hidden";
};

export type ResultsGetHrViewOutput = {
  campaignId: string;
  companyId: string;
  subjectEmployeeId: string;
  modelVersionId: string;
  modelKind: "indicators" | "levels";
  anonymityThreshold: number;
  smallGroupPolicy: SmallGroupPolicy;
  groupVisibility: ResultsHrViewGroupVisibility;
  competencyScores: ResultsHrViewCompetencyScore[];
  raterScores: ResultsHrViewRaterScore[];
  groupOverall: ResultsHrViewGroupOverall;
  configuredGroupWeights: ResultsHrViewGroupWeights;
  effectiveGroupWeights: ResultsHrViewGroupWeights;
  overallScore?: number;
};

export type CampaignParticipantsAddFromDepartmentsInput = {
  campaignId: string;
  departmentIds: string[];
  includeSelf?: boolean;
};

export type CampaignParticipantsAddFromDepartmentsOutput = {
  campaignId: string;
  addedEmployeeIds: string[];
  totalParticipants: number;
};

export type MatrixGeneratedAssignment = {
  subjectEmployeeId: string;
  raterEmployeeId: string;
  raterRole: "manager" | "peer" | "subordinate" | "self";
};

export type MatrixGenerateSuggestedInput = {
  campaignId: string;
  departmentIds?: string[];
};

export type MatrixGenerateSuggestedOutput = {
  campaignId: string;
  generatedAssignments: MatrixGeneratedAssignment[];
  totalAssignments: number;
};

export type MatrixSetInput = {
  campaignId: string;
  assignments: MatrixGeneratedAssignment[];
};

export type MatrixSetOutput = {
  campaignId: string;
  totalAssignments: number;
};

export type AiRunForCampaignInput = {
  campaignId: string;
};

export type AiRunForCampaignOutput = {
  campaignId: string;
  aiJobId: string;
  provider: "mvp_stub";
  status: "completed";
  completedAt: string;
  wasAlreadyCompleted: boolean;
};

export type ClientSetActiveCompanyInput = {
  companyId: string;
};

export type ClientSetActiveCompanyOutput = {
  companyId: string;
};

export const questionnaireStatuses = ["not_started", "in_progress", "submitted"] as const;
export type QuestionnaireStatus = (typeof questionnaireStatuses)[number];

export type QuestionnaireListAssignedInput = {
  campaignId: string;
  status?: QuestionnaireStatus;
};

export type QuestionnaireListAssignedItem = {
  questionnaireId: string;
  campaignId: string;
  companyId: string;
  subjectEmployeeId: string;
  raterEmployeeId: string;
  status: QuestionnaireStatus;
  submittedAt?: string;
};

export type QuestionnaireListAssignedOutput = {
  items: QuestionnaireListAssignedItem[];
};

export type QuestionnaireSaveDraftInput = {
  questionnaireId: string;
  draft: Record<string, unknown>;
};

export type QuestionnaireSaveDraftOutput = {
  questionnaireId: string;
  status: "in_progress";
  campaignLockedAt: string;
};

export type QuestionnaireSubmitInput = {
  questionnaireId: string;
};

export type QuestionnaireSubmitOutput = {
  questionnaireId: string;
  status: "submitted";
  submittedAt: string;
  wasAlreadySubmitted: boolean;
};

export type SeedRunInput = {
  scenario: SeedScenario;
  variant?: string;
};

export type SeedRunOutput = {
  scenario: SeedScenario;
  variant?: string;
  handles: Record<string, string>;
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const ensureObject = (value: unknown, fieldName: string): Record<string, unknown> => {
  if (!isRecord(value)) {
    throw new Error(`${fieldName} must be an object.`);
  }

  return value;
};

const ensureAllowedKeys = (
  value: Record<string, unknown>,
  allowedKeys: readonly string[],
  fieldName: string,
): void => {
  for (const key of Object.keys(value)) {
    if (!allowedKeys.includes(key)) {
      throw new Error(`${fieldName}.${key} is not allowed.`);
    }
  }
};

const ensureArray = (value: unknown, fieldName: string): unknown[] => {
  if (!Array.isArray(value)) {
    throw new Error(`${fieldName} must be an array.`);
  }

  return value;
};

const ensureStringField = (
  value: Record<string, unknown>,
  field: string,
  fieldName: string,
): string => {
  const fieldValue = value[field];
  if (typeof fieldValue !== "string" || fieldValue.trim().length === 0) {
    throw new Error(`${fieldName}.${field} must be a non-empty string.`);
  }

  return fieldValue.trim();
};

const ensureBooleanField = (
  value: Record<string, unknown>,
  field: string,
  fieldName: string,
): boolean => {
  const fieldValue = value[field];
  if (typeof fieldValue !== "boolean") {
    throw new Error(`${fieldName}.${field} must be a boolean.`);
  }

  return fieldValue;
};

const ensureNumberField = (
  value: Record<string, unknown>,
  field: string,
  fieldName: string,
): number => {
  const fieldValue = value[field];
  if (typeof fieldValue !== "number" || Number.isNaN(fieldValue)) {
    throw new Error(`${fieldName}.${field} must be a number.`);
  }

  return fieldValue;
};

const isSeedScenario = (value: string): value is SeedScenario => {
  return seedScenarios.includes(value as SeedScenario);
};

const isOperationErrorCode = (value: string): value is OperationErrorCode => {
  return operationErrorCodes.includes(value as OperationErrorCode);
};

const isMembershipRole = (value: string): value is MembershipRole => {
  return membershipRoles.includes(value as MembershipRole);
};

const isQuestionnaireStatus = (value: string): value is QuestionnaireStatus => {
  return questionnaireStatuses.includes(value as QuestionnaireStatus);
};

const isPendingQuestionnaireStatus = (
  value: string,
): value is CampaignProgressPendingItem["status"] => {
  return value === "not_started" || value === "in_progress";
};

const isResultsGroupKey = (value: string): value is ResultsGroupKey => {
  return resultsGroupKeys.includes(value as ResultsGroupKey);
};

const isResultsGroupVisibilityState = (value: string): value is ResultsGroupVisibilityState => {
  return resultsGroupVisibilityStates.includes(value as ResultsGroupVisibilityState);
};

const isSmallGroupPolicy = (value: string): value is SmallGroupPolicy => {
  return smallGroupPolicies.includes(value as SmallGroupPolicy);
};

export const isKnownOperation = (value: string): value is KnownOperation => {
  return knownOperations.includes(value as KnownOperation);
};

export const createOperationError = (
  code: OperationErrorCode,
  message: string,
  details?: Record<string, unknown>,
): OperationError => {
  return {
    code,
    message,
    ...(details ? { details } : {}),
  };
};

export const parseOperationError = (value: unknown): OperationError => {
  const record = ensureObject(value, "error");

  const code = record.code;
  if (typeof code !== "string" || !isOperationErrorCode(code)) {
    throw new Error(`error.code must be one of: ${operationErrorCodes.join(", ")}`);
  }

  const message = record.message;
  if (typeof message !== "string" || message.trim().length === 0) {
    throw new Error("error.message must be a non-empty string.");
  }

  const details = record.details;
  if (details !== undefined && !isRecord(details)) {
    throw new Error("error.details must be an object when provided.");
  }

  return createOperationError(code, message, details);
};

export const parseOperationContext = (value: unknown): OperationContext => {
  if (value === undefined) {
    return {};
  }

  const record = ensureObject(value, "context");
  ensureAllowedKeys(record, ["userId", "companyId", "role"], "context");

  const userId = record.userId;
  if (userId !== undefined && typeof userId !== "string") {
    throw new Error("context.userId must be a string when provided.");
  }

  const companyId = record.companyId;
  if (companyId !== undefined && typeof companyId !== "string") {
    throw new Error("context.companyId must be a string when provided.");
  }

  const roleValue = record.role;
  if (roleValue !== undefined) {
    if (typeof roleValue !== "string" || !isMembershipRole(roleValue)) {
      throw new Error(`context.role must be one of: ${membershipRoles.join(", ")}`);
    }
  }

  return {
    ...(userId ? { userId } : {}),
    ...(companyId ? { companyId } : {}),
    ...(roleValue ? { role: roleValue } : {}),
  };
};

export const parseDispatchOperationInput = (value: unknown): DispatchOperationInput => {
  const record = ensureObject(value, "dispatch input");
  ensureAllowedKeys(record, ["operation", "input", "context"], "dispatch input");

  const operation = record.operation;
  if (typeof operation !== "string" || operation.trim().length === 0) {
    throw new Error("dispatch input.operation must be a non-empty string.");
  }

  return {
    operation: operation.trim(),
    input: record.input,
    context: parseOperationContext(record.context),
  };
};

export const parseOperationResult = <Output>(
  value: unknown,
  parseOutput: (data: unknown) => Output,
): OperationResult<Output> => {
  const record = ensureObject(value, "operation result");
  ensureAllowedKeys(record, ["ok", "data", "error"], "operation result");

  const ok = record.ok;
  if (typeof ok !== "boolean") {
    throw new Error("operation result.ok must be a boolean.");
  }

  if (ok) {
    return {
      ok: true,
      data: parseOutput(record.data),
    };
  }

  return {
    ok: false,
    error: parseOperationError(record.error),
  };
};

export const errorFromUnknown = (
  error: unknown,
  fallbackCode: OperationErrorCode = "invalid_input",
  fallbackMessage = "Unexpected error.",
): OperationError => {
  if (isRecord(error)) {
    try {
      return parseOperationError(error);
    } catch {
      const maybeCode = error.code;
      const maybeMessage = error.message;
      if (typeof maybeCode === "string" && isOperationErrorCode(maybeCode)) {
        if (typeof maybeMessage === "string" && maybeMessage.trim().length > 0) {
          return createOperationError(
            maybeCode,
            maybeMessage,
            isRecord(error.details) ? error.details : undefined,
          );
        }
      }
    }
  }

  if (error instanceof Error) {
    return createOperationError(fallbackCode, error.message, {
      cause: error.name,
    });
  }

  return createOperationError(fallbackCode, fallbackMessage);
};

export const okResult = <Output>(data: Output): OperationResult<Output> => {
  return { ok: true, data };
};

export const errorResult = <Output>(error: OperationError): OperationResult<Output> => {
  return { ok: false, error };
};

const toStringMap = (value: unknown, fieldName: string): Record<string, string> => {
  const record = ensureObject(value, fieldName);

  const entries = Object.entries(record);
  const map: Record<string, string> = {};

  for (const [key, entryValue] of entries) {
    if (typeof entryValue !== "string") {
      throw new Error(`${fieldName}.${key} must be a string.`);
    }

    map[key] = entryValue;
  }

  return map;
};

export const parseSeedRunInput = (value: unknown): SeedRunInput => {
  const record = ensureObject(value, "seed.run input");
  ensureAllowedKeys(record, ["scenario", "variant"], "seed.run input");

  const scenario = record.scenario;
  if (typeof scenario !== "string" || !isSeedScenario(scenario)) {
    throw new Error(`Unknown seed scenario: ${String(scenario)}`);
  }

  const variant = record.variant;
  if (variant !== undefined && typeof variant !== "string") {
    throw new Error("seed.run input.variant must be a string when provided.");
  }

  return { scenario, variant };
};

export const parseSeedRunOutput = (value: unknown): SeedRunOutput => {
  const record = ensureObject(value, "seed.run output");
  ensureAllowedKeys(record, ["scenario", "variant", "handles"], "seed.run output");

  const scenario = record.scenario;
  if (typeof scenario !== "string" || !isSeedScenario(scenario)) {
    throw new Error(`Unknown seed scenario in output: ${String(scenario)}`);
  }

  const variant = record.variant;
  if (variant !== undefined && typeof variant !== "string") {
    throw new Error("seed.run output.variant must be a string when provided.");
  }

  return {
    scenario,
    variant,
    handles: toStringMap(record.handles, "seed.run output.handles"),
  };
};

export const parseSystemPingInput = (value: unknown): SystemPingInput => {
  const record = ensureObject(value, "system.ping input");
  ensureAllowedKeys(record, [], "system.ping input");
  return {};
};

export const parseSystemPingOutput = (value: unknown): SystemPingOutput => {
  const record = ensureObject(value, "system.ping output");
  ensureAllowedKeys(record, ["pong", "timestamp"], "system.ping output");

  const pong = record.pong;
  if (pong !== "ok") {
    throw new Error('system.ping output.pong must be "ok".');
  }

  const timestamp = ensureStringField(record, "timestamp", "system.ping output");
  return {
    pong: "ok",
    timestamp,
  };
};

export const parseCompanyUpdateProfileInput = (value: unknown): CompanyUpdateProfileInput => {
  const record = ensureObject(value, "company.updateProfile input");
  ensureAllowedKeys(record, ["companyId", "name"], "company.updateProfile input");

  return {
    companyId: ensureStringField(record, "companyId", "company.updateProfile input"),
    name: ensureStringField(record, "name", "company.updateProfile input"),
  };
};

export const parseCompanyUpdateProfileOutput = (value: unknown): CompanyUpdateProfileOutput => {
  const record = ensureObject(value, "company.updateProfile output");
  ensureAllowedKeys(record, ["companyId", "name", "updatedAt"], "company.updateProfile output");

  return {
    companyId: ensureStringField(record, "companyId", "company.updateProfile output"),
    name: ensureStringField(record, "name", "company.updateProfile output"),
    updatedAt: ensureStringField(record, "updatedAt", "company.updateProfile output"),
  };
};

const parseModelKind = (value: unknown, fieldName: string): "indicators" | "levels" => {
  if (value === "indicators" || value === "levels") {
    return value;
  }

  throw new Error(`${fieldName} must be one of: indicators, levels.`);
};

const parseCampaignLifecycleStatus = (
  value: unknown,
  fieldName: string,
): CampaignLifecycleStatus => {
  if (
    value === "draft" ||
    value === "started" ||
    value === "ended" ||
    value === "processing_ai" ||
    value === "ai_failed" ||
    value === "completed"
  ) {
    return value;
  }

  throw new Error(`${fieldName} must be one of: ${campaignLifecycleStatuses.join(", ")}.`);
};

const parseModelIndicatorInput = (value: unknown): ModelIndicatorInput => {
  const record = ensureObject(
    value,
    "model.version.create input.groups[].competencies[].indicators[]",
  );
  ensureAllowedKeys(
    record,
    ["text", "order"],
    "model.version.create input.groups[].competencies[].indicators[]",
  );

  const order = record.order;
  if (order !== undefined && typeof order !== "number") {
    throw new Error(
      "model.version.create input.groups[].competencies[].indicators[].order must be a number when provided.",
    );
  }

  return {
    text: ensureStringField(
      record,
      "text",
      "model.version.create input.groups[].competencies[].indicators[]",
    ),
    ...(typeof order === "number" ? { order } : {}),
  };
};

const parseModelLevelInput = (value: unknown): ModelLevelInput => {
  const record = ensureObject(value, "model.version.create input.groups[].competencies[].levels[]");
  ensureAllowedKeys(
    record,
    ["level", "text"],
    "model.version.create input.groups[].competencies[].levels[]",
  );

  return {
    level: ensureNumberField(
      record,
      "level",
      "model.version.create input.groups[].competencies[].levels[]",
    ),
    text: ensureStringField(
      record,
      "text",
      "model.version.create input.groups[].competencies[].levels[]",
    ),
  };
};

const parseModelCompetencyInput = (value: unknown): ModelCompetencyInput => {
  const record = ensureObject(value, "model.version.create input.groups[].competencies[]");
  ensureAllowedKeys(
    record,
    ["name", "indicators", "levels"],
    "model.version.create input.groups[].competencies[]",
  );

  const indicators = record.indicators;
  const levels = record.levels;

  let parsedIndicators: ModelIndicatorInput[] | undefined;
  if (indicators !== undefined) {
    parsedIndicators = ensureArray(
      indicators,
      "model.version.create input.groups[].competencies[].indicators",
    ).map(parseModelIndicatorInput);
  }

  let parsedLevels: ModelLevelInput[] | undefined;
  if (levels !== undefined) {
    parsedLevels = ensureArray(
      levels,
      "model.version.create input.groups[].competencies[].levels",
    ).map(parseModelLevelInput);
  }

  return {
    name: ensureStringField(record, "name", "model.version.create input.groups[].competencies[]"),
    ...(parsedIndicators ? { indicators: parsedIndicators } : {}),
    ...(parsedLevels ? { levels: parsedLevels } : {}),
  };
};

const parseModelGroupInput = (value: unknown): ModelGroupInput => {
  const record = ensureObject(value, "model.version.create input.groups[]");
  ensureAllowedKeys(
    record,
    ["name", "weight", "competencies"],
    "model.version.create input.groups[]",
  );

  return {
    name: ensureStringField(record, "name", "model.version.create input.groups[]"),
    weight: ensureNumberField(record, "weight", "model.version.create input.groups[]"),
    competencies: ensureArray(
      record.competencies,
      "model.version.create input.groups[].competencies",
    ).map(parseModelCompetencyInput),
  };
};

export const parseModelVersionCreateInput = (value: unknown): ModelVersionCreateInput => {
  const record = ensureObject(value, "model.version.create input");
  ensureAllowedKeys(record, ["name", "kind", "groups"], "model.version.create input");

  return {
    name: ensureStringField(record, "name", "model.version.create input"),
    kind: parseModelKind(record.kind, "model.version.create input.kind"),
    groups: ensureArray(record.groups, "model.version.create input.groups").map(
      parseModelGroupInput,
    ),
  };
};

export const parseModelVersionCreateOutput = (value: unknown): ModelVersionCreateOutput => {
  const record = ensureObject(value, "model.version.create output");
  ensureAllowedKeys(
    record,
    [
      "modelVersionId",
      "companyId",
      "name",
      "kind",
      "version",
      "createdAt",
      "groupCount",
      "competencyCount",
      "indicatorCount",
      "levelCount",
    ],
    "model.version.create output",
  );

  return {
    modelVersionId: ensureStringField(record, "modelVersionId", "model.version.create output"),
    companyId: ensureStringField(record, "companyId", "model.version.create output"),
    name: ensureStringField(record, "name", "model.version.create output"),
    kind: parseModelKind(record.kind, "model.version.create output.kind"),
    version: ensureNumberField(record, "version", "model.version.create output"),
    createdAt: ensureStringField(record, "createdAt", "model.version.create output"),
    groupCount: ensureNumberField(record, "groupCount", "model.version.create output"),
    competencyCount: ensureNumberField(record, "competencyCount", "model.version.create output"),
    indicatorCount: ensureNumberField(record, "indicatorCount", "model.version.create output"),
    levelCount: ensureNumberField(record, "levelCount", "model.version.create output"),
  };
};

export const parseCampaignCreateInput = (value: unknown): CampaignCreateInput => {
  const record = ensureObject(value, "campaign.create input");
  ensureAllowedKeys(
    record,
    ["name", "modelVersionId", "startAt", "endAt", "timezone"],
    "campaign.create input",
  );

  const timezone = record.timezone;
  if (timezone !== undefined && typeof timezone !== "string") {
    throw new Error("campaign.create input.timezone must be a string when provided.");
  }

  return {
    name: ensureStringField(record, "name", "campaign.create input"),
    modelVersionId: ensureStringField(record, "modelVersionId", "campaign.create input"),
    startAt: ensureStringField(record, "startAt", "campaign.create input"),
    endAt: ensureStringField(record, "endAt", "campaign.create input"),
    ...(typeof timezone === "string" && timezone.trim().length > 0
      ? { timezone: timezone.trim() }
      : {}),
  };
};

export const parseCampaignCreateOutput = (value: unknown): CampaignCreateOutput => {
  const record = ensureObject(value, "campaign.create output");
  ensureAllowedKeys(
    record,
    [
      "campaignId",
      "companyId",
      "modelVersionId",
      "name",
      "status",
      "startAt",
      "endAt",
      "timezone",
      "createdAt",
    ],
    "campaign.create output",
  );

  const status = ensureStringField(record, "status", "campaign.create output");
  if (status !== "draft") {
    throw new Error('campaign.create output.status must be "draft".');
  }

  return {
    campaignId: ensureStringField(record, "campaignId", "campaign.create output"),
    companyId: ensureStringField(record, "companyId", "campaign.create output"),
    modelVersionId: ensureStringField(record, "modelVersionId", "campaign.create output"),
    name: ensureStringField(record, "name", "campaign.create output"),
    status: "draft",
    startAt: ensureStringField(record, "startAt", "campaign.create output"),
    endAt: ensureStringField(record, "endAt", "campaign.create output"),
    timezone: ensureStringField(record, "timezone", "campaign.create output"),
    createdAt: ensureStringField(record, "createdAt", "campaign.create output"),
  };
};

export const parseCampaignTransitionInput = (value: unknown): CampaignTransitionInput => {
  const record = ensureObject(value, "campaign transition input");
  ensureAllowedKeys(record, ["campaignId"], "campaign transition input");

  return {
    campaignId: ensureStringField(record, "campaignId", "campaign transition input"),
  };
};

export const parseCampaignTransitionOutput = (value: unknown): CampaignTransitionOutput => {
  const record = ensureObject(value, "campaign transition output");
  ensureAllowedKeys(
    record,
    ["campaignId", "previousStatus", "status", "changed", "updatedAt"],
    "campaign transition output",
  );

  return {
    campaignId: ensureStringField(record, "campaignId", "campaign transition output"),
    previousStatus: parseCampaignLifecycleStatus(
      record.previousStatus,
      "campaign transition output.previousStatus",
    ),
    status: parseCampaignLifecycleStatus(record.status, "campaign transition output.status"),
    changed: ensureBooleanField(record, "changed", "campaign transition output"),
    updatedAt: ensureStringField(record, "updatedAt", "campaign transition output"),
  };
};

export const parseCampaignSetModelVersionInput = (value: unknown): CampaignSetModelVersionInput => {
  const record = ensureObject(value, "campaign.setModelVersion input");
  ensureAllowedKeys(record, ["campaignId", "modelVersionId"], "campaign.setModelVersion input");

  return {
    campaignId: ensureStringField(record, "campaignId", "campaign.setModelVersion input"),
    modelVersionId: ensureStringField(record, "modelVersionId", "campaign.setModelVersion input"),
  };
};

export const parseCampaignSetModelVersionOutput = (
  value: unknown,
): CampaignSetModelVersionOutput => {
  const record = ensureObject(value, "campaign.setModelVersion output");
  ensureAllowedKeys(
    record,
    ["campaignId", "modelVersionId", "changed", "updatedAt"],
    "campaign.setModelVersion output",
  );

  return {
    campaignId: ensureStringField(record, "campaignId", "campaign.setModelVersion output"),
    modelVersionId: ensureStringField(record, "modelVersionId", "campaign.setModelVersion output"),
    changed: ensureBooleanField(record, "changed", "campaign.setModelVersion output"),
    updatedAt: ensureStringField(record, "updatedAt", "campaign.setModelVersion output"),
  };
};

export const parseCampaignParticipantsMutationInput = (
  value: unknown,
): CampaignParticipantsMutationInput => {
  const record = ensureObject(value, "campaign participants mutation input");
  ensureAllowedKeys(record, ["campaignId", "employeeIds"], "campaign participants mutation input");

  const employeeIds = ensureArray(
    record.employeeIds,
    "campaign participants mutation input.employeeIds",
  );
  return {
    campaignId: ensureStringField(record, "campaignId", "campaign participants mutation input"),
    employeeIds: employeeIds.map((employeeId) => {
      if (typeof employeeId !== "string" || employeeId.trim().length === 0) {
        throw new Error(
          "campaign participants mutation input.employeeIds[] must be non-empty strings.",
        );
      }

      return employeeId.trim();
    }),
  };
};

export const parseCampaignParticipantsMutationOutput = (
  value: unknown,
): CampaignParticipantsMutationOutput => {
  const record = ensureObject(value, "campaign participants mutation output");
  ensureAllowedKeys(
    record,
    ["campaignId", "changedEmployeeIds", "totalParticipants"],
    "campaign participants mutation output",
  );

  return {
    campaignId: ensureStringField(record, "campaignId", "campaign participants mutation output"),
    changedEmployeeIds: ensureArray(
      record.changedEmployeeIds,
      "campaign participants mutation output.changedEmployeeIds",
    ).map((employeeId) => {
      if (typeof employeeId !== "string" || employeeId.trim().length === 0) {
        throw new Error(
          "campaign participants mutation output.changedEmployeeIds[] must be non-empty strings.",
        );
      }

      return employeeId.trim();
    }),
    totalParticipants: ensureNumberField(
      record,
      "totalParticipants",
      "campaign participants mutation output",
    ),
  };
};

export const parseCampaignWeightsSetInput = (value: unknown): CampaignWeightsSetInput => {
  const record = ensureObject(value, "campaign.weights.set input");
  ensureAllowedKeys(
    record,
    ["campaignId", "manager", "peers", "subordinates"],
    "campaign.weights.set input",
  );

  return {
    campaignId: ensureStringField(record, "campaignId", "campaign.weights.set input"),
    manager: ensureNumberField(record, "manager", "campaign.weights.set input"),
    peers: ensureNumberField(record, "peers", "campaign.weights.set input"),
    subordinates: ensureNumberField(record, "subordinates", "campaign.weights.set input"),
  };
};

export const parseCampaignWeightsSetOutput = (value: unknown): CampaignWeightsSetOutput => {
  const record = ensureObject(value, "campaign.weights.set output");
  ensureAllowedKeys(
    record,
    ["campaignId", "manager", "peers", "subordinates", "self", "changed", "updatedAt"],
    "campaign.weights.set output",
  );

  const selfValue = ensureNumberField(record, "self", "campaign.weights.set output");
  if (selfValue !== 0) {
    throw new Error("campaign.weights.set output.self must be 0.");
  }

  return {
    campaignId: ensureStringField(record, "campaignId", "campaign.weights.set output"),
    manager: ensureNumberField(record, "manager", "campaign.weights.set output"),
    peers: ensureNumberField(record, "peers", "campaign.weights.set output"),
    subordinates: ensureNumberField(record, "subordinates", "campaign.weights.set output"),
    self: 0,
    changed: ensureBooleanField(record, "changed", "campaign.weights.set output"),
    updatedAt: ensureStringField(record, "updatedAt", "campaign.weights.set output"),
  };
};

export const parseEmployeeUpsertInput = (value: unknown): EmployeeUpsertInput => {
  const record = ensureObject(value, "employee.upsert input");
  ensureAllowedKeys(
    record,
    ["employeeId", "email", "firstName", "lastName", "phone", "isActive"],
    "employee.upsert input",
  );

  const input: EmployeeUpsertInput = {
    employeeId: ensureStringField(record, "employeeId", "employee.upsert input"),
  };

  const email = record.email;
  if (email !== undefined) {
    if (typeof email !== "string" || email.trim().length === 0) {
      throw new Error("employee.upsert input.email must be a non-empty string when provided.");
    }
    input.email = email.trim();
  }

  const firstName = record.firstName;
  if (firstName !== undefined) {
    if (typeof firstName !== "string" || firstName.trim().length === 0) {
      throw new Error("employee.upsert input.firstName must be a non-empty string when provided.");
    }
    input.firstName = firstName.trim();
  }

  const lastName = record.lastName;
  if (lastName !== undefined) {
    if (typeof lastName !== "string" || lastName.trim().length === 0) {
      throw new Error("employee.upsert input.lastName must be a non-empty string when provided.");
    }
    input.lastName = lastName.trim();
  }

  const phone = record.phone;
  if (phone !== undefined) {
    if (typeof phone !== "string" || phone.trim().length === 0) {
      throw new Error("employee.upsert input.phone must be a non-empty string when provided.");
    }
    input.phone = phone.trim();
  }

  const isActive = record.isActive;
  if (isActive !== undefined) {
    if (typeof isActive !== "boolean") {
      throw new Error("employee.upsert input.isActive must be boolean when provided.");
    }
    input.isActive = isActive;
  }

  return input;
};

export const parseEmployeeUpsertOutput = (value: unknown): EmployeeUpsertOutput => {
  const record = ensureObject(value, "employee.upsert output");
  ensureAllowedKeys(
    record,
    ["employeeId", "companyId", "isActive", "deletedAt", "updatedAt", "created"],
    "employee.upsert output",
  );

  const deletedAt = record.deletedAt;
  if (deletedAt !== undefined && deletedAt !== null && typeof deletedAt !== "string") {
    throw new Error("employee.upsert output.deletedAt must be a string when provided.");
  }

  return {
    employeeId: ensureStringField(record, "employeeId", "employee.upsert output"),
    companyId: ensureStringField(record, "companyId", "employee.upsert output"),
    isActive: ensureBooleanField(record, "isActive", "employee.upsert output"),
    ...(typeof deletedAt === "string" ? { deletedAt } : {}),
    updatedAt: ensureStringField(record, "updatedAt", "employee.upsert output"),
    created: ensureBooleanField(record, "created", "employee.upsert output"),
  };
};

const parseEmployeeListActiveItem = (value: unknown): EmployeeListActiveItem => {
  const record = ensureObject(value, "employee.listActive output.items[]");
  ensureAllowedKeys(
    record,
    ["employeeId", "email", "firstName", "lastName", "isActive"],
    "employee.listActive output.items[]",
  );

  const firstName = record.firstName;
  if (firstName !== undefined && firstName !== null && typeof firstName !== "string") {
    throw new Error("employee.listActive output.items[].firstName must be a string when provided.");
  }

  const lastName = record.lastName;
  if (lastName !== undefined && lastName !== null && typeof lastName !== "string") {
    throw new Error("employee.listActive output.items[].lastName must be a string when provided.");
  }

  return {
    employeeId: ensureStringField(record, "employeeId", "employee.listActive output.items[]"),
    email: ensureStringField(record, "email", "employee.listActive output.items[]"),
    ...(typeof firstName === "string" ? { firstName } : {}),
    ...(typeof lastName === "string" ? { lastName } : {}),
    isActive: ensureBooleanField(record, "isActive", "employee.listActive output.items[]"),
  };
};

export const parseEmployeeListActiveInput = (value: unknown): EmployeeListActiveInput => {
  const record = ensureObject(value, "employee.listActive input");
  ensureAllowedKeys(record, ["companyId"], "employee.listActive input");

  const companyId = record.companyId;
  if (companyId !== undefined && typeof companyId !== "string") {
    throw new Error("employee.listActive input.companyId must be a string when provided.");
  }

  return {
    ...(typeof companyId === "string" ? { companyId: companyId.trim() } : {}),
  };
};

export const parseEmployeeListActiveOutput = (value: unknown): EmployeeListActiveOutput => {
  const record = ensureObject(value, "employee.listActive output");
  ensureAllowedKeys(record, ["items"], "employee.listActive output");

  return {
    items: ensureArray(record.items, "employee.listActive output.items").map(
      parseEmployeeListActiveItem,
    ),
  };
};

export const parseOrgDepartmentMoveInput = (value: unknown): OrgDepartmentMoveInput => {
  const record = ensureObject(value, "org.department.move input");
  ensureAllowedKeys(record, ["employeeId", "toDepartmentId"], "org.department.move input");

  return {
    employeeId: ensureStringField(record, "employeeId", "org.department.move input"),
    toDepartmentId: ensureStringField(record, "toDepartmentId", "org.department.move input"),
  };
};

export const parseOrgDepartmentMoveOutput = (value: unknown): OrgDepartmentMoveOutput => {
  const record = ensureObject(value, "org.department.move output");
  ensureAllowedKeys(
    record,
    ["employeeId", "previousDepartmentId", "departmentId", "changed", "effectiveAt"],
    "org.department.move output",
  );

  const previousDepartmentId = record.previousDepartmentId;
  if (
    previousDepartmentId !== undefined &&
    previousDepartmentId !== null &&
    typeof previousDepartmentId !== "string"
  ) {
    throw new Error(
      "org.department.move output.previousDepartmentId must be a string when provided.",
    );
  }

  return {
    employeeId: ensureStringField(record, "employeeId", "org.department.move output"),
    ...(typeof previousDepartmentId === "string" ? { previousDepartmentId } : {}),
    departmentId: ensureStringField(record, "departmentId", "org.department.move output"),
    changed: ensureBooleanField(record, "changed", "org.department.move output"),
    effectiveAt: ensureStringField(record, "effectiveAt", "org.department.move output"),
  };
};

export const parseOrgManagerSetInput = (value: unknown): OrgManagerSetInput => {
  const record = ensureObject(value, "org.manager.set input");
  ensureAllowedKeys(record, ["employeeId", "managerEmployeeId"], "org.manager.set input");

  return {
    employeeId: ensureStringField(record, "employeeId", "org.manager.set input"),
    managerEmployeeId: ensureStringField(record, "managerEmployeeId", "org.manager.set input"),
  };
};

export const parseOrgManagerSetOutput = (value: unknown): OrgManagerSetOutput => {
  const record = ensureObject(value, "org.manager.set output");
  ensureAllowedKeys(
    record,
    ["employeeId", "previousManagerEmployeeId", "managerEmployeeId", "changed", "effectiveAt"],
    "org.manager.set output",
  );

  const previousManagerEmployeeId = record.previousManagerEmployeeId;
  if (
    previousManagerEmployeeId !== undefined &&
    previousManagerEmployeeId !== null &&
    typeof previousManagerEmployeeId !== "string"
  ) {
    throw new Error(
      "org.manager.set output.previousManagerEmployeeId must be a string when provided.",
    );
  }

  return {
    employeeId: ensureStringField(record, "employeeId", "org.manager.set output"),
    ...(typeof previousManagerEmployeeId === "string" ? { previousManagerEmployeeId } : {}),
    managerEmployeeId: ensureStringField(record, "managerEmployeeId", "org.manager.set output"),
    changed: ensureBooleanField(record, "changed", "org.manager.set output"),
    effectiveAt: ensureStringField(record, "effectiveAt", "org.manager.set output"),
  };
};

const parseCampaignSnapshotListItem = (value: unknown): CampaignSnapshotListItem => {
  const record = ensureObject(value, "campaign.snapshot.list output.items[]");
  ensureAllowedKeys(
    record,
    [
      "snapshotId",
      "companyId",
      "campaignId",
      "employeeId",
      "email",
      "firstName",
      "lastName",
      "departmentId",
      "managerEmployeeId",
      "positionTitle",
      "positionLevel",
      "snapshotAt",
    ],
    "campaign.snapshot.list output.items[]",
  );

  const firstName = record.firstName;
  if (firstName !== undefined && firstName !== null && typeof firstName !== "string") {
    throw new Error("campaign.snapshot.list output.items[].firstName must be a string.");
  }

  const lastName = record.lastName;
  if (lastName !== undefined && lastName !== null && typeof lastName !== "string") {
    throw new Error("campaign.snapshot.list output.items[].lastName must be a string.");
  }

  const departmentId = record.departmentId;
  if (departmentId !== undefined && departmentId !== null && typeof departmentId !== "string") {
    throw new Error("campaign.snapshot.list output.items[].departmentId must be a string.");
  }

  const managerEmployeeId = record.managerEmployeeId;
  if (
    managerEmployeeId !== undefined &&
    managerEmployeeId !== null &&
    typeof managerEmployeeId !== "string"
  ) {
    throw new Error("campaign.snapshot.list output.items[].managerEmployeeId must be a string.");
  }

  const positionTitle = record.positionTitle;
  if (positionTitle !== undefined && positionTitle !== null && typeof positionTitle !== "string") {
    throw new Error("campaign.snapshot.list output.items[].positionTitle must be a string.");
  }

  const positionLevel = record.positionLevel;
  if (positionLevel !== undefined && positionLevel !== null && typeof positionLevel !== "number") {
    throw new Error("campaign.snapshot.list output.items[].positionLevel must be a number.");
  }

  return {
    snapshotId: ensureStringField(record, "snapshotId", "campaign.snapshot.list output.items[]"),
    companyId: ensureStringField(record, "companyId", "campaign.snapshot.list output.items[]"),
    campaignId: ensureStringField(record, "campaignId", "campaign.snapshot.list output.items[]"),
    employeeId: ensureStringField(record, "employeeId", "campaign.snapshot.list output.items[]"),
    email: ensureStringField(record, "email", "campaign.snapshot.list output.items[]"),
    ...(typeof firstName === "string" ? { firstName } : {}),
    ...(typeof lastName === "string" ? { lastName } : {}),
    ...(typeof departmentId === "string" ? { departmentId } : {}),
    ...(typeof managerEmployeeId === "string" ? { managerEmployeeId } : {}),
    ...(typeof positionTitle === "string" ? { positionTitle } : {}),
    ...(typeof positionLevel === "number" ? { positionLevel } : {}),
    snapshotAt: ensureStringField(record, "snapshotAt", "campaign.snapshot.list output.items[]"),
  };
};

export const parseCampaignSnapshotListInput = (value: unknown): CampaignSnapshotListInput => {
  const record = ensureObject(value, "campaign.snapshot.list input");
  ensureAllowedKeys(record, ["campaignId"], "campaign.snapshot.list input");

  return {
    campaignId: ensureStringField(record, "campaignId", "campaign.snapshot.list input"),
  };
};

export const parseCampaignSnapshotListOutput = (value: unknown): CampaignSnapshotListOutput => {
  const record = ensureObject(value, "campaign.snapshot.list output");
  ensureAllowedKeys(record, ["items"], "campaign.snapshot.list output");

  return {
    items: ensureArray(record.items, "campaign.snapshot.list output.items").map(
      parseCampaignSnapshotListItem,
    ),
  };
};

export const parseCampaignProgressGetInput = (value: unknown): CampaignProgressGetInput => {
  const record = ensureObject(value, "campaign.progress.get input");
  ensureAllowedKeys(record, ["campaignId"], "campaign.progress.get input");

  return {
    campaignId: ensureStringField(record, "campaignId", "campaign.progress.get input"),
  };
};

const parseCampaignProgressStatusCounts = (value: unknown): CampaignProgressStatusCounts => {
  const record = ensureObject(value, "campaign.progress.get output.statusCounts");
  ensureAllowedKeys(
    record,
    ["notStarted", "inProgress", "submitted"],
    "campaign.progress.get output.statusCounts",
  );

  return {
    notStarted: ensureNumberField(
      record,
      "notStarted",
      "campaign.progress.get output.statusCounts",
    ),
    inProgress: ensureNumberField(
      record,
      "inProgress",
      "campaign.progress.get output.statusCounts",
    ),
    submitted: ensureNumberField(record, "submitted", "campaign.progress.get output.statusCounts"),
  };
};

const parseCampaignProgressPendingItem = (value: unknown): CampaignProgressPendingItem => {
  const record = ensureObject(value, "campaign.progress.get output.pendingQuestionnaires[]");
  ensureAllowedKeys(
    record,
    [
      "questionnaireId",
      "campaignId",
      "companyId",
      "subjectEmployeeId",
      "raterEmployeeId",
      "status",
      "firstDraftAt",
      "submittedAt",
    ],
    "campaign.progress.get output.pendingQuestionnaires[]",
  );

  const status = ensureStringField(
    record,
    "status",
    "campaign.progress.get output.pendingQuestionnaires[]",
  );
  if (!isPendingQuestionnaireStatus(status)) {
    throw new Error(
      'campaign.progress.get output.pendingQuestionnaires[].status must be "not_started" or "in_progress".',
    );
  }

  const firstDraftAt = record.firstDraftAt;
  if (firstDraftAt !== undefined && firstDraftAt !== null && typeof firstDraftAt !== "string") {
    throw new Error(
      "campaign.progress.get output.pendingQuestionnaires[].firstDraftAt must be a string when provided.",
    );
  }

  const submittedAt = record.submittedAt;
  if (submittedAt !== undefined && submittedAt !== null && typeof submittedAt !== "string") {
    throw new Error(
      "campaign.progress.get output.pendingQuestionnaires[].submittedAt must be a string when provided.",
    );
  }

  return {
    questionnaireId: ensureStringField(
      record,
      "questionnaireId",
      "campaign.progress.get output.pendingQuestionnaires[]",
    ),
    campaignId: ensureStringField(
      record,
      "campaignId",
      "campaign.progress.get output.pendingQuestionnaires[]",
    ),
    companyId: ensureStringField(
      record,
      "companyId",
      "campaign.progress.get output.pendingQuestionnaires[]",
    ),
    subjectEmployeeId: ensureStringField(
      record,
      "subjectEmployeeId",
      "campaign.progress.get output.pendingQuestionnaires[]",
    ),
    raterEmployeeId: ensureStringField(
      record,
      "raterEmployeeId",
      "campaign.progress.get output.pendingQuestionnaires[]",
    ),
    status,
    ...(typeof firstDraftAt === "string" ? { firstDraftAt } : {}),
    ...(typeof submittedAt === "string" ? { submittedAt } : {}),
  };
};

const parseCampaignProgressPendingGroupItem = (
  value: unknown,
): CampaignProgressPendingGroupItem => {
  const record = ensureObject(value, "campaign.progress.get output.pendingBy[]");
  ensureAllowedKeys(
    record,
    ["employeeId", "pendingCount"],
    "campaign.progress.get output.pendingBy[]",
  );

  return {
    employeeId: ensureStringField(record, "employeeId", "campaign.progress.get output.pendingBy[]"),
    pendingCount: ensureNumberField(
      record,
      "pendingCount",
      "campaign.progress.get output.pendingBy[]",
    ),
  };
};

export const parseCampaignProgressGetOutput = (value: unknown): CampaignProgressGetOutput => {
  const record = ensureObject(value, "campaign.progress.get output");
  ensureAllowedKeys(
    record,
    [
      "campaignId",
      "companyId",
      "totalQuestionnaires",
      "statusCounts",
      "campaignLockedAt",
      "pendingQuestionnaires",
      "pendingByRater",
      "pendingBySubject",
    ],
    "campaign.progress.get output",
  );

  const campaignLockedAt = record.campaignLockedAt;
  if (
    campaignLockedAt !== undefined &&
    campaignLockedAt !== null &&
    typeof campaignLockedAt !== "string"
  ) {
    throw new Error("campaign.progress.get output.campaignLockedAt must be a string.");
  }

  return {
    campaignId: ensureStringField(record, "campaignId", "campaign.progress.get output"),
    companyId: ensureStringField(record, "companyId", "campaign.progress.get output"),
    totalQuestionnaires: ensureNumberField(
      record,
      "totalQuestionnaires",
      "campaign.progress.get output",
    ),
    statusCounts: parseCampaignProgressStatusCounts(record.statusCounts),
    ...(typeof campaignLockedAt === "string" ? { campaignLockedAt } : {}),
    pendingQuestionnaires: ensureArray(
      record.pendingQuestionnaires,
      "campaign.progress.get output.pendingQuestionnaires",
    ).map(parseCampaignProgressPendingItem),
    pendingByRater: ensureArray(
      record.pendingByRater,
      "campaign.progress.get output.pendingByRater",
    ).map(parseCampaignProgressPendingGroupItem),
    pendingBySubject: ensureArray(
      record.pendingBySubject,
      "campaign.progress.get output.pendingBySubject",
    ).map(parseCampaignProgressPendingGroupItem),
  };
};

export const parseResultsGetHrViewInput = (value: unknown): ResultsGetHrViewInput => {
  const record = ensureObject(value, "results.getHrView input");
  ensureAllowedKeys(
    record,
    ["campaignId", "subjectEmployeeId", "smallGroupPolicy", "anonymityThreshold"],
    "results.getHrView input",
  );

  const smallGroupPolicyValue = record.smallGroupPolicy;
  if (smallGroupPolicyValue !== undefined) {
    if (typeof smallGroupPolicyValue !== "string" || !isSmallGroupPolicy(smallGroupPolicyValue)) {
      throw new Error(
        `results.getHrView input.smallGroupPolicy must be one of: ${smallGroupPolicies.join(", ")}`,
      );
    }
  }

  const anonymityThresholdValue = record.anonymityThreshold;
  if (anonymityThresholdValue !== undefined) {
    if (
      typeof anonymityThresholdValue !== "number" ||
      Number.isNaN(anonymityThresholdValue) ||
      !Number.isInteger(anonymityThresholdValue) ||
      anonymityThresholdValue < 1
    ) {
      throw new Error("results.getHrView input.anonymityThreshold must be an integer >= 1.");
    }
  }

  return {
    campaignId: ensureStringField(record, "campaignId", "results.getHrView input"),
    subjectEmployeeId: ensureStringField(record, "subjectEmployeeId", "results.getHrView input"),
    ...(smallGroupPolicyValue ? { smallGroupPolicy: smallGroupPolicyValue } : {}),
    ...(typeof anonymityThresholdValue === "number"
      ? { anonymityThreshold: anonymityThresholdValue }
      : {}),
  };
};

const parseOptionalNumberField = (
  record: Record<string, unknown>,
  field: string,
  fieldName: string,
): number | undefined => {
  const value = record[field];
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new Error(`${fieldName}.${field} must be a number when provided.`);
  }
  return value;
};

const parseNullableModeLevelField = (
  record: Record<string, unknown>,
  field: string,
  fieldName: string,
): 1 | 2 | 3 | 4 | null => {
  const value = record[field];
  if (value === null) {
    return null;
  }
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1 || value > 4) {
    throw new Error(`${fieldName}.${field} must be an integer in range 1..4 or null.`);
  }
  return value as 1 | 2 | 3 | 4;
};

const parseResultsHrViewLevelDistribution = (value: unknown): ResultsHrViewLevelDistribution => {
  const record = ensureObject(value, "results.getHrView output.levelSummary.distribution");
  ensureAllowedKeys(
    record,
    ["level1", "level2", "level3", "level4"],
    "results.getHrView output.levelSummary.distribution",
  );

  return {
    level1: ensureNumberField(
      record,
      "level1",
      "results.getHrView output.levelSummary.distribution",
    ),
    level2: ensureNumberField(
      record,
      "level2",
      "results.getHrView output.levelSummary.distribution",
    ),
    level3: ensureNumberField(
      record,
      "level3",
      "results.getHrView output.levelSummary.distribution",
    ),
    level4: ensureNumberField(
      record,
      "level4",
      "results.getHrView output.levelSummary.distribution",
    ),
  };
};

const parseResultsHrViewLevelSummary = (value: unknown): ResultsHrViewLevelSummary => {
  const record = ensureObject(value, "results.getHrView output.levelSummary");
  ensureAllowedKeys(
    record,
    ["modeLevel", "distribution", "nValid", "nUnsure"],
    "results.getHrView output.levelSummary",
  );

  return {
    modeLevel: parseNullableModeLevelField(
      record,
      "modeLevel",
      "results.getHrView output.levelSummary",
    ),
    distribution: parseResultsHrViewLevelDistribution(record.distribution),
    nValid: ensureNumberField(record, "nValid", "results.getHrView output.levelSummary"),
    nUnsure: ensureNumberField(record, "nUnsure", "results.getHrView output.levelSummary"),
  };
};

const parseResultsHrViewRaterScore = (value: unknown): ResultsHrViewRaterScore => {
  const record = ensureObject(value, "results.getHrView output.raterScores[]");
  ensureAllowedKeys(
    record,
    [
      "raterEmployeeId",
      "group",
      "competencyId",
      "score",
      "validIndicatorCount",
      "totalIndicatorCount",
    ],
    "results.getHrView output.raterScores[]",
  );

  const group = ensureStringField(record, "group", "results.getHrView output.raterScores[]");
  if (!isResultsGroupKey(group)) {
    throw new Error(
      `results.getHrView output.raterScores[].group must be one of: ${resultsGroupKeys.join(", ")}`,
    );
  }

  const score = parseOptionalNumberField(record, "score", "results.getHrView output.raterScores[]");

  return {
    raterEmployeeId: ensureStringField(
      record,
      "raterEmployeeId",
      "results.getHrView output.raterScores[]",
    ),
    group,
    competencyId: ensureStringField(
      record,
      "competencyId",
      "results.getHrView output.raterScores[]",
    ),
    ...(score !== undefined ? { score } : {}),
    validIndicatorCount: ensureNumberField(
      record,
      "validIndicatorCount",
      "results.getHrView output.raterScores[]",
    ),
    totalIndicatorCount: ensureNumberField(
      record,
      "totalIndicatorCount",
      "results.getHrView output.raterScores[]",
    ),
  };
};

const parseResultsHrViewCompetencyScore = (value: unknown): ResultsHrViewCompetencyScore => {
  const record = ensureObject(value, "results.getHrView output.competencyScores[]");
  ensureAllowedKeys(
    record,
    [
      "competencyId",
      "competencyName",
      "groupId",
      "groupName",
      "managerScore",
      "managerRaters",
      "peersScore",
      "peersRaters",
      "subordinatesScore",
      "subordinatesRaters",
      "selfScore",
      "selfRaters",
      "otherScore",
      "otherRaters",
      "managerVisibility",
      "peersVisibility",
      "subordinatesVisibility",
      "selfVisibility",
      "otherVisibility",
      "managerLevels",
      "peersLevels",
      "subordinatesLevels",
      "selfLevels",
      "otherLevels",
    ],
    "results.getHrView output.competencyScores[]",
  );

  const managerScore = parseOptionalNumberField(
    record,
    "managerScore",
    "results.getHrView output.competencyScores[]",
  );
  const peersScore = parseOptionalNumberField(
    record,
    "peersScore",
    "results.getHrView output.competencyScores[]",
  );
  const subordinatesScore = parseOptionalNumberField(
    record,
    "subordinatesScore",
    "results.getHrView output.competencyScores[]",
  );
  const selfScore = parseOptionalNumberField(
    record,
    "selfScore",
    "results.getHrView output.competencyScores[]",
  );
  const otherScore = parseOptionalNumberField(
    record,
    "otherScore",
    "results.getHrView output.competencyScores[]",
  );
  const managerVisibility = ensureStringField(
    record,
    "managerVisibility",
    "results.getHrView output.competencyScores[]",
  );
  if (managerVisibility !== "shown") {
    throw new Error(
      'results.getHrView output.competencyScores[].managerVisibility must be "shown".',
    );
  }

  const peersVisibility = ensureStringField(
    record,
    "peersVisibility",
    "results.getHrView output.competencyScores[]",
  );
  if (!isResultsGroupVisibilityState(peersVisibility)) {
    throw new Error(
      `results.getHrView output.competencyScores[].peersVisibility must be one of: ${resultsGroupVisibilityStates.join(", ")}`,
    );
  }

  const subordinatesVisibility = ensureStringField(
    record,
    "subordinatesVisibility",
    "results.getHrView output.competencyScores[]",
  );
  if (!isResultsGroupVisibilityState(subordinatesVisibility)) {
    throw new Error(
      `results.getHrView output.competencyScores[].subordinatesVisibility must be one of: ${resultsGroupVisibilityStates.join(", ")}`,
    );
  }

  const selfVisibility = ensureStringField(
    record,
    "selfVisibility",
    "results.getHrView output.competencyScores[]",
  );
  if (selfVisibility !== "shown") {
    throw new Error('results.getHrView output.competencyScores[].selfVisibility must be "shown".');
  }

  const otherVisibilityValue = record.otherVisibility;
  if (otherVisibilityValue !== undefined) {
    if (otherVisibilityValue !== "shown" && otherVisibilityValue !== "hidden") {
      throw new Error(
        'results.getHrView output.competencyScores[].otherVisibility must be "shown" or "hidden" when provided.',
      );
    }
  }

  const managerLevelsValue = record.managerLevels;
  const peersLevelsValue = record.peersLevels;
  const subordinatesLevelsValue = record.subordinatesLevels;
  const selfLevelsValue = record.selfLevels;
  const otherLevelsValue = record.otherLevels;

  return {
    competencyId: ensureStringField(
      record,
      "competencyId",
      "results.getHrView output.competencyScores[]",
    ),
    competencyName: ensureStringField(
      record,
      "competencyName",
      "results.getHrView output.competencyScores[]",
    ),
    groupId: ensureStringField(record, "groupId", "results.getHrView output.competencyScores[]"),
    groupName: ensureStringField(
      record,
      "groupName",
      "results.getHrView output.competencyScores[]",
    ),
    ...(managerScore !== undefined ? { managerScore } : {}),
    managerRaters: ensureNumberField(
      record,
      "managerRaters",
      "results.getHrView output.competencyScores[]",
    ),
    ...(peersScore !== undefined ? { peersScore } : {}),
    peersRaters: ensureNumberField(
      record,
      "peersRaters",
      "results.getHrView output.competencyScores[]",
    ),
    ...(subordinatesScore !== undefined ? { subordinatesScore } : {}),
    subordinatesRaters: ensureNumberField(
      record,
      "subordinatesRaters",
      "results.getHrView output.competencyScores[]",
    ),
    ...(selfScore !== undefined ? { selfScore } : {}),
    selfRaters: ensureNumberField(
      record,
      "selfRaters",
      "results.getHrView output.competencyScores[]",
    ),
    ...(otherScore !== undefined ? { otherScore } : {}),
    otherRaters: ensureNumberField(
      record,
      "otherRaters",
      "results.getHrView output.competencyScores[]",
    ),
    managerVisibility: "shown",
    peersVisibility,
    subordinatesVisibility,
    selfVisibility: "shown",
    ...(otherVisibilityValue ? { otherVisibility: otherVisibilityValue } : {}),
    ...(managerLevelsValue !== undefined
      ? { managerLevels: parseResultsHrViewLevelSummary(managerLevelsValue) }
      : {}),
    ...(peersLevelsValue !== undefined
      ? { peersLevels: parseResultsHrViewLevelSummary(peersLevelsValue) }
      : {}),
    ...(subordinatesLevelsValue !== undefined
      ? { subordinatesLevels: parseResultsHrViewLevelSummary(subordinatesLevelsValue) }
      : {}),
    ...(selfLevelsValue !== undefined
      ? { selfLevels: parseResultsHrViewLevelSummary(selfLevelsValue) }
      : {}),
    ...(otherLevelsValue !== undefined
      ? { otherLevels: parseResultsHrViewLevelSummary(otherLevelsValue) }
      : {}),
  };
};

const parseResultsHrViewGroupOverall = (value: unknown): ResultsHrViewGroupOverall => {
  const record = ensureObject(value, "results.getHrView output.groupOverall");
  ensureAllowedKeys(
    record,
    ["manager", "peers", "subordinates", "self", "other"],
    "results.getHrView output.groupOverall",
  );

  const manager = parseOptionalNumberField(
    record,
    "manager",
    "results.getHrView output.groupOverall",
  );
  const peers = parseOptionalNumberField(record, "peers", "results.getHrView output.groupOverall");
  const subordinates = parseOptionalNumberField(
    record,
    "subordinates",
    "results.getHrView output.groupOverall",
  );
  const self = parseOptionalNumberField(record, "self", "results.getHrView output.groupOverall");
  const other = parseOptionalNumberField(record, "other", "results.getHrView output.groupOverall");

  return {
    ...(manager !== undefined ? { manager } : {}),
    ...(peers !== undefined ? { peers } : {}),
    ...(subordinates !== undefined ? { subordinates } : {}),
    ...(self !== undefined ? { self } : {}),
    ...(other !== undefined ? { other } : {}),
  };
};

const parseResultsHrViewGroupVisibility = (value: unknown): ResultsHrViewGroupVisibility => {
  const record = ensureObject(value, "results.getHrView output.groupVisibility");
  ensureAllowedKeys(
    record,
    ["manager", "peers", "subordinates", "self", "other"],
    "results.getHrView output.groupVisibility",
  );

  const manager = ensureStringField(record, "manager", "results.getHrView output.groupVisibility");
  if (manager !== "shown") {
    throw new Error('results.getHrView output.groupVisibility.manager must be "shown".');
  }

  const peers = ensureStringField(record, "peers", "results.getHrView output.groupVisibility");
  if (!isResultsGroupVisibilityState(peers)) {
    throw new Error(
      `results.getHrView output.groupVisibility.peers must be one of: ${resultsGroupVisibilityStates.join(", ")}`,
    );
  }

  const subordinates = ensureStringField(
    record,
    "subordinates",
    "results.getHrView output.groupVisibility",
  );
  if (!isResultsGroupVisibilityState(subordinates)) {
    throw new Error(
      `results.getHrView output.groupVisibility.subordinates must be one of: ${resultsGroupVisibilityStates.join(", ")}`,
    );
  }

  const self = ensureStringField(record, "self", "results.getHrView output.groupVisibility");
  if (self !== "shown") {
    throw new Error('results.getHrView output.groupVisibility.self must be "shown".');
  }

  const otherValue = record.other;
  if (otherValue !== undefined) {
    if (otherValue !== "shown" && otherValue !== "hidden") {
      throw new Error(
        'results.getHrView output.groupVisibility.other must be "shown" or "hidden" when provided.',
      );
    }
  }

  return {
    manager: "shown",
    peers,
    subordinates,
    self: "shown",
    ...(otherValue ? { other: otherValue } : {}),
  };
};

const parseResultsHrViewGroupWeights = (value: unknown): ResultsHrViewGroupWeights => {
  const record = ensureObject(value, "results.getHrView output.groupWeights");
  ensureAllowedKeys(
    record,
    ["manager", "peers", "subordinates", "self", "other"],
    "results.getHrView output.groupWeights",
  );

  const manager = ensureNumberField(record, "manager", "results.getHrView output.groupWeights");
  const peers = ensureNumberField(record, "peers", "results.getHrView output.groupWeights");
  const subordinates = ensureNumberField(
    record,
    "subordinates",
    "results.getHrView output.groupWeights",
  );
  const self = ensureNumberField(record, "self", "results.getHrView output.groupWeights");
  const other = ensureNumberField(record, "other", "results.getHrView output.groupWeights");

  return {
    manager,
    peers,
    subordinates,
    self,
    other,
  };
};

export const parseResultsGetHrViewOutput = (value: unknown): ResultsGetHrViewOutput => {
  const record = ensureObject(value, "results.getHrView output");
  ensureAllowedKeys(
    record,
    [
      "campaignId",
      "companyId",
      "subjectEmployeeId",
      "modelVersionId",
      "modelKind",
      "anonymityThreshold",
      "smallGroupPolicy",
      "groupVisibility",
      "competencyScores",
      "raterScores",
      "groupOverall",
      "configuredGroupWeights",
      "effectiveGroupWeights",
      "overallScore",
    ],
    "results.getHrView output",
  );

  const modelKind = ensureStringField(record, "modelKind", "results.getHrView output");
  if (modelKind !== "indicators" && modelKind !== "levels") {
    throw new Error('results.getHrView output.modelKind must be "indicators" or "levels".');
  }

  const smallGroupPolicyValue = ensureStringField(
    record,
    "smallGroupPolicy",
    "results.getHrView output",
  );
  if (!isSmallGroupPolicy(smallGroupPolicyValue)) {
    throw new Error(
      `results.getHrView output.smallGroupPolicy must be one of: ${smallGroupPolicies.join(", ")}`,
    );
  }

  const anonymityThreshold = ensureNumberField(
    record,
    "anonymityThreshold",
    "results.getHrView output",
  );
  if (!Number.isInteger(anonymityThreshold) || anonymityThreshold < 1) {
    throw new Error("results.getHrView output.anonymityThreshold must be an integer >= 1.");
  }

  const overallScore = parseOptionalNumberField(record, "overallScore", "results.getHrView output");

  return {
    campaignId: ensureStringField(record, "campaignId", "results.getHrView output"),
    companyId: ensureStringField(record, "companyId", "results.getHrView output"),
    subjectEmployeeId: ensureStringField(record, "subjectEmployeeId", "results.getHrView output"),
    modelVersionId: ensureStringField(record, "modelVersionId", "results.getHrView output"),
    modelKind,
    anonymityThreshold,
    smallGroupPolicy: smallGroupPolicyValue,
    groupVisibility: parseResultsHrViewGroupVisibility(record.groupVisibility),
    competencyScores: ensureArray(
      record.competencyScores,
      "results.getHrView output.competencyScores",
    ).map(parseResultsHrViewCompetencyScore),
    raterScores: ensureArray(record.raterScores, "results.getHrView output.raterScores").map(
      parseResultsHrViewRaterScore,
    ),
    groupOverall: parseResultsHrViewGroupOverall(record.groupOverall),
    configuredGroupWeights: parseResultsHrViewGroupWeights(record.configuredGroupWeights),
    effectiveGroupWeights: parseResultsHrViewGroupWeights(record.effectiveGroupWeights),
    ...(overallScore !== undefined ? { overallScore } : {}),
  };
};

const matrixRaterRoles = ["manager", "peer", "subordinate", "self"] as const;
const isMatrixRaterRole = (value: string): value is MatrixGeneratedAssignment["raterRole"] => {
  return matrixRaterRoles.includes(value as (typeof matrixRaterRoles)[number]);
};

const parseMatrixGeneratedAssignment = (value: unknown): MatrixGeneratedAssignment => {
  const record = ensureObject(value, "matrix.generateSuggested output.generatedAssignments[]");
  ensureAllowedKeys(
    record,
    ["subjectEmployeeId", "raterEmployeeId", "raterRole"],
    "matrix.generateSuggested output.generatedAssignments[]",
  );

  const raterRole = ensureStringField(
    record,
    "raterRole",
    "matrix.generateSuggested output.generatedAssignments[]",
  );
  if (!isMatrixRaterRole(raterRole)) {
    throw new Error(
      `matrix.generateSuggested output.generatedAssignments[].raterRole must be one of: ${matrixRaterRoles.join(", ")}`,
    );
  }

  return {
    subjectEmployeeId: ensureStringField(
      record,
      "subjectEmployeeId",
      "matrix.generateSuggested output.generatedAssignments[]",
    ),
    raterEmployeeId: ensureStringField(
      record,
      "raterEmployeeId",
      "matrix.generateSuggested output.generatedAssignments[]",
    ),
    raterRole,
  };
};

export const parseCampaignParticipantsAddFromDepartmentsInput = (
  value: unknown,
): CampaignParticipantsAddFromDepartmentsInput => {
  const record = ensureObject(value, "campaign.participants.addFromDepartments input");
  ensureAllowedKeys(
    record,
    ["campaignId", "departmentIds", "includeSelf"],
    "campaign.participants.addFromDepartments input",
  );

  const includeSelf = record.includeSelf;
  if (includeSelf !== undefined && typeof includeSelf !== "boolean") {
    throw new Error(
      "campaign.participants.addFromDepartments input.includeSelf must be boolean when provided.",
    );
  }

  const departmentIds = ensureArray(
    record.departmentIds,
    "campaign.participants.addFromDepartments input.departmentIds",
  ).map((item) =>
    ensureStringField(
      { value: item },
      "value",
      "campaign.participants.addFromDepartments input.departmentIds[]",
    ),
  );

  return {
    campaignId: ensureStringField(
      record,
      "campaignId",
      "campaign.participants.addFromDepartments input",
    ),
    departmentIds,
    ...(typeof includeSelf === "boolean" ? { includeSelf } : {}),
  };
};

export const parseCampaignParticipantsAddFromDepartmentsOutput = (
  value: unknown,
): CampaignParticipantsAddFromDepartmentsOutput => {
  const record = ensureObject(value, "campaign.participants.addFromDepartments output");
  ensureAllowedKeys(
    record,
    ["campaignId", "addedEmployeeIds", "totalParticipants"],
    "campaign.participants.addFromDepartments output",
  );

  return {
    campaignId: ensureStringField(
      record,
      "campaignId",
      "campaign.participants.addFromDepartments output",
    ),
    addedEmployeeIds: ensureArray(
      record.addedEmployeeIds,
      "campaign.participants.addFromDepartments output.addedEmployeeIds",
    ).map((item) =>
      ensureStringField(
        { value: item },
        "value",
        "campaign.participants.addFromDepartments output.addedEmployeeIds[]",
      ),
    ),
    totalParticipants: ensureNumberField(
      record,
      "totalParticipants",
      "campaign.participants.addFromDepartments output",
    ),
  };
};

export const parseMatrixGenerateSuggestedInput = (value: unknown): MatrixGenerateSuggestedInput => {
  const record = ensureObject(value, "matrix.generateSuggested input");
  ensureAllowedKeys(record, ["campaignId", "departmentIds"], "matrix.generateSuggested input");

  const departmentIdsValue = record.departmentIds;
  let departmentIds: string[] | undefined;
  if (departmentIdsValue !== undefined) {
    departmentIds = ensureArray(
      departmentIdsValue,
      "matrix.generateSuggested input.departmentIds",
    ).map((item) =>
      ensureStringField({ value: item }, "value", "matrix.generateSuggested input.departmentIds[]"),
    );
  }

  return {
    campaignId: ensureStringField(record, "campaignId", "matrix.generateSuggested input"),
    ...(departmentIds ? { departmentIds } : {}),
  };
};

export const parseMatrixGenerateSuggestedOutput = (
  value: unknown,
): MatrixGenerateSuggestedOutput => {
  const record = ensureObject(value, "matrix.generateSuggested output");
  ensureAllowedKeys(
    record,
    ["campaignId", "generatedAssignments", "totalAssignments"],
    "matrix.generateSuggested output",
  );

  return {
    campaignId: ensureStringField(record, "campaignId", "matrix.generateSuggested output"),
    generatedAssignments: ensureArray(
      record.generatedAssignments,
      "matrix.generateSuggested output.generatedAssignments",
    ).map(parseMatrixGeneratedAssignment),
    totalAssignments: ensureNumberField(
      record,
      "totalAssignments",
      "matrix.generateSuggested output",
    ),
  };
};

export const parseMatrixSetInput = (value: unknown): MatrixSetInput => {
  const record = ensureObject(value, "matrix.set input");
  ensureAllowedKeys(record, ["campaignId", "assignments"], "matrix.set input");

  return {
    campaignId: ensureStringField(record, "campaignId", "matrix.set input"),
    assignments: ensureArray(record.assignments, "matrix.set input.assignments").map(
      parseMatrixGeneratedAssignment,
    ),
  };
};

export const parseMatrixSetOutput = (value: unknown): MatrixSetOutput => {
  const record = ensureObject(value, "matrix.set output");
  ensureAllowedKeys(record, ["campaignId", "totalAssignments"], "matrix.set output");

  return {
    campaignId: ensureStringField(record, "campaignId", "matrix.set output"),
    totalAssignments: ensureNumberField(record, "totalAssignments", "matrix.set output"),
  };
};

export const parseAiRunForCampaignInput = (value: unknown): AiRunForCampaignInput => {
  const record = ensureObject(value, "ai.runForCampaign input");
  ensureAllowedKeys(record, ["campaignId"], "ai.runForCampaign input");

  return {
    campaignId: ensureStringField(record, "campaignId", "ai.runForCampaign input"),
  };
};

export const parseAiRunForCampaignOutput = (value: unknown): AiRunForCampaignOutput => {
  const record = ensureObject(value, "ai.runForCampaign output");
  ensureAllowedKeys(
    record,
    ["campaignId", "aiJobId", "provider", "status", "completedAt", "wasAlreadyCompleted"],
    "ai.runForCampaign output",
  );

  const provider = ensureStringField(record, "provider", "ai.runForCampaign output");
  if (provider !== "mvp_stub") {
    throw new Error('ai.runForCampaign output.provider must be "mvp_stub".');
  }

  const status = ensureStringField(record, "status", "ai.runForCampaign output");
  if (status !== "completed") {
    throw new Error('ai.runForCampaign output.status must be "completed".');
  }

  return {
    campaignId: ensureStringField(record, "campaignId", "ai.runForCampaign output"),
    aiJobId: ensureStringField(record, "aiJobId", "ai.runForCampaign output"),
    provider: "mvp_stub",
    status: "completed",
    completedAt: ensureStringField(record, "completedAt", "ai.runForCampaign output"),
    wasAlreadyCompleted: ensureBooleanField(
      record,
      "wasAlreadyCompleted",
      "ai.runForCampaign output",
    ),
  };
};

export const parseClientSetActiveCompanyInput = (value: unknown): ClientSetActiveCompanyInput => {
  const record = ensureObject(value, "client.setActiveCompany input");
  ensureAllowedKeys(record, ["companyId"], "client.setActiveCompany input");

  return {
    companyId: ensureStringField(record, "companyId", "client.setActiveCompany input"),
  };
};

export const parseClientSetActiveCompanyOutput = (value: unknown): ClientSetActiveCompanyOutput => {
  const record = ensureObject(value, "client.setActiveCompany output");
  ensureAllowedKeys(record, ["companyId"], "client.setActiveCompany output");

  return {
    companyId: ensureStringField(record, "companyId", "client.setActiveCompany output"),
  };
};

export const parseQuestionnaireListAssignedInput = (
  value: unknown,
): QuestionnaireListAssignedInput => {
  const record = ensureObject(value, "questionnaire.listAssigned input");
  ensureAllowedKeys(record, ["campaignId", "status"], "questionnaire.listAssigned input");

  const status = record.status;
  if (status !== undefined) {
    if (typeof status !== "string" || !isQuestionnaireStatus(status)) {
      throw new Error(
        `questionnaire.listAssigned input.status must be one of: ${questionnaireStatuses.join(", ")}`,
      );
    }
  }

  return {
    campaignId: ensureStringField(record, "campaignId", "questionnaire.listAssigned input"),
    ...(status ? { status } : {}),
  };
};

const parseQuestionnaireListAssignedItem = (value: unknown): QuestionnaireListAssignedItem => {
  const record = ensureObject(value, "questionnaire.listAssigned output.items[]");
  ensureAllowedKeys(
    record,
    [
      "questionnaireId",
      "campaignId",
      "companyId",
      "subjectEmployeeId",
      "raterEmployeeId",
      "status",
      "submittedAt",
    ],
    "questionnaire.listAssigned output.items[]",
  );

  const status = record.status;
  if (typeof status !== "string" || !isQuestionnaireStatus(status)) {
    throw new Error(
      `questionnaire.listAssigned output.items[].status must be one of: ${questionnaireStatuses.join(", ")}`,
    );
  }

  const submittedAt = record.submittedAt;
  if (submittedAt !== undefined && submittedAt !== null && typeof submittedAt !== "string") {
    throw new Error("questionnaire.listAssigned output.items[].submittedAt must be a string.");
  }

  return {
    questionnaireId: ensureStringField(
      record,
      "questionnaireId",
      "questionnaire.listAssigned output.items[]",
    ),
    campaignId: ensureStringField(
      record,
      "campaignId",
      "questionnaire.listAssigned output.items[]",
    ),
    companyId: ensureStringField(record, "companyId", "questionnaire.listAssigned output.items[]"),
    subjectEmployeeId: ensureStringField(
      record,
      "subjectEmployeeId",
      "questionnaire.listAssigned output.items[]",
    ),
    raterEmployeeId: ensureStringField(
      record,
      "raterEmployeeId",
      "questionnaire.listAssigned output.items[]",
    ),
    status,
    ...(typeof submittedAt === "string" ? { submittedAt } : {}),
  };
};

export const parseQuestionnaireListAssignedOutput = (
  value: unknown,
): QuestionnaireListAssignedOutput => {
  const record = ensureObject(value, "questionnaire.listAssigned output");
  ensureAllowedKeys(record, ["items"], "questionnaire.listAssigned output");

  const items = ensureArray(record.items, "questionnaire.listAssigned output.items").map(
    parseQuestionnaireListAssignedItem,
  );

  return {
    items,
  };
};

export const parseQuestionnaireSaveDraftInput = (value: unknown): QuestionnaireSaveDraftInput => {
  const record = ensureObject(value, "questionnaire.saveDraft input");
  ensureAllowedKeys(record, ["questionnaireId", "draft"], "questionnaire.saveDraft input");

  const draft = record.draft;
  if (!isRecord(draft)) {
    throw new Error("questionnaire.saveDraft input.draft must be an object.");
  }

  return {
    questionnaireId: ensureStringField(record, "questionnaireId", "questionnaire.saveDraft input"),
    draft,
  };
};

export const parseQuestionnaireSaveDraftOutput = (value: unknown): QuestionnaireSaveDraftOutput => {
  const record = ensureObject(value, "questionnaire.saveDraft output");
  ensureAllowedKeys(
    record,
    ["questionnaireId", "status", "campaignLockedAt"],
    "questionnaire.saveDraft output",
  );

  const status = record.status;
  if (status !== "in_progress") {
    throw new Error('questionnaire.saveDraft output.status must be "in_progress".');
  }

  return {
    questionnaireId: ensureStringField(record, "questionnaireId", "questionnaire.saveDraft output"),
    status: "in_progress",
    campaignLockedAt: ensureStringField(
      record,
      "campaignLockedAt",
      "questionnaire.saveDraft output",
    ),
  };
};

export const parseQuestionnaireSubmitInput = (value: unknown): QuestionnaireSubmitInput => {
  const record = ensureObject(value, "questionnaire.submit input");
  ensureAllowedKeys(record, ["questionnaireId"], "questionnaire.submit input");

  return {
    questionnaireId: ensureStringField(record, "questionnaireId", "questionnaire.submit input"),
  };
};

export const parseQuestionnaireSubmitOutput = (value: unknown): QuestionnaireSubmitOutput => {
  const record = ensureObject(value, "questionnaire.submit output");
  ensureAllowedKeys(
    record,
    ["questionnaireId", "status", "submittedAt", "wasAlreadySubmitted"],
    "questionnaire.submit output",
  );

  const status = record.status;
  if (status !== "submitted") {
    throw new Error('questionnaire.submit output.status must be "submitted".');
  }

  const wasAlreadySubmitted = record.wasAlreadySubmitted;
  if (typeof wasAlreadySubmitted !== "boolean") {
    throw new Error("questionnaire.submit output.wasAlreadySubmitted must be a boolean.");
  }

  return {
    questionnaireId: ensureStringField(record, "questionnaireId", "questionnaire.submit output"),
    status: "submitted",
    submittedAt: ensureStringField(record, "submittedAt", "questionnaire.submit output"),
    wasAlreadySubmitted,
  };
};

export const apiContractReady = true;
