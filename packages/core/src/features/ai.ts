/**
 * AI feature-area entrypoint.
 * @docs .memory-bank/spec/ai/ai-processing.md
 * @see .memory-bank/spec/security/webhooks-ai.md
 */
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

import { recordAuditEvent } from "../shared/audit";
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
    await recordAuditEvent(request, {
      companyId: companyIdOrError,
      campaignId: output.campaignId,
      eventType: output.wasAlreadyCompleted ? "ai.job_reused" : "ai.job_completed_stub",
      objectType: "ai_job",
      objectId: output.aiJobId,
      summary: output.wasAlreadyCompleted
        ? "Использован существующий результат AI job."
        : "AI job завершён в MVP stub режиме.",
      metadataJson: {
        provider: output.provider,
        status: output.status,
        completedAt: output.completedAt,
        wasAlreadyCompleted: output.wasAlreadyCompleted,
      },
    });
    return okResult(parseAiRunForCampaignOutput(output));
  } catch (error) {
    return errorResult(errorFromUnknown(error, "invalid_input", "Failed to run AI processing."));
  }
};
