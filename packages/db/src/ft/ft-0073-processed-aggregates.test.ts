import { and, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { applyAiWebhookResult } from "../ai";
import { hasDatabaseUrl } from "../connection-string";
import { createDb, createPool } from "../db";
import { aiJobs, campaigns, questionnaires } from "../schema";
import { runSeedScenario } from "../seeds";

const hasUrl = hasDatabaseUrl();

describe("FT-0073 AI processed comments ingestion", () => {
  it.runIf(hasUrl)(
    "applies processed/summary comments from webhook payload and keeps retry no-op",
    async () => {
      const seeded = await runSeedScenario({
        scenario: "S9_campaign_completed_with_ai",
      });

      const companyId = seeded.handles["company.main"];
      const campaignId = seeded.handles["campaign.main"];
      const questionnaireId = seeded.handles["questionnaire.subject_manager"];
      const competencyId = seeded.handles["competency.main"];

      expect(companyId).toBeDefined();
      expect(campaignId).toBeDefined();
      expect(questionnaireId).toBeDefined();
      expect(competencyId).toBeDefined();

      if (!companyId || !campaignId || !questionnaireId || !competencyId) {
        throw new Error("Required seed handles are missing.");
      }

      const aiJobId = "23000000-0000-4000-8000-000000000001";
      const setupPool = createPool();
      try {
        const setupDb = createDb(setupPool);
        await setupDb
          .update(campaigns)
          .set({
            status: "processing_ai",
            updatedAt: new Date("2026-01-22T09:00:00.000Z"),
          })
          .where(eq(campaigns.id, campaignId));

        await setupDb.insert(aiJobs).values({
          id: aiJobId,
          companyId,
          campaignId,
          provider: "external_mock",
          status: "processing",
          idempotencyKey: "ft0073-pending",
          requestPayload: {
            campaignId,
          },
          responsePayload: {},
          requestedAt: new Date("2026-01-22T09:00:00.000Z"),
          createdAt: new Date("2026-01-22T09:00:00.000Z"),
          updatedAt: new Date("2026-01-22T09:00:00.000Z"),
        });
      } finally {
        await setupPool.end();
      }

      const processedText = "AI: формулирует фокус и приоритеты в нейтральном стиле.";
      const summaryText = "Сохраняет фокус и приоритизацию.";

      const firstApply = await applyAiWebhookResult({
        campaignId,
        aiJobId,
        idempotencyKey: "ft0073-idem-1",
        status: "completed",
        payload: {
          ai_job_id: aiJobId,
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

      expect(firstApply.applied).toBe(true);
      expect(firstApply.noOp).toBe(false);
      expect(firstApply.campaignStatus).toBe("completed");
      expect(firstApply.aiJobStatus).toBe("completed");

      const inspectPool = createPool();
      let updatedDraftPayload: unknown;
      try {
        const inspectDb = createDb(inspectPool);
        const rows = await inspectDb
          .select({
            draftPayload: questionnaires.draftPayload,
          })
          .from(questionnaires)
          .where(
            and(eq(questionnaires.campaignId, campaignId), eq(questionnaires.id, questionnaireId)),
          )
          .limit(1);

        updatedDraftPayload = rows[0]?.draftPayload;
      } finally {
        await inspectPool.end();
      }

      const payloadRecord =
        typeof updatedDraftPayload === "object" && updatedDraftPayload !== null
          ? (updatedDraftPayload as Record<string, unknown>)
          : {};
      const commentsRecord =
        typeof payloadRecord.competencyComments === "object" &&
        payloadRecord.competencyComments !== null
          ? (payloadRecord.competencyComments as Record<string, unknown>)
          : {};
      const bundle =
        typeof commentsRecord[competencyId] === "object" && commentsRecord[competencyId] !== null
          ? (commentsRecord[competencyId] as Record<string, unknown>)
          : {};

      expect(bundle.rawText).toBeTypeOf("string");
      expect(bundle.processedText).toBe(processedText);
      expect(bundle.summaryText).toBe(summaryText);

      const secondApply = await applyAiWebhookResult({
        campaignId,
        aiJobId,
        idempotencyKey: "ft0073-idem-1",
        status: "completed",
        payload: {
          ai_job_id: aiJobId,
          campaign_id: campaignId,
          status: "completed",
          questionnaire_comments: [
            {
              questionnaire_id: questionnaireId,
              competency_comments: {
                [competencyId]: {
                  processed_text: "SHOULD_NOT_OVERWRITE_ON_RETRY",
                  summary_text: "SHOULD_NOT_OVERWRITE_ON_RETRY",
                },
              },
            },
          ],
        },
      });

      expect(secondApply.applied).toBe(false);
      expect(secondApply.noOp).toBe(true);

      const inspectAfterRetryPool = createPool();
      let draftAfterRetry: unknown;
      try {
        const inspectAfterRetryDb = createDb(inspectAfterRetryPool);
        const rows = await inspectAfterRetryDb
          .select({
            draftPayload: questionnaires.draftPayload,
          })
          .from(questionnaires)
          .where(
            and(eq(questionnaires.campaignId, campaignId), eq(questionnaires.id, questionnaireId)),
          )
          .limit(1);

        draftAfterRetry = rows[0]?.draftPayload;
      } finally {
        await inspectAfterRetryPool.end();
      }

      const retryPayloadRecord =
        typeof draftAfterRetry === "object" && draftAfterRetry !== null
          ? (draftAfterRetry as Record<string, unknown>)
          : {};
      const retryCommentsRecord =
        typeof retryPayloadRecord.competencyComments === "object" &&
        retryPayloadRecord.competencyComments !== null
          ? (retryPayloadRecord.competencyComments as Record<string, unknown>)
          : {};
      const retryBundle =
        typeof retryCommentsRecord[competencyId] === "object" &&
        retryCommentsRecord[competencyId] !== null
          ? (retryCommentsRecord[competencyId] as Record<string, unknown>)
          : {};

      expect(retryBundle.processedText).toBe(processedText);
      expect(retryBundle.summaryText).toBe(summaryText);
    },
    60_000,
  );

  it.skipIf(hasUrl)("skips integration run when database URL is absent", () => {
    expect(hasDatabaseUrl()).toBe(false);
  });
});
