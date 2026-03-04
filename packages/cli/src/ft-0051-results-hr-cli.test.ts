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
    resultsGetHrView: async ({
      campaignId,
      subjectEmployeeId,
    }: {
      campaignId: string;
      subjectEmployeeId: string;
    }) => {
      return {
        ok: true as const,
        data: {
          campaignId,
          companyId: activeCompanyId,
          subjectEmployeeId,
          modelVersionId: "model-main",
          modelKind: "indicators" as const,
          competencyScores: [
            {
              competencyId: "competency-main",
              competencyName: "Leadership",
              groupId: "group-main",
              groupName: "Core",
              managerScore: 4,
              managerRaters: 1,
              peersScore: 3,
              peersRaters: 2,
              subordinatesRaters: 0,
              selfRaters: 0,
            },
          ],
          raterScores: [
            {
              raterEmployeeId: "peer-1",
              group: "peers" as const,
              competencyId: "competency-main",
              score: 5,
              validIndicatorCount: 1,
              totalIndicatorCount: 3,
            },
          ],
          groupOverall: {
            manager: 4,
            peers: 3,
          },
        },
      };
    },
  });
};

describe("FT-0051 CLI results hr", () => {
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

  it("prints stable --json payload for results hr command", async () => {
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

    await runCli([
      "node",
      "feedback360",
      "results",
      "hr",
      "--campaign",
      "campaign-main",
      "--subject",
      "subject-main",
      "--json",
    ]);

    expect(errorSpy).toHaveBeenCalledTimes(0);
    expect(process.exitCode).toBeUndefined();

    const jsonLines = logSpy.mock.calls
      .map((call) => String(call[0] ?? ""))
      .filter((line) => line.trim().startsWith("{"));
    expect(jsonLines.length).toBeGreaterThanOrEqual(2);

    const payload = JSON.parse(jsonLines.at(-1) ?? "{}") as {
      ok?: boolean;
      data?: {
        competencyScores?: Array<{ peersScore?: number }>;
      };
    };
    expect(payload.ok).toBe(true);
    expect(payload.data?.competencyScores?.[0]?.peersScore).toBe(3);
  });
});
