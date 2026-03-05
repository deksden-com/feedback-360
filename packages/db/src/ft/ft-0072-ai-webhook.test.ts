import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import {
  applyAiWebhookResult,
  countAiWebhookReceiptsForDebug,
  getAiJobStatusForDebug,
  getCampaignStatusForDebug,
} from "../ai";
import { hasDatabaseUrl } from "../connection-string";
import { createDb, createPool } from "../db";
import { aiJobs, campaigns } from "../schema";
import { runSeedScenario } from "../seeds";

const hasUrl = hasDatabaseUrl();

describe("FT-0072 webhook idempotency receipts", () => {
  it.runIf(hasUrl)(
    "applies webhook once, updates statuses, and keeps idempotent no-op on retry",
    async () => {
      const seeded = await runSeedScenario({
        scenario: "S8_campaign_ended",
      });

      const companyId = seeded.handles["company.main"];
      const campaignId = seeded.handles["campaign.main"];

      expect(companyId).toBeDefined();
      expect(campaignId).toBeDefined();

      if (!companyId || !campaignId) {
        throw new Error("Required seed handles are missing.");
      }

      const aiJobId = "22000000-0000-4000-8000-000000000001";
      const setupPool = createPool();
      try {
        const setupDb = createDb(setupPool);
        await setupDb
          .update(campaigns)
          .set({
            status: "processing_ai",
            updatedAt: new Date("2026-01-21T09:00:00.000Z"),
          })
          .where(eq(campaigns.id, campaignId));

        await setupDb.insert(aiJobs).values({
          id: aiJobId,
          companyId,
          campaignId,
          provider: "external_mock",
          status: "processing",
          idempotencyKey: "ft0072-pending",
          requestPayload: {
            campaignId,
          },
          responsePayload: {},
          requestedAt: new Date("2026-01-21T09:00:00.000Z"),
          createdAt: new Date("2026-01-21T09:00:00.000Z"),
          updatedAt: new Date("2026-01-21T09:00:00.000Z"),
        });
      } finally {
        await setupPool.end();
      }

      const firstApply = await applyAiWebhookResult({
        campaignId,
        aiJobId,
        idempotencyKey: "ft0072-idem-1",
        status: "completed",
        payload: {
          ai_job_id: aiJobId,
          campaign_id: campaignId,
          status: "completed",
        },
      });

      expect(firstApply.applied).toBe(true);
      expect(firstApply.noOp).toBe(false);
      expect(firstApply.campaignStatus).toBe("completed");
      expect(firstApply.aiJobStatus).toBe("completed");

      const secondApply = await applyAiWebhookResult({
        campaignId,
        aiJobId,
        idempotencyKey: "ft0072-idem-1",
        status: "completed",
        payload: {
          ai_job_id: aiJobId,
          campaign_id: campaignId,
          status: "completed",
        },
      });

      expect(secondApply.applied).toBe(false);
      expect(secondApply.noOp).toBe(true);

      const campaignStatus = await getCampaignStatusForDebug(campaignId);
      const aiJobStatus = await getAiJobStatusForDebug(aiJobId);
      const receiptCount = await countAiWebhookReceiptsForDebug("ft0072-idem-1");

      expect(campaignStatus).toBe("completed");
      expect(aiJobStatus).toBe("completed");
      expect(receiptCount).toBe(1);
    },
    30_000,
  );

  it.skipIf(hasUrl)("skips integration run when database URL is absent", () => {
    expect(hasDatabaseUrl()).toBe(false);
  });
});
