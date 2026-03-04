import { beforeEach, describe, expect, it, vi } from "vitest";

const state = {
  participants: new Set<string>(),
};

vi.mock("@feedback-360/db", () => {
  return {
    addCampaignParticipantsFromDepartments: async ({
      campaignId,
      departmentIds,
    }: {
      companyId: string;
      campaignId: string;
      departmentIds: string[];
      includeSelf?: boolean;
    }) => {
      if (departmentIds.includes("department-a")) {
        state.participants.add("employee-head-a");
        state.participants.add("employee-staff-a1");
      }
      if (departmentIds.includes("department-b")) {
        state.participants.add("employee-head-b");
        state.participants.add("employee-staff-b1");
      }
      return {
        campaignId,
        addedEmployeeIds: [...state.participants].sort((left, right) => left.localeCompare(right)),
        totalParticipants: state.participants.size,
      };
    },
    generateSuggestedMatrix: async ({ campaignId }: { companyId: string; campaignId: string }) => {
      return {
        campaignId,
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
      };
    },
    listCampaignEmployeeSnapshots: async () => ({ items: [] }),
    moveEmployeeDepartment: async () => ({
      employeeId: "employee-staff-a1",
      departmentId: "department-b",
      changed: true,
      effectiveAt: "2026-01-10T10:00:00.000Z",
    }),
    setEmployeeManager: async () => ({
      employeeId: "employee-staff-a1",
      managerEmployeeId: "employee-head-b",
      changed: true,
      effectiveAt: "2026-01-10T10:05:00.000Z",
    }),
    listActiveEmployees: async () => ({ items: [] }),
    upsertEmployee: async () => ({
      employeeId: "employee-staff-a1",
      companyId: "company-main",
      isActive: true,
      updatedAt: "2026-01-10T10:10:00.000Z",
      created: false,
    }),
    listAssignedQuestionnaires: async () => ({ items: [] }),
    saveQuestionnaireDraft: async () => ({
      questionnaireId: "q-main",
      status: "in_progress" as const,
      campaignLockedAt: "2026-01-10T10:00:00.000Z",
    }),
    submitQuestionnaire: async () => ({
      questionnaireId: "q-main",
      status: "submitted" as const,
      submittedAt: "2026-01-10T10:05:00.000Z",
      wasAlreadySubmitted: false,
    }),
  };
});

describe("FT-0033 matrix autogen (no-db acceptance)", () => {
  beforeEach(() => {
    state.participants = new Set();
  });

  it("adds participants from departments and generates expected peer/manager suggestions", async () => {
    const { dispatchOperation } = await import("../index");
    const context = {
      companyId: "company-main",
      role: "hr_admin" as const,
    };

    const addParticipants = await dispatchOperation({
      operation: "campaign.participants.addFromDepartments",
      input: {
        campaignId: "campaign-main",
        departmentIds: ["department-a", "department-b"],
      },
      context,
    });
    expect(addParticipants.ok).toBe(true);
    if (addParticipants.ok && "addedEmployeeIds" in addParticipants.data) {
      expect(addParticipants.data.addedEmployeeIds).toContain("employee-head-a");
      expect(addParticipants.data.addedEmployeeIds).toContain("employee-head-b");
      expect(addParticipants.data.totalParticipants).toBe(4);
    }

    const generate = await dispatchOperation({
      operation: "matrix.generateSuggested",
      input: {
        campaignId: "campaign-main",
        departmentIds: ["department-a", "department-b"],
      },
      context,
    });
    expect(generate.ok).toBe(true);
    if (generate.ok && "generatedAssignments" in generate.data) {
      const data = generate.data as {
        generatedAssignments: Array<{
          subjectEmployeeId: string;
          raterEmployeeId: string;
          raterRole: string;
        }>;
      };
      const findRole = (subjectEmployeeId: string, raterEmployeeId: string): string | undefined => {
        return data.generatedAssignments.find(
          (assignment) =>
            assignment.subjectEmployeeId === subjectEmployeeId &&
            assignment.raterEmployeeId === raterEmployeeId,
        )?.raterRole;
      };

      expect(findRole("employee-head-a", "employee-head-b")).toBe("peer");
      expect(findRole("employee-head-b", "employee-head-a")).toBe("peer");
      expect(findRole("employee-staff-a1", "employee-head-a")).toBe("manager");
      expect(findRole("employee-staff-b1", "employee-head-b")).toBe("manager");
    }
  });
});
