/**
 * Models client feature methods.
 * @docs .memory-bank/spec/client-api/operation-catalog.md
 * @see .memory-bank/spec/domain/competency-models.md
 */
import {
  type ModelVersionCloneDraftInput,
  type ModelVersionCloneDraftOutput,
  type ModelVersionCreateInput,
  type ModelVersionCreateOutput,
  type ModelVersionGetInput,
  type ModelVersionGetOutput,
  type ModelVersionListInput,
  type ModelVersionListOutput,
  type ModelVersionPublishInput,
  type ModelVersionPublishOutput,
  type ModelVersionUpsertDraftInput,
  type ModelVersionUpsertDraftOutput,
  type OperationContext,
  type OperationResult,
  errorFromUnknown,
  errorResult,
  parseModelVersionCloneDraftInput,
  parseModelVersionCloneDraftOutput,
  parseModelVersionCreateInput,
  parseModelVersionCreateOutput,
  parseModelVersionGetInput,
  parseModelVersionGetOutput,
  parseModelVersionListInput,
  parseModelVersionListOutput,
  parseModelVersionPublishInput,
  parseModelVersionPublishOutput,
  parseModelVersionUpsertDraftInput,
  parseModelVersionUpsertDraftOutput,
} from "@feedback-360/api-contract";

import type { ClientRuntime } from "../shared/runtime";

export type ModelsClientMethods = {
  modelVersionCreate(
    input: ModelVersionCreateInput,
    context?: OperationContext,
  ): Promise<OperationResult<ModelVersionCreateOutput>>;
  modelVersionList(
    input?: ModelVersionListInput,
    context?: OperationContext,
  ): Promise<OperationResult<ModelVersionListOutput>>;
  modelVersionGet(
    input: ModelVersionGetInput,
    context?: OperationContext,
  ): Promise<OperationResult<ModelVersionGetOutput>>;
  modelVersionCloneDraft(
    input: ModelVersionCloneDraftInput,
    context?: OperationContext,
  ): Promise<OperationResult<ModelVersionCloneDraftOutput>>;
  modelVersionUpsertDraft(
    input: ModelVersionUpsertDraftInput,
    context?: OperationContext,
  ): Promise<OperationResult<ModelVersionUpsertDraftOutput>>;
  modelVersionPublish(
    input: ModelVersionPublishInput,
    context?: OperationContext,
  ): Promise<OperationResult<ModelVersionPublishOutput>>;
};

export const createModelsClientMethods = (runtime: ClientRuntime): ModelsClientMethods => ({
  modelVersionCreate: async (input, context) => {
    let parsedInput: ModelVersionCreateInput;
    try {
      parsedInput = parseModelVersionCreateInput(input);
    } catch (error) {
      return errorResult(
        errorFromUnknown(error, "invalid_input", "Invalid modelVersionCreate input."),
      );
    }

    return runtime.invokeOperation({
      operation: "model.version.create",
      input: parsedInput,
      context,
      parseOutput: parseModelVersionCreateOutput,
    });
  },

  modelVersionList: async (input, context) => {
    let parsedInput: ModelVersionListInput;
    try {
      parsedInput = parseModelVersionListInput(input ?? {});
    } catch (error) {
      return errorResult(
        errorFromUnknown(error, "invalid_input", "Invalid modelVersionList input."),
      );
    }

    return runtime.invokeOperation({
      operation: "model.version.list",
      input: parsedInput,
      context,
      parseOutput: parseModelVersionListOutput,
    });
  },

  modelVersionGet: async (input, context) => {
    let parsedInput: ModelVersionGetInput;
    try {
      parsedInput = parseModelVersionGetInput(input);
    } catch (error) {
      return errorResult(
        errorFromUnknown(error, "invalid_input", "Invalid modelVersionGet input."),
      );
    }

    return runtime.invokeOperation({
      operation: "model.version.get",
      input: parsedInput,
      context,
      parseOutput: parseModelVersionGetOutput,
    });
  },

  modelVersionCloneDraft: async (input, context) => {
    let parsedInput: ModelVersionCloneDraftInput;
    try {
      parsedInput = parseModelVersionCloneDraftInput(input);
    } catch (error) {
      return errorResult(
        errorFromUnknown(error, "invalid_input", "Invalid modelVersionCloneDraft input."),
      );
    }

    return runtime.invokeOperation({
      operation: "model.version.cloneDraft",
      input: parsedInput,
      context,
      parseOutput: parseModelVersionCloneDraftOutput,
    });
  },

  modelVersionUpsertDraft: async (input, context) => {
    let parsedInput: ModelVersionUpsertDraftInput;
    try {
      parsedInput = parseModelVersionUpsertDraftInput(input);
    } catch (error) {
      return errorResult(
        errorFromUnknown(error, "invalid_input", "Invalid modelVersionUpsertDraft input."),
      );
    }

    return runtime.invokeOperation({
      operation: "model.version.upsertDraft",
      input: parsedInput,
      context,
      parseOutput: parseModelVersionUpsertDraftOutput,
    });
  },

  modelVersionPublish: async (input, context) => {
    let parsedInput: ModelVersionPublishInput;
    try {
      parsedInput = parseModelVersionPublishInput(input);
    } catch (error) {
      return errorResult(
        errorFromUnknown(error, "invalid_input", "Invalid modelVersionPublish input."),
      );
    }

    return runtime.invokeOperation({
      operation: "model.version.publish",
      input: parsedInput,
      context,
      parseOutput: parseModelVersionPublishOutput,
    });
  },
});
