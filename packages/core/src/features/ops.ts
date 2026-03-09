/**
 * Ops feature-area entrypoint.
 * @docs .memory-bank/spec/operations/runbook.md
 * @see .memory-bank/spec/operations/deployment-architecture.md
 */
import {
  type DispatchOperationInput,
  type OperationResult,
  type OpsAiDiagnosticsListInput,
  type OpsAiDiagnosticsListOutput,
  type OpsAuditListInput,
  type OpsAuditListOutput,
  type OpsHealthGetOutput,
  createOperationError,
  errorFromUnknown,
  errorResult,
  okResult,
  parseOpsAiDiagnosticsListInput,
  parseOpsAiDiagnosticsListOutput,
  parseOpsAuditListInput,
  parseOpsAuditListOutput,
  parseOpsHealthGetInput,
  parseOpsHealthGetOutput,
} from "@feedback-360/api-contract";
import * as db from "@feedback-360/db";

import { ensureContextCompany, hasRole } from "../shared/context";

const getDeploymentUrl = (): string | null => {
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  switch (process.env.APP_ENV) {
    case "beta":
      return "https://beta.go360go.ru";
    case "prod":
      return "https://go360go.ru";
    default:
      return null;
  }
};

export const runOpsHealthGet = async (
  request: DispatchOperationInput,
): Promise<OperationResult<OpsHealthGetOutput>> => {
  if (!hasRole(request, ["hr_admin", "hr_reader"])) {
    return errorResult(
      createOperationError("forbidden", "Only HR roles can inspect ops health.", {
        operation: "ops.health.get",
      }),
    );
  }

  try {
    parseOpsHealthGetInput(request.input);
  } catch (error) {
    return errorResult(errorFromUnknown(error, "invalid_input", "Invalid ops.health.get input."));
  }

  const output: OpsHealthGetOutput = {
    appEnv: process.env.APP_ENV ?? "local",
    appVersion: process.env.npm_package_version ?? "0.1.0",
    gitCommitSha: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
    gitBranch: process.env.VERCEL_GIT_COMMIT_REF ?? null,
    deploymentUrl: getDeploymentUrl(),
    checks: [
      {
        key: "web",
        label: "Web app",
        status: "healthy",
        detail: "Next.js приложение отвечает и готово к smoke-проверкам.",
      },
      {
        key: "db",
        label: "Database connectivity",
        status:
          process.env.SUPABASE_DB_POOLER_URL || process.env.DATABASE_URL ? "healthy" : "error",
        detail:
          process.env.SUPABASE_DB_POOLER_URL || process.env.DATABASE_URL
            ? "DB connection string настроен."
            : "DB connection string не настроен.",
      },
      {
        key: "resend",
        label: "Resend",
        status:
          process.env.RESEND_BETA_API_KEY || process.env.RESEND_PROD_API_KEY
            ? "healthy"
            : "warning",
        detail:
          process.env.RESEND_BETA_API_KEY || process.env.RESEND_PROD_API_KEY
            ? "API key для email delivery настроен."
            : "Email provider key не найден.",
      },
      {
        key: "sentry",
        label: "Sentry",
        status: process.env.SENTRY_BETA_DSN || process.env.SENTRY_PROD_DSN ? "healthy" : "warning",
        detail:
          process.env.SENTRY_BETA_DSN || process.env.SENTRY_PROD_DSN
            ? "DSN настроен, ошибки можно коррелировать по request id."
            : "DSN не задан, runtime ошибки не будут отправляться в Sentry.",
      },
      {
        key: "ai-webhook",
        label: "AI webhook security",
        status: process.env.AI_WEBHOOK_SECRET ? "healthy" : "warning",
        detail: process.env.AI_WEBHOOK_SECRET
          ? "Webhook secret настроен."
          : "AI webhook secret не задан.",
      },
    ],
  };

  return okResult(parseOpsHealthGetOutput(output));
};

export const runOpsAiDiagnosticsList = async (
  request: DispatchOperationInput,
): Promise<OperationResult<OpsAiDiagnosticsListOutput>> => {
  if (!hasRole(request, ["hr_admin", "hr_reader"])) {
    return errorResult(
      createOperationError("forbidden", "Only HR roles can inspect AI diagnostics.", {
        operation: "ops.aiDiagnostics.list",
      }),
    );
  }

  const companyIdOrError = ensureContextCompany(request);
  if (typeof companyIdOrError !== "string") {
    return companyIdOrError;
  }

  let parsedInput: OpsAiDiagnosticsListInput;
  try {
    parsedInput = parseOpsAiDiagnosticsListInput(request.input);
  } catch (error) {
    return errorResult(
      errorFromUnknown(error, "invalid_input", "Invalid ops.aiDiagnostics.list input."),
    );
  }

  try {
    if (typeof db.listAiDiagnostics !== "function") {
      throw createOperationError("invalid_input", "AI diagnostics adapter is unavailable.");
    }

    const output = await db.listAiDiagnostics({
      companyId: companyIdOrError,
      campaignId: parsedInput.campaignId,
      status: parsedInput.status,
    });
    return okResult(
      parseOpsAiDiagnosticsListOutput({
        items: output.items.map((item) => ({
          ...item,
          requestedAt: item.requestedAt.toISOString(),
          completedAt: item.completedAt?.toISOString() ?? null,
          receipt: item.receipt
            ? {
                ...item.receipt,
                receivedAt: item.receipt.receivedAt.toISOString(),
                lastReceivedAt: item.receipt.lastReceivedAt.toISOString(),
              }
            : null,
        })),
      }),
    );
  } catch (error) {
    return errorResult(errorFromUnknown(error, "invalid_input", "Failed to load AI diagnostics."));
  }
};

export const runOpsAuditList = async (
  request: DispatchOperationInput,
): Promise<OperationResult<OpsAuditListOutput>> => {
  if (!hasRole(request, ["hr_admin", "hr_reader"])) {
    return errorResult(
      createOperationError("forbidden", "Only HR roles can inspect audit events.", {
        operation: "ops.audit.list",
      }),
    );
  }

  const companyIdOrError = ensureContextCompany(request);
  if (typeof companyIdOrError !== "string") {
    return companyIdOrError;
  }

  let parsedInput: OpsAuditListInput;
  try {
    parsedInput = parseOpsAuditListInput(request.input);
  } catch (error) {
    return errorResult(errorFromUnknown(error, "invalid_input", "Invalid ops.audit.list input."));
  }

  try {
    if (typeof db.listAuditEvents !== "function") {
      throw createOperationError("invalid_input", "Audit diagnostics adapter is unavailable.");
    }

    const output = await db.listAuditEvents({
      companyId: companyIdOrError,
      campaignId: parsedInput.campaignId,
      actorUserId: parsedInput.actorUserId,
      eventType: parsedInput.eventType,
      source: parsedInput.source,
      limit: parsedInput.limit,
    });
    const redact = request.context?.role === "hr_reader";
    return okResult(
      parseOpsAuditListOutput({
        items: output.items.map((item) => ({
          ...item,
          actorUserId: redact ? null : item.actorUserId,
          metadataJson: redact && item.source !== "release" ? {} : item.metadataJson,
          createdAt: item.createdAt.toISOString(),
        })),
      }),
    );
  } catch (error) {
    return errorResult(errorFromUnknown(error, "invalid_input", "Failed to load audit events."));
  }
};
