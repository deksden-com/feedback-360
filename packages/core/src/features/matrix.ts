import {
  type CampaignParticipantsAddFromDepartmentsInput,
  type CampaignParticipantsAddFromDepartmentsOutput,
  type DispatchOperationInput,
  type MatrixGenerateSuggestedInput,
  type MatrixGenerateSuggestedOutput,
  type MatrixListInput,
  type MatrixListOutput,
  type MatrixSetInput,
  type MatrixSetOutput,
  type OperationResult,
  createOperationError,
  errorFromUnknown,
  errorResult,
  okResult,
  parseCampaignParticipantsAddFromDepartmentsInput,
  parseCampaignParticipantsAddFromDepartmentsOutput,
  parseMatrixGenerateSuggestedInput,
  parseMatrixGenerateSuggestedOutput,
  parseMatrixListInput,
  parseMatrixListOutput,
  parseMatrixSetInput,
  parseMatrixSetOutput,
} from "@feedback-360/api-contract";
import {
  addCampaignParticipantsFromDepartments,
  generateSuggestedMatrix,
  listMatrixAssignments,
  setMatrixAssignments,
} from "@feedback-360/db";

import { recordAuditEvent } from "../shared/audit";
import { ensureContextCompany, hasRole } from "../shared/context";

export const runCampaignParticipantsAddFromDepartments = async (
  request: DispatchOperationInput,
): Promise<OperationResult<CampaignParticipantsAddFromDepartmentsOutput>> => {
  if (!hasRole(request, ["hr_admin"])) {
    return errorResult(
      createOperationError("forbidden", "Only HR Admin can add campaign participants.", {
        operation: "campaign.participants.addFromDepartments",
      }),
    );
  }

  const companyIdOrError = ensureContextCompany(request);
  if (typeof companyIdOrError !== "string") {
    return companyIdOrError;
  }

  let parsedInput: CampaignParticipantsAddFromDepartmentsInput;
  try {
    parsedInput = parseCampaignParticipantsAddFromDepartmentsInput(request.input);
  } catch (error) {
    return errorResult(
      errorFromUnknown(
        error,
        "invalid_input",
        "Invalid campaign.participants.addFromDepartments input.",
      ),
    );
  }

  try {
    const output = await addCampaignParticipantsFromDepartments({
      companyId: companyIdOrError,
      campaignId: parsedInput.campaignId,
      departmentIds: parsedInput.departmentIds,
      includeSelf: parsedInput.includeSelf,
    });
    return okResult(parseCampaignParticipantsAddFromDepartmentsOutput(output));
  } catch (error) {
    return errorResult(
      errorFromUnknown(error, "invalid_input", "Failed to add participants from departments."),
    );
  }
};

export const runMatrixGenerateSuggested = async (
  request: DispatchOperationInput,
): Promise<OperationResult<MatrixGenerateSuggestedOutput>> => {
  if (!hasRole(request, ["hr_admin"])) {
    return errorResult(
      createOperationError("forbidden", "Only HR Admin can generate matrix suggestions.", {
        operation: "matrix.generateSuggested",
      }),
    );
  }

  const companyIdOrError = ensureContextCompany(request);
  if (typeof companyIdOrError !== "string") {
    return companyIdOrError;
  }

  let parsedInput: MatrixGenerateSuggestedInput;
  try {
    parsedInput = parseMatrixGenerateSuggestedInput(request.input);
  } catch (error) {
    return errorResult(
      errorFromUnknown(error, "invalid_input", "Invalid matrix.generateSuggested input."),
    );
  }

  try {
    const output = await generateSuggestedMatrix({
      companyId: companyIdOrError,
      campaignId: parsedInput.campaignId,
      departmentIds: parsedInput.departmentIds,
    });
    return okResult(parseMatrixGenerateSuggestedOutput(output));
  } catch (error) {
    return errorResult(
      errorFromUnknown(error, "invalid_input", "Failed to generate matrix suggestions."),
    );
  }
};

export const runMatrixList = async (
  request: DispatchOperationInput,
): Promise<OperationResult<MatrixListOutput>> => {
  if (!hasRole(request, ["hr_admin", "hr_reader"])) {
    return errorResult(
      createOperationError("forbidden", "Current role cannot inspect matrix assignments.", {
        operation: "matrix.list",
      }),
    );
  }

  const companyIdOrError = ensureContextCompany(request);
  if (typeof companyIdOrError !== "string") {
    return companyIdOrError;
  }

  let parsedInput: MatrixListInput;
  try {
    parsedInput = parseMatrixListInput(request.input);
  } catch (error) {
    return errorResult(errorFromUnknown(error, "invalid_input", "Invalid matrix.list input."));
  }

  try {
    const output = await listMatrixAssignments({
      companyId: companyIdOrError,
      campaignId: parsedInput.campaignId,
    });
    return okResult(parseMatrixListOutput(output));
  } catch (error) {
    return errorResult(errorFromUnknown(error, "invalid_input", "Failed to list matrix."));
  }
};

export const runMatrixSet = async (
  request: DispatchOperationInput,
): Promise<OperationResult<MatrixSetOutput>> => {
  if (!hasRole(request, ["hr_admin"])) {
    return errorResult(
      createOperationError("forbidden", "Only HR Admin can set matrix assignments.", {
        operation: "matrix.set",
      }),
    );
  }

  const companyIdOrError = ensureContextCompany(request);
  if (typeof companyIdOrError !== "string") {
    return companyIdOrError;
  }

  let parsedInput: MatrixSetInput;
  try {
    parsedInput = parseMatrixSetInput(request.input);
  } catch (error) {
    return errorResult(errorFromUnknown(error, "invalid_input", "Invalid matrix.set input."));
  }

  try {
    const output = await setMatrixAssignments({
      companyId: companyIdOrError,
      campaignId: parsedInput.campaignId,
      assignments: parsedInput.assignments,
    });
    await recordAuditEvent(request, {
      companyId: companyIdOrError,
      campaignId: output.campaignId,
      eventType: "matrix.updated",
      objectType: "matrix",
      objectId: output.campaignId,
      summary: "Матрица оценивающих обновлена.",
      metadataJson: {
        totalAssignments: output.totalAssignments,
      },
    });
    return okResult(parseMatrixSetOutput(output));
  } catch (error) {
    return errorResult(errorFromUnknown(error, "invalid_input", "Failed to set matrix."));
  }
};
