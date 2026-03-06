import {
  captureRequestException,
  createRequestTrace,
  extendRequestTrace,
  jsonWithRequestTrace,
  logError,
  logInfo,
} from "@/lib/observability";
import { type AppOperationContext, resolveAppOperationContext } from "@/lib/operation-context";
import { type OperationError, createOperationError } from "@feedback-360/api-contract";
import { createInprocClient } from "@feedback-360/client";

type OpsAction = "ops.health.get" | "ops.aiDiagnostics.list" | "ops.audit.list";

type ExecutePayload = {
  action: OpsAction;
  input: unknown;
};

const mapHttpStatus = (error: OperationError): number => {
  switch (error.code) {
    case "unauthenticated":
      return 401;
    case "forbidden":
      return 403;
    case "not_found":
      return 404;
    default:
      return 400;
  }
};

const parsePayload = async (request: Request): Promise<ExecutePayload | OperationError> => {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return createOperationError("invalid_input", "JSON body is required.");
  }
  const body = (await request.json()) as { action?: unknown; input?: unknown };
  if (typeof body.action !== "string" || body.action.trim().length === 0) {
    return createOperationError("invalid_input", "action is required.");
  }
  return { action: body.action.trim() as OpsAction, input: body.input ?? {} };
};

const runAction = async (payload: ExecutePayload, context: AppOperationContext) => {
  if (context.role !== "hr_admin" && context.role !== "hr_reader") {
    return {
      ok: false as const,
      error: createOperationError("forbidden", "Ops console is available only for HR roles."),
    };
  }

  const client = createInprocClient();
  switch (payload.action) {
    case "ops.health.get":
      return client.opsHealthGet({}, context);
    case "ops.aiDiagnostics.list":
      return client.opsAiDiagnosticsList(payload.input as never, context);
    case "ops.audit.list":
      return client.opsAuditList(payload.input as never, context);
    default:
      return {
        ok: false as const,
        error: createOperationError("not_found", `Unsupported action: ${payload.action}`),
      };
  }
};

export async function POST(request: Request) {
  let trace = createRequestTrace(request, { route: "/api/ops/execute" });
  const payload = await parsePayload(request);
  if ("code" in payload) {
    logError(trace, "ops_execute_parse_failed", payload, { errorCode: payload.code });
    return jsonWithRequestTrace(
      trace,
      { ok: false, error: payload },
      { status: mapHttpStatus(payload) },
    );
  }

  trace = extendRequestTrace(trace, { action: payload.action });
  const resolved = await resolveAppOperationContext();
  if (!resolved.ok) {
    const error = createOperationError(
      resolved.error.code === "unauthenticated" ? "unauthenticated" : "forbidden",
      resolved.error.message,
    );
    logError(trace, "ops_execute_context_failed", error, { errorCode: error.code });
    return jsonWithRequestTrace(trace, { ok: false, error }, { status: mapHttpStatus(error) });
  }

  trace = extendRequestTrace(trace, {
    companyId: resolved.context.companyId,
    role: resolved.context.role,
    userId: resolved.context.userId,
  });

  const result = await runAction(payload, resolved.context);
  if (!result.ok) {
    logError(trace, "ops_execute_failed", result.error, { errorCode: result.error.code });
    if (
      !["invalid_input", "forbidden", "not_found", "unauthenticated"].includes(result.error.code)
    ) {
      captureRequestException(trace, result.error, { errorCode: result.error.code });
    }
    return jsonWithRequestTrace(
      trace,
      { ok: false, error: result.error },
      { status: mapHttpStatus(result.error) },
    );
  }

  logInfo(trace, "ops_execute_succeeded");
  return jsonWithRequestTrace(trace, { ok: true, data: result.data });
}
