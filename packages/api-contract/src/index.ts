export const seedScenarios = ["S0_empty", "S1_company_min", "S2_org_basic"] as const;

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

export const knownOperations = ["seed.run", "system.ping", "company.updateProfile"] as const;
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

const isSeedScenario = (value: string): value is SeedScenario => {
  return seedScenarios.includes(value as SeedScenario);
};

const isOperationErrorCode = (value: string): value is OperationErrorCode => {
  return operationErrorCodes.includes(value as OperationErrorCode);
};

const isMembershipRole = (value: string): value is MembershipRole => {
  return membershipRoles.includes(value as MembershipRole);
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

export const apiContractReady = true;
