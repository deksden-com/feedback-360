import { createOperationError } from "@feedback-360/api-contract";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = {
  campaignStatusById: new Map<string, "draft" | "started">(),
  campaignModelById: new Map<string, string>(),
  participantsByCampaign: new Map<string, Set<string>>(),
};

const getCampaignStatus = (campaignId: string): "draft" | "started" => {
  return state.campaignStatusById.get(campaignId) ?? "draft";
};

const ensureDraftCampaign = (campaignId: string): void => {
  if (getCampaignStatus(campaignId) !== "draft") {
    throw createOperationError(
      "campaign_started_immutable",
      "Campaign entities are immutable after start.",
      { campaignId },
    );
  }
};

vi.mock("@feedback-360/db", () => {
  return {
    setCampaignModelVersion: async ({
      campaignId,
      modelVersionId,
    }: {
      companyId: string;
      campaignId: string;
      modelVersionId: string;
    }) => {
      ensureDraftCampaign(campaignId);
      const previousModel = state.campaignModelById.get(campaignId);
      state.campaignModelById.set(campaignId, modelVersionId);
      return {
        campaignId,
        modelVersionId,
        changed: previousModel !== modelVersionId,
        updatedAt: "2026-03-04T12:00:00.000Z",
      };
    },
    addCampaignParticipants: async ({
      campaignId,
      employeeIds,
    }: {
      companyId: string;
      campaignId: string;
      employeeIds: string[];
    }) => {
      ensureDraftCampaign(campaignId);
      const current = state.participantsByCampaign.get(campaignId) ?? new Set<string>();
      const changedEmployeeIds: string[] = [];
      for (const employeeId of employeeIds) {
        if (!current.has(employeeId)) {
          current.add(employeeId);
          changedEmployeeIds.push(employeeId);
        }
      }
      state.participantsByCampaign.set(campaignId, current);

      return {
        campaignId,
        changedEmployeeIds,
        totalParticipants: current.size,
      };
    },
    removeCampaignParticipants: async ({
      campaignId,
      employeeIds,
    }: {
      companyId: string;
      campaignId: string;
      employeeIds: string[];
    }) => {
      ensureDraftCampaign(campaignId);
      const current = state.participantsByCampaign.get(campaignId) ?? new Set<string>();
      const changedEmployeeIds: string[] = [];
      for (const employeeId of employeeIds) {
        if (current.delete(employeeId)) {
          changedEmployeeIds.push(employeeId);
        }
      }
      state.participantsByCampaign.set(campaignId, current);

      return {
        campaignId,
        changedEmployeeIds,
        totalParticipants: current.size,
      };
    },
    startCampaign: async ({
      campaignId,
    }: {
      companyId: string;
      campaignId: string;
    }) => {
      const previousStatus = getCampaignStatus(campaignId);
      if (previousStatus !== "draft" && previousStatus !== "started") {
        throw createOperationError(
          "invalid_transition",
          "Campaign can be started only from draft.",
        );
      }

      const changed = previousStatus !== "started";
      state.campaignStatusById.set(campaignId, "started");
      return {
        campaignId,
        previousStatus,
        status: "started" as const,
        changed,
        updatedAt: "2026-03-04T12:10:00.000Z",
      };
    },
    createCampaign: async () => ({
      campaignId: "campaign-main",
      companyId: "company-main",
      modelVersionId: "model-version-main",
      name: "Q1 campaign",
      status: "draft" as const,
      startAt: "2026-03-10T09:00:00.000Z",
      endAt: "2026-03-20T18:00:00.000Z",
      timezone: "Europe/Kaliningrad",
      createdAt: "2026-03-04T10:00:00.000Z",
    }),
    createModelVersion: async () => ({
      modelVersionId: "model-version-main",
      companyId: "company-main",
      name: "Model",
      kind: "indicators" as const,
      version: 1,
      createdAt: "2026-03-04T09:00:00.000Z",
      groupCount: 1,
      competencyCount: 1,
      indicatorCount: 2,
      levelCount: 0,
    }),
    stopCampaign: async () => ({
      campaignId: "campaign-main",
      previousStatus: "started" as const,
      status: "ended" as const,
      changed: true,
      updatedAt: "2026-03-04T12:20:00.000Z",
    }),
    endCampaign: async () => ({
      campaignId: "campaign-main",
      previousStatus: "started" as const,
      status: "ended" as const,
      changed: true,
      updatedAt: "2026-03-04T12:20:00.000Z",
    }),
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

describe("FT-0043 started immutability (no-db)", () => {
  beforeEach(() => {
    state.campaignStatusById = new Map([["campaign-main", "draft"]]);
    state.campaignModelById = new Map([["campaign-main", "model-version-1"]]);
    state.participantsByCampaign = new Map([["campaign-main", new Set<string>(["employee-1"])]]);
  });

  it("allows model/participants mutation in draft and blocks after campaign start", async () => {
    const { dispatchOperation } = await import("../index");
    const context = {
      companyId: "company-main",
      role: "hr_admin" as const,
    };

    const setModelDraft = await dispatchOperation({
      operation: "campaign.setModelVersion",
      input: {
        campaignId: "campaign-main",
        modelVersionId: "model-version-2",
      },
      context,
    });
    expect(setModelDraft.ok).toBe(true);

    const addParticipantsDraft = await dispatchOperation({
      operation: "campaign.participants.add",
      input: {
        campaignId: "campaign-main",
        employeeIds: ["employee-2", "employee-3"],
      },
      context,
    });
    expect(addParticipantsDraft.ok).toBe(true);

    const removeParticipantsDraft = await dispatchOperation({
      operation: "campaign.participants.remove",
      input: {
        campaignId: "campaign-main",
        employeeIds: ["employee-1"],
      },
      context,
    });
    expect(removeParticipantsDraft.ok).toBe(true);

    const startCampaign = await dispatchOperation({
      operation: "campaign.start",
      input: {
        campaignId: "campaign-main",
      },
      context,
    });
    expect(startCampaign.ok).toBe(true);

    const setModelStarted = await dispatchOperation({
      operation: "campaign.setModelVersion",
      input: {
        campaignId: "campaign-main",
        modelVersionId: "model-version-3",
      },
      context,
    });
    expect(setModelStarted.ok).toBe(false);
    if (!setModelStarted.ok) {
      expect(setModelStarted.error.code).toBe("campaign_started_immutable");
    }

    const addParticipantsStarted = await dispatchOperation({
      operation: "campaign.participants.add",
      input: {
        campaignId: "campaign-main",
        employeeIds: ["employee-4"],
      },
      context,
    });
    expect(addParticipantsStarted.ok).toBe(false);
    if (!addParticipantsStarted.ok) {
      expect(addParticipantsStarted.error.code).toBe("campaign_started_immutable");
    }

    const removeParticipantsStarted = await dispatchOperation({
      operation: "campaign.participants.remove",
      input: {
        campaignId: "campaign-main",
        employeeIds: ["employee-2"],
      },
      context,
    });
    expect(removeParticipantsStarted.ok).toBe(false);
    if (!removeParticipantsStarted.ok) {
      expect(removeParticipantsStarted.error.code).toBe("campaign_started_immutable");
    }
  });
});
