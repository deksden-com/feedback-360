import {
  evaluateReminderSchedule,
  hasDatabaseUrl,
  listNotificationOutboxForCampaignForDebug,
  runSeedScenario,
} from "@feedback-360/db";
import { describe, expect, it } from "vitest";

import { dispatchOperation } from "../index";

const hasUrl = hasDatabaseUrl();

describe("FT-0063 notifications scheduling", () => {
  it("evaluates reminder schedule by timezone, quiet hours and weekly cadence", () => {
    const kaliningradScheduled = evaluateReminderSchedule({
      now: new Date("2026-01-12T08:05:00.000Z"),
      timezone: "Europe/Kaliningrad",
    });
    expect(kaliningradScheduled.shouldGenerate).toBe(true);
    expect(kaliningradScheduled.reason).toBe("ok");
    expect(kaliningradScheduled.localWeekday).toBe(1);
    expect(kaliningradScheduled.localHour).toBe(10);
    expect(kaliningradScheduled.localDateBucket).toBe("2026-01-12");

    const outsideQuietHours = evaluateReminderSchedule({
      now: new Date("2026-01-12T05:05:00.000Z"),
      timezone: "Europe/Kaliningrad",
    });
    expect(outsideQuietHours.shouldGenerate).toBe(false);
    expect(outsideQuietHours.reason).toBe("outside_quiet_hours");

    const outsideScheduledHour = evaluateReminderSchedule({
      now: new Date("2026-01-12T09:05:00.000Z"),
      timezone: "Europe/Kaliningrad",
    });
    expect(outsideScheduledHour.shouldGenerate).toBe(false);
    expect(outsideScheduledHour.reason).toBe("outside_scheduled_hour");

    const outsideWeekday = evaluateReminderSchedule({
      now: new Date("2026-01-13T08:05:00.000Z"),
      timezone: "Europe/Kaliningrad",
    });
    expect(outsideWeekday.shouldGenerate).toBe(false);
    expect(outsideWeekday.reason).toBe("outside_weekly_schedule");

    const tokyoScheduled = evaluateReminderSchedule({
      now: new Date("2026-01-12T01:05:00.000Z"),
      timezone: "Asia/Tokyo",
    });
    expect(tokyoScheduled.shouldGenerate).toBe(true);
    expect(tokyoScheduled.reason).toBe("ok");
    expect(tokyoScheduled.localHour).toBe(10);
  });

  it.runIf(hasUrl)(
    "generates reminders only inside schedule window and keeps idempotency",
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

      const outsideQuiet = await dispatchOperation({
        operation: "notifications.generateReminders",
        input: {
          campaignId,
          now: "2026-01-12T05:05:00.000Z",
        },
        context: hrContext,
      });
      expect(outsideQuiet.ok).toBe(true);
      if (outsideQuiet.ok && "generated" in outsideQuiet.data) {
        expect(outsideQuiet.data.generated).toBe(0);
        expect(outsideQuiet.data.candidateRecipients).toBe(0);
      }

      const scheduledFirst = await dispatchOperation({
        operation: "notifications.generateReminders",
        input: {
          campaignId,
          now: "2026-01-12T08:05:00.000Z",
        },
        context: hrContext,
      });
      expect(scheduledFirst.ok).toBe(true);
      if (scheduledFirst.ok && "generated" in scheduledFirst.data) {
        expect(scheduledFirst.data.dateBucket).toBe("2026-01-12");
        expect(scheduledFirst.data.generated).toBe(1);
        expect(scheduledFirst.data.deduplicated).toBe(0);
      }

      const scheduledSecond = await dispatchOperation({
        operation: "notifications.generateReminders",
        input: {
          campaignId,
          now: "2026-01-12T08:05:00.000Z",
        },
        context: hrContext,
      });
      expect(scheduledSecond.ok).toBe(true);
      if (scheduledSecond.ok && "generated" in scheduledSecond.data) {
        expect(scheduledSecond.data.generated).toBe(0);
        expect(scheduledSecond.data.deduplicated).toBeGreaterThanOrEqual(1);
      }

      const outsideWeekday = await dispatchOperation({
        operation: "notifications.generateReminders",
        input: {
          campaignId,
          now: "2026-01-13T08:05:00.000Z",
        },
        context: hrContext,
      });
      expect(outsideWeekday.ok).toBe(true);
      if (outsideWeekday.ok && "generated" in outsideWeekday.data) {
        expect(outsideWeekday.data.generated).toBe(0);
        expect(outsideWeekday.data.deduplicated).toBe(0);
      }

      const outboxRows = await listNotificationOutboxForCampaignForDebug(campaignId);
      expect(outboxRows.length).toBe(1);
      expect(outboxRows[0]?.eventType).toBe("campaign_reminder");
    },
    60_000,
  );

  it.skipIf(hasUrl)("skips integration run when database URL is absent", () => {
    expect(hasDatabaseUrl()).toBe(false);
  });
});
