import {
  countNotificationAttemptsForCampaignForDebug,
  hasDatabaseUrl,
  listNotificationOutboxForCampaignForDebug,
  runSeedScenario,
} from "@feedback-360/db";
import { describe, expect, it } from "vitest";

import { dispatchOperation } from "../index";

const hasUrl = hasDatabaseUrl();

describe("FT-0061 notifications outbox dispatcher", () => {
  it.runIf(hasUrl)(
    "generates reminder outbox rows idempotently and dispatches pending rows",
    async () => {
      const seeded = await runSeedScenario({
        scenario: "S5_campaign_started_no_answers",
      });

      const companyId = seeded.handles["company.main"];
      const campaignId = seeded.handles["campaign.main"];
      expect(companyId).toBeDefined();
      expect(campaignId).toBeDefined();

      if (!companyId || !campaignId) {
        throw new Error("Required seed handles are missing.");
      }

      const hrContext = {
        companyId,
        role: "hr_admin" as const,
      };

      const generatedFirst = await dispatchOperation({
        operation: "notifications.generateReminders",
        input: {
          campaignId,
        },
        context: hrContext,
      });
      expect(generatedFirst.ok).toBe(true);
      if (generatedFirst.ok && "generated" in generatedFirst.data) {
        expect(generatedFirst.data.campaignId).toBe(campaignId);
        expect(generatedFirst.data.candidateRecipients).toBeGreaterThanOrEqual(1);
        expect(generatedFirst.data.generated).toBe(1);
        expect(generatedFirst.data.deduplicated).toBe(0);
      }

      const generatedSecond = await dispatchOperation({
        operation: "notifications.generateReminders",
        input: {
          campaignId,
        },
        context: hrContext,
      });
      expect(generatedSecond.ok).toBe(true);
      if (generatedSecond.ok && "generated" in generatedSecond.data) {
        expect(generatedSecond.data.generated).toBe(0);
        expect(generatedSecond.data.deduplicated).toBeGreaterThanOrEqual(1);
      }

      const dispatchResult = await dispatchOperation({
        operation: "notifications.dispatchOutbox",
        input: {
          campaignId,
          provider: "stub",
        },
        context: hrContext,
      });
      expect(dispatchResult.ok).toBe(true);
      if (dispatchResult.ok && "processed" in dispatchResult.data) {
        expect(dispatchResult.data.provider).toBe("stub");
        expect(dispatchResult.data.processed).toBe(1);
        expect(dispatchResult.data.sent).toBe(1);
        expect(dispatchResult.data.failed).toBe(0);
        expect(dispatchResult.data.remainingPending).toBe(0);
      }

      const forbiddenResult = await dispatchOperation({
        operation: "notifications.generateReminders",
        input: {
          campaignId,
        },
        context: {
          companyId,
          role: "hr_reader",
        },
      });
      expect(forbiddenResult.ok).toBe(false);
      if (!forbiddenResult.ok) {
        expect(forbiddenResult.error.code).toBe("forbidden");
      }

      const outboxRows = await listNotificationOutboxForCampaignForDebug(campaignId);
      expect(outboxRows.length).toBe(1);
      expect(outboxRows[0]?.status).toBe("sent");
      expect(outboxRows[0]?.attempts).toBe(1);
      expect(outboxRows[0]?.eventType).toBe("campaign_reminder");

      const attemptCount = await countNotificationAttemptsForCampaignForDebug(campaignId);
      expect(attemptCount).toBe(1);
    },
    60_000,
  );

  it.skipIf(hasUrl)("skips integration run when database URL is absent", () => {
    expect(hasDatabaseUrl()).toBe(false);
  });
});
