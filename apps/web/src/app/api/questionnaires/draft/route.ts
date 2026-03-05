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
      draft: Record<string, unknown>;
      returnTo?: string;
    }
  | OperationError
> => {
  if (isJsonRequest(request)) {
    const body = (await request.json()) as {
      questionnaireId?: unknown;
      draft?: unknown;
      note?: unknown;
      returnTo?: unknown;
    };
    if (typeof body.questionnaireId !== "string" || body.questionnaireId.trim().length === 0) {
      return createOperationError("invalid_input", "questionnaireId is required.");
    }

    const fallbackDraft =
      typeof body.note === "string"
        ? {
            note: body.note,
          }
        : {};
    const draft =
      typeof body.draft === "object" && body.draft !== null && !Array.isArray(body.draft)
        ? (body.draft as Record<string, unknown>)
        : fallbackDraft;

    return {
      questionnaireId: body.questionnaireId.trim(),
      draft,
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

  const note = getFormString(form.get("note")) ?? "";
  const returnTo = getFormString(form.get("returnTo"));

  return {
    questionnaireId,
    draft: {
      note,
    },
    ...(returnTo ? { returnTo } : {}),
  };
};

export async function POST(request: Request) {
  const payload = await parsePayload(request);
  if ("code" in payload) {
    return NextResponse.json(
      {
        ok: false,
        error: payload,
      },
      { status: mapHttpStatus(payload) },
    );
  }

  const resolved = await resolveAppOperationContext();
  if (!resolved.ok) {
    const error = createOperationError(
      resolved.error.code === "unauthenticated" ? "unauthenticated" : "forbidden",
      resolved.error.message,
    );
    if (isJsonRequest(request)) {
      return NextResponse.json(
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

  const client = createInprocClient();
  const result = await client.questionnaireSaveDraft(
    {
      questionnaireId: payload.questionnaireId,
      draft: payload.draft,
    },
    resolved.context,
  );

  if (!result.ok) {
    if (isJsonRequest(request)) {
      return NextResponse.json(
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
    return NextResponse.json({
      ok: true,
      data: result.data,
    });
  }

  const redirectTo = payload.returnTo ?? "/questionnaires";
  return NextResponse.redirect(new URL(withQuery(redirectTo, { saved: "1" }), request.url), {
    status: 303,
  });
}
