import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type MockQuestionnaireStatus = "not_started" | "in_progress" | "submitted";

const makeClientMock = () => {
  const state = {
    activeCompanyId: "",
    questionnaire: {
      questionnaireId: "q-main",
      campaignId: "campaign-main",
      companyId: "company-main",
      subjectEmployeeId: "subject-1",
      raterEmployeeId: "rater-1",
      status: "not_started" as MockQuestionnaireStatus,
      submittedAt: "",
    },
    campaignLockedAt: "",
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
    questionnaireListAssigned: async ({
      campaignId,
      status,
    }: {
      campaignId: string;
      status?: MockQuestionnaireStatus;
    }) => {
      const matchCampaign = campaignId === state.questionnaire.campaignId;
      const matchStatus = status ? status === state.questionnaire.status : true;
      const items = matchCampaign && matchStatus ? [state.questionnaire] : [];
      return {
        ok: true as const,
        data: {
          items: items.map((item) => ({
            questionnaireId: item.questionnaireId,
            campaignId: item.campaignId,
            companyId: item.companyId,
            subjectEmployeeId: item.subjectEmployeeId,
            raterEmployeeId: item.raterEmployeeId,
            status: item.status,
            ...(item.submittedAt ? { submittedAt: item.submittedAt } : {}),
          })),
        },
      };
    },
    questionnaireSaveDraft: async ({
      questionnaireId,
    }: {
      questionnaireId: string;
      draft: Record<string, unknown>;
    }) => {
      if (questionnaireId !== state.questionnaire.questionnaireId) {
        return {
          ok: false as const,
          error: { code: "not_found", message: "Questionnaire not found." },
        };
      }

      if (state.questionnaire.status === "submitted") {
        return {
          ok: false as const,
          error: {
            code: "invalid_transition",
            message: "Submitted questionnaire is immutable.",
          },
        };
      }

      state.questionnaire.status = "in_progress";
      if (!state.campaignLockedAt) {
        state.campaignLockedAt = "2026-01-10T10:00:00.000Z";
      }

      return {
        ok: true as const,
        data: {
          questionnaireId: state.questionnaire.questionnaireId,
          status: "in_progress" as const,
          campaignLockedAt: state.campaignLockedAt,
        },
      };
    },
    questionnaireSubmit: async ({ questionnaireId }: { questionnaireId: string }) => {
      if (questionnaireId !== state.questionnaire.questionnaireId) {
        return {
          ok: false as const,
          error: { code: "not_found", message: "Questionnaire not found." },
        };
      }

      if (state.questionnaire.status === "submitted" && state.questionnaire.submittedAt) {
        return {
          ok: true as const,
          data: {
            questionnaireId,
            status: "submitted" as const,
            submittedAt: state.questionnaire.submittedAt,
            wasAlreadySubmitted: true,
          },
        };
      }

      state.questionnaire.status = "submitted";
      state.questionnaire.submittedAt = "2026-01-10T10:05:00.000Z";
      return {
        ok: true as const,
        data: {
          questionnaireId,
          status: "submitted" as const,
          submittedAt: state.questionnaire.submittedAt,
          wasAlreadySubmitted: false,
        },
      };
    },
  });
};

describe("FT-0013 CLI questionnaire flow", () => {
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

  it("runs company use + questionnaire list/save-draft/submit flow", async () => {
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

    await runCli(["node", "feedback360", "company", "use", "company-main", "--json"]);
    await runCli([
      "node",
      "feedback360",
      "questionnaire",
      "list",
      "--campaign",
      "campaign-main",
      "--status",
      "not_started",
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
    await runCli(["node", "feedback360", "questionnaire", "submit", "q-main", "--json"]);
    await runCli([
      "node",
      "feedback360",
      "questionnaire",
      "list",
      "--campaign",
      "campaign-main",
      "--status",
      "submitted",
    ]);
    await runCli([
      "node",
      "feedback360",
      "questionnaire",
      "save-draft",
      "q-main",
      "--draft-json",
      '{"answers":{"leadership":5}}',
      "--json",
    ]);

    expect(errorSpy).toHaveBeenCalledTimes(0);
    expect(process.exitCode).toBe(1);

    const jsonLines = logSpy.mock.calls
      .map((call) => String(call[0] ?? ""))
      .filter((line) => line.trim().startsWith("{"));
    expect(jsonLines.length).toBeGreaterThanOrEqual(5);

    const lastJson = JSON.parse(jsonLines.at(-1) ?? "{}") as {
      ok?: boolean;
      error?: { code?: string };
    };
    expect(lastJson.ok).toBe(false);
    expect(lastJson.error?.code).toBe("invalid_transition");

    const humanLine = logSpy.mock.calls
      .map((call) => String(call[0] ?? ""))
      .find((line) => line.includes("status=submitted"));
    expect(humanLine).toContain("status=submitted");
  }, 15000);
});
