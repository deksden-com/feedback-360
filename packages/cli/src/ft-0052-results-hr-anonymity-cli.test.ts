import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type CapturedInput = {
  campaignId: string;
  subjectEmployeeId: string;
  smallGroupPolicy?: "hide" | "merge_to_other";
  anonymityThreshold?: number;
};

const makeClientMock = (capturedInputs: CapturedInput[]) => {
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
    resultsGetHrView: async (input: CapturedInput) => {
      capturedInputs.push(input);
      return {
        ok: true as const,
        data: {
          campaignId: input.campaignId,
          companyId: activeCompanyId,
          subjectEmployeeId: input.subjectEmployeeId,
          modelVersionId: "model-main",
          modelKind: "indicators" as const,
          smallGroupPolicy: input.smallGroupPolicy ?? "hide",
          anonymityThreshold: input.anonymityThreshold ?? 3,
          groupVisibility: {
            manager: "shown" as const,
            peers: "merged" as const,
            subordinates: "merged" as const,
            self: "shown" as const,
            other: "shown" as const,
          },
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
              subordinatesScore: 2,
              subordinatesRaters: 1,
              selfRaters: 0,
              otherScore: 3.3333,
              otherRaters: 3,
              managerVisibility: "shown" as const,
              peersVisibility: "merged" as const,
              subordinatesVisibility: "merged" as const,
              selfVisibility: "shown" as const,
              otherVisibility: "shown" as const,
            },
          ],
          raterScores: [],
          groupOverall: {
            manager: 4,
            peers: 3,
            subordinates: 2,
            other: 3.3333,
          },
        },
      };
    },
  });
};

describe("FT-0052 CLI results hr anonymity options", () => {
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

  it("forwards --small-group-policy and --anonymity-threshold to typed client input", async () => {
    const capturedInputs: CapturedInput[] = [];

    vi.doMock("node:os", async () => {
      const actual = await vi.importActual<typeof import("node:os")>("node:os");
      return {
        ...actual,
        homedir: () => homePath,
      };
    });

    vi.doMock("@feedback-360/client", () => {
      return {
        createInprocClient: makeClientMock(capturedInputs),
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
      "--small-group-policy",
      "merge_to_other",
      "--anonymity-threshold",
      "4",
      "--json",
    ]);

    expect(errorSpy).toHaveBeenCalledTimes(0);
    expect(process.exitCode).toBeUndefined();
    expect(capturedInputs).toHaveLength(1);
    expect(capturedInputs[0]).toMatchObject({
      campaignId: "campaign-main",
      subjectEmployeeId: "subject-main",
      smallGroupPolicy: "merge_to_other",
      anonymityThreshold: 4,
    });

    const jsonLines = logSpy.mock.calls
      .map((call) => String(call[0] ?? ""))
      .filter((line) => line.trim().startsWith("{"));
    expect(jsonLines.length).toBeGreaterThanOrEqual(2);
  });
});
