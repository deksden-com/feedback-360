import { createOperationError } from "@feedback-360/api-contract";
import { beforeEach, describe, expect, it, vi } from "vitest";

const campaignState = {
  statusByCampaignId: new Map<string, "draft" | "started" | "ended">(),
};

const ensureCampaignStatus = (campaignId: string): "draft" | "started" | "ended" => {
  return campaignState.statusByCampaignId.get(campaignId) ?? "draft";
};

vi.mock("@feedback-360/db", () => {
  return {
    createAuditEvent: async () => undefined,
    startCampaign: async ({
      campaignId,
    }: {
      companyId: string;
      campaignId: string;
    }) => {
      const previousStatus = ensureCampaignStatus(campaignId);
      if (previousStatus !== "draft" && previousStatus !== "started") {
        throw createOperationError(
          "invalid_transition",
          "Campaign can be started only from draft.",
        );
      }

      const changed = previousStatus !== "started";
      campaignState.statusByCampaignId.set(campaignId, "started");
      return {
        campaignId,
        previousStatus,
        status: "started" as const,
        changed,
        updatedAt: "2026-03-04T12:00:00.000Z",
      };
    },
    stopCampaign: async ({
      campaignId,
    }: {
      companyId: string;
      campaignId: string;
    }) => {
      const previousStatus = ensureCampaignStatus(campaignId);
      if (previousStatus !== "started" && previousStatus !== "ended") {
        throw createOperationError(
          "invalid_transition",
          "Campaign can be ended only from started.",
        );
      }

      const changed = previousStatus !== "ended";
      campaignState.statusByCampaignId.set(campaignId, "ended");
      return {
        campaignId,
        previousStatus,
        status: "ended" as const,
        changed,
        updatedAt: "2026-03-04T12:10:00.000Z",
      };
    },
    endCampaign: async ({
      campaignId,
    }: {
      companyId: string;
      campaignId: string;
    }) => {
      const previousStatus = ensureCampaignStatus(campaignId);
      if (previousStatus !== "started" && previousStatus !== "ended") {
        throw createOperationError(
          "invalid_transition",
          "Campaign can be ended only from started.",
        );
      }

      const changed = previousStatus !== "ended";
      campaignState.statusByCampaignId.set(campaignId, "ended");
      return {
        campaignId,
        previousStatus,
        status: "ended" as const,
        changed,
        updatedAt: "2026-03-04T12:10:00.000Z",
      };
    },
    createCampaign: async () => ({
      campaignId: "campaign-main",
      companyId: "company-main",
      modelVersionId: "model-version-main",
      name: "Campaign",
      status: "draft" as const,
      startAt: "2026-03-10T09:00:00.000Z",
      endAt: "2026-03-20T18:00:00.000Z",
      timezone: "Europe/Kaliningrad",
      createdAt: "2026-03-04T10:05:00.000Z",
    }),
    createModelVersion: async () => ({
      modelVersionId: "model-version-main",
      companyId: "company-main",
      name: "Model",
      kind: "indicators" as const,
      version: 1,
      createdAt: "2026-03-04T10:00:00.000Z",
      groupCount: 1,
      competencyCount: 1,
      indicatorCount: 2,
      levelCount: 0,
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

describe("FT-0042 campaign lifecycle transitions (no-db)", () => {
  beforeEach(() => {
    campaignState.statusByCampaignId = new Map([["campaign-main", "draft"]]);
  });

  it("supports idempotent start/end transitions and rejects invalid reverse transition", async () => {
    const { dispatchOperation } = await import("../index");
    const context = {
      companyId: "company-main",
      role: "hr_admin" as const,
    };

    const startOnce = await dispatchOperation({
      operation: "campaign.start",
      input: { campaignId: "campaign-main" },
      context,
    });
    expect(startOnce.ok).toBe(true);
    if (startOnce.ok && "status" in startOnce.data && "changed" in startOnce.data) {
      expect(startOnce.data.status).toBe("started");
      expect(startOnce.data.changed).toBe(true);
    }

    const startTwice = await dispatchOperation({
      operation: "campaign.start",
      input: { campaignId: "campaign-main" },
      context,
    });
    expect(startTwice.ok).toBe(true);
    if (startTwice.ok && "status" in startTwice.data && "changed" in startTwice.data) {
      expect(startTwice.data.status).toBe("started");
      expect(startTwice.data.changed).toBe(false);
    }

    const stopOnce = await dispatchOperation({
      operation: "campaign.stop",
      input: { campaignId: "campaign-main" },
      context,
    });
    expect(stopOnce.ok).toBe(true);
    if (stopOnce.ok && "status" in stopOnce.data && "changed" in stopOnce.data) {
      expect(stopOnce.data.status).toBe("ended");
      expect(stopOnce.data.changed).toBe(true);
    }

    const stopTwice = await dispatchOperation({
      operation: "campaign.stop",
      input: { campaignId: "campaign-main" },
      context,
    });
    expect(stopTwice.ok).toBe(true);
    if (stopTwice.ok && "status" in stopTwice.data && "changed" in stopTwice.data) {
      expect(stopTwice.data.status).toBe("ended");
      expect(stopTwice.data.changed).toBe(false);
    }

    const startAfterEnded = await dispatchOperation({
      operation: "campaign.start",
      input: { campaignId: "campaign-main" },
      context,
    });
    expect(startAfterEnded.ok).toBe(false);
    if (!startAfterEnded.ok) {
      expect(startAfterEnded.error.code).toBe("invalid_transition");
    }
  });

  it("returns forbidden when non-hr role attempts lifecycle transition", async () => {
    const { dispatchOperation } = await import("../index");
    const result = await dispatchOperation({
      operation: "campaign.start",
      input: { campaignId: "campaign-main" },
      context: {
        companyId: "company-main",
        role: "employee",
      },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("forbidden");
    }
  });
});
