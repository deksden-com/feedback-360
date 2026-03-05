import {
  countAiCommentAggregatesForCampaignForDebug,
  hasDatabaseUrl,
  runSeedScenario,
} from "@feedback-360/db";
import { describe, expect, it } from "vitest";

import { dispatchOperation } from "../index";

const hasUrl = hasDatabaseUrl();

describe("FT-0073 processed text aggregates visibility", () => {
  it.runIf(hasUrl)(
    "stores processed aggregates and keeps raw text visible only in HR view",
    async () => {
      const seeded = await runSeedScenario({
        scenario: "S9_campaign_completed_with_ai",
      });

      const companyId = seeded.handles["company.main"];
      const campaignId = seeded.handles["campaign.main"];
      const subjectEmployeeId = seeded.handles["employee.subject_main"];
      const employeeUserId = seeded.handles["user.staff_a1"];
      const managerUserId = seeded.handles["user.head_a"];
      expect(companyId).toBeDefined();
      expect(campaignId).toBeDefined();
      expect(subjectEmployeeId).toBeDefined();
      expect(employeeUserId).toBeDefined();
      expect(managerUserId).toBeDefined();

      if (!companyId || !campaignId || !subjectEmployeeId || !employeeUserId || !managerUserId) {
        throw new Error("Required seed handles are missing.");
      }

      const aiRun = await dispatchOperation({
        operation: "ai.runForCampaign",
        input: {
          campaignId,
        },
        context: {
          companyId,
          role: "hr_admin",
        },
      });
      expect(aiRun.ok).toBe(true);
      if (aiRun.ok && "status" in aiRun.data) {
        expect(aiRun.data.status).toBe("completed");
      }

      const aggregateCount = await countAiCommentAggregatesForCampaignForDebug(campaignId);
      expect(aggregateCount).toBeGreaterThan(0);

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
      if (myResult.ok && "openText" in myResult.data) {
        const items = myResult.data.openText ?? [];
        expect(items.length).toBeGreaterThan(0);
        for (const item of items) {
          expect("rawText" in item).toBe(false);
        }
        const hasProcessed = items.some(
          (item: { processedText?: string }) => typeof item.processedText === "string",
        );
        expect(hasProcessed).toBe(true);
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
      if (teamResult.ok && "openText" in teamResult.data) {
        const items = teamResult.data.openText ?? [];
        expect(items.length).toBeGreaterThan(0);
        for (const item of items) {
          expect("rawText" in item).toBe(false);
        }
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
        const hasSummary = items.some(
          (item: { summaryText?: string }) => typeof item.summaryText === "string",
        );
        expect(hasRaw).toBe(true);
        expect(hasProcessed).toBe(true);
        expect(hasSummary).toBe(true);
      }
    },
    60_000,
  );

  it.skipIf(hasUrl)("skips integration run when database URL is absent", () => {
    expect(hasDatabaseUrl()).toBe(false);
  });
});
