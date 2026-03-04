import { getQuestionnaireForDebug, hasDatabaseUrl, runSeedScenario } from "@feedback-360/db";
import { describe, expect, it } from "vitest";

import { dispatchOperation } from "../index";

const hasUrl = hasDatabaseUrl();

describe("FT-0022 RBAC enforcement", () => {
  it.runIf(hasUrl)("blocks hr_reader write ops and keeps questionnaire unchanged", async () => {
    const seeded = await runSeedScenario({
      scenario: "S5_campaign_started_no_answers",
    });

    const companyId = seeded.handles["company.main"];
    const campaignId = seeded.handles["campaign.main"];
    const questionnaireId = seeded.handles["questionnaire.main"];

    expect(companyId).toBeDefined();
    expect(campaignId).toBeDefined();
    expect(questionnaireId).toBeDefined();

    if (!companyId || !campaignId || !questionnaireId) {
      return;
    }

    const readerContext = {
      companyId,
      role: "hr_reader" as const,
    };

    const listResult = await dispatchOperation({
      operation: "questionnaire.listAssigned",
      input: {
        campaignId,
      },
      context: readerContext,
    });

    expect(listResult.ok).toBe(true);
    if (listResult.ok && "items" in listResult.data) {
      const firstQuestionnaireId = listResult.data.items
        .map((item) => ("questionnaireId" in item ? item.questionnaireId : undefined))
        .find((value): value is string => typeof value === "string");
      expect(listResult.data.items.length).toBeGreaterThan(0);
      expect(firstQuestionnaireId).toBe(questionnaireId);
    }

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
      context: readerContext,
    });

    expect(saveDraftResult.ok).toBe(false);
    if (!saveDraftResult.ok) {
      expect(saveDraftResult.error.code).toBe("forbidden");
    }

    const submitResult = await dispatchOperation({
      operation: "questionnaire.submit",
      input: {
        questionnaireId,
      },
      context: readerContext,
    });

    expect(submitResult.ok).toBe(false);
    if (!submitResult.ok) {
      expect(submitResult.error.code).toBe("forbidden");
    }

    const questionnaireState = await getQuestionnaireForDebug(questionnaireId);
    expect(questionnaireState.status).toBe("not_started");
  });

  it.skipIf(hasUrl)("skips integration run when database URL is absent", () => {
    expect(hasDatabaseUrl()).toBe(false);
  });
});
