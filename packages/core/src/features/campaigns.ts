/**
 * Campaigns feature-area entrypoint.
 * @docs .memory-bank/spec/domain/campaign-lifecycle.md
 * @see .memory-bank/spec/domain/assignments-and-matrix.md
 */
import {
  type CampaignCreateInput,
  type CampaignCreateOutput,
  type CampaignGetInput,
  type CampaignGetOutput,
  type CampaignListInput,
  type CampaignListOutput,
  type CampaignParticipantsMutationInput,
  type CampaignParticipantsMutationOutput,
  type CampaignProgressGetInput,
  type CampaignProgressGetOutput,
  type CampaignSetModelVersionInput,
  type CampaignSetModelVersionOutput,
  type CampaignSnapshotListInput,
  type CampaignSnapshotListOutput,
  type CampaignTransitionInput,
  type CampaignTransitionOutput,
  type CampaignUpdateDraftInput,
  type CampaignUpdateDraftOutput,
  type CampaignWeightsSetInput,
  type CampaignWeightsSetOutput,
  type DispatchOperationInput,
  type OperationResult,
  createOperationError,
  errorFromUnknown,
  errorResult,
  okResult,
  parseCampaignCreateInput,
  parseCampaignCreateOutput,
  parseCampaignGetInput,
  parseCampaignGetOutput,
  parseCampaignListInput,
  parseCampaignListOutput,
  parseCampaignParticipantsMutationInput,
  parseCampaignParticipantsMutationOutput,
  parseCampaignProgressGetInput,
  parseCampaignProgressGetOutput,
  parseCampaignSetModelVersionInput,
  parseCampaignSetModelVersionOutput,
  parseCampaignSnapshotListInput,
  parseCampaignSnapshotListOutput,
  parseCampaignTransitionInput,
  parseCampaignTransitionOutput,
  parseCampaignUpdateDraftInput,
  parseCampaignUpdateDraftOutput,
  parseCampaignWeightsSetInput,
  parseCampaignWeightsSetOutput,
} from "@feedback-360/api-contract";
import {
  addCampaignParticipants,
  createCampaign,
  endCampaign,
  getCampaign,
  getCampaignProgress,
  listCampaignEmployeeSnapshots,
  listCampaigns,
  removeCampaignParticipants,
  setCampaignModelVersion,
  setCampaignWeights,
  startCampaign,
  stopCampaign,
  updateCampaignDraft,
} from "@feedback-360/db";

import { recordAuditEvent } from "../shared/audit";
import { ensureContextCompany, hasRole } from "../shared/context";

export const runCampaignList = async (
  request: DispatchOperationInput,
): Promise<OperationResult<CampaignListOutput>> => {
  if (!hasRole(request, ["hr_admin", "hr_reader"])) {
    return errorResult(
      createOperationError("forbidden", "Current role cannot list campaigns.", {
        operation: "campaign.list",
      }),
    );
  }

  const companyIdOrError = ensureContextCompany(request);
  if (typeof companyIdOrError !== "string") {
    return companyIdOrError;
  }

  let parsedInput: CampaignListInput;
  try {
    parsedInput = parseCampaignListInput(request.input);
  } catch (error) {
    return errorResult(errorFromUnknown(error, "invalid_input", "Invalid campaign.list input."));
  }

  try {
    const output = await listCampaigns({
      companyId: companyIdOrError,
      status: parsedInput.status,
    });
    return okResult(parseCampaignListOutput(output));
  } catch (error) {
    return errorResult(errorFromUnknown(error, "invalid_input", "Failed to list campaigns."));
  }
};

