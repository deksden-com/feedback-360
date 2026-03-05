import { hasDatabaseUrl, runSeedScenario } from "@feedback-360/db";
import { describe, expect, it } from "vitest";

import { dispatchOperation } from "../index";

const hasUrl = hasDatabaseUrl();

describe("FT-0055 results views shaping", () => {
  it.runIf(hasUrl)(
    "returns processed-only open text for employee/manager and raw for HR view",
    async () => {
      const seeded = await runSeedScenario({
        scenario: "S9_campaign_completed_with_ai",
      });

      const companyId = seeded.handles["company.main"];
      const campaignId = seeded.handles["campaign.main"];
      const subjectEmployeeId = seeded.handles["employee.subject_main"];
      const employeeUserId = seeded.handles["user.staff_a1"];
      const managerUserId = seeded.handles["user.head_a"];
      const outsiderManagerUserId = seeded.handles["user.head_b"];

      expect(companyId).toBeDefined();
      expect(campaignId).toBeDefined();
      expect(subjectEmployeeId).toBeDefined();
      expect(employeeUserId).toBeDefined();
      expect(managerUserId).toBeDefined();
      expect(outsiderManagerUserId).toBeDefined();

      if (
        !companyId ||
        !campaignId ||
        !subjectEmployeeId ||
        !employeeUserId ||
        !managerUserId ||
        !outsiderManagerUserId
      ) {
        return;
      }

      const myResult = await dispatchOperation({
        operation: "results.getMyDashboard",
        input: {
          campaignId,
          smallGroupPolicy: "merge_to_other",
        },
        context: {
          companyId,
          role: "employee",
          userId: employeeUserId,
        },
      });

      expect(myResult.ok).toBe(true);
      if (myResult.ok && "subjectEmployeeId" in myResult.data && "openText" in myResult.data) {
        expect(myResult.data.subjectEmployeeId).toBe(subjectEmployeeId);
        const openText = myResult.data.openText ?? [];
        expect(openText.length).toBeGreaterThan(0);
        for (const item of openText) {
          expect("rawText" in item).toBe(false);
          if ("processedText" in item) {
            expect(item.processedText?.length).toBeGreaterThan(0);
          }
        }
      }

      const teamResult = await dispatchOperation({
        operation: "results.getTeamDashboard",
        input: {
          campaignId,
          subjectEmployeeId,
          smallGroupPolicy: "merge_to_other",
        },
        context: {
          companyId,
          role: "manager",
          userId: managerUserId,
        },
      });

      expect(teamResult.ok).toBe(true);
      if (
        teamResult.ok &&
        "subjectEmployeeId" in teamResult.data &&
        "openText" in teamResult.data
      ) {
        expect(teamResult.data.subjectEmployeeId).toBe(subjectEmployeeId);
        const openText = teamResult.data.openText ?? [];
        expect(openText.length).toBeGreaterThan(0);
        for (const item of openText) {
          expect("rawText" in item).toBe(false);
        }
      }

      const blockedTeamResult = await dispatchOperation({
        operation: "results.getTeamDashboard",
        input: {
          campaignId,
          subjectEmployeeId,
        },
        context: {
          companyId,
          role: "manager",
          userId: outsiderManagerUserId,
        },
      });
      expect(blockedTeamResult.ok).toBe(false);
      if (!blockedTeamResult.ok) {
        expect(blockedTeamResult.error.code).toBe("forbidden");
      }

      const hrResult = await dispatchOperation({
        operation: "results.getHrView",
        input: {
          campaignId,
          subjectEmployeeId,
          smallGroupPolicy: "merge_to_other",
        },
        context: {
          companyId,
          role: "hr_reader",
        },
      });

      expect(hrResult.ok).toBe(true);
      if (hrResult.ok && "openText" in hrResult.data) {
        const items = hrResult.data.openText ?? [];
        expect(items.length).toBeGreaterThan(0);
        const hasRaw = items.some((item: { rawText?: string }) => typeof item.rawText === "string");
        const hasProcessed = items.some(
          (item: { processedText?: string }) => typeof item.processedText === "string",
        );
        expect(hasRaw).toBe(true);
        expect(hasProcessed).toBe(true);
      }
    },
    60_000,
  );

  it.skipIf(hasUrl)("skips integration run when database URL is absent", () => {
    expect(hasDatabaseUrl()).toBe(false);
  });
});
