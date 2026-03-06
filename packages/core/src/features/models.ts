import {
  type DispatchOperationInput,
  type ModelVersionCreateInput,
  type ModelVersionCreateOutput,
  type ModelVersionListInput,
  type ModelVersionListOutput,
  type OperationResult,
  createOperationError,
  errorFromUnknown,
  errorResult,
  okResult,
  parseModelVersionCreateInput,
  parseModelVersionCreateOutput,
  parseModelVersionListInput,
  parseModelVersionListOutput,
} from "@feedback-360/api-contract";
import { createModelVersion, listModelVersions } from "@feedback-360/db";

import { ensureContextCompany, hasRole } from "../shared/context";

export const runModelVersionCreate = async (
  request: DispatchOperationInput,
): Promise<OperationResult<ModelVersionCreateOutput>> => {
  if (!hasRole(request, ["hr_admin"])) {
    return errorResult(
      createOperationError("forbidden", "Only HR Admin can create competency model versions.", {
        operation: "model.version.create",
      }),
    );
  }

  const companyIdOrError = ensureContextCompany(request);
  if (typeof companyIdOrError !== "string") {
    return companyIdOrError;
  }

  let parsedInput: ModelVersionCreateInput;
  try {
    parsedInput = parseModelVersionCreateInput(request.input);
  } catch (error) {
    return errorResult(
      errorFromUnknown(error, "invalid_input", "Invalid model.version.create input."),
    );
  }

  try {
    const output = await createModelVersion({
      companyId: companyIdOrError,
      ...parsedInput,
    });
    return okResult(parseModelVersionCreateOutput(output));
  } catch (error) {
    return errorResult(errorFromUnknown(error, "invalid_input", "Failed to create model version."));
  }
};

export const runModelVersionList = async (
  request: DispatchOperationInput,
): Promise<OperationResult<ModelVersionListOutput>> => {
  if (!hasRole(request, ["hr_admin", "hr_reader"])) {
    return errorResult(
      createOperationError("forbidden", "Current role cannot list model versions.", {
        operation: "model.version.list",
      }),
    );
  }

  const companyIdOrError = ensureContextCompany(request);
  if (typeof companyIdOrError !== "string") {
    return companyIdOrError;
  }

  let parsedInput: ModelVersionListInput;
  try {
    parsedInput = parseModelVersionListInput(request.input);
  } catch (error) {
    return errorResult(
      errorFromUnknown(error, "invalid_input", "Invalid model.version.list input."),
    );
  }

  try {
    const output = await listModelVersions({
      companyId: companyIdOrError,
      ...parsedInput,
    });
    return okResult(parseModelVersionListOutput(output));
  } catch (error) {
    return errorResult(errorFromUnknown(error, "invalid_input", "Failed to list model versions."));
  }
};
