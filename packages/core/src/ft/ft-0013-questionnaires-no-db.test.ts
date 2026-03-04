import { createOperationError } from "@feedback-360/api-contract";
import { beforeEach, describe, expect, it, vi } from "vitest";

type MockQuestionnaire = {
  questionnaireId: string;
  campaignId: string;
  companyId: string;
  subjectEmployeeId: string;
  raterEmployeeId: string;
  status: "not_started" | "in_progress" | "submitted";
  submittedAt?: string;
};

const state = {
  campaignLockedAt: "",
  questionnaire: {
    questionnaireId: "q-main",
    campaignId: "campaign-main",
    companyId: "company-main",
    subjectEmployeeId: "employee-subject",
    raterEmployeeId: "employee-rater",
    status: "not_started",
  } as MockQuestionnaire,
};

vi.mock("@feedback-360/db", () => {
  return {
    listAssignedQuestionnaires: async ({
      campaignId,
      companyId,
      status,
    }: {
      campaignId: string;
      companyId?: string;
      status?: MockQuestionnaire["status"];
    }) => {
      if (campaignId !== state.questionnaire.campaignId) {
        return { items: [] };
      }

      if (companyId && companyId !== state.questionnaire.companyId) {
        return { items: [] };
      }

      if (status && status !== state.questionnaire.status) {
        return { items: [] };
      }

      return {
        items: [state.questionnaire],
      };
    },
    saveQuestionnaireDraft: async ({
      questionnaireId,
    }: {
      questionnaireId: string;
      companyId?: string;
      draft: Record<string, unknown>;
    }) => {
      if (questionnaireId !== state.questionnaire.questionnaireId) {
        throw createOperationError("not_found", "Questionnaire not found.");
      }

      if (state.questionnaire.status === "submitted") {
        throw createOperationError("invalid_transition", "Submitted questionnaire is immutable.");
      }

      state.questionnaire = {
        ...state.questionnaire,
        status: "in_progress",
      };
      if (!state.campaignLockedAt) {
        state.campaignLockedAt = "2026-01-10T10:00:00.000Z";
      }

      return {
        questionnaireId: state.questionnaire.questionnaireId,
        status: "in_progress" as const,
        campaignLockedAt: state.campaignLockedAt,
      };
    },
    submitQuestionnaire: async ({
      questionnaireId,
    }: {
      questionnaireId: string;
      companyId?: string;
    }) => {
      if (questionnaireId !== state.questionnaire.questionnaireId) {
        throw createOperationError("not_found", "Questionnaire not found.");
      }

      if (state.questionnaire.status === "submitted" && state.questionnaire.submittedAt) {
        return {
          questionnaireId: state.questionnaire.questionnaireId,
          status: "submitted" as const,
          submittedAt: state.questionnaire.submittedAt,
          wasAlreadySubmitted: true,
        };
      }

      const submittedAt = "2026-01-10T10:05:00.000Z";
      state.questionnaire = {
        ...state.questionnaire,
        status: "submitted",
        submittedAt,
      };

      return {
        questionnaireId: state.questionnaire.questionnaireId,
        status: "submitted" as const,
        submittedAt,
        wasAlreadySubmitted: false,
      };
    },
  };
});

describe("FT-0013 questionnaire ops (no-db acceptance)", () => {
  beforeEach(() => {
    state.campaignLockedAt = "";
    state.questionnaire = {
      questionnaireId: "q-main",
      campaignId: "campaign-main",
      companyId: "company-main",
      subjectEmployeeId: "employee-subject",
      raterEmployeeId: "employee-rater",
      status: "not_started",
    } as MockQuestionnaire;
  });

  it("runs list/saveDraft/submit flow and enforces submitted immutability", async () => {
    const { dispatchOperation } = await import("../index");

    const context = {
      companyId: "company-main",
      role: "employee" as const,
    };

    const listNotStarted = await dispatchOperation({
      operation: "questionnaire.listAssigned",
      input: {
        campaignId: "campaign-main",
        status: "not_started",
      },
      context,
    });

    expect(listNotStarted.ok).toBe(true);
    if (listNotStarted.ok && "items" in listNotStarted.data) {
      const firstQuestionnaireId = listNotStarted.data.items
        .map((item) => ("questionnaireId" in item ? item.questionnaireId : undefined))
        .find((value): value is string => typeof value === "string");
      expect(firstQuestionnaireId).toBe("q-main");
    }

    const saveDraft = await dispatchOperation({
      operation: "questionnaire.saveDraft",
      input: {
        questionnaireId: "q-main",
        draft: {
          answers: {
            leadership: 4,
          },
        },
      },
      context,
    });

    expect(saveDraft.ok).toBe(true);
    if (saveDraft.ok && "campaignLockedAt" in saveDraft.data && "status" in saveDraft.data) {
      expect(saveDraft.data.status).toBe("in_progress");
      expect(saveDraft.data.campaignLockedAt).toBe("2026-01-10T10:00:00.000Z");
    }

    const submit = await dispatchOperation({
      operation: "questionnaire.submit",
      input: {
        questionnaireId: "q-main",
      },
      context,
    });

    expect(submit.ok).toBe(true);
    if (submit.ok && "submittedAt" in submit.data) {
      expect(submit.data.status).toBe("submitted");
      expect(submit.data.wasAlreadySubmitted).toBe(false);
    }

    const listSubmitted = await dispatchOperation({
      operation: "questionnaire.listAssigned",
      input: {
        campaignId: "campaign-main",
        status: "submitted",
      },
      context,
    });

    expect(listSubmitted.ok).toBe(true);
    if (listSubmitted.ok && "items" in listSubmitted.data) {
      const firstQuestionnaireStatus = listSubmitted.data.items
        .map((item) => ("status" in item ? item.status : undefined))
        .find((value) => value !== undefined);
      expect(firstQuestionnaireStatus).toBe("submitted");
    }

    const submitAgain = await dispatchOperation({
      operation: "questionnaire.submit",
      input: {
        questionnaireId: "q-main",
      },
      context,
    });

    expect(submitAgain.ok).toBe(true);
    if (submitAgain.ok && "wasAlreadySubmitted" in submitAgain.data) {
      expect(submitAgain.data.wasAlreadySubmitted).toBe(true);
    }

    const saveAfterSubmit = await dispatchOperation({
      operation: "questionnaire.saveDraft",
      input: {
        questionnaireId: "q-main",
        draft: {
          answers: {
            leadership: 5,
          },
        },
      },
      context,
    });

    expect(saveAfterSubmit.ok).toBe(false);
    if (!saveAfterSubmit.ok) {
      expect(saveAfterSubmit.error.code).toBe("invalid_transition");
    }
  });
});
