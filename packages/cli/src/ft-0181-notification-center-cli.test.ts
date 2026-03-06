import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const makeClientMock = () => {
  let activeCompanyId = "";

  return () => ({
    setActiveCompany: (companyId: string) => {
      activeCompanyId = companyId;
      return {
        ok: true as const,
        data: { companyId },
      };
    },
    getActiveCompany: () => activeCompanyId || undefined,
    notificationReminderSettingsGet: async () => ({
      ok: true as const,
      data: {
        companyId: activeCompanyId,
        reminderScheduledHour: 10,
        quietHoursStart: 8,
        quietHoursEnd: 20,
        reminderWeekdays: [1, 3, 5],
        locale: "ru" as const,
        updatedAt: "2026-03-06T10:00:00.000Z",
      },
    }),
    notificationReminderSettingsUpsert: async () => ({
      ok: true as const,
      data: {
        companyId: activeCompanyId,
        reminderScheduledHour: 11,
        quietHoursStart: 9,
        quietHoursEnd: 19,
        reminderWeekdays: [2, 4],
        locale: "ru" as const,
        updatedAt: "2026-03-06T11:00:00.000Z",
      },
    }),
    notificationReminderPreview: async () => ({
      ok: true as const,
      data: {
        companyId: activeCompanyId,
        campaignId: "campaign-main",
        effectiveTimezone: "Europe/Kaliningrad",
        companyTimezone: "Europe/Kaliningrad",
        campaignTimezone: "Europe/Kaliningrad",
        reminderScheduledHour: 11,
        quietHoursStart: 9,
        quietHoursEnd: 19,
        reminderWeekdays: [2, 4],
        nextRunAt: "2026-03-10T08:00:00.000Z",
        localDateBucket: "2026-03-06",
        localWeekday: 4,
        localHour: 11,
      },
    }),
    notificationTemplateCatalog: async () => ({
      ok: true as const,
      data: {
        items: [
          {
            templateKey: "campaign_invite@v1" as const,
            locale: "ru" as const,
            version: "v1" as const,
            channel: "email" as const,
            title: "Invite",
            description: "Invite mail",
            variables: ["campaignName"],
          },
        ],
      },
    }),
    notificationTemplatePreview: async () => ({
      ok: true as const,
      data: {
        templateKey: "campaign_reminder@v1" as const,
        locale: "ru" as const,
        version: "v1" as const,
        channel: "email" as const,
        title: "Reminder",
        description: "Reminder mail",
        variables: ["campaignName", "pendingCount"],
        subject: "Reminder subject",
        text: "Reminder text",
        html: "<p>Reminder text</p>",
      },
    }),
    notificationDeliveryDiagnostics: async () => ({
      ok: true as const,
      data: {
        items: [
          {
            outboxId: "outbox-1",
            campaignId: "campaign-main",
            campaignName: "Main",
            recipientEmployeeId: "employee-1",
            recipientLabel: "Employee One",
            toEmail: "employee.one@example.com",
            eventType: "campaign_reminder",
            templateKey: "campaign_reminder@v1",
            channel: "email" as const,
            status: "retry_scheduled",
            attempts: 2,
            nextRetryAt: "2026-03-06T12:00:00.000Z",
            lastError: "Temporary failure",
            idempotencyKey: "ik-1",
            attemptsHistory: [
              {
                attemptNo: 1,
                provider: "stub",
                status: "retry_scheduled",
                errorMessage: "Temporary failure",
                requestedAt: "2026-03-06T11:00:00.000Z",
              },
            ],
          },
        ],
      },
    }),
  });
};

describe("FT-0181 CLI notification center flow", () => {
  let homePath = "";

  beforeEach(async () => {
    vi.resetModules();
    process.exitCode = undefined;
    homePath = await mkdtemp(join(tmpdir(), "feedback360-cli-test-"));
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    process.exitCode = undefined;
    if (homePath) {
      await rm(homePath, { recursive: true, force: true });
    }
  });

  it("runs reminder settings, preview, template and deliveries commands", async () => {
    vi.doMock("node:os", async () => {
      const actual = await vi.importActual<typeof import("node:os")>("node:os");
      return {
        ...actual,
        homedir: () => homePath,
      };
    });

    vi.doMock("@feedback-360/client", () => {
      return {
        createInprocClient: makeClientMock(),
      };
    });

    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { runCli } = await import("./index");

    await runCli(["node", "feedback360", "company", "use", "company-main"]);
    await runCli(["node", "feedback360", "reminders", "settings"]);
    await runCli([
      "node",
      "feedback360",
      "reminders",
      "configure",
      "--scheduled-hour",
      "11",
      "--quiet-start",
      "9",
      "--quiet-end",
      "19",
      "--weekdays",
      "2,4",
    ]);
    await runCli([
      "node",
      "feedback360",
      "reminders",
      "preview",
      "--campaign",
      "campaign-main",
      "--scheduled-hour",
      "11",
      "--quiet-start",
      "9",
      "--quiet-end",
      "19",
      "--weekdays",
      "2,4",
    ]);
    await runCli(["node", "feedback360", "notifications", "templates"]);
    await runCli([
      "node",
      "feedback360",
      "notifications",
      "template-preview",
      "--template-key",
      "campaign_reminder@v1",
      "--campaign",
      "campaign-main",
    ]);
    await runCli([
      "node",
      "feedback360",
      "notifications",
      "deliveries",
      "--status",
      "retry_scheduled",
    ]);

    expect(errorSpy).toHaveBeenCalledTimes(0);
    expect(process.exitCode).toBeUndefined();

    const output = logSpy.mock.calls.map((call) => String(call[0] ?? "")).join("\n");
    expect(output).toContain("Reminder settings:");
    expect(output).toContain("Reminder preview:");
    expect(output).toContain("Notification templates:");
    expect(output).toContain("Template preview:");
    expect(output).toContain("Delivery diagnostics:");
  });
});
