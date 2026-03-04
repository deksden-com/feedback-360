import type { CampaignSnapshotListItem } from "@feedback-360/api-contract";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = {
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

vi.mock("@feedback-360/db", () => {
  return {
    listCampaignEmployeeSnapshots: async ({ campaignId }: { campaignId: string }) => {
      return {
        items: state.snapshots.filter((item) => item.campaignId === campaignId),
      };
    },
    moveEmployeeDepartment: async ({
      employeeId,
      toDepartmentId,
    }: {
      companyId: string;
      employeeId: string;
      toDepartmentId: string;
    }) => {
      const live = state.live[employeeId as keyof typeof state.live];
      const previousDepartmentId = live?.departmentId;
      state.live[employeeId as keyof typeof state.live] = {
        ...(live ?? { managerEmployeeId: "employee-head-a" }),
        departmentId: toDepartmentId,
      };

      return {
        employeeId,
        ...(previousDepartmentId ? { previousDepartmentId } : {}),
        departmentId: toDepartmentId,
        changed: previousDepartmentId !== toDepartmentId,
        effectiveAt: "2026-01-11T10:00:00.000Z",
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
      const live = state.live[employeeId as keyof typeof state.live];
      const previousManagerEmployeeId = live?.managerEmployeeId;
      state.live[employeeId as keyof typeof state.live] = {
        ...(live ?? { departmentId: "department-a" }),
        managerEmployeeId,
      };

      return {
        employeeId,
        ...(previousManagerEmployeeId ? { previousManagerEmployeeId } : {}),
        managerEmployeeId,
        changed: previousManagerEmployeeId !== managerEmployeeId,
        effectiveAt: "2026-01-11T10:05:00.000Z",
      };
    },
    listActiveEmployees: async () => ({
      items: [],
    }),
    upsertEmployee: async () => ({
      employeeId: "employee-staff-a1",
      companyId: "company-main",
      isActive: true,
      updatedAt: "2026-01-11T10:10:00.000Z",
      created: false,
    }),
    listAssignedQuestionnaires: async () => ({
      items: [],
    }),
    saveQuestionnaireDraft: async () => ({
      questionnaireId: "q-main",
      status: "in_progress" as const,
      campaignLockedAt: "2026-01-11T10:00:00.000Z",
    }),
    submitQuestionnaire: async () => ({
      questionnaireId: "q-main",
      status: "submitted" as const,
      submittedAt: "2026-01-11T10:05:00.000Z",
      wasAlreadySubmitted: false,
    }),
  };
});

describe("FT-0032 snapshot immutability (no-db acceptance)", () => {
  beforeEach(() => {
    state.live = {
      "employee-staff-a1": {
        departmentId: "department-a",
        managerEmployeeId: "employee-head-a",
      },
    };
  });

  it("keeps campaign snapshots unchanged after live org updates", async () => {
    const { dispatchOperation } = await import("../index");
    const context = {
      companyId: "company-main",
      role: "hr_admin" as const,
    };

    const snapshotBefore = await dispatchOperation({
      operation: "campaign.snapshot.list",
      input: {
        campaignId: "campaign-main",
      },
      context,
    });
    expect(snapshotBefore.ok).toBe(true);

    const moveDepartment = await dispatchOperation({
      operation: "org.department.move",
      input: {
        employeeId: "employee-staff-a1",
        toDepartmentId: "department-b",
      },
      context,
    });
    expect(moveDepartment.ok).toBe(true);

    const setManager = await dispatchOperation({
      operation: "org.manager.set",
      input: {
        employeeId: "employee-staff-a1",
        managerEmployeeId: "employee-head-b",
      },
      context,
    });
    expect(setManager.ok).toBe(true);

    const snapshotAfter = await dispatchOperation({
      operation: "campaign.snapshot.list",
      input: {
        campaignId: "campaign-main",
      },
      context,
    });
    expect(snapshotAfter.ok).toBe(true);

    if (
      snapshotBefore.ok &&
      snapshotAfter.ok &&
      "items" in snapshotBefore.data &&
      "items" in snapshotAfter.data
    ) {
      const beforeStaff = snapshotBefore.data.items.find(
        (item): item is CampaignSnapshotListItem =>
          "snapshotId" in item && "employeeId" in item && item.employeeId === "employee-staff-a1",
      );
      const afterStaff = snapshotAfter.data.items.find(
        (item): item is CampaignSnapshotListItem =>
          "snapshotId" in item && "employeeId" in item && item.employeeId === "employee-staff-a1",
      );

      expect(beforeStaff).toBeDefined();
      expect(afterStaff).toBeDefined();
      expect(beforeStaff?.departmentId).toBe("department-a");
      expect(beforeStaff?.managerEmployeeId).toBe("employee-head-a");
      expect(afterStaff?.departmentId).toBe("department-a");
      expect(afterStaff?.managerEmployeeId).toBe("employee-head-a");
    }

    expect(state.live["employee-staff-a1"]?.departmentId).toBe("department-b");
    expect(state.live["employee-staff-a1"]?.managerEmployeeId).toBe("employee-head-b");
  });
});
