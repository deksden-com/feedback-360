import {
  type AiRunForCampaignInput,
  type AiRunForCampaignOutput,
  type DispatchOperationInput,
  type OperationResult,
  createOperationError,
  errorFromUnknown,
  errorResult,
  okResult,
  parseAiRunForCampaignInput,
  parseAiRunForCampaignOutput,
} from "@feedback-360/api-contract";
import { runAiForCampaign } from "@feedback-360/db";

import { ensureContextCompany, hasRole } from "../shared/context";

export const runAiRunForCampaign = async (
  request: DispatchOperationInput,
): Promise<OperationResult<AiRunForCampaignOutput>> => {
  if (!hasRole(request, ["hr_admin"])) {
    return errorResult(
      createOperationError("forbidden", "Only HR Admin can run AI processing.", {
        operation: "ai.runForCampaign",
      }),
    );
  }

  const companyIdOrError = ensureContextCompany(request);
  if (typeof companyIdOrError !== "string") {
    return companyIdOrError;
  }

  let parsedInput: AiRunForCampaignInput;
  try {
    parsedInput = parseAiRunForCampaignInput(request.input);
  } catch (error) {
    return errorResult(
      errorFromUnknown(error, "invalid_input", "Invalid ai.runForCampaign input."),
    );
  }

  try {
    const output = await runAiForCampaign({
      campaignId: parsedInput.campaignId,
      companyId: companyIdOrError,
    });
    return okResult(parseAiRunForCampaignOutput(output));
  } catch (error) {
    return errorResult(errorFromUnknown(error, "invalid_input", "Failed to run AI processing."));
  }
};
