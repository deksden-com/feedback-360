import { beforeEach, describe, expect, it, vi } from "vitest";

const state = {
  updatedDraftName: "Q1 Campaign Updated",
};

vi.mock("@feedback-360/db", () => {
  return {
    createAuditEvent: async () => undefined,
    listModelVersions: async () => ({
      items: [
        {
          modelVersionId: "model-version-1",
          name: "Q1 Model",
          kind: "indicators" as const,
          version: 1,
          status: "published",
          createdAt: "2026-03-06T09:00:00.000Z",
        },
      ],
    }),
    listCampaigns: async ({ companyId, status }: { companyId: string; status?: string }) => ({
      items: [
        {
          campaignId: "campaign-main",
          companyId,
          name: state.updatedDraftName,
          status: (status ?? "draft") as
            | "draft"
            | "started"
            | "ended"
            | "processing_ai"
            | "ai_failed"
            | "completed",
          modelVersionId: "model-version-1",
          modelName: "Q1 Model",
          modelKind: "indicators" as const,
          modelVersion: 1,
          startAt: "2026-04-01T09:00:00.000Z",
          endAt: "2026-04-30T18:00:00.000Z",
          timezone: "Europe/Kaliningrad",
          createdAt: "2026-03-06T10:00:00.000Z",
          updatedAt: "2026-03-06T10:00:00.000Z",
        },
      ],
    }),
    getCampaign: async ({
      campaignId,
      companyId,
    }: {
      campaignId: string;
      companyId: string;
    }) => ({
      campaignId,
      companyId,
      name: state.updatedDraftName,
      status: "draft" as const,
      modelVersionId: "model-version-1",
      modelName: "Q1 Model",
      modelKind: "indicators" as const,
      modelVersion: 1,
      startAt: "2026-04-01T09:00:00.000Z",
      endAt: "2026-04-30T18:00:00.000Z",
      timezone: "Europe/Kaliningrad",
      createdAt: "2026-03-06T10:00:00.000Z",
      updatedAt: "2026-03-06T10:00:00.000Z",
      managerWeight: 40,
      peersWeight: 30,
      subordinatesWeight: 30,
      selfWeight: 0,
    }),
    updateCampaignDraft: async ({
      campaignId,
      companyId,
      name,
      modelVersionId,
      startAt,
      endAt,
      timezone,
    }: {
      campaignId: string;
      companyId: string;
      name: string;
      modelVersionId: string;
      startAt: string;
      endAt: string;
      timezone?: string;
    }) => {
      state.updatedDraftName = name;
      return {
        campaignId,
        companyId,
        modelVersionId,
        name,
        status: "draft" as const,
        startAt,
        endAt,
        timezone: timezone ?? "Europe/Kaliningrad",
        changed: true,
        updatedAt: "2026-03-06T11:00:00.000Z",
      };
    },
  };
});

describe("FT-0121 HR campaign list/detail operations (no-db)", () => {
  beforeEach(() => {
    state.updatedDraftName = "Q1 Campaign Updated";
  });

  it("supports list/get/updateDraft and model listing for HR", async () => {
    const { dispatchOperation } = await import("../index");
    const context = {
      companyId: "company-main",
      role: "hr_admin" as const,
    };

    const models = await dispatchOperation({
      operation: "model.version.list",
      input: {},
      context,
    });
    expect(models.ok).toBe(true);

    const campaigns = await dispatchOperation({
      operation: "campaign.list",
      input: { status: "draft" },
      context,
    });
    expect(campaigns.ok).toBe(true);

    const detail = await dispatchOperation({
      operation: "campaign.get",
      input: { campaignId: "campaign-main" },
      context,
    });
    expect(detail.ok).toBe(true);

    const updated = await dispatchOperation({
      operation: "campaign.updateDraft",
      input: {
        campaignId: "campaign-main",
        name: "Q2 Campaign",
        modelVersionId: "model-version-1",
        startAt: "2026-04-02T09:00:00.000Z",
        endAt: "2026-04-28T18:00:00.000Z",
        timezone: "Europe/Kaliningrad",
      },
      context,
    });
    expect(updated.ok).toBe(true);
    if (updated.ok) {
      expect("name" in updated.data ? updated.data.name : undefined).toBe("Q2 Campaign");
      expect("changed" in updated.data ? updated.data.changed : undefined).toBe(true);
    }
  });

  it("keeps campaign list/detail forbidden for non-HR roles", async () => {
    const { dispatchOperation } = await import("../index");
    const result = await dispatchOperation({
      operation: "campaign.list",
      input: {},
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