export const runCampaignGet = async (
  request: DispatchOperationInput,
): Promise<OperationResult<CampaignGetOutput>> => {
  if (!hasRole(request, ["hr_admin", "hr_reader"])) {
    return errorResult(
      createOperationError("forbidden", "Current role cannot read campaign details.", {
        operation: "campaign.get",
      }),
    );
  }

  const companyIdOrError = ensureContextCompany(request);
  if (typeof companyIdOrError !== "string") {
    return companyIdOrError;
  }

  let parsedInput: CampaignGetInput;
  try {
    parsedInput = parseCampaignGetInput(request.input);
  } catch (error) {
    return errorResult(errorFromUnknown(error, "invalid_input", "Invalid campaign.get input."));
  }

  try {
    const output = await getCampaign({
      companyId: companyIdOrError,
      campaignId: parsedInput.campaignId,
    });
    return okResult(parseCampaignGetOutput(output));
  } catch (error) {
    return errorResult(errorFromUnknown(error, "invalid_input", "Failed to load campaign."));
  }
};

export const runCampaignCreate = async (
  request: DispatchOperationInput,
): Promise<OperationResult<CampaignCreateOutput>> => {
  if (!hasRole(request, ["hr_admin"])) {
    return errorResult(
      createOperationError("forbidden", "Only HR Admin can create campaigns.", {
        operation: "campaign.create",
      }),
    );
  }

  const companyIdOrError = ensureContextCompany(request);
  if (typeof companyIdOrError !== "string") {
    return companyIdOrError;
  }

  let parsedInput: CampaignCreateInput;
  try {
    parsedInput = parseCampaignCreateInput(request.input);
  } catch (error) {
    return errorResult(errorFromUnknown(error, "invalid_input", "Invalid campaign.create input."));
  }

  try {
    const output = await createCampaign({
      companyId: companyIdOrError,
      ...parsedInput,
    });
    return okResult(parseCampaignCreateOutput(output));
  } catch (error) {
    return errorResult(errorFromUnknown(error, "invalid_input", "Failed to create campaign."));
  }
};

export const runCampaignUpdateDraft = async (
  request: DispatchOperationInput,
): Promise<OperationResult<CampaignUpdateDraftOutput>> => {
  if (!hasRole(request, ["hr_admin"])) {
    return errorResult(
      createOperationError("forbidden", "Only HR Admin can update campaign drafts.", {
        operation: "campaign.updateDraft",
      }),
    );
  }

  const companyIdOrError = ensureContextCompany(request);
  if (typeof companyIdOrError !== "string") {
    return companyIdOrError;
  }

  let parsedInput: CampaignUpdateDraftInput;
  try {
    parsedInput = parseCampaignUpdateDraftInput(request.input);
  } catch (error) {
    return errorResult(
      errorFromUnknown(error, "invalid_input", "Invalid campaign.updateDraft input."),
    );
  }

  try {
    const output = await updateCampaignDraft({
      companyId: companyIdOrError,
      ...parsedInput,
    });
    await recordAuditEvent(request, {
      companyId: companyIdOrError,
      campaignId: output.campaignId,
      eventType: "campaign.draft_updated",
      objectType: "campaign",
      objectId: output.campaignId,
      summary: `Обновлён draft кампании ${output.name}.`,
      metadataJson: {
        startAt: output.startAt,
        endAt: output.endAt,
        timezone: output.timezone,
      },
    });
    return okResult(parseCampaignUpdateDraftOutput(output));
  } catch (error) {
    return errorResult(
      errorFromUnknown(error, "invalid_input", "Failed to update campaign draft."),
    );
  }
};

const runCampaignTransition = async (
  request: DispatchOperationInput,
  operation: "campaign.start" | "campaign.stop" | "campaign.end",
  execute: (params: {
    companyId: string;
    campaignId: string;
  }) => Promise<CampaignTransitionOutput>,
): Promise<OperationResult<CampaignTransitionOutput>> => {
  if (!hasRole(request, ["hr_admin"])) {
    return errorResult(
      createOperationError("forbidden", "Only HR Admin can manage campaign lifecycle.", {
        operation,
      }),
    );
  }

  const companyIdOrError = ensureContextCompany(request);
  if (typeof companyIdOrError !== "string") {
    return companyIdOrError;
  }

  let parsedInput: CampaignTransitionInput;
  try {
    parsedInput = parseCampaignTransitionInput(request.input);
  } catch (error) {
    return errorResult(errorFromUnknown(error, "invalid_input", `Invalid ${operation} input.`));
  }

  try {
    const output = await execute({
      companyId: companyIdOrError,
      campaignId: parsedInput.campaignId,
    });
    await recordAuditEvent(request, {
      companyId: companyIdOrError,
      campaignId: output.campaignId,
      eventType: `campaign.${operation.split(".")[1]}`,
      objectType: "campaign",
      objectId: output.campaignId,
      summary: `Кампания переведена в состояние ${output.status}.`,
      metadataJson: {
        operation,
        status: output.status,
      },
    });
    return okResult(parseCampaignTransitionOutput(output));
  } catch (error) {
    return errorResult(
      errorFromUnknown(error, "invalid_input", `Failed to ${operation.split(".")[1]} campaign.`),
    );
  }
};

