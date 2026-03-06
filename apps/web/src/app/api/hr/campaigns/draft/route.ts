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
    case "campaign_started_immutable":
    case "campaign_locked":
    case "invalid_transition":
      return 409;
    default:
      return 400;
  }
};

const withQuery = (basePath: string, params: Record<string, string>): string => {
  const url = new URL(basePath, "http://local");
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

const getFormNumber = (value: FormDataEntryValue | null, fieldName: string): number => {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw createOperationError("invalid_input", `${fieldName} is required.`);
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw createOperationError("invalid_input", `${fieldName} must be a finite number.`);
  }

  return parsed;
};

const normalizeDateTimeLocalToIso = (value: string, fieldName: string): string => {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    throw createOperationError("invalid_input", `${fieldName} is required.`);
  }

  const normalized = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(trimmed)
    ? `${trimmed}:00.000Z`
    : trimmed;
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    throw createOperationError("invalid_input", `${fieldName} must be a valid datetime.`);
  }

  return parsed.toISOString();
};

type DraftPayload = {
  campaignId?: string;
  name: string;
  modelVersionId: string;
  startAt: string;
  endAt: string;
  timezone?: string;
  managerWeight: number;
  peersWeight: number;
  subordinatesWeight: number;
  returnTo?: string;
};

const parsePayload = async (request: Request): Promise<DraftPayload | OperationError> => {
  try {
    if (isJsonRequest(request)) {
      const body = (await request.json()) as Record<string, unknown>;
      const campaignId =
        typeof body.campaignId === "string" && body.campaignId.trim().length > 0
          ? body.campaignId.trim()
          : undefined;
      const timezone =
        typeof body.timezone === "string" && body.timezone.trim().length > 0
          ? body.timezone.trim()
          : undefined;
      const returnTo =
        typeof body.returnTo === "string" && body.returnTo.trim().length > 0
          ? body.returnTo.trim()
          : undefined;

      return {
        ...(campaignId ? { campaignId } : {}),
        name: typeof body.name === "string" ? body.name : "",
        modelVersionId: typeof body.modelVersionId === "string" ? body.modelVersionId : "",
        startAt: normalizeDateTimeLocalToIso(String(body.startAt ?? ""), "startAt"),
        endAt: normalizeDateTimeLocalToIso(String(body.endAt ?? ""), "endAt"),
        ...(timezone ? { timezone } : {}),
        managerWeight: Number(body.managerWeight),
        peersWeight: Number(body.peersWeight),
        subordinatesWeight: Number(body.subordinatesWeight),
        ...(returnTo ? { returnTo } : {}),
      };
    }

    const form = await request.formData();
    const campaignId = getFormString(form.get("campaignId"));
    const returnTo = getFormString(form.get("returnTo"));
    const timezone = getFormString(form.get("timezone"));

    return {
      ...(campaignId ? { campaignId } : {}),
      name: getFormString(form.get("name")) ?? "",
      modelVersionId: getFormString(form.get("modelVersionId")) ?? "",
      startAt: normalizeDateTimeLocalToIso(getFormString(form.get("startAt")) ?? "", "startAt"),
      endAt: normalizeDateTimeLocalToIso(getFormString(form.get("endAt")) ?? "", "endAt"),
      ...(timezone ? { timezone } : {}),
      managerWeight: getFormNumber(form.get("managerWeight"), "managerWeight"),
      peersWeight: getFormNumber(form.get("peersWeight"), "peersWeight"),
      subordinatesWeight: getFormNumber(form.get("subordinatesWeight"), "subordinatesWeight"),
      ...(returnTo ? { returnTo } : {}),
    };
  } catch (error) {
    return errorFromUnknownDraft(error);
  }
};

const errorFromUnknownDraft = (error: unknown): OperationError => {
  if (typeof error === "object" && error && "code" in error && "message" in error) {
    return error as OperationError;
  }

  if (error instanceof Error) {
    return createOperationError("invalid_input", error.message);
  }

  return createOperationError("invalid_input", "Invalid draft payload.");
};

