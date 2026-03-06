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

export async function POST(request: Request) {
  let trace = createRequestTrace(request, {
    route: "/api/hr/models/publish",
  });

  const body = (await request.json().catch(() => null)) as { modelVersionId?: unknown } | null;
  const modelVersionId = typeof body?.modelVersionId === "string" ? body.modelVersionId.trim() : "";
  if (!modelVersionId) {
    const error = createOperationError("invalid_input", "modelVersionId is required.");
    return jsonWithRequestTrace(trace, { ok: false, error }, { status: mapHttpStatus(error) });
  }

  trace = extendRequestTrace(trace, { modelVersionId });

  const resolved = await resolveAppOperationContext();
  if (!resolved.ok) {
    const error = createOperationError(
      resolved.error.code === "unauthenticated" ? "unauthenticated" : "forbidden",
      resolved.error.message,
    );
    logError(trace, "hr_model_publish_context_failed", error, { errorCode: error.code });
    return jsonWithRequestTrace(trace, { ok: false, error }, { status: mapHttpStatus(error) });
  }

  const client = createInprocClient();
  const result = await client.modelVersionPublish({ modelVersionId }, resolved.context);
  if (!result.ok) {
    logError(trace, "hr_model_publish_failed", result.error, { errorCode: result.error.code });
    if (!["invalid_input", "forbidden", "not_found"].includes(result.error.code)) {
      captureRequestException(trace, result.error, { errorCode: result.error.code });
    }
    return jsonWithRequestTrace(
      trace,
      { ok: false, error: result.error },
      { status: mapHttpStatus(result.error) },
    );
  }

  logInfo(trace, "hr_model_publish_succeeded", { modelVersionId });
  return jsonWithRequestTrace(trace, {
    ok: true,
    data: {
      modelVersionId,
    },
  });
}
