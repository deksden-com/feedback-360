import { beforeEach, describe, expect, it, vi } from "vitest";

type MockEmployee = {
  employeeId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isActive: boolean;
  deletedAt?: string;
};

const state = {
  departmentByEmployee: new Map([["employee-staff-a1", "department-a"]]),
  managerByEmployee: new Map([["employee-staff-a1", "employee-head-a"]]),
  employees: new Map<string, MockEmployee>([
    [
      "employee-staff-a1",
      {
        employeeId: "employee-staff-a1",
        email: "staff.a1@acme.example",
        isActive: true,
      },
    ],
    [
      "employee-staff-a2",
      {
        employeeId: "employee-staff-a2",
        email: "staff.a2@acme.example",
        isActive: true,
      },
    ],
  ]),
};

vi.mock("@feedback-360/db", () => {
  return {
    moveEmployeeDepartment: async ({
      employeeId,
      toDepartmentId,
    }: {
      companyId: string;
      employeeId: string;
      toDepartmentId: string;
    }) => {
      const previousDepartmentId = state.departmentByEmployee.get(employeeId);
      const changed = previousDepartmentId !== toDepartmentId;
      state.departmentByEmployee.set(employeeId, toDepartmentId);
      return {
        employeeId,
        ...(previousDepartmentId ? { previousDepartmentId } : {}),
        departmentId: toDepartmentId,
        changed,
        effectiveAt: "2026-01-10T10:00:00.000Z",
      };
    },
    setEmployeeManager: async ({
      employeeId,
      managerEmployeeId,
    }: {
      companyId: string;
      employeeId: string;
      managerEmployeeId: string;
    }) => {
      const previousManagerEmployeeId = state.managerByEmployee.get(employeeId);
      const changed = previousManagerEmployeeId !== managerEmployeeId;
      state.managerByEmployee.set(employeeId, managerEmployeeId);
      return {
        employeeId,
        ...(previousManagerEmployeeId ? { previousManagerEmployeeId } : {}),
        managerEmployeeId,
        changed,
        effectiveAt: "2026-01-10T10:05:00.000Z",
      };
    },
    upsertEmployee: async ({
      employeeId,
      isActive,
    }: {
      companyId: string;
      employeeId: string;
      isActive?: boolean;
    }) => {
      const current = state.employees.get(employeeId);
      if (!current) {
        throw new Error("employee not found in mock");
      }

      const nextIsActive = isActive ?? current.isActive;
      const updated: MockEmployee = {
        ...current,
        isActive: nextIsActive,
        ...(nextIsActive ? {} : { deletedAt: "2026-01-10T10:10:00.000Z" }),
      };
      state.employees.set(employeeId, updated);

      return {
        employeeId,
        companyId: "company-main",
        isActive: updated.isActive,
        ...(updated.deletedAt ? { deletedAt: updated.deletedAt } : {}),
        updatedAt: "2026-01-10T10:10:00.000Z",
        created: false,
      };
    },
    listActiveEmployees: async () => {
      return {
        items: Array.from(state.employees.values())
          .filter((employee) => employee.isActive)
          .map((employee) => ({
            employeeId: employee.employeeId,
            email: employee.email,
            ...(employee.firstName ? { firstName: employee.firstName } : {}),
            ...(employee.lastName ? { lastName: employee.lastName } : {}),
            isActive: employee.isActive,
          })),
      };
    },
  };
});

describe("FT-0031 org history + soft delete (no-db acceptance)", () => {
  beforeEach(() => {
    state.departmentByEmployee = new Map([["employee-staff-a1", "department-a"]]);
    state.managerByEmployee = new Map([["employee-staff-a1", "employee-head-a"]]);
    state.employees = new Map<string, MockEmployee>([
      [
        "employee-staff-a1",
        {
          employeeId: "employee-staff-a1",
          email: "staff.a1@acme.example",
          isActive: true,
        },
      ],
      [
        "employee-staff-a2",
        {
          employeeId: "employee-staff-a2",
          email: "staff.a2@acme.example",
          isActive: true,
        },
      ],
    ]);
  });

  it("moves department, changes manager and excludes deactivated employee from active list", async () => {
    const { dispatchOperation } = await import("../index");

    const context = {
      companyId: "company-main",
      role: "hr_admin" as const,
    };

    const moveDepartment = await dispatchOperation({
      operation: "org.department.move",
      input: {
        employeeId: "employee-staff-a1",
        toDepartmentId: "department-b",
      },
      context,
    });
    expect(moveDepartment.ok).toBe(true);
    if (
      moveDepartment.ok &&
      "departmentId" in moveDepartment.data &&
      "effectiveAt" in moveDepartment.data
    ) {
      expect(moveDepartment.data.previousDepartmentId).toBe("department-a");
      expect(moveDepartment.data.departmentId).toBe("department-b");
      expect(moveDepartment.data.changed).toBe(true);
    }

    const setManager = await dispatchOperation({
      operation: "org.manager.set",
      input: {
        employeeId: "employee-staff-a1",
        managerEmployeeId: "employee-head-b",
      },
      context,
    });
    expect(setManager.ok).toBe(true);
    if (setManager.ok && "managerEmployeeId" in setManager.data) {
      expect(setManager.data.previousManagerEmployeeId).toBe("employee-head-a");
      expect(setManager.data.managerEmployeeId).toBe("employee-head-b");
      expect(setManager.data.changed).toBe(true);
    }

    const deactivateEmployee = await dispatchOperation({
      operation: "employee.upsert",
      input: {
        employeeId: "employee-staff-a2",
        isActive: false,
      },
      context,
    });
    expect(deactivateEmployee.ok).toBe(true);
    if (
      deactivateEmployee.ok &&
      "isActive" in deactivateEmployee.data &&
      "updatedAt" in deactivateEmployee.data
    ) {
      expect(deactivateEmployee.data.isActive).toBe(false);
      expect(deactivateEmployee.data.created).toBe(false);
      expect(deactivateEmployee.data.deletedAt).toBeDefined();
    }

    const activeEmployees = await dispatchOperation({
      operation: "employee.listActive",
      input: {},
      context,
    });
    expect(activeEmployees.ok).toBe(true);
    if (activeEmployees.ok && "items" in activeEmployees.data) {
      const ids = activeEmployees.data.items.flatMap((item) =>
        "employeeId" in item ? [item.employeeId] : [],
      );
      expect(ids).toContain("employee-staff-a1");
      expect(ids).not.toContain("employee-staff-a2");
    }
  });
});
