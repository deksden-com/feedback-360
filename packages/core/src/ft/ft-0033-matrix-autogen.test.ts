import { hasDatabaseUrl, runSeedScenario } from "@feedback-360/db";
import { describe, expect, it } from "vitest";

import { dispatchOperation } from "../index";

const hasUrl = hasDatabaseUrl();

describe("FT-0033 matrix autogeneration", () => {
  it.runIf(hasUrl)(
    "generates peers for heads and manager links for department staff",
    async () => {
      const seeded = await runSeedScenario({
        scenario: "S4_campaign_draft",
        variant: "no_participants",
      });

      const companyId = seeded.handles["company.main"];
      const campaignId = seeded.handles["campaign.main"];
      const departmentA = seeded.handles["department.a"];
      const departmentB = seeded.handles["department.b"];
      const employeeHeadA = seeded.handles["employee.head_a"];
      const employeeHeadB = seeded.handles["employee.head_b"];
      const employeeStaffA1 = seeded.handles["employee.staff_a1"];
      const employeeStaffB1 = seeded.handles["employee.staff_b1"];

      expect(companyId).toBeDefined();
      expect(campaignId).toBeDefined();
      expect(departmentA).toBeDefined();
      expect(departmentB).toBeDefined();
      expect(employeeHeadA).toBeDefined();
      expect(employeeHeadB).toBeDefined();
      expect(employeeStaffA1).toBeDefined();
      expect(employeeStaffB1).toBeDefined();

      if (
        !companyId ||
        !campaignId ||
        !departmentA ||
        !departmentB ||
        !employeeHeadA ||
        !employeeHeadB ||
        !employeeStaffA1 ||
        !employeeStaffB1
      ) {
        return;
      }

      const context = {
        companyId,
        role: "hr_admin" as const,
      };

      const addParticipants = await dispatchOperation({
        operation: "campaign.participants.addFromDepartments",
        input: {
          campaignId,
          departmentIds: [departmentA, departmentB],
        },
        context,
      });
      expect(addParticipants.ok).toBe(true);
      if (addParticipants.ok && "addedEmployeeIds" in addParticipants.data) {
        expect(addParticipants.data.addedEmployeeIds).toContain(employeeHeadA);
        expect(addParticipants.data.addedEmployeeIds).toContain(employeeHeadB);
      }

      const generated = await dispatchOperation({
        operation: "matrix.generateSuggested",
        input: {
          campaignId,
          departmentIds: [departmentA, departmentB],
        },
        context,
      });
      expect(generated.ok).toBe(true);

      if (generated.ok && "generatedAssignments" in generated.data) {
        const data = generated.data as {
          generatedAssignments: Array<{
            subjectEmployeeId: string;
            raterEmployeeId: string;
            raterRole: string;
          }>;
        };
        const roleFor = (
          subjectEmployeeId: string,
          raterEmployeeId: string,
        ): string | undefined => {
          return data.generatedAssignments.find(
            (assignment) =>
              assignment.subjectEmployeeId === subjectEmployeeId &&
              assignment.raterEmployeeId === raterEmployeeId,
          )?.raterRole;
        };

        expect(roleFor(employeeHeadA, employeeHeadB)).toBe("peer");
        expect(roleFor(employeeHeadB, employeeHeadA)).toBe("peer");
        expect(roleFor(employeeStaffA1, employeeHeadA)).toBe("manager");
        expect(roleFor(employeeStaffB1, employeeHeadB)).toBe("manager");
      }
    },
    30_000,
  );

  it.skipIf(hasUrl)("skips integration run when database URL is absent", () => {
    expect(hasDatabaseUrl()).toBe(false);
  });
});