export const runCampaignStart = (request: DispatchOperationInput) =>
  runCampaignTransition(request, "campaign.start", startCampaign);

export const runCampaignStop = (request: DispatchOperationInput) =>
  runCampaignTransition(request, "campaign.stop", stopCampaign);

export const runCampaignEnd = (request: DispatchOperationInput) =>
  runCampaignTransition(request, "campaign.end", endCampaign);

export const runCampaignSetModelVersion = async (
  request: DispatchOperationInput,
): Promise<OperationResult<CampaignSetModelVersionOutput>> => {
  if (!hasRole(request, ["hr_admin"])) {
    return errorResult(
      createOperationError("forbidden", "Only HR Admin can change campaign model version.", {
        operation: "campaign.setModelVersion",
      }),
    );
  }

  const companyIdOrError = ensureContextCompany(request);
  if (typeof companyIdOrError !== "string") {
    return companyIdOrError;
  }

  let parsedInput: CampaignSetModelVersionInput;
  try {
    parsedInput = parseCampaignSetModelVersionInput(request.input);
  } catch (error) {
    return errorResult(
      errorFromUnknown(error, "invalid_input", "Invalid campaign.setModelVersion input."),
    );
  }

  try {
    const output = await setCampaignModelVersion({
      companyId: companyIdOrError,
      campaignId: parsedInput.campaignId,
      modelVersionId: parsedInput.modelVersionId,
    });
    return okResult(parseCampaignSetModelVersionOutput(output));
  } catch (error) {
    return errorResult(
      errorFromUnknown(error, "invalid_input", "Failed to set campaign model version."),
    );
  }
};

export const runCampaignWeightsSet = async (
  request: DispatchOperationInput,
): Promise<OperationResult<CampaignWeightsSetOutput>> => {
  if (!hasRole(request, ["hr_admin"])) {
    return errorResult(
      createOperationError("forbidden", "Only HR Admin can set campaign weights.", {
        operation: "campaign.weights.set",
      }),
    );
  }

  const companyIdOrError = ensureContextCompany(request);
  if (typeof companyIdOrError !== "string") {
    return companyIdOrError;
  }

  let parsedInput: CampaignWeightsSetInput;
  try {
    parsedInput = parseCampaignWeightsSetInput(request.input);
  } catch (error) {
    return errorResult(
      errorFromUnknown(error, "invalid_input", "Invalid campaign.weights.set input."),
    );
  }

  try {
    const output = await setCampaignWeights({
      companyId: companyIdOrError,
      campaignId: parsedInput.campaignId,
      manager: parsedInput.manager,
      peers: parsedInput.peers,
      subordinates: parsedInput.subordinates,
    });
    await recordAuditEvent(request, {
      companyId: companyIdOrError,
      campaignId: output.campaignId,
      eventType: "campaign.weights_updated",
      objectType: "campaign",
      objectId: output.campaignId,
      summary: "Обновлены веса групп оценивания.",
      metadataJson: {
        manager: output.manager,
        peers: output.peers,
        subordinates: output.subordinates,
      },
    });
    return okResult(parseCampaignWeightsSetOutput(output));
  } catch (error) {
    return errorResult(errorFromUnknown(error, "invalid_input", "Failed to set campaign weights."));
  }
};

