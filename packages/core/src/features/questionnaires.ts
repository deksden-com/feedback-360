import {
  type DispatchOperationInput,
  type OperationResult,
  type QuestionnaireGetDraftInput,
  type QuestionnaireGetDraftOutput,
  type QuestionnaireListAssignedInput,
  type QuestionnaireListAssignedOutput,
  type QuestionnaireSaveDraftInput,
  type QuestionnaireSaveDraftOutput,
  type QuestionnaireSubmitInput,
  type QuestionnaireSubmitOutput,
  createOperationError,
  errorFromUnknown,
  errorResult,
  okResult,
  parseQuestionnaireGetDraftInput,
  parseQuestionnaireGetDraftOutput,
  parseQuestionnaireListAssignedInput,
  parseQuestionnaireListAssignedOutput,
  parseQuestionnaireSaveDraftInput,
  parseQuestionnaireSaveDraftOutput,
  parseQuestionnaireSubmitInput,
  parseQuestionnaireSubmitOutput,
} from "@feedback-360/api-contract";
import {
  getQuestionnaireDraft,
  listAssignedQuestionnaires,
  saveQuestionnaireDraft,
  submitQuestionnaire,
} from "@feedback-360/db";

import { ensureContextCompany, hasRole, resolveRaterEmployeeId } from "../shared/context";

export const runQuestionnaireListAssigned = async (
  request: DispatchOperationInput,
): Promise<OperationResult<QuestionnaireListAssignedOutput>> => {
  if (!hasRole(request, ["hr_admin", "hr_reader", "manager", "employee"])) {
    return errorResult(
      createOperationError("forbidden", "Current role cannot list questionnaires.", {
        operation: "questionnaire.listAssigned",
      }),
    );
  }

  const companyIdOrError = ensureContextCompany(request);
  if (typeof companyIdOrError !== "string") {
    return companyIdOrError;
  }

  let parsedInput: QuestionnaireListAssignedInput;
  try {
    parsedInput = parseQuestionnaireListAssignedInput(request.input);
  } catch (error) {
    return errorResult(
      errorFromUnknown(error, "invalid_input", "Invalid questionnaire.listAssigned input."),
    );
  }

  try {
    const raterEmployeeIdOrError = await resolveRaterEmployeeId(
      request,
      companyIdOrError,
      "questionnaire.listAssigned",
    );
    if (typeof raterEmployeeIdOrError !== "string" && raterEmployeeIdOrError !== undefined) {
      return raterEmployeeIdOrError;
    }

    const output = await listAssignedQuestionnaires({
      campaignId: parsedInput.campaignId,
      status: parsedInput.status,
      companyId: companyIdOrError,
      ...(raterEmployeeIdOrError ? { raterEmployeeId: raterEmployeeIdOrError } : {}),
    });
    return okResult(parseQuestionnaireListAssignedOutput(output));
  } catch (error) {
    return errorResult(
      errorFromUnknown(error, "invalid_input", "Failed to list assigned questionnaires."),
    );
  }
};

export const runQuestionnaireGetDraft = async (
  request: DispatchOperationInput,
): Promise<OperationResult<QuestionnaireGetDraftOutput>> => {
  if (!hasRole(request, ["hr_admin", "hr_reader", "manager", "employee"])) {
    return errorResult(
      createOperationError("forbidden", "Current role cannot read questionnaire draft.", {
        operation: "questionnaire.getDraft",
      }),
    );
  }

  const companyIdOrError = ensureContextCompany(request);
  if (typeof companyIdOrError !== "string") {
    return companyIdOrError;
  }

  let parsedInput: QuestionnaireGetDraftInput;
  try {
    parsedInput = parseQuestionnaireGetDraftInput(request.input);
  } catch (error) {
    return errorResult(
      errorFromUnknown(error, "invalid_input", "Invalid questionnaire.getDraft input."),
    );
  }

  try {
    const raterEmployeeIdOrError = await resolveRaterEmployeeId(
      request,
      companyIdOrError,
      "questionnaire.getDraft",
    );
    if (typeof raterEmployeeIdOrError !== "string" && raterEmployeeIdOrError !== undefined) {
      return raterEmployeeIdOrError;
    }

    const output = await getQuestionnaireDraft({
      questionnaireId: parsedInput.questionnaireId,
      companyId: companyIdOrError,
      ...(raterEmployeeIdOrError ? { raterEmployeeId: raterEmployeeIdOrError } : {}),
    });
    return okResult(parseQuestionnaireGetDraftOutput(output));
  } catch (error) {
    return errorResult(
      errorFromUnknown(error, "invalid_input", "Failed to get questionnaire draft."),
    );
  }
};

