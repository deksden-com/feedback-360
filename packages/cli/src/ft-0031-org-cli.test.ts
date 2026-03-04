import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const makeClientMock = () => {
  const state = {
    activeCompanyId: "",
    employees: [
      {
        employeeId: "employee-staff-a1",
        email: "staff.a1@acme.example",
        firstName: "Sasha",
        lastName: "StaffA1",
        isActive: true,
      },
      {
        employeeId: "employee-staff-a2",
        email: "staff.a2@acme.example",
        firstName: "Olga",
        lastName: "StaffA2",
        isActive: true,
      },
    ],
  };

  return () => ({
    seedRun: async () => ({
      scenario: "S2_org_basic",
      handles: {
        "company.main": "company-main",
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
    employeeUpsert: async ({
      employeeId,
      isActive,
    }: { employeeId: string; isActive?: boolean }) => {
      const target = state.employees.find((employee) => employee.employeeId === employeeId);
      if (!target) {
        return {
          ok: false as const,
          error: { code: "not_found", message: "Employee not found." },
        };
      }

      if (typeof isActive === "boolean") {
        target.isActive = isActive;
      }

      return {
        ok: true as const,
        data: {
          employeeId,
          companyId: "company-main",
          isActive: target.isActive,
          ...(target.isActive ? {} : { deletedAt: "2026-01-10T10:10:00.000Z" }),
          updatedAt: "2026-01-10T10:10:00.000Z",
          created: false,
        },
      };
    },
    employeeListActive: async () => {
      return {
        ok: true as const,
        data: {
          items: state.employees.filter((employee) => employee.isActive),
        },
      };
    },
    orgDepartmentMove: async ({
      employeeId,
      toDepartmentId,
    }: {
      employeeId: string;
      toDepartmentId: string;
    }) => ({
      ok: true as const,
      data: {
        employeeId,
        previousDepartmentId: "department-a",
        departmentId: toDepartmentId,
        changed: true,
        effectiveAt: "2026-01-10T10:00:00.000Z",
      },
    }),
    orgManagerSet: async ({
      employeeId,
      managerEmployeeId,
    }: {
      employeeId: string;
      managerEmployeeId: string;
    }) => ({
      ok: true as const,
      data: {
        employeeId,
        previousManagerEmployeeId: "employee-head-a",
        managerEmployeeId,
        changed: true,
        effectiveAt: "2026-01-10T10:05:00.000Z",
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

describe("FT-0031 CLI org flow", () => {
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

  it("runs org move/set-manager and employee soft deactivate flow", async () => {
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
      "org",
      "department",
      "move",
      "employee-staff-a1",
      "--to",
      "department-b",
      "--json",
    ]);
    await runCli([
      "node",
      "feedback360",
      "org",
      "set-manager",
      "employee-staff-a1",
      "--manager",
      "employee-head-b",
      "--json",
    ]);
    await runCli([
      "node",
      "feedback360",
      "employee",
      "upsert",
      "employee-staff-a2",
      "--is-active",
      "false",
      "--json",
    ]);
    await runCli(["node", "feedback360", "employee", "list-active"]);

    expect(errorSpy).toHaveBeenCalledTimes(0);
    expect(process.exitCode).toBeUndefined();

    const humanLine = logSpy.mock.calls
      .map((call) => String(call[0] ?? ""))
      .find((line) => line.includes("Active employees:"));
    expect(humanLine).toContain("Active employees:");

    const listOutput = logSpy.mock.calls
      .map((call) => String(call[0] ?? ""))
      .filter((line) => line.includes("email="))
      .join("\n");
    expect(listOutput).toContain("employee-staff-a1");
    expect(listOutput).not.toContain("employee-staff-a2");
  });
});
