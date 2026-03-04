import { createOperationError } from "@feedback-360/api-contract";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = {
  lockedAt: "",
};

vi.mock("@feedback-360/db", () => {
  return {
    setCampaignWeights: async ({
      campaignId,
      manager,
      peers,
      subordinates,
    }: {
      companyId: string;
      campaignId: string;
      manager: number;
      peers: number;
      subordinates: number;
    }) => {
      if (state.lockedAt) {
        throw createOperationError("campaign_locked", "Campaign matrix is locked.", {
          campaignId,
          lockedAt: state.lockedAt,
        });
      }

      return {
        campaignId,
        manager,
        peers,
        subordinates,
        self: 0 as const,
        changed: true,
        updatedAt: "2026-03-04T12:00:00.000Z",
      };
    },
    setMatrixAssignments: async ({
      campaignId,
      assignments,
    }: {
      companyId: string;
      campaignId: string;
      assignments: Array<{
        subjectEmployeeId: string;
        raterEmployeeId: string;
        raterRole: "manager" | "peer" | "subordinate" | "self";
      }>;
    }) => {
      if (state.lockedAt) {
        throw createOperationError("campaign_locked", "Campaign matrix is locked.", {
          campaignId,
          lockedAt: state.lockedAt,
        });
      }

      return {
        campaignId,
        totalAssignments: assignments.length,
      };
    },
    saveQuestionnaireDraft: async ({ questionnaireId }: { questionnaireId: string }) => {
      state.lockedAt = "2026-03-04T12:05:00.000Z";
      return {
        questionnaireId,
        status: "in_progress" as const,
        campaignLockedAt: state.lockedAt,
      };
    },
  };
});

describe("FT-0044 lock on first draft save (no-db)", () => {
  beforeEach(() => {
    state.lockedAt = "";
  });

  it("allows matrix/weights before first draft and blocks both operations after lock", async () => {
    const { dispatchOperation } = await import("../index");

    const hrContext = {
      companyId: "company-main",
      role: "hr_admin" as const,
    };
    const employeeContext = {
      companyId: "company-main",
      role: "employee" as const,
    };

    const beforeLockWeights = await dispatchOperation({
      operation: "campaign.weights.set",
      input: {
        campaignId: "campaign-main",
        manager: 40,
        peers: 30,
        subordinates: 30,
      },
      context: hrContext,
    });
    expect(beforeLockWeights.ok).toBe(true);

    const beforeLockMatrix = await dispatchOperation({
      operation: "matrix.set",
      input: {
        campaignId: "campaign-main",
        assignments: [
          {
            subjectEmployeeId: "employee-staff-a1",
            raterEmployeeId: "employee-head-a",
            raterRole: "manager",
          },
        ],
      },
      context: hrContext,
    });
    expect(beforeLockMatrix.ok).toBe(true);

    const saveDraft = await dispatchOperation({
      operation: "questionnaire.saveDraft",
      input: {
        questionnaireId: "questionnaire-main",
        draft: {
          answers: { leadership: 4 },
        },
      },
      context: employeeContext,
    });
    expect(saveDraft.ok).toBe(true);
    if (saveDraft.ok && "campaignLockedAt" in saveDraft.data) {
      expect(saveDraft.data.campaignLockedAt).toBe("2026-03-04T12:05:00.000Z");
    }

    const afterLockWeights = await dispatchOperation({
      operation: "campaign.weights.set",
      input: {
        campaignId: "campaign-main",
        manager: 50,
        peers: 25,
        subordinates: 25,
      },
      context: hrContext,
    });
    expect(afterLockWeights.ok).toBe(false);
    if (!afterLockWeights.ok) {
      expect(afterLockWeights.error.code).toBe("campaign_locked");
    }

    const afterLockMatrix = await dispatchOperation({
      operation: "matrix.set",
      input: {
        campaignId: "campaign-main",
        assignments: [
          {
            subjectEmployeeId: "employee-staff-a1",
            raterEmployeeId: "employee-head-b",
            raterRole: "manager",
          },
        ],
      },
      context: hrContext,
    });
    expect(afterLockMatrix.ok).toBe(false);
    if (!afterLockMatrix.ok) {
      expect(afterLockMatrix.error.code).toBe("campaign_locked");
    }
  });
});
