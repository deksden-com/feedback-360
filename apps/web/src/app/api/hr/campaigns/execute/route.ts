import {
  captureRequestException,
  createRequestTrace,
  extendRequestTrace,
  jsonWithRequestTrace,
  logError,
  logInfo,
} from "@/lib/observability";
import { type AppOperationContext, resolveAppOperationContext } from "@/lib/operation-context";
import {
  type AiRunForCampaignInput,
  type CampaignCreateInput,
  type CampaignParticipantsAddFromDepartmentsInput,
  type CampaignParticipantsMutationInput,
  type CampaignProgressGetInput,
  type CampaignSnapshotListInput,
  type CampaignTransitionInput,
  type CampaignWeightsSetInput,
  type EmployeeListActiveInput,
  type MatrixGenerateSuggestedInput,
  type MatrixListInput,
  type MatrixSetInput,
  type OperationError,
  createOperationError,
} from "@feedback-360/api-contract";
import { createInprocClient } from "@feedback-360/client";

type HrCampaignAction =
  | "campaign.create"
  | "campaign.start"
  | "campaign.stop"
  | "campaign.end"
  | "campaign.progress.get"
  | "campaign.weights.set"
  | "campaign.participants.add"
  | "campaign.participants.remove"
  | "campaign.participants.addFromDepartments"
  | "campaign.snapshot.list"
  | "matrix.generateSuggested"
  | "matrix.list"
  | "matrix.set"
  | "ai.runForCampaign"
  | "employee.listActive";

type ExecutePayload = {
  action: HrCampaignAction;
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
    case "campaign_started_immutable":
    case "campaign_ended_readonly":
    case "campaign_locked":
    case "invalid_transition":
    case "ai_job_conflict":
      return 409;
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

  const action = body.action.trim() as HrCampaignAction;
  return {
    action,
    input: body.input ?? {},
  };
};

const runAction = async (payload: ExecutePayload, context: AppOperationContext) => {
  if (context.role !== "hr_admin" && context.role !== "hr_reader") {
    return {
      ok: false as const,
      error: createOperationError(
        "forbidden",
        "HR campaign workbench is available only for HR roles.",
      ),
    };
  }

  const client = createInprocClient();
  const input = payload.input;

  switch (payload.action) {
    case "campaign.create":
      return client.campaignCreate(input as CampaignCreateInput, context);
    case "campaign.start":
      return client.campaignStart(input as CampaignTransitionInput, context);
    case "campaign.stop":
      return client.campaignStop(input as CampaignTransitionInput, context);
    case "campaign.end":
      return client.campaignEnd(input as CampaignTransitionInput, context);
    case "campaign.progress.get":
      return client.campaignProgressGet(input as CampaignProgressGetInput, context);
    case "campaign.weights.set":
      return client.campaignWeightsSet(input as CampaignWeightsSetInput, context);
    case "campaign.participants.add":
      return client.campaignParticipantsAdd(input as CampaignParticipantsMutationInput, context);
    case "campaign.participants.remove":
      return client.campaignParticipantsRemove(input as CampaignParticipantsMutationInput, context);
    case "campaign.participants.addFromDepartments":
      return client.campaignParticipantsAddFromDepartments(
        input as CampaignParticipantsAddFromDepartmentsInput,
        context,
      );
    case "campaign.snapshot.list":
      return client.campaignSnapshotList(input as CampaignSnapshotListInput, context);
    case "matrix.generateSuggested":
      return client.matrixGenerateSuggested(input as MatrixGenerateSuggestedInput, context);
    case "matrix.list":
      return client.matrixList(input as MatrixListInput, context);
    case "matrix.set":
      return client.matrixSet(input as MatrixSetInput, context);
    case "ai.runForCampaign":
      return client.aiRunForCampaign(input as AiRunForCampaignInput, context);
    case "employee.listActive":
      return client.employeeListActive(input as EmployeeListActiveInput, context);
    default:
      return {
        ok: false as const,
        error: createOperationError("not_found", `Unsupported action: ${payload.action}`),
      };
  }
};

export async function POST(request: Request) {
  let trace = createRequestTrace(request, {
    route: "/api/hr/campaigns/execute",
  });

  const payload = await parsePayload(request);
  if ("code" in payload) {
    logError(trace, "hr_campaign_execute_parse_failed", payload, {
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
    action: payload.action,
  });

  const resolved = await resolveAppOperationContext();
  if (!resolved.ok) {
    const error = createOperationError(
      resolved.error.code === "unauthenticated" ? "unauthenticated" : "forbidden",
      resolved.error.message,
    );
    logError(trace, "hr_campaign_execute_context_failed", error, {
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

  trace = extendRequestTrace(trace, {
    companyId: resolved.context.companyId,
    role: resolved.context.role,
    userId: resolved.context.userId,
  });

  const result = await runAction(payload, resolved.context);
  if (!result.ok) {
    logError(trace, "hr_campaign_execute_failed", result.error, {
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

  logInfo(trace, "hr_campaign_execute_succeeded");
  return jsonWithRequestTrace(trace, {
    ok: true,
    data: result.data,
  });
}
