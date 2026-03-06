import {
  captureRequestException,
  createRequestTrace,
  extendRequestTrace,
  jsonWithRequestTrace,
  logError,
  logInfo,
} from "@/lib/observability";
import { resolveAppOperationContext } from "@/lib/operation-context";
import { parseQuestionnaireDraftFromFormData } from "@/lib/questionnaire-form";
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
      draft?: Record<string, unknown>;
      returnTo?: string;
    }
  | OperationError
> => {
  const queryReturnTo = getFormString(new URL(request.url).searchParams.get("returnTo"));
  const parseDraftCandidate = (value: unknown): Record<string, unknown> | undefined => {
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed.length === 0) {
        return undefined;
      }

      try {
        const parsed = JSON.parse(trimmed) as unknown;
        if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
          return parsed as Record<string, unknown>;
        }
      } catch {
        return undefined;
      }
    }

    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }

    return undefined;
  };

  if (isJsonRequest(request)) {
    const body = (await request.json()) as {
      questionnaireId?: unknown;
      draft?: unknown;
      draftJson?: unknown;
      returnTo?: unknown;
    };
    if (typeof body.questionnaireId !== "string" || body.questionnaireId.trim().length === 0) {
      return createOperationError("invalid_input", "questionnaireId is required.");
    }

    return {
      questionnaireId: body.questionnaireId.trim(),
      ...((parseDraftCandidate(body.draft) ?? parseDraftCandidate(body.draftJson))
        ? { draft: parseDraftCandidate(body.draft) ?? parseDraftCandidate(body.draftJson) }
        : {}),
      ...((
        typeof body.returnTo === "string" && body.returnTo.trim().length > 0
          ? body.returnTo.trim()
          : queryReturnTo
      )
        ? {
            returnTo:
              (typeof body.returnTo === "string" && body.returnTo.trim().length > 0
                ? body.returnTo.trim()
                : queryReturnTo) ?? undefined,
          }
        : {}),
    };
  }

  const form = await request.formData();
  const questionnaireId = getFormString(form.get("questionnaireId"));
  if (!questionnaireId) {
    return createOperationError("invalid_input", "questionnaireId is required.");
  }

  const returnTo = getFormString(form.get("returnTo"));
  const draft = parseDraftCandidate(getFormString(form.get("draftJson")));
  const parsedFormDraft = draft ?? parseQuestionnaireDraftFromFormData(form);
  return {
    questionnaireId,
    ...(Object.keys(parsedFormDraft).length > 0 ? { draft: parsedFormDraft } : {}),
    ...((returnTo ?? queryReturnTo) ? { returnTo: returnTo ?? queryReturnTo } : {}),
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
  if (payload.draft) {
    const draftResult = await client.questionnaireSaveDraft(
      {
        questionnaireId: payload.questionnaireId,
        draft: payload.draft,
      },
      resolved.context,
    );

    if (!draftResult.ok) {
      if (isJsonRequest(request)) {
        logError(trace, "questionnaire_submit_draft_failed", draftResult.error, {
          errorCode: draftResult.error.code,
        });
        return jsonWithRequestTrace(
          trace,
          {
            ok: false,
            error: draftResult.error,
          },
          { status: mapHttpStatus(draftResult.error) },
        );
      }

      const redirectTo = payload.returnTo ?? "/questionnaires";
      return NextResponse.redirect(
        new URL(withQuery(redirectTo, { error: draftResult.error.code }), request.url),
        {
          status: 303,
        },
      );
    }
  }

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
