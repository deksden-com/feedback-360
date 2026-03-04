import type { CampaignSnapshotListItem } from "@feedback-360/api-contract";
import {
  getDepartmentHistoryForEmployeeDebug,
  getManagerHistoryForEmployeeDebug,
  hasDatabaseUrl,
  runSeedScenario,
} from "@feedback-360/db";
import { describe, expect, it } from "vitest";

import { dispatchOperation } from "../index";

const hasUrl = hasDatabaseUrl();

describe("FT-0032 snapshot immutability", () => {
  it.runIf(hasUrl)("keeps campaign snapshots immutable after org updates", async () => {
    const seeded = await runSeedScenario({
      scenario: "S5_campaign_started_no_answers",
    });

    const companyId = seeded.handles["company.main"];
    const campaignId = seeded.handles["campaign.main"];
    const employeeStaffA1 = seeded.handles["employee.staff_a1"];
    const employeeHeadA = seeded.handles["employee.head_a"];
    const employeeHeadB = seeded.handles["employee.head_b"];
    const departmentA = seeded.handles["department.a"];
    const departmentB = seeded.handles["department.b"];

    expect(companyId).toBeDefined();
    expect(campaignId).toBeDefined();
    expect(employeeStaffA1).toBeDefined();
    expect(employeeHeadA).toBeDefined();
    expect(employeeHeadB).toBeDefined();
    expect(departmentA).toBeDefined();
    expect(departmentB).toBeDefined();

    if (
      !companyId ||
      !campaignId ||
      !employeeStaffA1 ||
      !employeeHeadA ||
      !employeeHeadB ||
      !departmentA ||
      !departmentB
    ) {
      return;
    }

    const context = {
      companyId,
      role: "hr_admin" as const,
    };

    const snapshotBefore = await dispatchOperation({
      operation: "campaign.snapshot.list",
      input: {
        campaignId,
      },
      context,
    });
    expect(snapshotBefore.ok).toBe(true);

    const moveDepartment = await dispatchOperation({
      operation: "org.department.move",
      input: {
        employeeId: employeeStaffA1,
        toDepartmentId: departmentB,
      },
      context,
    });
    expect(moveDepartment.ok).toBe(true);

    const setManager = await dispatchOperation({
      operation: "org.manager.set",
      input: {
        employeeId: employeeStaffA1,
        managerEmployeeId: employeeHeadB,
      },
      context,
    });
    expect(setManager.ok).toBe(true);

    const snapshotAfter = await dispatchOperation({
      operation: "campaign.snapshot.list",
      input: {
        campaignId,
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
          "snapshotId" in item && "employeeId" in item && item.employeeId === employeeStaffA1,
      );
      const afterStaff = snapshotAfter.data.items.find(
        (item): item is CampaignSnapshotListItem =>
          "snapshotId" in item && "employeeId" in item && item.employeeId === employeeStaffA1,
      );

      expect(beforeStaff).toBeDefined();
      expect(afterStaff).toBeDefined();
      expect(beforeStaff?.departmentId).toBe(departmentA);
      expect(beforeStaff?.managerEmployeeId).toBe(employeeHeadA);
      expect(afterStaff?.departmentId).toBe(departmentA);
      expect(afterStaff?.managerEmployeeId).toBe(employeeHeadA);
    }

    const liveDepartmentHistory = await getDepartmentHistoryForEmployeeDebug(employeeStaffA1);
    expect(liveDepartmentHistory).toHaveLength(2);
    expect(liveDepartmentHistory[1]?.departmentId).toBe(departmentB);
    expect(liveDepartmentHistory[1]?.endAt).toBeUndefined();

    const liveManagerHistory = await getManagerHistoryForEmployeeDebug(employeeStaffA1);
    expect(liveManagerHistory).toHaveLength(2);
    expect(liveManagerHistory[1]?.managerEmployeeId).toBe(employeeHeadB);
    expect(liveManagerHistory[1]?.endAt).toBeUndefined();
  });

  it.skipIf(hasUrl)("skips integration run when database URL is absent", () => {
    expect(hasDatabaseUrl()).toBe(false);
  });
});
