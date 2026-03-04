import { createOperationError } from "@feedback-360/api-contract";
import { beforeEach, describe, expect, it, vi } from "vitest";

type MockState = {
  nextModelVersion: number;
};

const state: MockState = {
  nextModelVersion: 1,
};

vi.mock("@feedback-360/db", () => {
  return {
    createModelVersion: async ({
      companyId,
      name,
      kind,
      groups,
    }: {
      companyId: string;
      name: string;
      kind: "indicators" | "levels";
      groups: Array<{ weight: number }>;
    }) => {
      const totalWeight = groups.reduce((sum, group) => sum + group.weight, 0);
      if (totalWeight !== 100) {
        throw createOperationError("invalid_input", "Sum of group weights must be exactly 100.");
      }

      const modelVersion = state.nextModelVersion;
      state.nextModelVersion += 1;
      return {
        modelVersionId: `model-version-${modelVersion}`,
        companyId,
        name,
        kind,
        version: modelVersion,
        createdAt: "2026-03-04T10:00:00.000Z",
        groupCount: groups.length,
        competencyCount: 2,
        indicatorCount: 4,
        levelCount: 0,
      };
    },
    createCampaign: async ({
      companyId,
      modelVersionId,
      name,
      startAt,
      endAt,
      timezone,
    }: {
      companyId: string;
      modelVersionId: string;
      name: string;
      startAt: string;
      endAt: string;
      timezone?: string;
    }) => {
      return {
        campaignId: "campaign-main",
        companyId,
        modelVersionId,
        name,
        status: "draft" as const,
        startAt,
        endAt,
        timezone: timezone ?? "Europe/Kaliningrad",
        createdAt: "2026-03-04T10:05:00.000Z",
      };
    },
    addCampaignParticipantsFromDepartments: async () => ({
      campaignId: "campaign-main",
      addedEmployeeIds: [],
      totalParticipants: 0,
    }),
    generateSuggestedMatrix: async () => ({
      campaignId: "campaign-main",
      generatedAssignments: [],
      totalAssignments: 0,
    }),
    listActiveEmployees: async () => ({ items: [] }),
    listAssignedQuestionnaires: async () => ({ items: [] }),
    listCampaignEmployeeSnapshots: async () => ({ items: [] }),
    moveEmployeeDepartment: async () => ({
      employeeId: "employee-main",
      departmentId: "department-main",
      changed: false,
      effectiveAt: "2026-03-04T10:00:00.000Z",
    }),
    runAiForCampaign: async () => ({
      campaignId: "campaign-main",
      aiJobId: "ai-job-main",
      provider: "mvp_stub" as const,
      status: "completed" as const,
      completedAt: "2026-03-04T10:00:00.000Z",
      wasAlreadyCompleted: false,
    }),
    saveQuestionnaireDraft: async () => ({
      questionnaireId: "questionnaire-main",
      status: "in_progress" as const,
      campaignLockedAt: "2026-03-04T10:00:00.000Z",
    }),
    setEmployeeManager: async () => ({
      employeeId: "employee-main",
      managerEmployeeId: "manager-main",
      changed: false,
      effectiveAt: "2026-03-04T10:00:00.000Z",
    }),
    submitQuestionnaire: async () => ({
      questionnaireId: "questionnaire-main",
      status: "submitted" as const,
      submittedAt: "2026-03-04T10:00:00.000Z",
      wasAlreadySubmitted: false,
    }),
    upsertEmployee: async () => ({
      employeeId: "employee-main",
      companyId: "company-main",
      isActive: true,
      updatedAt: "2026-03-04T10:00:00.000Z",
      created: false,
    }),
  };
});

describe("FT-0041 models v1 (no-db acceptance)", () => {
  beforeEach(() => {
    state.nextModelVersion = 1;
  });

  it("creates model version and campaign through dispatcher with hr_admin role", async () => {
    const { dispatchOperation } = await import("../index");
    const context = {
      companyId: "company-main",
      role: "hr_admin" as const,
    };

    const modelResult = await dispatchOperation({
      operation: "model.version.create",
      input: {
        name: "Q1 Model",
        kind: "indicators",
        groups: [
          {
            name: "Execution",
            weight: 100,
            competencies: [
              {
                name: "Delivery",
                indicators: [
                  { text: "Keeps commitments", order: 1 },
                  { text: "Communicates risks", order: 2 },
                ],
              },
            ],
          },
        ],
      },
      context,
    });

    expect(modelResult.ok).toBe(true);
    if (
      !modelResult.ok ||
      !("modelVersionId" in modelResult.data) ||
      !("groupCount" in modelResult.data)
    ) {
      return;
    }

    expect(modelResult.data.companyId).toBe("company-main");
    expect(modelResult.data.kind).toBe("indicators");
    expect(modelResult.data.groupCount).toBe(1);
    expect(modelResult.data.indicatorCount).toBe(4);

    const campaignResult = await dispatchOperation({
      operation: "campaign.create",
      input: {
        name: "Q1 2026",
        modelVersionId: modelResult.data.modelVersionId,
        startAt: "2026-03-10T09:00:00.000Z",
        endAt: "2026-03-20T18:00:00.000Z",
      },
      context,
    });

    expect(campaignResult.ok).toBe(true);
    if (
      !campaignResult.ok ||
      !("campaignId" in campaignResult.data) ||
      !("modelVersionId" in campaignResult.data) ||
      !("timezone" in campaignResult.data)
    ) {
      return;
    }

    expect(campaignResult.data.companyId).toBe("company-main");
    expect(campaignResult.data.modelVersionId).toBe(modelResult.data.modelVersionId);
    expect(campaignResult.data.status).toBe("draft");
  });

  it("returns invalid_input for non-normalized group weights", async () => {
    const { dispatchOperation } = await import("../index");

    const result = await dispatchOperation({
      operation: "model.version.create",
      input: {
        name: "Invalid model",
        kind: "indicators",
        groups: [
          {
            name: "Execution",
            weight: 80,
            competencies: [
              {
                name: "Delivery",
                indicators: [{ text: "Keeps commitments" }],
              },
            ],
          },
        ],
      },
      context: {
        companyId: "company-main",
        role: "hr_admin",
      },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("invalid_input");
    }
  });
});
