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
    invokeOperation: async () => ({
      ok: false as const,
      error: { code: "not_found", message: "not implemented in test mock" },
    }),
    campaignProgressGet: async ({ campaignId }: { campaignId: string }) => {
      return {
        ok: true as const,
        data: {
          campaignId,
          companyId: activeCompanyId,
          totalQuestionnaires: 3,
          statusCounts: {
            notStarted: 1,
            inProgress: 1,
            submitted: 1,
          },
          campaignLockedAt: "2026-03-04T12:00:00.000Z",
          pendingQuestionnaires: [
            {
              questionnaireId: "q1",
              campaignId,
              companyId: activeCompanyId,
              subjectEmployeeId: "subject-1",
              raterEmployeeId: "rater-1",
              status: "not_started" as const,
            },
          ],
          pendingByRater: [{ employeeId: "rater-1", pendingCount: 1 }],
          pendingBySubject: [{ employeeId: "subject-1", pendingCount: 1 }],
        },
      };
    },
  });
};

describe("FT-0046 CLI campaign progress", () => {
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

  it("prints stable --json payload for campaign progress command", async () => {
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

    await runCli([
      "node",
      "feedback360",
      "company",
      "use",
      "company-main",
      "--role",
      "hr_admin",
      "--json",
    ]);

    await runCli(["node", "feedback360", "campaign", "progress", "campaign-main", "--json"]);

    expect(errorSpy).toHaveBeenCalledTimes(0);
    expect(process.exitCode).toBeUndefined();

    const jsonLines = logSpy.mock.calls
      .map((call) => String(call[0] ?? ""))
      .filter((line) => line.trim().startsWith("{"));
    expect(jsonLines.length).toBeGreaterThanOrEqual(2);

    const progressPayload = JSON.parse(jsonLines.at(-1) ?? "{}") as {
      ok?: boolean;
      data?: {
        statusCounts?: { notStarted?: number; inProgress?: number; submitted?: number };
        pendingQuestionnaires?: unknown[];
      };
    };

    expect(progressPayload.ok).toBe(true);
    expect(progressPayload.data?.statusCounts).toEqual({
      notStarted: 1,
      inProgress: 1,
      submitted: 1,
    });
    expect(progressPayload.data?.pendingQuestionnaires?.length).toBe(1);
  });
});
