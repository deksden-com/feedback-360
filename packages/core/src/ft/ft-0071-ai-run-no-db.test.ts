import { beforeEach, describe, expect, it, vi } from "vitest";

const state = {
  aiJobId: "ai-job-main",
  callCount: 0,
};

vi.mock("@feedback-360/db", () => {
  return {
    runAiForCampaign: async ({ campaignId }: { companyId: string; campaignId: string }) => {
      state.callCount += 1;
      return {
        campaignId,
        aiJobId: state.aiJobId,
        provider: "mvp_stub" as const,
        status: "completed" as const,
        completedAt: "2026-01-21T10:00:00.000Z",
        wasAlreadyCompleted: state.callCount > 1,
      };
    },
  };
});

describe("FT-0071 ai.runForCampaign (no-db acceptance)", () => {
  beforeEach(() => {
    state.callCount = 0;
  });

  it("allows HR admin to run AI processing and returns idempotent completed result", async () => {
    const { dispatchOperation } = await import("../index");

    const firstRun = await dispatchOperation({
      operation: "ai.runForCampaign",
      input: {
        campaignId: "campaign-main",
      },
      context: {
        companyId: "company-main",
        role: "hr_admin",
      },
    });

    expect(firstRun.ok).toBe(true);
    if (firstRun.ok && "aiJobId" in firstRun.data) {
      expect(firstRun.data.aiJobId).toBe("ai-job-main");
      expect(firstRun.data.status).toBe("completed");
      expect(firstRun.data.wasAlreadyCompleted).toBe(false);
    }

    const secondRun = await dispatchOperation({
      operation: "ai.runForCampaign",
      input: {
        campaignId: "campaign-main",
      },
      context: {
        companyId: "company-main",
        role: "hr_admin",
      },
    });

    expect(secondRun.ok).toBe(true);
    if (secondRun.ok && "aiJobId" in secondRun.data) {
      expect(secondRun.data.wasAlreadyCompleted).toBe(true);
    }
    expect(state.callCount).toBe(2);
  });

  it("blocks non-hr-admin roles", async () => {
    const { dispatchOperation } = await import("../index");

    const result = await dispatchOperation({
      operation: "ai.runForCampaign",
      input: {
        campaignId: "campaign-main",
      },
      context: {
        companyId: "company-main",
        role: "manager",
      },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("forbidden");
    }
    expect(state.callCount).toBe(0);
  });
});
