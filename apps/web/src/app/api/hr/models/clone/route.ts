import { NextResponse } from "next/server";

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

const withQuery = (path: string, params: Record<string, string>) => {
  const url = new URL(path, "http://local");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return `${url.pathname}${url.search}`;
};

const getFormString = (value: FormDataEntryValue | null): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const isJsonRequest = (request: Request): boolean => {
  const contentType = request.headers.get("content-type");
  return typeof contentType === "string" && contentType.includes("application/json");
};

export async function POST(request: Request) {
  let trace = createRequestTrace(request, {
    route: "/api/hr/models/clone",
  });

  const jsonMode = isJsonRequest(request);
  const sourcePayload = jsonMode
    ? ((await request.json().catch(() => null)) as {
        sourceModelVersionId?: unknown;
        returnTo?: unknown;
        name?: unknown;
      } | null)
    : null;
  const form = jsonMode ? null : await request.formData();
  const sourceModelVersionId = jsonMode
    ? typeof sourcePayload?.sourceModelVersionId === "string"
      ? sourcePayload.sourceModelVersionId.trim()
      : undefined
    : getFormString(form?.get("sourceModelVersionId") ?? null);
  const returnTo = jsonMode
    ? typeof sourcePayload?.returnTo === "string" && sourcePayload.returnTo.trim().length > 0
      ? sourcePayload.returnTo.trim()
      : "/hr/models"
    : (getFormString(form?.get("returnTo") ?? null) ?? "/hr/models");
  const name = jsonMode
    ? typeof sourcePayload?.name === "string" && sourcePayload.name.trim().length > 0
      ? sourcePayload.name.trim()
      : undefined
    : getFormString(form?.get("name") ?? null);

  if (!sourceModelVersionId) {
    const error = createOperationError("invalid_input", "sourceModelVersionId is required.");
    if (jsonMode) {
      return jsonWithRequestTrace(trace, { ok: false, error }, { status: mapHttpStatus(error) });
    }
    return NextResponse.redirect(new URL(withQuery(returnTo, { error: error.code }), request.url), {
      status: 303,
    });
  }

  trace = extendRequestTrace(trace, {
    sourceModelVersionId,
  });

  const resolved = await resolveAppOperationContext();
  if (!resolved.ok) {
    const error = createOperationError(
      resolved.error.code === "unauthenticated" ? "unauthenticated" : "forbidden",
      resolved.error.message,
    );
    logError(trace, "hr_model_clone_context_failed", error, { errorCode: error.code });
    if (jsonMode) {
      return jsonWithRequestTrace(trace, { ok: false, error }, { status: mapHttpStatus(error) });
    }
    return NextResponse.redirect(new URL(withQuery(returnTo, { error: error.code }), request.url), {
      status: 303,
    });
  }

  const client = createInprocClient();
  const result = await client.modelVersionCloneDraft(
    {
      sourceModelVersionId,
      ...(name ? { name } : {}),
    },
    resolved.context,
  );

  if (!result.ok) {
    logError(trace, "hr_model_clone_failed", result.error, { errorCode: result.error.code });
    if (!["invalid_input", "forbidden", "not_found"].includes(result.error.code)) {
      captureRequestException(trace, result.error, { errorCode: result.error.code });
    }
    if (jsonMode) {
      return jsonWithRequestTrace(
        trace,
        { ok: false, error: result.error },
        { status: mapHttpStatus(result.error) },
      );
    }
    return NextResponse.redirect(
      new URL(withQuery(returnTo, { error: result.error.code }), request.url),
      { status: 303 },
    );
  }

  logInfo(trace, "hr_model_clone_succeeded", { modelVersionId: result.data.modelVersionId });
  if (jsonMode) {
    return jsonWithRequestTrace(trace, {
      ok: true,
      data: {
        modelVersionId: result.data.modelVersionId,
      },
    });
  }
  return NextResponse.redirect(
    new URL(`/hr/models/${result.data.modelVersionId}?cloned=1`, request.url),
    { status: 303 },
  );
}
