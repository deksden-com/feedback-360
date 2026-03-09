/**
 * Questionnaires client feature methods.
 * @docs .memory-bank/spec/client-api/operation-catalog.md
 * @see .memory-bank/spec/domain/questionnaires.md
 */
import {
  type OperationContext,
  type OperationResult,
  type QuestionnaireGetDraftInput,
  type QuestionnaireGetDraftOutput,
  type QuestionnaireListAssignedInput,
  type QuestionnaireListAssignedOutput,
  type QuestionnaireSaveDraftInput,
  type QuestionnaireSaveDraftOutput,
  type QuestionnaireSubmitInput,
  type QuestionnaireSubmitOutput,
  errorFromUnknown,
  errorResult,
  parseQuestionnaireGetDraftInput,
  parseQuestionnaireGetDraftOutput,
  parseQuestionnaireListAssignedInput,
  parseQuestionnaireListAssignedOutput,
  parseQuestionnaireSaveDraftInput,
  parseQuestionnaireSaveDraftOutput,
  parseQuestionnaireSubmitInput,
  parseQuestionnaireSubmitOutput,
} from "@feedback-360/api-contract";

import type { ClientRuntime } from "../shared/runtime";

export type QuestionnairesClientMethods = {
  questionnaireListAssigned(
    input: QuestionnaireListAssignedInput,
    context?: OperationContext,
  ): Promise<OperationResult<QuestionnaireListAssignedOutput>>;
  questionnaireGetDraft(
    input: QuestionnaireGetDraftInput,
    context?: OperationContext,
  ): Promise<OperationResult<QuestionnaireGetDraftOutput>>;
  questionnaireSaveDraft(
    input: QuestionnaireSaveDraftInput,
    context?: OperationContext,
  ): Promise<OperationResult<QuestionnaireSaveDraftOutput>>;
  questionnaireSubmit(
    input: QuestionnaireSubmitInput,
    context?: OperationContext,
  ): Promise<OperationResult<QuestionnaireSubmitOutput>>;
};

export const createQuestionnairesClientMethods = (
  runtime: ClientRuntime,
): QuestionnairesClientMethods => ({
  questionnaireListAssigned: async (input, context) => {
    let parsedInput: QuestionnaireListAssignedInput;
    try {
      parsedInput = parseQuestionnaireListAssignedInput(input);
    } catch (error) {
      return errorResult(
        errorFromUnknown(error, "invalid_input", "Invalid questionnaireListAssigned input."),
      );
    }

    return runtime.invokeOperation({
      operation: "questionnaire.listAssigned",
      input: parsedInput,
      context,
      parseOutput: parseQuestionnaireListAssignedOutput,
    });
  },

  questionnaireGetDraft: async (input, context) => {
    let parsedInput: QuestionnaireGetDraftInput;
    try {
      parsedInput = parseQuestionnaireGetDraftInput(input);
    } catch (error) {
      return errorResult(
        errorFromUnknown(error, "invalid_input", "Invalid questionnaireGetDraft input."),
      );
    }

    return runtime.invokeOperation({
      operation: "questionnaire.getDraft",
      input: parsedInput,
      context,
      parseOutput: parseQuestionnaireGetDraftOutput,
    });
  },

  questionnaireSaveDraft: async (input, context) => {
    let parsedInput: QuestionnaireSaveDraftInput;
    try {
      parsedInput = parseQuestionnaireSaveDraftInput(input);
    } catch (error) {
      return errorResult(
        errorFromUnknown(error, "invalid_input", "Invalid questionnaireSaveDraft input."),
      );
    }

    return runtime.invokeOperation({
      operation: "questionnaire.saveDraft",
      input: parsedInput,
      context,
      parseOutput: parseQuestionnaireSaveDraftOutput,
    });
  },

  questionnaireSubmit: async (input, context) => {
    let parsedInput: QuestionnaireSubmitInput;
    try {
      parsedInput = parseQuestionnaireSubmitInput(input);
    } catch (error) {
      return errorResult(
        errorFromUnknown(error, "invalid_input", "Invalid questionnaireSubmit input."),
      );
    }

    return runtime.invokeOperation({
      operation: "questionnaire.submit",
      input: parsedInput,
      context,
      parseOutput: parseQuestionnaireSubmitOutput,
    });
  },
});
