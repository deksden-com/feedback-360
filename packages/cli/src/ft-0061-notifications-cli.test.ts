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
    notificationsGenerateReminders: async ({ campaignId }: { campaignId: string }) => {
      return {
        ok: true as const,
        data: {
          campaignId,
          dateBucket: "2026-03-05",
          candidateRecipients: 1,
          generated: 1,
          deduplicated: 0,
        },
      };
    },
    notificationsDispatchOutbox: async () => {
      return {
        ok: true as const,
        data: {
          provider: "stub" as const,
          processed: 1,
          sent: 1,
          failed: 0,
          attemptsLogged: 1,
          remainingPending: 0,
        },
      };
    },
  });
};

describe("FT-0061 CLI reminders/notifications flow", () => {
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

  it("runs reminders generate and notifications dispatch commands", async () => {
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
    await runCli(["node", "feedback360", "reminders", "generate", "--campaign", "campaign-main"]);
    await runCli([
      "node",
      "feedback360",
      "notifications",
      "dispatch",
      "--campaign",
      "campaign-main",
      "--provider",
      "stub",
    ]);

    expect(errorSpy).toHaveBeenCalledTimes(0);
    expect(process.exitCode).toBeUndefined();

    const output = logSpy.mock.calls.map((call) => String(call[0] ?? "")).join("\n");
    expect(output).toContain("Reminders generated:");
    expect(output).toContain("campaign=campaign-main");
    expect(output).toContain("Notification dispatch:");
    expect(output).toContain("provider=stub");
  });
});
