import {
  type ModelVersionCreateInput,
  type ModelVersionCreateOutput,
  type ModelVersionListInput,
  type ModelVersionListOutput,
  type OperationContext,
  type OperationResult,
  errorFromUnknown,
  errorResult,
  parseModelVersionCreateInput,
  parseModelVersionCreateOutput,
  parseModelVersionListInput,
  parseModelVersionListOutput,
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
});