const runCampaignParticipantsMutation = async (
  request: DispatchOperationInput,
  operation: "campaign.participants.add" | "campaign.participants.remove",
  execute: (params: {
    companyId: string;
    campaignId: string;
    employeeIds: string[];
  }) => Promise<CampaignParticipantsMutationOutput>,
): Promise<OperationResult<CampaignParticipantsMutationOutput>> => {
  if (!hasRole(request, ["hr_admin"])) {
    return errorResult(
      createOperationError("forbidden", "Only HR Admin can manage campaign participants.", {
        operation,
      }),
    );
  }

  const companyIdOrError = ensureContextCompany(request);
  if (typeof companyIdOrError !== "string") {
    return companyIdOrError;
  }

  let parsedInput: CampaignParticipantsMutationInput;
  try {
    parsedInput = parseCampaignParticipantsMutationInput(request.input);
  } catch (error) {
    return errorResult(errorFromUnknown(error, "invalid_input", `Invalid ${operation} input.`));
  }

  try {
    const output = await execute({
      companyId: companyIdOrError,
      campaignId: parsedInput.campaignId,
      employeeIds: parsedInput.employeeIds,
    });
    return okResult(parseCampaignParticipantsMutationOutput(output));
  } catch (error) {
    return errorResult(
      errorFromUnknown(
        error,
        "invalid_input",
        `Failed to ${operation.split(".")[2]} campaign participants.`,
      ),
    );
  }
};

export const runCampaignParticipantsAdd = (request: DispatchOperationInput) =>
  runCampaignParticipantsMutation(request, "campaign.participants.add", addCampaignParticipants);

export const runCampaignParticipantsRemove = (request: DispatchOperationInput) =>
  runCampaignParticipantsMutation(
    request,
    "campaign.participants.remove",
    removeCampaignParticipants,
  );

export const runCampaignSnapshotList = async (
  request: DispatchOperationInput,
): Promise<OperationResult<CampaignSnapshotListOutput>> => {
  if (!hasRole(request, ["hr_admin", "hr_reader"])) {
    return errorResult(
      createOperationError("forbidden", "Current role cannot list campaign snapshots.", {
        operation: "campaign.snapshot.list",
      }),
    );
  }

  const companyIdOrError = ensureContextCompany(request);
  if (typeof companyIdOrError !== "string") {
    return companyIdOrError;
  }

  let parsedInput: CampaignSnapshotListInput;
  try {
    parsedInput = parseCampaignSnapshotListInput(request.input);
  } catch (error) {
    return errorResult(
      errorFromUnknown(error, "invalid_input", "Invalid campaign.snapshot.list input."),
    );
  }

  try {
    const output = await listCampaignEmployeeSnapshots({
      campaignId: parsedInput.campaignId,
      companyId: companyIdOrError,
    });
    return okResult(parseCampaignSnapshotListOutput(output));
  } catch (error) {
    return errorResult(
      errorFromUnknown(error, "invalid_input", "Failed to list campaign snapshots."),
    );
  }
};

export const runCampaignProgressGet = async (
  request: DispatchOperationInput,
): Promise<OperationResult<CampaignProgressGetOutput>> => {
  if (!hasRole(request, ["hr_admin", "hr_reader"])) {
    return errorResult(
      createOperationError("forbidden", "Current role cannot view campaign progress.", {
        operation: "campaign.progress.get",
      }),
    );
  }

  const companyIdOrError = ensureContextCompany(request);
  if (typeof companyIdOrError !== "string") {
    return companyIdOrError;
  }

  let parsedInput: CampaignProgressGetInput;
  try {
    parsedInput = parseCampaignProgressGetInput(request.input);
  } catch (error) {
    return errorResult(
      errorFromUnknown(error, "invalid_input", "Invalid campaign.progress.get input."),
    );
  }

  try {
    const output = await getCampaignProgress({
      campaignId: parsedInput.campaignId,
      companyId: companyIdOrError,
    });
    return okResult(parseCampaignProgressGetOutput(output));
  } catch (error) {
    return errorResult(
      errorFromUnknown(error, "invalid_input", "Failed to load campaign progress."),
    );
  }
};
