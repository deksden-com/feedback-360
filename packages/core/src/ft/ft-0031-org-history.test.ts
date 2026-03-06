import {
  getDepartmentHistoryForEmployeeDebug,
  getManagerHistoryForEmployeeDebug,
  hasDatabaseUrl,
  listActiveEmployees,
  runSeedScenario,
} from "@feedback-360/db";
import { describe, expect, it } from "vitest";

import { dispatchOperation } from "../index";

const hasUrl = hasDatabaseUrl();

describe("FT-0031 org history + soft delete", () => {
  it.runIf(hasUrl)(
    "closes old history intervals and excludes deactivated employees from active list",
    async () => {
      const seeded = await runSeedScenario({
        scenario: "S2_org_basic",
      });

      const companyId = seeded.handles["company.main"];
      const employeeStaffA1 = seeded.handles["employee.staff_a1"];
      const employeeStaffA2 = seeded.handles["employee.staff_a2"];
      const employeeHeadA = seeded.handles["employee.head_a"];
      const employeeHeadB = seeded.handles["employee.head_b"];
      const departmentB = seeded.handles["department.b"];

      expect(companyId).toBeDefined();
      expect(employeeStaffA1).toBeDefined();
      expect(employeeStaffA2).toBeDefined();
      expect(employeeHeadA).toBeDefined();
      expect(employeeHeadB).toBeDefined();
      expect(departmentB).toBeDefined();

      if (
        !companyId ||
        !employeeStaffA1 ||
        !employeeStaffA2 ||
        !employeeHeadA ||
        !employeeHeadB ||
        !departmentB
      ) {
        return;
      }

      const context = {
        companyId,
        role: "hr_admin" as const,
      };

      const moveDepartment = await dispatchOperation({
        operation: "org.department.move",
        input: {
          employeeId: employeeStaffA1,
          toDepartmentId: departmentB,
        },
        context,
      });
      expect(moveDepartment.ok).toBe(true);
      if (
        moveDepartment.ok &&
        "departmentId" in moveDepartment.data &&
        "effectiveAt" in moveDepartment.data
      ) {
        expect(moveDepartment.data.departmentId).toBe(departmentB);
        expect(moveDepartment.data.changed).toBe(true);
      }

      const setManager = await dispatchOperation({
        operation: "org.manager.set",
        input: {
          employeeId: employeeStaffA1,
          managerEmployeeId: employeeHeadB,
        },
        context,
      });
      expect(setManager.ok).toBe(true);
      if (setManager.ok && "managerEmployeeId" in setManager.data) {
        expect(setManager.data.previousManagerEmployeeId).toBe(employeeHeadA);
        expect(setManager.data.managerEmployeeId).toBe(employeeHeadB);
        expect(setManager.data.changed).toBe(true);
      }

      const deactivateEmployee = await dispatchOperation({
        operation: "employee.upsert",
        input: {
          employeeId: employeeStaffA2,
          isActive: false,
        },
        context,
      });
      expect(deactivateEmployee.ok).toBe(true);
      if (deactivateEmployee.ok && "isActive" in deactivateEmployee.data) {
        expect(deactivateEmployee.data.isActive).toBe(false);
      }

      const departmentHistory = await getDepartmentHistoryForEmployeeDebug(employeeStaffA1);
      expect(departmentHistory).toHaveLength(2);
      expect(departmentHistory[0]?.endAt).toBeDefined();
      expect(departmentHistory[1]?.departmentId).toBe(departmentB);
      expect(departmentHistory[1]?.endAt).toBeUndefined();

      const managerHistory = await getManagerHistoryForEmployeeDebug(employeeStaffA1);
      expect(managerHistory).toHaveLength(2);
      expect(managerHistory[0]?.managerEmployeeId).toBe(employeeHeadA);
      expect(managerHistory[0]?.endAt).toBeDefined();
      expect(managerHistory[1]?.managerEmployeeId).toBe(employeeHeadB);
      expect(managerHistory[1]?.endAt).toBeUndefined();

      const activeEmployees = await listActiveEmployees({ companyId });
      const activeEmployeeIds = activeEmployees.items.map((item) => item.employeeId);
      expect(activeEmployeeIds).toContain(employeeStaffA1);
      expect(activeEmployeeIds).not.toContain(employeeStaffA2);
    },
  );

  it.skipIf(hasUrl)("skips integration run when database URL is absent", () => {
    expect(hasDatabaseUrl()).toBe(false);
  });
});
