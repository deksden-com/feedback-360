import { beforeEach, describe, expect, it, vi } from "vitest";

const listAssignedQuestionnairesMock = vi.fn(async () => ({
  items: [
    {
      questionnaireId: "q-main",
      campaignId: "campaign-main",
      companyId: "company-main",
      subjectEmployeeId: "employee-subject",
      raterEmployeeId: "employee-rater",
      status: "not_started" as const,
    },
  ],
}));

const saveQuestionnaireDraftMock = vi.fn(async () => {
  return {
    questionnaireId: "q-main",
    status: "in_progress" as const,
    campaignLockedAt: "2026-01-10T10:00:00.000Z",
  };
});

const submitQuestionnaireMock = vi.fn(async () => {
  return {
    questionnaireId: "q-main",
    status: "submitted" as const,
    submittedAt: "2026-01-10T10:05:00.000Z",
    wasAlreadySubmitted: false,
  };
});

vi.mock("@feedback-360/db", () => {
  return {
    listAssignedQuestionnaires: listAssignedQuestionnairesMock,
    saveQuestionnaireDraft: saveQuestionnaireDraftMock,
    submitQuestionnaire: submitQuestionnaireMock,
  };
});

describe("FT-0022 RBAC enforcement (no-db)", () => {
  beforeEach(() => {
    listAssignedQuestionnairesMock.mockClear();
    saveQuestionnaireDraftMock.mockClear();
    submitQuestionnaireMock.mockClear();
  });

  it("allows hr_reader read ops and blocks write ops with forbidden", async () => {
    const { dispatchOperation } = await import("../index");

    const readerContext = {
      companyId: "company-main",
      role: "hr_reader" as const,
    };

    const listResult = await dispatchOperation({
      operation: "questionnaire.listAssigned",
      input: {
        campaignId: "campaign-main",
      },
      context: readerContext,
    });

    expect(listResult.ok).toBe(true);
    expect(listAssignedQuestionnairesMock).toHaveBeenCalledTimes(1);

    const saveDraftResult = await dispatchOperation({
      operation: "questionnaire.saveDraft",
      input: {
        questionnaireId: "q-main",
        draft: {
          answers: {
            communication: 4,
          },
        },
      },
      context: readerContext,
    });

    expect(saveDraftResult.ok).toBe(false);
    if (!saveDraftResult.ok) {
      expect(saveDraftResult.error.code).toBe("forbidden");
    }
    expect(saveQuestionnaireDraftMock).not.toHaveBeenCalled();

    const submitResult = await dispatchOperation({
      operation: "questionnaire.submit",
      input: {
        questionnaireId: "q-main",
      },
      context: readerContext,
    });

    expect(submitResult.ok).toBe(false);
    if (!submitResult.ok) {
      expect(submitResult.error.code).toBe("forbidden");
    }
    expect(submitQuestionnaireMock).not.toHaveBeenCalled();

    const companyWriteResult = await dispatchOperation({
      operation: "company.updateProfile",
      input: {
        companyId: "company-main",
        name: "Updated Company",
      },
      context: readerContext,
    });

    expect(companyWriteResult.ok).toBe(false);
    if (!companyWriteResult.ok) {
      expect(companyWriteResult.error.code).toBe("forbidden");
    }
  });
});
