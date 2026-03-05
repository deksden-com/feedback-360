import type { QuestionnaireListAssignedItem } from "@feedback-360/api-contract";
import { describe, expect, it } from "vitest";

import { hasDatabaseUrl, runSeedScenario } from "@feedback-360/db";

import { dispatchOperation } from "../index";

const hasUrl = hasDatabaseUrl();

describe("FT-0082 questionnaire access scoping", () => {
  it.runIf(hasUrl)(
    "scopes questionnaire list/get/save/submit by current rater for employee/manager roles",
    async () => {
      const seeded = await runSeedScenario({ scenario: "S7_campaign_started_some_submitted" });
      const companyId = seeded.handles["company.main"];
      const campaignId = seeded.handles["campaign.main"];
      const managerUserId = seeded.handles["user.head_a"];
      const staffUserId = seeded.handles["user.staff_a2"];

      expect(companyId).toBeDefined();
      expect(campaignId).toBeDefined();
      expect(managerUserId).toBeDefined();
      expect(staffUserId).toBeDefined();

      const hrList = await dispatchOperation({
        operation: "questionnaire.listAssigned",
        input: {
          campaignId,
        },
        context: {
          companyId: String(companyId),
          role: "hr_admin",
        },
      });
      expect(hrList.ok).toBe(true);
      if (!hrList.ok) {
        return;
      }
      if (!("items" in hrList.data)) {
        return;
      }

      expect(hrList.data.items.length).toBeGreaterThanOrEqual(3);

      const managerList = await dispatchOperation({
        operation: "questionnaire.listAssigned",
        input: {
          campaignId,
        },
        context: {
          companyId: String(companyId),
          role: "manager",
          userId: String(managerUserId),
        },
      });
      expect(managerList.ok).toBe(true);
      if (!managerList.ok) {
        return;
      }
      if (!("items" in managerList.data)) {
        return;
      }

      const managerItems = managerList.data.items.filter(
        (item): item is QuestionnaireListAssignedItem => "questionnaireId" in item,
      );
      expect(managerItems.length).toBeGreaterThanOrEqual(1);
      const managerQuestionnaireId = managerItems[0]?.questionnaireId;
      expect(managerQuestionnaireId).toBeDefined();

      const managerGetOwn = await dispatchOperation({
        operation: "questionnaire.getDraft",
        input: {
          questionnaireId: managerQuestionnaireId,
        },
        context: {
          companyId: String(companyId),
          role: "manager",
          userId: String(managerUserId),
        },
      });
      expect(managerGetOwn.ok).toBe(true);

      const foreignQuestionnaireId = hrList.data.items
        .map((item) => ("questionnaireId" in item ? item.questionnaireId : undefined))
        .filter((value): value is string => typeof value === "string")
        .find((value) => !managerItems.some((owned) => owned.questionnaireId === value));
      expect(foreignQuestionnaireId).toBeDefined();

      const managerGetForeign = await dispatchOperation({
        operation: "questionnaire.getDraft",
        input: {
          questionnaireId: foreignQuestionnaireId,
        },
        context: {
          companyId: String(companyId),
          role: "manager",
          userId: String(managerUserId),
        },
      });
      expect(managerGetForeign.ok).toBe(false);
      if (!managerGetForeign.ok) {
        expect(managerGetForeign.error.code).toBe("not_found");
      }

      const managerSaveForeign = await dispatchOperation({
        operation: "questionnaire.saveDraft",
        input: {
          questionnaireId: foreignQuestionnaireId,
          draft: {
            note: "forbidden",
          },
        },
        context: {
          companyId: String(companyId),
          role: "manager",
          userId: String(managerUserId),
        },
      });
      expect(managerSaveForeign.ok).toBe(false);
      if (!managerSaveForeign.ok) {
        expect(managerSaveForeign.error.code).toBe("forbidden");
      }

      const managerSubmitForeign = await dispatchOperation({
        operation: "questionnaire.submit",
        input: {
          questionnaireId: foreignQuestionnaireId,
        },
        context: {
          companyId: String(companyId),
          role: "manager",
          userId: String(managerUserId),
        },
      });
      expect(managerSubmitForeign.ok).toBe(false);
      if (!managerSubmitForeign.ok) {
        expect(managerSubmitForeign.error.code).toBe("forbidden");
      }

      const staffList = await dispatchOperation({
        operation: "questionnaire.listAssigned",
        input: {
          campaignId,
        },
        context: {
          companyId: String(companyId),
          role: "employee",
          userId: String(staffUserId),
        },
      });
      expect(staffList.ok).toBe(true);
      if (staffList.ok && "items" in staffList.data) {
        expect(staffList.data.items.length).toBe(0);
      }

      const missingUser = await dispatchOperation({
        operation: "questionnaire.listAssigned",
        input: {
          campaignId,
        },
        context: {
          companyId: String(companyId),
          role: "employee",
        },
      });
      expect(missingUser.ok).toBe(false);
      if (!missingUser.ok) {
        expect(missingUser.error.code).toBe("unauthenticated");
      }
    },
    60_000,
  );

  it.skipIf(hasUrl)("skips integration run when database URL is absent", () => {
    expect(hasDatabaseUrl()).toBe(false);
  });
});
