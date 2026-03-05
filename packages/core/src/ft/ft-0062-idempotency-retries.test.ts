import {
  countNotificationAttemptsForCampaignForDebug,
  hasDatabaseUrl,
  listNotificationAttemptsForCampaignForDebug,
  listNotificationOutboxForCampaignForDebug,
  runSeedScenario,
  setNotificationOutboxNextRetryAtForDebug,
  updateNotificationOutboxPayloadForDebug,
} from "@feedback-360/db";
import { describe, expect, it } from "vitest";

import { dispatchOperation } from "../index";

const hasUrl = hasDatabaseUrl();

describe("FT-0062 notification idempotency and retries", () => {
  it.runIf(hasUrl)(
    "deduplicates outbox and retries transient failures with backoff",
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

      const outboxBefore = await listNotificationOutboxForCampaignForDebug(campaignId);
      expect(outboxBefore.length).toBe(1);
      const outboxId = outboxBefore[0]?.outboxId;
      if (!outboxId) {
        throw new Error("Expected outbox row to be created.");
      }

      await updateNotificationOutboxPayloadForDebug(outboxId, {
        __stubFailUntilAttempt: 1,
        pendingCount: 1,
        campaignName: "Q1 360 Campaign",
      });

      const failedDispatch = await dispatchOperation({
        operation: "notifications.dispatchOutbox",
        input: {
          campaignId,
          provider: "stub",
        },
        context: hrContext,
      });
      expect(failedDispatch.ok).toBe(true);
      if (failedDispatch.ok && "processed" in failedDispatch.data) {
        expect(failedDispatch.data.processed).toBe(1);
        expect(failedDispatch.data.sent).toBe(0);
        expect(failedDispatch.data.failed).toBe(1);
        expect(failedDispatch.data.remainingPending).toBe(1);
      }

      const outboxAfterFirstAttempt = await listNotificationOutboxForCampaignForDebug(campaignId);
      expect(outboxAfterFirstAttempt.length).toBe(1);
      expect(outboxAfterFirstAttempt[0]?.status).toBe("pending");
      expect(outboxAfterFirstAttempt[0]?.attempts).toBe(1);
      expect(outboxAfterFirstAttempt[0]?.nextRetryAt).not.toBeNull();
      expect(outboxAfterFirstAttempt[0]?.lastError).toContain("transient failure");

      await setNotificationOutboxNextRetryAtForDebug(
        outboxId,
        new Date("2099-01-01T00:00:00.000Z"),
      );

      const immediateRetry = await dispatchOperation({
        operation: "notifications.dispatchOutbox",
        input: {
          campaignId,
          provider: "stub",
        },
        context: hrContext,
      });
      expect(immediateRetry.ok).toBe(true);
      if (immediateRetry.ok && "processed" in immediateRetry.data) {
        expect(immediateRetry.data.processed).toBe(0);
        expect(immediateRetry.data.sent).toBe(0);
      }

      await setNotificationOutboxNextRetryAtForDebug(
        outboxId,
        new Date("2000-01-01T00:00:00.000Z"),
      );

      const successfulRetry = await dispatchOperation({
        operation: "notifications.dispatchOutbox",
        input: {
          campaignId,
          provider: "stub",
        },
        context: hrContext,
      });
      expect(successfulRetry.ok).toBe(true);
      if (successfulRetry.ok && "processed" in successfulRetry.data) {
        expect(successfulRetry.data.processed).toBe(1);
        expect(successfulRetry.data.sent).toBe(1);
        expect(successfulRetry.data.failed).toBe(0);
        expect(successfulRetry.data.remainingPending).toBe(0);
      }

      const outboxFinal = await listNotificationOutboxForCampaignForDebug(campaignId);
      expect(outboxFinal.length).toBe(1);
      expect(outboxFinal[0]?.status).toBe("sent");
      expect(outboxFinal[0]?.attempts).toBe(2);
      expect(outboxFinal[0]?.nextRetryAt).toBeNull();
      expect(outboxFinal[0]?.lastError).toBeNull();

      const attempts = await listNotificationAttemptsForCampaignForDebug(campaignId);
      expect(attempts.map((attempt) => attempt.status)).toEqual(["retry_scheduled", "sent"]);
      expect(await countNotificationAttemptsForCampaignForDebug(campaignId)).toBe(2);
    },
    60_000,
  );

  it.skipIf(hasUrl)("skips integration run when database URL is absent", () => {
    expect(hasDatabaseUrl()).toBe(false);
  });
});
