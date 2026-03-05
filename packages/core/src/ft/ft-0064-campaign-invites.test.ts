import {
  hasDatabaseUrl,
  listNotificationOutboxForCampaignForDebug,
  runSeedScenario,
} from "@feedback-360/db";
import { describe, expect, it } from "vitest";

import { dispatchOperation } from "../index";

const hasUrl = hasDatabaseUrl();

describe("FT-0064 campaign start invites", () => {
  it.runIf(hasUrl)(
    "creates invite outbox rows on campaign start and keeps idempotency on repeated start",
    async () => {
      const seeded = await runSeedScenario({
        scenario: "S4_campaign_draft",
        variant: "no_participants",
      });

      const companyId = seeded.handles["company.main"];
      const campaignId = seeded.handles["campaign.main"];
      const departmentAId = seeded.handles["department.a"];
      expect(companyId).toBeDefined();
      expect(campaignId).toBeDefined();
      expect(departmentAId).toBeDefined();
      if (!companyId || !campaignId || !departmentAId) {
        throw new Error("Required seed handles are missing.");
      }

      const hrContext = {
        companyId,
        role: "hr_admin" as const,
      };

      const addParticipants = await dispatchOperation({
        operation: "campaign.participants.addFromDepartments",
        input: {
          campaignId,
          departmentIds: [departmentAId],
          includeSelf: true,
        },
        context: hrContext,
      });
      expect(addParticipants.ok).toBe(true);
      if (addParticipants.ok && "totalParticipants" in addParticipants.data) {
        expect(addParticipants.data.totalParticipants).toBeGreaterThanOrEqual(1);
      }

      const startOnce = await dispatchOperation({
        operation: "campaign.start",
        input: {
          campaignId,
        },
        context: hrContext,
      });
      expect(startOnce.ok).toBe(true);
      if (
        startOnce.ok &&
        "changed" in startOnce.data &&
        "status" in startOnce.data &&
        "previousStatus" in startOnce.data
      ) {
        expect(startOnce.data.changed).toBe(true);
        expect(startOnce.data.status).toBe("started");
      }

      const outboxAfterStart = (await listNotificationOutboxForCampaignForDebug(campaignId)).filter(
        (row) => row.eventType === "campaign_invite",
      );
      expect(outboxAfterStart.length).toBeGreaterThanOrEqual(1);
      expect(outboxAfterStart.every((row) => row.status === "pending")).toBe(true);

      const startTwice = await dispatchOperation({
        operation: "campaign.start",
        input: {
          campaignId,
        },
        context: hrContext,
      });
      expect(startTwice.ok).toBe(true);
      if (
        startTwice.ok &&
        "changed" in startTwice.data &&
        "status" in startTwice.data &&
        "previousStatus" in startTwice.data
      ) {
        expect(startTwice.data.changed).toBe(false);
        expect(startTwice.data.status).toBe("started");
      }

      const outboxAfterSecondStart = (
        await listNotificationOutboxForCampaignForDebug(campaignId)
      ).filter((row) => row.eventType === "campaign_invite");
      expect(outboxAfterSecondStart.length).toBe(outboxAfterStart.length);

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
        expect(dispatchResult.data.processed).toBe(outboxAfterStart.length);
        expect(dispatchResult.data.sent).toBe(outboxAfterStart.length);
        expect(dispatchResult.data.failed).toBe(0);
      }

      const outboxAfterDispatch = (
        await listNotificationOutboxForCampaignForDebug(campaignId)
      ).filter((row) => row.eventType === "campaign_invite");
      expect(outboxAfterDispatch.every((row) => row.status === "sent")).toBe(true);
    },
    60_000,
  );

  it.skipIf(hasUrl)("skips integration run when database URL is absent", () => {
    expect(hasDatabaseUrl()).toBe(false);
  });
});
