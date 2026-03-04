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
      variant: "no_participants",
      handles: {
        "company.main": "company-main",
        "campaign.main": "campaign-main",
        "department.a": "department-a",
        "department.b": "department-b",
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
    employeeUpsert: async () => ({
      ok: true as const,
      data: {
        employeeId: "employee-staff-a1",
        companyId: "company-main",
        isActive: true,
        updatedAt: "2026-01-10T10:10:00.000Z",
        created: false,
      },
    }),
    employeeListActive: async () => ({
      ok: true as const,
      data: { items: [] },
    }),
    orgDepartmentMove: async () => ({
      ok: true as const,
      data: {
        employeeId: "employee-staff-a1",
        departmentId: "department-b",
        changed: true,
        effectiveAt: "2026-01-10T10:00:00.000Z",
      },
    }),
    orgManagerSet: async () => ({
      ok: true as const,
      data: {
        employeeId: "employee-staff-a1",
        managerEmployeeId: "employee-head-b",
        changed: true,
        effectiveAt: "2026-01-10T10:05:00.000Z",
      },
    }),
    campaignSnapshotList: async () => ({
      ok: true as const,
      data: {
        items: [],
      },
    }),
    campaignParticipantsAddFromDepartments: async () => ({
      ok: true as const,
      data: {
        campaignId: "campaign-main",
        addedEmployeeIds: [
          "employee-head-a",
          "employee-head-b",
          "employee-staff-a1",
          "employee-staff-b1",
        ],
        totalParticipants: 4,
      },
    }),
    matrixGenerateSuggested: async () => ({
      ok: true as const,
      data: {
        campaignId: "campaign-main",
        generatedAssignments: [
          {
            subjectEmployeeId: "employee-head-a",
            raterEmployeeId: "employee-head-b",
            raterRole: "peer" as const,
          },
          {
            subjectEmployeeId: "employee-head-b",
            raterEmployeeId: "employee-head-a",
            raterRole: "peer" as const,
          },
          {
            subjectEmployeeId: "employee-staff-a1",
            raterEmployeeId: "employee-head-a",
            raterRole: "manager" as const,
          },
          {
            subjectEmployeeId: "employee-staff-b1",
            raterEmployeeId: "employee-head-b",
            raterRole: "manager" as const,
          },
        ],
        totalAssignments: 4,
      },
    }),
    questionnaireListAssigned: async () => ({ ok: true as const, data: { items: [] } }),
    questionnaireSaveDraft: async () => ({
      ok: true as const,
      data: {
        questionnaireId: "q-main",
        status: "in_progress" as const,
        campaignLockedAt: "2026-01-10T10:00:00.000Z",
      },
    }),
    questionnaireSubmit: async () => ({
      ok: true as const,
      data: {
        questionnaireId: "q-main",
        status: "submitted" as const,
        submittedAt: "2026-01-10T10:05:00.000Z",
        wasAlreadySubmitted: false,
      },
    }),
  });
};

describe("FT-0033 CLI matrix autogen flow", () => {
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

  it("adds participants from departments and generates peer/manager suggestions", async () => {
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
    await runCli([
      "node",
      "feedback360",
      "campaign",
      "participants",
      "add-departments",
      "campaign-main",
      "--from-departments",
      "department-a",
      "department-b",
    ]);
    await runCli([
      "node",
      "feedback360",
      "matrix",
      "generate",
      "campaign-main",
      "--from-departments",
      "department-a",
      "department-b",
    ]);

    expect(errorSpy).toHaveBeenCalledTimes(0);
    expect(process.exitCode).toBeUndefined();

    const output = logSpy.mock.calls.map((call) => String(call[0] ?? "")).join("\n");
    expect(output).toContain("Participants added:");
    expect(output).toContain("Suggested assignments:");
    expect(output).toContain("subject=employee-head-a, rater=employee-head-b, role=peer");
    expect(output).toContain("subject=employee-staff-a1, rater=employee-head-a, role=manager");
  });
});
