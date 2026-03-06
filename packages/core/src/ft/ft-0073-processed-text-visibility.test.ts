import {
  applyAiWebhookResult,
  hasDatabaseUrl,
  runAiForCampaign,
  runSeedScenario,
} from "@feedback-360/db";
import { describe, expect, it } from "vitest";

import { dispatchOperation } from "../index";

const hasUrl = hasDatabaseUrl();

describe("FT-0073 processed text visibility", () => {
  it.runIf(hasUrl)(
    "shows processed/summary to employee-manager and keeps raw only in HR view after webhook apply",
    async () => {
      const seeded = await runSeedScenario({
        scenario: "S9_campaign_completed_with_ai",
      });

      const companyId = seeded.handles["company.main"];
      const campaignId = seeded.handles["campaign.main"];
      const subjectEmployeeId = seeded.handles["employee.subject_main"];
      const employeeUserId = seeded.handles["user.staff_a1"];
      const managerUserId = seeded.handles["user.head_a"];
      const questionnaireId = seeded.handles["questionnaire.subject_manager"];
      const competencyId = seeded.handles["competency.main"];

      expect(companyId).toBeDefined();
      expect(campaignId).toBeDefined();
      expect(subjectEmployeeId).toBeDefined();
      expect(employeeUserId).toBeDefined();
      expect(managerUserId).toBeDefined();
      expect(questionnaireId).toBeDefined();
      expect(competencyId).toBeDefined();

      if (
        !companyId ||
        !campaignId ||
        !subjectEmployeeId ||
        !employeeUserId ||
        !managerUserId ||
        !questionnaireId ||
        !competencyId
      ) {
        throw new Error("Required seed handles are missing.");
      }

      const aiRun = await runAiForCampaign({
        companyId,
        campaignId,
      });

      const processedText = "AI: руководитель формулирует обратную связь нейтрально и по делу.";
      const summaryText = "Фокус на нейтральной и конструктивной обратной связи.";

      const applyResult = await applyAiWebhookResult({
        campaignId,
        aiJobId: aiRun.aiJobId,
        idempotencyKey: "ft0073-core-idem-1",
        status: "completed",
        payload: {
          ai_job_id: aiRun.aiJobId,
          campaign_id: campaignId,
          status: "completed",
          questionnaire_comments: [
            {
              questionnaire_id: questionnaireId,
              competency_comments: {
                [competencyId]: {
                  processed_text: processedText,
                  summary_text: summaryText,
                },
              },
            },
          ],
        },
      });

      expect(applyResult.applied).toBe(true);
      expect(applyResult.noOp).toBe(false);

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
        const openText = myResult.data.openText ?? [];
        expect(openText.length).toBeGreaterThan(0);
        expect(
          openText.some((item) => {
            return "rawText" in item;
          }),
        ).toBe(false);
        expect(
          openText.some((item) => {
            return item.competencyId === competencyId && item.processedText === processedText;
          }),
        ).toBe(true);
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
        const openText = teamResult.data.openText ?? [];
        expect(openText.length).toBeGreaterThan(0);
        expect(
          openText.some((item) => {
            return "rawText" in item;
          }),
        ).toBe(false);
        expect(
          openText.some((item) => {
            return item.competencyId === competencyId && item.summaryText === summaryText;
          }),
        ).toBe(true);
      }

      const hrReaderResult = await dispatchOperation({
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

      expect(hrReaderResult.ok).toBe(true);
      if (hrReaderResult.ok && "openText" in hrReaderResult.data) {
        const items = hrReaderResult.data.openText ?? [];
        expect(items.length).toBeGreaterThan(0);
        expect(
          items.some((item) => {
            return item.competencyId === competencyId && item.processedText === processedText;
          }),
        ).toBe(true);
        expect(
          items.some((item) => {
            return item.competencyId === competencyId && item.summaryText === summaryText;
          }),
        ).toBe(true);
        expect(
          items.some((item) => {
            return item.competencyId === competencyId && typeof item.rawText === "string";
          }),
        ).toBe(false);
      }

      const hrAdminResult = await dispatchOperation({
        operation: "results.getHrView",
        input: {
          campaignId,
          subjectEmployeeId,
          smallGroupPolicy: "merge_to_other",
        },
        context: {
          companyId,
          role: "hr_admin",
        },
      });

      expect(hrAdminResult.ok).toBe(true);
      if (hrAdminResult.ok && "openText" in hrAdminResult.data) {
        const items = hrAdminResult.data.openText ?? [];
        expect(items.length).toBeGreaterThan(0);
        expect(
          items.some((item) => {
            return item.competencyId === competencyId && item.processedText === processedText;
          }),
        ).toBe(true);
        expect(
          items.some((item) => {
            return item.competencyId === competencyId && item.summaryText === summaryText;
          }),
        ).toBe(true);
        expect(
          items.some((item) => {
            return item.competencyId === competencyId && typeof item.rawText === "string";
          }),
        ).toBe(true);
      }
    },
    60_000,
  );

  it.skipIf(hasUrl)("skips integration run when database URL is absent", () => {
    expect(hasDatabaseUrl()).toBe(false);
  });
});
