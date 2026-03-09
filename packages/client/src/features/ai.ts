/**
 * AI client feature methods.
 * @docs .memory-bank/spec/client-api/operation-catalog.md
 * @see .memory-bank/spec/ai/ai-processing.md
 */
import {
  type AiRunForCampaignInput,
  type AiRunForCampaignOutput,
  type OperationContext,
  type OperationResult,
  errorFromUnknown,
  errorResult,
  parseAiRunForCampaignInput,
  parseAiRunForCampaignOutput,
} from "@feedback-360/api-contract";

import type { ClientRuntime } from "../shared/runtime";

export type AiClientMethods = {
  aiRunForCampaign(
    input: AiRunForCampaignInput,
    context?: OperationContext,
  ): Promise<OperationResult<AiRunForCampaignOutput>>;
};

export const createAiClientMethods = (runtime: ClientRuntime): AiClientMethods => ({
  aiRunForCampaign: async (input, context) => {
    let parsedInput: AiRunForCampaignInput;
    try {
      parsedInput = parseAiRunForCampaignInput(input);
    } catch (error) {
      return errorResult(
        errorFromUnknown(error, "invalid_input", "Invalid aiRunForCampaign input."),
      );
    }

    return runtime.invokeOperation({
      operation: "ai.runForCampaign",
      input: parsedInput,
      context,
      parseOutput: parseAiRunForCampaignOutput,
    });
  },
});
