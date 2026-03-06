import {
  captureRequestException,
  createRequestTrace,
  extendRequestTrace,
  jsonWithRequestTrace,
  logError,
  logInfo,
} from "@/lib/observability";
import { resolveAppOperationContext } from "@/lib/operation-context";
import { type OperationError, createOperationError } from "@feedback-360/api-contract";
import { createInprocClient } from "@feedback-360/client";

const mapHttpStatus = (error: OperationError): number => {
  switch (error.code) {
    case "unauthenticated":
      return 401;
    case "forbidden":
      return 403;
    case "not_found":
      return 404;
    case "invalid_transition":
      return 409;
    default:
      return 400;
  }
};

const toOperationError = (error: unknown): OperationError => {
  if (typeof error === "object" && error && "code" in error && "message" in error) {
    return error as OperationError;
  }

  if (error instanceof Error) {
    return createOperationError("invalid_input", error.message);
  }

  return createOperationError("invalid_input", "Invalid model draft payload.");
};

const isOperationError = (value: unknown): value is OperationError => {
  return (
    typeof value === "object" &&
    value !== null &&
    "code" in value &&
    "message" in value &&
    typeof (value as { code?: unknown }).code === "string" &&
    typeof (value as { message?: unknown }).message === "string"
  );
};

export async function POST(request: Request) {
  let trace = createRequestTrace(request, {
    route: "/api/hr/models/draft",
  });

  const parsedBody = (await request.json().catch((error: unknown) => toOperationError(error))) as
    | Record<string, unknown>
    | OperationError;
  if (isOperationError(parsedBody)) {
    logError(trace, "hr_model_draft_parse_failed", parsedBody, {
      errorCode: parsedBody.code,
    });
    return jsonWithRequestTrace(
      trace,
      { ok: false, error: parsedBody },
      { status: mapHttpStatus(parsedBody) },
    );
  }
  const body = parsedBody;

  trace = extendRequestTrace(trace, {
    modelVersionId: typeof body.modelVersionId === "string" ? body.modelVersionId : "new",
  });

  const resolved = await resolveAppOperationContext();
  if (!resolved.ok) {
    const error = createOperationError(
      resolved.error.code === "unauthenticated" ? "unauthenticated" : "forbidden",
      resolved.error.message,
    );
    logError(trace, "hr_model_draft_context_failed", error, { errorCode: error.code });
    return jsonWithRequestTrace(trace, { ok: false, error }, { status: mapHttpStatus(error) });
  }

  trace = extendRequestTrace(trace, {
    companyId: resolved.context.companyId,
    role: resolved.context.role,
    userId: resolved.context.userId,
  });

  const client = createInprocClient();
  const result = await client.modelVersionUpsertDraft(
    {
      ...(typeof body.modelVersionId === "string" && body.modelVersionId.trim().length > 0
        ? { modelVersionId: body.modelVersionId }
        : {}),
      name: typeof body.name === "string" ? body.name : "",
      kind: body.kind === "levels" ? "levels" : "indicators",
      groups: Array.isArray(body.groups) ? body.groups : [],
    },
    resolved.context,
  );

  if (!result.ok) {
    logError(trace, "hr_model_draft_save_failed", result.error, { errorCode: result.error.code });
    if (!["invalid_input", "forbidden", "not_found"].includes(result.error.code)) {
      captureRequestException(trace, result.error, { errorCode: result.error.code });
    }
    return jsonWithRequestTrace(
      trace,
      { ok: false, error: result.error },
      { status: mapHttpStatus(result.error) },
    );
  }

  logInfo(trace, "hr_model_draft_save_succeeded", {
    savedModelVersionId: result.data.modelVersionId,
  });
  return jsonWithRequestTrace(trace, {
    ok: true,
    data: {
      modelVersionId: result.data.modelVersionId,
    },
  });
}