export const runQuestionnaireSaveDraft = async (
  request: DispatchOperationInput,
): Promise<OperationResult<QuestionnaireSaveDraftOutput>> => {
  if (!hasRole(request, ["hr_admin", "manager", "employee"])) {
    return errorResult(
      createOperationError("forbidden", "Current role cannot save questionnaire draft.", {
        operation: "questionnaire.saveDraft",
      }),
    );
  }

  const companyIdOrError = ensureContextCompany(request);
  if (typeof companyIdOrError !== "string") {
    return companyIdOrError;
  }

  let parsedInput: QuestionnaireSaveDraftInput;
  try {
    parsedInput = parseQuestionnaireSaveDraftInput(request.input);
  } catch (error) {
    return errorResult(
      errorFromUnknown(error, "invalid_input", "Invalid questionnaire.saveDraft input."),
    );
  }

  try {
    const raterEmployeeIdOrError = await resolveRaterEmployeeId(
      request,
      companyIdOrError,
      "questionnaire.saveDraft",
    );
    if (typeof raterEmployeeIdOrError !== "string" && raterEmployeeIdOrError !== undefined) {
      return raterEmployeeIdOrError;
    }

    const output = await saveQuestionnaireDraft({
      questionnaireId: parsedInput.questionnaireId,
      draft: parsedInput.draft,
      companyId: companyIdOrError,
      ...(raterEmployeeIdOrError ? { raterEmployeeId: raterEmployeeIdOrError } : {}),
    });
    return okResult(parseQuestionnaireSaveDraftOutput(output));
  } catch (error) {
    return errorResult(
      errorFromUnknown(error, "invalid_input", "Failed to save questionnaire draft."),
    );
  }
};

export const runQuestionnaireSubmit = async (
  request: DispatchOperationInput,
): Promise<OperationResult<QuestionnaireSubmitOutput>> => {
  if (!hasRole(request, ["hr_admin", "manager", "employee"])) {
    return errorResult(
      createOperationError("forbidden", "Current role cannot submit questionnaire.", {
        operation: "questionnaire.submit",
      }),
    );
  }

  const companyIdOrError = ensureContextCompany(request);
  if (typeof companyIdOrError !== "string") {
    return companyIdOrError;
  }

  let parsedInput: QuestionnaireSubmitInput;
  try {
    parsedInput = parseQuestionnaireSubmitInput(request.input);
  } catch (error) {
    return errorResult(
      errorFromUnknown(error, "invalid_input", "Invalid questionnaire.submit input."),
    );
  }

  try {
    const raterEmployeeIdOrError = await resolveRaterEmployeeId(
      request,
      companyIdOrError,
      "questionnaire.submit",
    );
    if (typeof raterEmployeeIdOrError !== "string" && raterEmployeeIdOrError !== undefined) {
      return raterEmployeeIdOrError;
    }

    const output = await submitQuestionnaire({
      questionnaireId: parsedInput.questionnaireId,
      companyId: companyIdOrError,
      ...(raterEmployeeIdOrError ? { raterEmployeeId: raterEmployeeIdOrError } : {}),
    });
    return okResult(parseQuestionnaireSubmitOutput(output));
  } catch (error) {
    return errorResult(errorFromUnknown(error, "invalid_input", "Failed to submit questionnaire."));
  }
};
