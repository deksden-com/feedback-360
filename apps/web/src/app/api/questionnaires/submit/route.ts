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
import { NextResponse } from "next/server";

const isJsonRequest = (request: Request): boolean => {
  return (request.headers.get("content-type") ?? "").includes("application/json");
};

const mapHttpStatus = (error: OperationError): number => {
  switch (error.code) {
    case "unauthenticated":
      return 401;
    case "forbidden":
      return 403;
    case "not_found":
      return 404;
    case "campaign_ended_readonly":
    case "campaign_locked":
    case "invalid_transition":
      return 409;
    default:
      return 400;
  }
};

const getFormString = (value: FormDataEntryValue | null): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const withQuery = (basePath: string, params: Record<string, string>): string => {
  const url = new URL(basePath, "http://local");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return `${url.pathname}${url.search}`;
};

const parsePayload = async (
  request: Request,
): Promise<
  | {
      questionnaireId: string;
      returnTo?: string;
    }
  | OperationError
> => {
  if (isJsonRequest(request)) {
    const body = (await request.json()) as { questionnaireId?: unknown; returnTo?: unknown };
    if (typeof body.questionnaireId !== "string" || body.questionnaireId.trim().length === 0) {
      return createOperationError("invalid_input", "questionnaireId is required.");
    }

    return {
      questionnaireId: body.questionnaireId.trim(),
      ...(typeof body.returnTo === "string" && body.returnTo.trim().length > 0
        ? { returnTo: body.returnTo.trim() }
        : {}),
    };
  }

  const form = await request.formData();
  const questionnaireId = getFormString(form.get("questionnaireId"));
  if (!questionnaireId) {
    return createOperationError("invalid_input", "questionnaireId is required.");
  }

  const returnTo = getFormString(form.get("returnTo"));
  return {
    questionnaireId,
    ...(returnTo ? { returnTo } : {}),
  };
};

export async function POST(request: Request) {
  let trace = createRequestTrace(request, {
    route: "/api/questionnaires/submit",
  });

  const payload = await parsePayload(request);
  if ("code" in payload) {
    logError(trace, "questionnaire_submit_parse_failed", payload, {
      errorCode: payload.code,
    });
    return jsonWithRequestTrace(
      trace,
      {
        ok: false,
        error: payload,
      },
      { status: mapHttpStatus(payload) },
    );
  }

  trace = extendRequestTrace(trace, {
    questionnaireId: payload.questionnaireId,
  });

  const resolved = await resolveAppOperationContext();
  if (!resolved.ok) {
    const error = createOperationError(
      resolved.error.code === "unauthenticated" ? "unauthenticated" : "forbidden",
      resolved.error.message,
    );
    if (isJsonRequest(request)) {
      logError(trace, "questionnaire_submit_context_failed", error, {
        errorCode: error.code,
      });
      return jsonWithRequestTrace(
        trace,
        {
          ok: false,
          error,
        },
        { status: mapHttpStatus(error) },
      );
    }

    const redirectTo = payload.returnTo ?? "/questionnaires";
    return NextResponse.redirect(
      new URL(withQuery(redirectTo, { error: error.code }), request.url),
      {
        status: 303,
      },
    );
  }

  trace = extendRequestTrace(trace, {
    companyId: resolved.context.companyId,
    role: resolved.context.role,
    userId: resolved.context.userId,
  });

  const client = createInprocClient();
  const result = await client.questionnaireSubmit(
    {
      questionnaireId: payload.questionnaireId,
    },
    resolved.context,
  );

  if (!result.ok) {
    if (isJsonRequest(request)) {
      logError(trace, "questionnaire_submit_failed", result.error, {
        errorCode: result.error.code,
      });
      if (
        !["invalid_input", "forbidden", "not_found", "unauthenticated"].includes(result.error.code)
      ) {
        captureRequestException(trace, result.error, {
          errorCode: result.error.code,
        });
      }
      return jsonWithRequestTrace(
        trace,
        {
          ok: false,
          error: result.error,
        },
        { status: mapHttpStatus(result.error) },
      );
    }

    const redirectTo = payload.returnTo ?? "/questionnaires";
    return NextResponse.redirect(
      new URL(withQuery(redirectTo, { error: result.error.code }), request.url),
      {
        status: 303,
      },
    );
  }

  if (isJsonRequest(request)) {
    logInfo(trace, "questionnaire_submitted");
    return jsonWithRequestTrace(trace, {
      ok: true,
      data: result.data,
    });
  }

  const redirectTo = payload.returnTo ?? "/questionnaires";
  return NextResponse.redirect(new URL(withQuery(redirectTo, { submitted: "1" }), request.url), {
    status: 303,
  });
}
