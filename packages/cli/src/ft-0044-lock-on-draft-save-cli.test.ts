import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const makeClientMock = () => {
  const state = {
    activeCompanyId: "",
    lockedAt: "",
  };

  return () => ({
    seedRun: async () => ({
      scenario: "S5_campaign_started_no_answers",
      handles: {
        "company.main": "company-main",
        "campaign.main": "campaign-main",
        "questionnaire.main": "q-main",
      },
    }),
    systemPing: async () => ({
      ok: true as const,
      data: { pong: "ok" as const, timestamp: new Date().toISOString() },
    }),
    setActiveCompany: (companyId: string) => {
      state.activeCompanyId = companyId;
      return {
        ok: true as const,
        data: { companyId },
      };
    },
    getActiveCompany: () => state.activeCompanyId || undefined,
    invokeOperation: async () => ({
      ok: false as const,
      error: { code: "not_found", message: "not implemented in test mock" },
    }),
    campaignWeightsSet: async ({
      campaignId,
      manager,
      peers,
      subordinates,
    }: {
      campaignId: string;
      manager: number;
      peers: number;
      subordinates: number;
    }) => {
      if (state.lockedAt) {
        return {
          ok: false as const,
          error: {
            code: "campaign_locked" as const,
            message: "Campaign matrix is locked.",
          },
        };
      }

      return {
        ok: true as const,
        data: {
          campaignId,
          manager,
          peers,
          subordinates,
          self: 0 as const,
          changed: true,
          updatedAt: "2026-03-04T12:00:00.000Z",
        },
      };
    },
    matrixSet: async ({
      campaignId,
      assignments,
    }: {
      campaignId: string;
      assignments: Array<{
        subjectEmployeeId: string;
        raterEmployeeId: string;
        raterRole: "manager" | "peer" | "subordinate" | "self";
      }>;
    }) => {
      if (state.lockedAt) {
        return {
          ok: false as const,
          error: {
            code: "campaign_locked" as const,
            message: "Campaign matrix is locked.",
          },
        };
      }

      return {
        ok: true as const,
        data: {
          campaignId,
          totalAssignments: assignments.length,
        },
      };
    },
    questionnaireSaveDraft: async ({ questionnaireId }: { questionnaireId: string }) => {
      state.lockedAt = "2026-03-04T12:05:00.000Z";
      return {
        ok: true as const,
        data: {
          questionnaireId,
          status: "in_progress" as const,
          campaignLockedAt: state.lockedAt,
        },
      };
    },
  });
};

describe("FT-0044 CLI lock on draft-save flow", () => {
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

  it("accepts matrix/weights changes before lock and returns campaign_locked after draft save", async () => {
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

    const assignmentsJson = JSON.stringify([
      {
        subjectEmployeeId: "employee-staff-a1",
        raterEmployeeId: "employee-head-a",
        raterRole: "manager",
      },
    ]);

    await runCli(["node", "feedback360", "company", "use", "company-main", "--json"]);
    await runCli([
      "node",
      "feedback360",
      "campaign",
      "weights",
      "set",
      "campaign-main",
      "--manager",
      "40",
      "--peers",
      "30",
      "--subordinates",
      "30",
      "--json",
    ]);
    await runCli([
      "node",
      "feedback360",
      "matrix",
      "set",
      "campaign-main",
      "--assignments-json",
      assignmentsJson,
      "--json",
    ]);
    await runCli([
      "node",
      "feedback360",
      "questionnaire",
      "save-draft",
      "q-main",
      "--draft-json",
      '{"answers":{"leadership":4}}',
      "--json",
    ]);
    await runCli([
      "node",
      "feedback360",
      "campaign",
      "weights",
      "set",
      "campaign-main",
      "--manager",
      "50",
      "--peers",
      "25",
      "--subordinates",
      "25",
      "--json",
    ]);
    await runCli([
      "node",
      "feedback360",
      "matrix",
      "set",
      "campaign-main",
      "--assignments-json",
      assignmentsJson,
      "--json",
    ]);

    expect(errorSpy).toHaveBeenCalledTimes(0);
    expect(process.exitCode).toBe(1);

    const jsonLines = logSpy.mock.calls
      .map((call) => String(call[0] ?? ""))
      .filter((line) => line.trim().startsWith("{"));
    expect(jsonLines.length).toBeGreaterThanOrEqual(6);

    const parsedLines = jsonLines.map(
      (line) => JSON.parse(line) as { ok?: boolean; error?: { code?: string } },
    );
    expect(parsedLines.filter((line) => line.ok === false).length).toBe(2);
    expect(parsedLines.at(-1)?.error?.code).toBe("campaign_locked");
  });
});
