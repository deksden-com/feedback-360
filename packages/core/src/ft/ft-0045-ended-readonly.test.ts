import { getQuestionnaireForDebug, hasDatabaseUrl, runSeedScenario } from "@feedback-360/db";
import { describe, expect, it } from "vitest";

import { dispatchOperation } from "../index";

const hasUrl = hasDatabaseUrl();

describe("FT-0045 ended campaign questionnaire read-only", () => {
  it.runIf(hasUrl)(
    "blocks saveDraft/submit after campaign ended and keeps questionnaire unchanged",
    async () => {
      const seeded = await runSeedScenario({
        scenario: "S8_campaign_ended",
      });

      const companyId = seeded.handles["company.main"];
      const questionnaireId = seeded.handles["questionnaire.main"];

      expect(companyId).toBeDefined();
      expect(questionnaireId).toBeDefined();

      if (!companyId || !questionnaireId) {
        return;
      }

      const employeeContext = {
        companyId,
        role: "employee" as const,
      };

      const before = await getQuestionnaireForDebug(questionnaireId);
      expect(before.status).toBe("not_started");
      expect(before.submittedAt).toBeUndefined();

      const saveDraftResult = await dispatchOperation({
        operation: "questionnaire.saveDraft",
        input: {
          questionnaireId,
          draft: {
            answers: {
              leadership: 4,
            },
          },
        },
        context: employeeContext,
      });
      expect(saveDraftResult.ok).toBe(false);
      if (!saveDraftResult.ok) {
        expect(saveDraftResult.error.code).toBe("campaign_ended_readonly");
      }

      const afterSave = await getQuestionnaireForDebug(questionnaireId);
      expect(afterSave).toEqual(before);

      const submitResult = await dispatchOperation({
        operation: "questionnaire.submit",
        input: {
          questionnaireId,
        },
        context: employeeContext,
      });
      expect(submitResult.ok).toBe(false);
      if (!submitResult.ok) {
        expect(submitResult.error.code).toBe("campaign_ended_readonly");
      }

      const afterSubmit = await getQuestionnaireForDebug(questionnaireId);
      expect(afterSubmit).toEqual(before);
    },
    60_000,
  );

  it.skipIf(hasUrl)("skips integration run when database URL is absent", () => {
    expect(hasDatabaseUrl()).toBe(false);
  });
});
