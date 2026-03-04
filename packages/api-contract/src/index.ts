export const seedScenarios = [
  "S0_empty",
  "S1_company_min",
  "S1_multi_tenant_min",
  "S2_org_basic",
  "S5_campaign_started_no_answers",
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
  "employee.upsert",
  "employee.listActive",
  "org.department.move",
  "org.manager.set",
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
