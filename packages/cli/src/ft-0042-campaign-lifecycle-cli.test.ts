import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const makeClientMock = () => {
  const state = {
    activeCompanyId: "",
  };

  return () => ({
    seedRun: async () => ({
      scenario: "S4_campaign_draft",
      handles: {
        "company.main": "company-main",
        "campaign.main": "campaign-main",
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
    modelVersionCreate: async () => ({
      ok: true as const,
      data: {
        modelVersionId: "model-version-main",
        companyId: "company-main",
        name: "Q1 Model",
        kind: "indicators" as const,
        version: 1,
        createdAt: "2026-03-04T10:00:00.000Z",
        groupCount: 1,
        competencyCount: 1,
        indicatorCount: 2,
        levelCount: 0,
      },
    }),
    campaignCreate: async () => ({
      ok: true as const,
      data: {
        campaignId: "campaign-main",
        companyId: "company-main",
        modelVersionId: "model-version-main",
        name: "Q1 Campaign",
        status: "draft" as const,
        startAt: "2026-03-10T09:00:00.000Z",
        endAt: "2026-03-20T18:00:00.000Z",
        timezone: "Europe/Kaliningrad",
        createdAt: "2026-03-04T10:05:00.000Z",
      },
    }),
    campaignStart: async () => ({
      ok: true as const,
      data: {
        campaignId: "campaign-main",
        previousStatus: "draft" as const,
        status: "started" as const,
        changed: true,
        updatedAt: "2026-03-04T12:00:00.000Z",
      },
    }),
    campaignStop: async () => ({
      ok: true as const,
      data: {
        campaignId: "campaign-main",
        previousStatus: "started" as const,
        status: "ended" as const,
        changed: true,
        updatedAt: "2026-03-04T12:10:00.000Z",
      },
    }),
    campaignEnd: async () => ({
      ok: true as const,
      data: {
        campaignId: "campaign-main",
        previousStatus: "ended" as const,
        status: "ended" as const,
        changed: false,
        updatedAt: "2026-03-04T12:20:00.000Z",
      },
    }),
    employeeUpsert: async () => ({
      ok: true as const,
      data: {
        employeeId: "employee-main",
        companyId: "company-main",
        isActive: true,
        updatedAt: "2026-03-04T10:00:00.000Z",
        created: false,
      },
    }),
    employeeListActive: async () => ({ ok: true as const, data: { items: [] } }),
    orgDepartmentMove: async () => ({
      ok: true as const,
      data: {
        employeeId: "employee-main",
        departmentId: "department-main",
        changed: false,
        effectiveAt: "2026-03-04T10:00:00.000Z",
      },
    }),
    orgManagerSet: async () => ({
      ok: true as const,
      data: {
        employeeId: "employee-main",
        managerEmployeeId: "manager-main",
        changed: false,
        effectiveAt: "2026-03-04T10:00:00.000Z",
      },
    }),
    campaignSnapshotList: async () => ({ ok: true as const, data: { items: [] } }),
    campaignParticipantsAddFromDepartments: async () => ({
      ok: true as const,
      data: {
        campaignId: "campaign-main",
        addedEmployeeIds: [],
        totalParticipants: 0,
      },
    }),
    matrixGenerateSuggested: async () => ({
      ok: true as const,
      data: {
        campaignId: "campaign-main",
        generatedAssignments: [],
        totalAssignments: 0,
      },
    }),
    aiRunForCampaign: async () => ({
      ok: true as const,
      data: {
        campaignId: "campaign-main",
        aiJobId: "ai-job-main",
        provider: "mvp_stub" as const,
        status: "completed" as const,
        completedAt: "2026-03-04T10:00:00.000Z",
        wasAlreadyCompleted: false,
      },
    }),
    questionnaireListAssigned: async () => ({ ok: true as const, data: { items: [] } }),
    questionnaireSaveDraft: async () => ({
      ok: true as const,
      data: {
        questionnaireId: "questionnaire-main",
        status: "in_progress" as const,
        campaignLockedAt: "2026-03-04T10:00:00.000Z",
      },
    }),
    questionnaireSubmit: async () => ({
      ok: true as const,
      data: {
        questionnaireId: "questionnaire-main",
        status: "submitted" as const,
        submittedAt: "2026-03-04T10:00:00.000Z",
        wasAlreadySubmitted: false,
      },
    }),
  });
};

describe("FT-0042 CLI campaign lifecycle flow", () => {
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

  it("runs campaign start/stop/end commands with human-readable output", async () => {
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
    await runCli(["node", "feedback360", "campaign", "start", "campaign-main"]);
    await runCli(["node", "feedback360", "campaign", "stop", "campaign-main"]);
    await runCli(["node", "feedback360", "campaign", "end", "campaign-main"]);

    expect(errorSpy).toHaveBeenCalledTimes(0);
    expect(process.exitCode).toBeUndefined();

    const output = logSpy.mock.calls.map((call) => String(call[0] ?? "")).join("\n");
    expect(output).toContain("Campaign status updated:");
    expect(output).toContain("previous=draft, status=started");
    expect(output).toContain("previous=started, status=ended");
    expect(output).toContain("previous=ended, status=ended");
  });
});
