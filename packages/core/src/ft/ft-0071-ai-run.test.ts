import {
  getCampaignStatusForDebug,
  hasDatabaseUrl,
  listAiJobsForCampaignForDebug,
  runSeedScenario,
} from "@feedback-360/db";
import { describe, expect, it } from "vitest";

import { dispatchOperation } from "../index";

const hasUrl = hasDatabaseUrl();

describe("FT-0071 ai.runForCampaign", () => {
  it.runIf(hasUrl)(
    "moves ended campaign to completed via mvp stub and keeps idempotency per campaign",
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

      const context = {
        companyId,
        role: "hr_admin" as const,
      };

      const firstRun = await dispatchOperation({
        operation: "ai.runForCampaign",
        input: {
          campaignId,
        },
        context,
      });

      expect(firstRun.ok).toBe(true);
      if (firstRun.ok && "aiJobId" in firstRun.data) {
        expect(firstRun.data.status).toBe("completed");
        expect(firstRun.data.wasAlreadyCompleted).toBe(false);
      }

      const secondRun = await dispatchOperation({
        operation: "ai.runForCampaign",
        input: {
          campaignId,
        },
        context,
      });

      expect(secondRun.ok).toBe(true);
      if (
        firstRun.ok &&
        "aiJobId" in firstRun.data &&
        secondRun.ok &&
        "aiJobId" in secondRun.data
      ) {
        expect(secondRun.data.aiJobId).toBe(firstRun.data.aiJobId);
        expect(secondRun.data.wasAlreadyCompleted).toBe(true);
      }

      const campaignStatus = await getCampaignStatusForDebug(campaignId);
      expect(campaignStatus).toBe("completed");

      const aiJobIds = await listAiJobsForCampaignForDebug(campaignId);
      expect(aiJobIds).toHaveLength(1);
      if (firstRun.ok && "aiJobId" in firstRun.data) {
        expect(aiJobIds[0]).toBe(firstRun.data.aiJobId);
      }
    },
  );

  it.skipIf(hasUrl)("skips integration run when database URL is absent", () => {
    expect(hasDatabaseUrl()).toBe(false);
  });
});