export async function POST(request: Request) {
  let trace = createRequestTrace(request, {
    route: "/api/hr/campaigns/draft",
  });

  const payload = await parsePayload(request);
  if ("code" in payload) {
    logError(trace, "hr_campaign_draft_parse_failed", payload, {
      errorCode: payload.code,
    });

    if (!isJsonRequest(request)) {
      const fallbackTarget = request.headers.get("referer") ?? "/hr/campaigns/new";
      return NextResponse.redirect(
        new URL(withQuery(fallbackTarget, { error: payload.code }), request.url),
        {
          status: 303,
        },
      );
    }

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
    campaignId: payload.campaignId ?? "new",
  });

  const resolved = await resolveAppOperationContext();
  if (!resolved.ok) {
    const error = createOperationError(
      resolved.error.code === "unauthenticated" ? "unauthenticated" : "forbidden",
      resolved.error.message,
    );

    if (isJsonRequest(request)) {
      logError(trace, "hr_campaign_draft_context_failed", error, {
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

    const redirectTo = payload.returnTo ?? "/hr/campaigns";
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
  const draftResult = payload.campaignId
    ? await client.campaignUpdateDraft(
        {
          campaignId: payload.campaignId,
          name: payload.name,
          modelVersionId: payload.modelVersionId,
          startAt: payload.startAt,
          endAt: payload.endAt,
          ...(payload.timezone ? { timezone: payload.timezone } : {}),
        },
        resolved.context,
      )
    : await client.campaignCreate(
        {
          name: payload.name,
          modelVersionId: payload.modelVersionId,
          startAt: payload.startAt,
          endAt: payload.endAt,
          ...(payload.timezone ? { timezone: payload.timezone } : {}),
        },
        resolved.context,
      );

  if (!draftResult.ok) {
    if (isJsonRequest(request)) {
      logError(trace, "hr_campaign_draft_save_failed", draftResult.error, {
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

    const redirectTo = payload.returnTo ?? "/hr/campaigns";
    return NextResponse.redirect(
      new URL(withQuery(redirectTo, { error: draftResult.error.code }), request.url),
      {
        status: 303,
      },
    );
  }

  const weightsResult = await client.campaignWeightsSet(
    {
      campaignId: draftResult.data.campaignId,
      manager: payload.managerWeight,
      peers: payload.peersWeight,
      subordinates: payload.subordinatesWeight,
    },
    resolved.context,
  );

  if (!weightsResult.ok) {
    logError(trace, "hr_campaign_draft_weights_failed", weightsResult.error, {
      errorCode: weightsResult.error.code,
    });

    if (
      !["invalid_input", "forbidden", "not_found", "unauthenticated"].includes(
        weightsResult.error.code,
      )
    ) {
      captureRequestException(trace, weightsResult.error, {
        errorCode: weightsResult.error.code,
      });
    }

    if (isJsonRequest(request)) {
      return jsonWithRequestTrace(
        trace,
        {
          ok: false,
          error: weightsResult.error,
        },
        { status: mapHttpStatus(weightsResult.error) },
      );
    }

    const redirectTo = payload.returnTo ?? `/hr/campaigns/${draftResult.data.campaignId}/edit`;
    return NextResponse.redirect(
      new URL(withQuery(redirectTo, { error: weightsResult.error.code }), request.url),
      {
        status: 303,
      },
    );
  }

  logInfo(trace, "hr_campaign_draft_saved", {
    savedCampaignId: draftResult.data.campaignId,
  });

  if (isJsonRequest(request)) {
    return jsonWithRequestTrace(trace, {
      ok: true,
      data: {
        campaignId: draftResult.data.campaignId,
        draft: draftResult.data,
        weights: weightsResult.data,
      },
    });
  }

  const redirectTo = payload.campaignId
    ? `/hr/campaigns/${draftResult.data.campaignId}?saved=1`
    : `/hr/campaigns/${draftResult.data.campaignId}?created=1`;
  return NextResponse.redirect(new URL(redirectTo, request.url), {
    status: 303,
  });
}
