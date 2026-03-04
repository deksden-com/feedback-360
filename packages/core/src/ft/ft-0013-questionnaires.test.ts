import { describe, expect, it } from "vitest";

import { hasDatabaseUrl, runSeedScenario } from "@feedback-360/db";

import { dispatchOperation } from "../index";

const hasUrl = hasDatabaseUrl();

describe("FT-0013 questionnaire ops", () => {
  it.runIf(hasUrl)(
    "supports list -> saveDraft -> submit flow with lock and submitted immutability",
    async () => {
      const seeded = await runSeedScenario({ scenario: "S5_campaign_started_no_answers" });
      const companyId = seeded.handles["company.main"];
      const campaignId = seeded.handles["campaign.main"];
      const questionnaireId = seeded.handles["questionnaire.main"];

      expect(companyId).toBeDefined();
      expect(campaignId).toBeDefined();
      expect(questionnaireId).toBeDefined();

      const context = {
        companyId: String(companyId),
        role: "employee" as const,
      };

      const listNotStarted = await dispatchOperation({
        operation: "questionnaire.listAssigned",
        input: {
          campaignId,
          status: "not_started",
        },
        context,
      });

      expect(listNotStarted.ok).toBe(true);
      if (listNotStarted.ok && "items" in listNotStarted.data) {
        const questionnaireIds = listNotStarted.data.items
          .map((item) => ("questionnaireId" in item ? item.questionnaireId : undefined))
          .filter((value): value is string => typeof value === "string");
        expect(questionnaireIds.includes(String(questionnaireId))).toBe(true);
      }

      const savedDraft = await dispatchOperation({
        operation: "questionnaire.saveDraft",
        input: {
          questionnaireId,
          draft: {
            answers: {
              leadership: 4,
            },
          },
        },
        context,
      });

      expect(savedDraft.ok).toBe(true);
      if (savedDraft.ok && "campaignLockedAt" in savedDraft.data) {
        expect(savedDraft.data.status).toBe("in_progress");
        expect(typeof savedDraft.data.campaignLockedAt).toBe("string");
      }

      const submitted = await dispatchOperation({
        operation: "questionnaire.submit",
        input: { questionnaireId },
        context,
      });

      expect(submitted.ok).toBe(true);
      if (submitted.ok && "submittedAt" in submitted.data) {
        expect(submitted.data.status).toBe("submitted");
        expect(submitted.data.wasAlreadySubmitted).toBe(false);
      }

      const listSubmitted = await dispatchOperation({
        operation: "questionnaire.listAssigned",
        input: {
          campaignId,
          status: "submitted",
        },
        context,
      });

      expect(listSubmitted.ok).toBe(true);
      if (listSubmitted.ok && "items" in listSubmitted.data) {
        const questionnaireIds = listSubmitted.data.items
          .map((item) => ("questionnaireId" in item ? item.questionnaireId : undefined))
          .filter((value): value is string => typeof value === "string");
        expect(questionnaireIds.includes(String(questionnaireId))).toBe(true);
      }

      const submittedAgain = await dispatchOperation({
        operation: "questionnaire.submit",
        input: { questionnaireId },
        context,
      });

      expect(submittedAgain.ok).toBe(true);
      if (submittedAgain.ok && "wasAlreadySubmitted" in submittedAgain.data) {
        expect(submittedAgain.data.wasAlreadySubmitted).toBe(true);
      }

      const draftAfterSubmit = await dispatchOperation({
        operation: "questionnaire.saveDraft",
        input: {
          questionnaireId,
          draft: { answers: { leadership: 5 } },
        },
        context,
      });

      expect(draftAfterSubmit.ok).toBe(false);
      if (!draftAfterSubmit.ok) {
        expect(draftAfterSubmit.error.code).toBe("invalid_transition");
      }
    },
    60_000,
  );

  it.skipIf(hasUrl)("skips integration run when database URL is absent", () => {
    expect(hasDatabaseUrl()).toBe(false);
  });
});
