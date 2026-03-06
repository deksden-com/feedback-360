import {
  type CampaignParticipantsAddFromDepartmentsInput,
  type CampaignParticipantsAddFromDepartmentsOutput,
  type MatrixGenerateSuggestedInput,
  type MatrixGenerateSuggestedOutput,
  type MatrixListInput,
  type MatrixListOutput,
  type MatrixSetInput,
  type MatrixSetOutput,
  type OperationContext,
  type OperationResult,
  errorFromUnknown,
  errorResult,
  parseCampaignParticipantsAddFromDepartmentsInput,
  parseCampaignParticipantsAddFromDepartmentsOutput,
  parseMatrixGenerateSuggestedInput,
  parseMatrixGenerateSuggestedOutput,
  parseMatrixListInput,
  parseMatrixListOutput,
  parseMatrixSetInput,
  parseMatrixSetOutput,
} from "@feedback-360/api-contract";

import type { ClientRuntime } from "../shared/runtime";

export type MatrixClientMethods = {
  campaignParticipantsAddFromDepartments(
    input: CampaignParticipantsAddFromDepartmentsInput,
    context?: OperationContext,
  ): Promise<OperationResult<CampaignParticipantsAddFromDepartmentsOutput>>;
  matrixGenerateSuggested(
    input: MatrixGenerateSuggestedInput,
    context?: OperationContext,
  ): Promise<OperationResult<MatrixGenerateSuggestedOutput>>;
  matrixList(
    input: MatrixListInput,
    context?: OperationContext,
  ): Promise<OperationResult<MatrixListOutput>>;
  matrixSet(
    input: MatrixSetInput,
    context?: OperationContext,
  ): Promise<OperationResult<MatrixSetOutput>>;
};

export const createMatrixClientMethods = (runtime: ClientRuntime): MatrixClientMethods => ({
  campaignParticipantsAddFromDepartments: async (input, context) => {
    let parsedInput: CampaignParticipantsAddFromDepartmentsInput;
    try {
      parsedInput = parseCampaignParticipantsAddFromDepartmentsInput(input);
    } catch (error) {
      return errorResult(
        errorFromUnknown(
          error,
          "invalid_input",
          "Invalid campaignParticipantsAddFromDepartments input.",
        ),
      );
    }

    return runtime.invokeOperation({
      operation: "campaign.participants.addFromDepartments",
      input: parsedInput,
      context,
      parseOutput: parseCampaignParticipantsAddFromDepartmentsOutput,
    });
  },

  matrixGenerateSuggested: async (input, context) => {
    let parsedInput: MatrixGenerateSuggestedInput;
    try {
      parsedInput = parseMatrixGenerateSuggestedInput(input);
    } catch (error) {
      return errorResult(
        errorFromUnknown(error, "invalid_input", "Invalid matrixGenerateSuggested input."),
      );
    }

    return runtime.invokeOperation({
      operation: "matrix.generateSuggested",
      input: parsedInput,
      context,
      parseOutput: parseMatrixGenerateSuggestedOutput,
    });
  },

  matrixList: async (input, context) => {
    let parsedInput: MatrixListInput;
    try {
      parsedInput = parseMatrixListInput(input);
    } catch (error) {
      return errorResult(errorFromUnknown(error, "invalid_input", "Invalid matrixList input."));
    }

    return runtime.invokeOperation({
      operation: "matrix.list",
      input: parsedInput,
      context,
      parseOutput: parseMatrixListOutput,
    });
  },

  matrixSet: async (input, context) => {
    let parsedInput: MatrixSetInput;
    try {
      parsedInput = parseMatrixSetInput(input);
    } catch (error) {
      return errorResult(errorFromUnknown(error, "invalid_input", "Invalid matrixSet input."));
    }

    return runtime.invokeOperation({
      operation: "matrix.set",
      input: parsedInput,
      context,
      parseOutput: parseMatrixSetOutput,
    });
  },
});
