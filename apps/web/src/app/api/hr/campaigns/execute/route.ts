import { resolveAppOperationContext } from "@/lib/operation-context";
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
  type MatrixSetInput,
  type OperationError,
  createOperationError,
} from "@feedback-360/api-contract";
import { createInprocClient } from "@feedback-360/client";
import { NextResponse } from "next/server";

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

const runAction = async (payload: ExecutePayload) => {
  const resolved = await resolveAppOperationContext();
  if (!resolved.ok) {
    return {
      ok: false as const,
      error: createOperationError(
        resolved.error.code === "unauthenticated" ? "unauthenticated" : "forbidden",
        resolved.error.message,
      ),
    };
  }

  if (resolved.context.role !== "hr_admin" && resolved.context.role !== "hr_reader") {
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
      return client.campaignCreate(input as CampaignCreateInput, resolved.context);
    case "campaign.start":
      return client.campaignStart(input as CampaignTransitionInput, resolved.context);
    case "campaign.stop":
      return client.campaignStop(input as CampaignTransitionInput, resolved.context);
    case "campaign.end":
      return client.campaignEnd(input as CampaignTransitionInput, resolved.context);
    case "campaign.progress.get":
      return client.campaignProgressGet(input as CampaignProgressGetInput, resolved.context);
    case "campaign.weights.set":
      return client.campaignWeightsSet(input as CampaignWeightsSetInput, resolved.context);
    case "campaign.participants.add":
      return client.campaignParticipantsAdd(
        input as CampaignParticipantsMutationInput,
        resolved.context,
      );
    case "campaign.participants.remove":
      return client.campaignParticipantsRemove(
        input as CampaignParticipantsMutationInput,
        resolved.context,
      );
    case "campaign.participants.addFromDepartments":
      return client.campaignParticipantsAddFromDepartments(
        input as CampaignParticipantsAddFromDepartmentsInput,
        resolved.context,
      );
    case "campaign.snapshot.list":
      return client.campaignSnapshotList(input as CampaignSnapshotListInput, resolved.context);
    case "matrix.generateSuggested":
      return client.matrixGenerateSuggested(
        input as MatrixGenerateSuggestedInput,
        resolved.context,
      );
    case "matrix.set":
      return client.matrixSet(input as MatrixSetInput, resolved.context);
    case "ai.runForCampaign":
      return client.aiRunForCampaign(input as AiRunForCampaignInput, resolved.context);
    case "employee.listActive":
      return client.employeeListActive(input as EmployeeListActiveInput, resolved.context);
    default:
      return {
        ok: false as const,
        error: createOperationError("not_found", `Unsupported action: ${payload.action}`),
      };
  }
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

  const result = await runAction(payload);
  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: result.error,
      },
      { status: mapHttpStatus(result.error) },
    );
  }

  return NextResponse.json({
    ok: true,
    data: result.data,
  });
}
