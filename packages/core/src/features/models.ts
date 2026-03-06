import {
  type DispatchOperationInput,
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
  type OperationResult,
  createOperationError,
  errorFromUnknown,
  errorResult,
  okResult,
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
import {
  cloneModelVersionToDraft,
  createModelVersion,
  getModelVersion,
  listModelVersions,
  publishModelVersion,
  upsertModelDraft,
} from "@feedback-360/db";

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

export const runModelVersionGet = async (
  request: DispatchOperationInput,
): Promise<OperationResult<ModelVersionGetOutput>> => {
  if (!hasRole(request, ["hr_admin", "hr_reader"])) {
    return errorResult(
      createOperationError("forbidden", "Current role cannot view model versions.", {
        operation: "model.version.get",
      }),
    );
  }

  const companyIdOrError = ensureContextCompany(request);
  if (typeof companyIdOrError !== "string") {
    return companyIdOrError;
  }

  let parsedInput: ModelVersionGetInput;
  try {
    parsedInput = parseModelVersionGetInput(request.input);
  } catch (error) {
    return errorResult(
      errorFromUnknown(error, "invalid_input", "Invalid model.version.get input."),
    );
  }

  try {
    const output = await getModelVersion({
      companyId: companyIdOrError,
      modelVersionId: parsedInput.modelVersionId,
    });
    return okResult(parseModelVersionGetOutput(output));
  } catch (error) {
    return errorResult(errorFromUnknown(error, "not_found", "Failed to load model version."));
  }
};

export const runModelVersionCloneDraft = async (
  request: DispatchOperationInput,
): Promise<OperationResult<ModelVersionCloneDraftOutput>> => {
  if (!hasRole(request, ["hr_admin"])) {
    return errorResult(
      createOperationError("forbidden", "Only HR Admin can clone model drafts.", {
        operation: "model.version.cloneDraft",
      }),
    );
  }

  const companyIdOrError = ensureContextCompany(request);
  if (typeof companyIdOrError !== "string") {
    return companyIdOrError;
  }

  let parsedInput: ModelVersionCloneDraftInput;
  try {
    parsedInput = parseModelVersionCloneDraftInput(request.input);
  } catch (error) {
    return errorResult(
      errorFromUnknown(error, "invalid_input", "Invalid model.version.cloneDraft input."),
    );
  }

  try {
    const output = await cloneModelVersionToDraft({
      companyId: companyIdOrError,
      sourceModelVersionId: parsedInput.sourceModelVersionId,
      name: parsedInput.name,
    });
    return okResult(parseModelVersionCloneDraftOutput(output));
  } catch (error) {
    return errorResult(errorFromUnknown(error, "invalid_input", "Failed to clone model draft."));
  }
};

export const runModelVersionUpsertDraft = async (
  request: DispatchOperationInput,
): Promise<OperationResult<ModelVersionUpsertDraftOutput>> => {
  if (!hasRole(request, ["hr_admin"])) {
    return errorResult(
      createOperationError("forbidden", "Only HR Admin can edit model drafts.", {
        operation: "model.version.upsertDraft",
      }),
    );
  }

  const companyIdOrError = ensureContextCompany(request);
  if (typeof companyIdOrError !== "string") {
    return companyIdOrError;
  }

  let parsedInput: ModelVersionUpsertDraftInput;
  try {
    parsedInput = parseModelVersionUpsertDraftInput(request.input);
  } catch (error) {
    return errorResult(
      errorFromUnknown(error, "invalid_input", "Invalid model.version.upsertDraft input."),
    );
  }

  try {
    const output = await upsertModelDraft({
      companyId: companyIdOrError,
      ...parsedInput,
    });
    return okResult(parseModelVersionUpsertDraftOutput(output));
  } catch (error) {
    return errorResult(errorFromUnknown(error, "invalid_input", "Failed to save model draft."));
  }
};

export const runModelVersionPublish = async (
  request: DispatchOperationInput,
): Promise<OperationResult<ModelVersionPublishOutput>> => {
  if (!hasRole(request, ["hr_admin"])) {
    return errorResult(
      createOperationError("forbidden", "Only HR Admin can publish model drafts.", {
        operation: "model.version.publish",
      }),
    );
  }

  const companyIdOrError = ensureContextCompany(request);
  if (typeof companyIdOrError !== "string") {
    return companyIdOrError;
  }

  let parsedInput: ModelVersionPublishInput;
  try {
    parsedInput = parseModelVersionPublishInput(request.input);
  } catch (error) {
    return errorResult(
      errorFromUnknown(error, "invalid_input", "Invalid model.version.publish input."),
    );
  }

  try {
    const output = await publishModelVersion({
      companyId: companyIdOrError,
      modelVersionId: parsedInput.modelVersionId,
    });
    return okResult(parseModelVersionPublishOutput(output));
  } catch (error) {
    return errorResult(
      errorFromUnknown(error, "invalid_transition", "Failed to publish model draft."),
    );
  }
};
