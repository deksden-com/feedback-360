import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const makeClientMock = () => {
  const state = {
    activeCompanyId: "",
    live: {
      "employee-staff-a1": {
        departmentId: "department-a",
        managerEmployeeId: "employee-head-a",
      },
    },
    snapshots: [
      {
        snapshotId: "snapshot-1",
        companyId: "company-main",
        campaignId: "campaign-main",
        employeeId: "employee-head-a",
        email: "head.a@acme.example",
        departmentId: "department-a",
        managerEmployeeId: "employee-ceo",
        snapshotAt: "2026-01-10T09:00:00.000Z",
      },
      {
        snapshotId: "snapshot-2",
        companyId: "company-main",
        campaignId: "campaign-main",
        employeeId: "employee-staff-a1",
        email: "staff.a1@acme.example",
        departmentId: "department-a",
        managerEmployeeId: "employee-head-a",
        snapshotAt: "2026-01-10T09:00:00.000Z",
      },
    ],
  };

  return () => ({
    seedRun: async () => ({
      scenario: "S5_campaign_started_no_answers",
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
    employeeUpsert: async () => ({
      ok: true as const,
      data: {
        employeeId: "employee-staff-a1",
        companyId: "company-main",
        isActive: true,
        updatedAt: "2026-01-11T10:10:00.000Z",
        created: false,
      },
    }),
    employeeListActive: async () => ({
      ok: true as const,
      data: { items: [] },
    }),
    orgDepartmentMove: async ({
      employeeId,
      toDepartmentId,
    }: {
      employeeId: string;
      toDepartmentId: string;
    }) => {
      state.live[employeeId as keyof typeof state.live] = {
        ...state.live[employeeId as keyof typeof state.live],
        departmentId: toDepartmentId,
      };
      return {
        ok: true as const,
        data: {
          employeeId,
          previousDepartmentId: "department-a",
          departmentId: toDepartmentId,
          changed: true,
          effectiveAt: "2026-01-11T10:00:00.000Z",
        },
      };
    },
    orgManagerSet: async ({
      employeeId,
      managerEmployeeId,
    }: {
      employeeId: string;
      managerEmployeeId: string;
    }) => {
      state.live[employeeId as keyof typeof state.live] = {
        ...state.live[employeeId as keyof typeof state.live],
        managerEmployeeId,
      };
      return {
        ok: true as const,
        data: {
          employeeId,
          previousManagerEmployeeId: "employee-head-a",
          managerEmployeeId,
          changed: true,
          effectiveAt: "2026-01-11T10:05:00.000Z",
        },
      };
    },
    campaignSnapshotList: async ({ campaignId }: { campaignId: string }) => {
      return {
        ok: true as const,
        data: {
          items: state.snapshots.filter((item) => item.campaignId === campaignId),
        },
      };
    },
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

describe("FT-0032 CLI snapshot flow", () => {
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

  it("keeps campaign snapshot output unchanged after live org changes", async () => {
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
      "snapshot",
      "list",
      "--campaign",
      "campaign-main",
    ]);
    await runCli([
      "node",
      "feedback360",
      "org",
      "department",
      "move",
      "employee-staff-a1",
      "--to",
      "department-b",
    ]);
    await runCli([
      "node",
      "feedback360",
      "org",
      "set-manager",
      "employee-staff-a1",
      "--manager",
      "employee-head-b",
    ]);
    await runCli([
      "node",
      "feedback360",
      "campaign",
      "snapshot",
      "list",
      "--campaign",
      "campaign-main",
    ]);

    expect(errorSpy).toHaveBeenCalledTimes(0);
    expect(process.exitCode).toBeUndefined();

    const output = logSpy.mock.calls.map((call) => String(call[0] ?? "")).join("\n");
    expect(output).toContain("Campaign snapshots:");
    expect(output).toContain("employee=employee-staff-a1");
    expect(output).toContain("department=department-a");
    expect(output).toContain("manager=employee-head-a");
  });
});
