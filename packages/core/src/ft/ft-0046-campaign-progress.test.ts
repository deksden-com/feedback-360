import { hasDatabaseUrl, runSeedScenario } from "@feedback-360/db";
import { describe, expect, it } from "vitest";

import { dispatchOperation } from "../index";

const hasUrl = hasDatabaseUrl();

describe("FT-0046 campaign progress view", () => {
  it.runIf(hasUrl)(
    "returns questionnaire counts/pending lists for HR and blocks non-HR roles",
    async () => {
      const seeded = await runSeedScenario({
        scenario: "S7_campaign_started_some_submitted",
      });

      const companyId = seeded.handles["company.main"];
      const campaignId = seeded.handles["campaign.main"];
      const expectedPendingRater = seeded.handles["employee.head_a"];
      const expectedPendingSubjectA = seeded.handles["employee.staff_a1"];
      const expectedPendingSubjectB = seeded.handles["employee.staff_a2"];

      expect(companyId).toBeDefined();
      expect(campaignId).toBeDefined();
      expect(expectedPendingRater).toBeDefined();
      expect(expectedPendingSubjectA).toBeDefined();
      expect(expectedPendingSubjectB).toBeDefined();

      if (
        !companyId ||
        !campaignId ||
        !expectedPendingRater ||
        !expectedPendingSubjectA ||
        !expectedPendingSubjectB
      ) {
        return;
      }

      const hrProgress = await dispatchOperation({
        operation: "campaign.progress.get",
        input: {
          campaignId,
        },
        context: {
          companyId,
          role: "hr_admin",
        },
      });

      expect(hrProgress.ok).toBe(true);
      if (hrProgress.ok && "statusCounts" in hrProgress.data) {
        expect(hrProgress.data.campaignId).toBe(campaignId);
        expect(hrProgress.data.companyId).toBe(companyId);
        expect(hrProgress.data.totalQuestionnaires).toBe(3);
        expect(hrProgress.data.statusCounts).toEqual({
          notStarted: 1,
          inProgress: 1,
          submitted: 1,
        });
        expect(hrProgress.data.pendingQuestionnaires).toHaveLength(2);
        expect(
          hrProgress.data.pendingQuestionnaires
            .map((item: { status: string }) => item.status)
            .sort(),
        ).toEqual(["in_progress", "not_started"]);
        expect(hrProgress.data.campaignLockedAt).toBeDefined();
        expect(hrProgress.data.pendingByRater).toEqual([
          {
            employeeId: expectedPendingRater,
            pendingCount: 2,
          },
        ]);
        expect(hrProgress.data.pendingBySubject).toEqual([
          {
            employeeId: expectedPendingSubjectA,
            pendingCount: 1,
          },
          {
            employeeId: expectedPendingSubjectB,
            pendingCount: 1,
          },
        ]);
      }

      const employeeProgress = await dispatchOperation({
        operation: "campaign.progress.get",
        input: {
          campaignId,
        },
        context: {
          companyId,
          role: "employee",
        },
      });
      expect(employeeProgress.ok).toBe(false);
      if (!employeeProgress.ok) {
        expect(employeeProgress.error.code).toBe("forbidden");
      }

      const managerProgress = await dispatchOperation({
        operation: "campaign.progress.get",
        input: {
          campaignId,
        },
        context: {
          companyId,
          role: "manager",
        },
      });
      expect(managerProgress.ok).toBe(false);
      if (!managerProgress.ok) {
        expect(managerProgress.error.code).toBe("forbidden");
      }
    },
    60_000,
  );

  it.skipIf(hasUrl)("skips integration run when database URL is absent", () => {
    expect(hasDatabaseUrl()).toBe(false);
  });
});
