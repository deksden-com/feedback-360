/**
 * Campaign client feature methods.
 * @docs .memory-bank/spec/client-api/operation-catalog.md
 * @see .memory-bank/spec/domain/campaign-lifecycle.md
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
  type OperationContext,
  type OperationResult,
  errorFromUnknown,
  errorResult,
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

import type { ClientRuntime } from "../shared/runtime";

export type CampaignsClientMethods = {
  campaignList(
    input?: CampaignListInput,
    context?: OperationContext,
  ): Promise<OperationResult<CampaignListOutput>>;
  campaignGet(
    input: CampaignGetInput,
    context?: OperationContext,
  ): Promise<OperationResult<CampaignGetOutput>>;
  campaignCreate(
    input: CampaignCreateInput,
    context?: OperationContext,
  ): Promise<OperationResult<CampaignCreateOutput>>;
  campaignUpdateDraft(
    input: CampaignUpdateDraftInput,
    context?: OperationContext,
  ): Promise<OperationResult<CampaignUpdateDraftOutput>>;
  campaignSetModelVersion(
    input: CampaignSetModelVersionInput,
    context?: OperationContext,
  ): Promise<OperationResult<CampaignSetModelVersionOutput>>;
  campaignWeightsSet(
    input: CampaignWeightsSetInput,
    context?: OperationContext,
  ): Promise<OperationResult<CampaignWeightsSetOutput>>;
  campaignParticipantsAdd(
    input: CampaignParticipantsMutationInput,
    context?: OperationContext,
  ): Promise<OperationResult<CampaignParticipantsMutationOutput>>;
  campaignParticipantsRemove(
    input: CampaignParticipantsMutationInput,
    context?: OperationContext,
  ): Promise<OperationResult<CampaignParticipantsMutationOutput>>;
  campaignStart(
    input: CampaignTransitionInput,
    context?: OperationContext,
  ): Promise<OperationResult<CampaignTransitionOutput>>;
  campaignStop(
    input: CampaignTransitionInput,
    context?: OperationContext,
  ): Promise<OperationResult<CampaignTransitionOutput>>;
  campaignEnd(
    input: CampaignTransitionInput,
    context?: OperationContext,
  ): Promise<OperationResult<CampaignTransitionOutput>>;
  campaignSnapshotList(
    input: CampaignSnapshotListInput,
    context?: OperationContext,
  ): Promise<OperationResult<CampaignSnapshotListOutput>>;
  campaignProgressGet(
    input: CampaignProgressGetInput,
    context?: OperationContext,
  ): Promise<OperationResult<CampaignProgressGetOutput>>;
};

const invokeCampaignTransition = (
  runtime: ClientRuntime,
  operation: "campaign.start" | "campaign.stop" | "campaign.end",
) => {
  return async (
    input: CampaignTransitionInput,
    context?: OperationContext,
  ): Promise<OperationResult<CampaignTransitionOutput>> => {
    let parsedInput: CampaignTransitionInput;
    try {
      parsedInput = parseCampaignTransitionInput(input);
    } catch (error) {
      return errorResult(errorFromUnknown(error, "invalid_input", `Invalid ${operation} input.`));
    }

    return runtime.invokeOperation({
      operation,
      input: parsedInput,
      context,
      parseOutput: parseCampaignTransitionOutput,
    });
  };
};

const invokeCampaignParticipants = (
  runtime: ClientRuntime,
  operation: "campaign.participants.add" | "campaign.participants.remove",
) => {
  return async (
    input: CampaignParticipantsMutationInput,
    context?: OperationContext,
  ): Promise<OperationResult<CampaignParticipantsMutationOutput>> => {
    let parsedInput: CampaignParticipantsMutationInput;
    try {
      parsedInput = parseCampaignParticipantsMutationInput(input);
    } catch (error) {
      return errorResult(errorFromUnknown(error, "invalid_input", `Invalid ${operation} input.`));
    }

    return runtime.invokeOperation({
      operation,
      input: parsedInput,
      context,
      parseOutput: parseCampaignParticipantsMutationOutput,
    });
  };
};

export const createCampaignsClientMethods = (runtime: ClientRuntime): CampaignsClientMethods => ({
  campaignList: async (input, context) => {
    let parsedInput: CampaignListInput;
    try {
      parsedInput = parseCampaignListInput(input ?? {});
    } catch (error) {
      return errorResult(errorFromUnknown(error, "invalid_input", "Invalid campaignList input."));
    }

    return runtime.invokeOperation({
      operation: "campaign.list",
      input: parsedInput,
      context,
      parseOutput: parseCampaignListOutput,
    });
  },

  campaignGet: async (input, context) => {
    let parsedInput: CampaignGetInput;
    try {
      parsedInput = parseCampaignGetInput(input);
    } catch (error) {
      return errorResult(errorFromUnknown(error, "invalid_input", "Invalid campaignGet input."));
    }

    return runtime.invokeOperation({
      operation: "campaign.get",
      input: parsedInput,
      context,
      parseOutput: parseCampaignGetOutput,
    });
  },

  campaignCreate: async (input, context) => {
    let parsedInput: CampaignCreateInput;
    try {
      parsedInput = parseCampaignCreateInput(input);
    } catch (error) {
      return errorResult(errorFromUnknown(error, "invalid_input", "Invalid campaignCreate input."));
    }

    return runtime.invokeOperation({
      operation: "campaign.create",
      input: parsedInput,
      context,
      parseOutput: parseCampaignCreateOutput,
    });
  },

  campaignUpdateDraft: async (input, context) => {
    let parsedInput: CampaignUpdateDraftInput;
    try {
      parsedInput = parseCampaignUpdateDraftInput(input);
    } catch (error) {
      return errorResult(
        errorFromUnknown(error, "invalid_input", "Invalid campaignUpdateDraft input."),
      );
    }

    return runtime.invokeOperation({
      operation: "campaign.updateDraft",
      input: parsedInput,
      context,
      parseOutput: parseCampaignUpdateDraftOutput,
    });
  },

  campaignSetModelVersion: async (input, context) => {
    let parsedInput: CampaignSetModelVersionInput;
    try {
      parsedInput = parseCampaignSetModelVersionInput(input);
    } catch (error) {
      return errorResult(
        errorFromUnknown(error, "invalid_input", "Invalid campaignSetModelVersion input."),
      );
    }

    return runtime.invokeOperation({
      operation: "campaign.setModelVersion",
      input: parsedInput,
      context,
      parseOutput: parseCampaignSetModelVersionOutput,
    });
  },

  campaignWeightsSet: async (input, context) => {
    let parsedInput: CampaignWeightsSetInput;
    try {
      parsedInput = parseCampaignWeightsSetInput(input);
    } catch (error) {
      return errorResult(
        errorFromUnknown(error, "invalid_input", "Invalid campaignWeightsSet input."),
      );
    }

    return runtime.invokeOperation({
      operation: "campaign.weights.set",
      input: parsedInput,
      context,
      parseOutput: parseCampaignWeightsSetOutput,
    });
  },

  campaignParticipantsAdd: invokeCampaignParticipants(runtime, "campaign.participants.add"),
  campaignParticipantsRemove: invokeCampaignParticipants(runtime, "campaign.participants.remove"),
  campaignStart: invokeCampaignTransition(runtime, "campaign.start"),
  campaignStop: invokeCampaignTransition(runtime, "campaign.stop"),
  campaignEnd: invokeCampaignTransition(runtime, "campaign.end"),

  campaignSnapshotList: async (input, context) => {
    let parsedInput: CampaignSnapshotListInput;
    try {
      parsedInput = parseCampaignSnapshotListInput(input);
    } catch (error) {
      return errorResult(
        errorFromUnknown(error, "invalid_input", "Invalid campaignSnapshotList input."),
      );
    }

    return runtime.invokeOperation({
      operation: "campaign.snapshot.list",
      input: parsedInput,
      context,
      parseOutput: parseCampaignSnapshotListOutput,
    });
  },

  campaignProgressGet: async (input, context) => {
    let parsedInput: CampaignProgressGetInput;
    try {
      parsedInput = parseCampaignProgressGetInput(input);
    } catch (error) {
      return errorResult(
        errorFromUnknown(error, "invalid_input", "Invalid campaignProgressGet input."),
      );
    }

    return runtime.invokeOperation({
      operation: "campaign.progress.get",
      input: parsedInput,
      context,
      parseOutput: parseCampaignProgressGetOutput,
    });
  },
});
