import { createOperationError } from "@feedback-360/api-contract";
import { and, asc, desc, eq } from "drizzle-orm";

import { createDb, createPool } from "./db";
import { aiJobs, aiWebhookReceipts, campaigns, questionnaires } from "./schema";

const MVP_STUB_PROVIDER = "mvp_stub";
const MVP_STUB_IDEMPOTENCY_KEY = "mvp_stub_default";

type RunAiForCampaignInput = {
  companyId: string;
  campaignId: string;
};

export type RunAiForCampaignOutput = {
  campaignId: string;
  aiJobId: string;
  provider: "mvp_stub";
  status: "completed";
  completedAt: string;
  wasAlreadyCompleted: boolean;
};

export type ApplyAiWebhookResultInput = {
  campaignId: string;
  aiJobId: string;
  idempotencyKey: string;
  status: "completed" | "failed";
  payload: Record<string, unknown>;
  receivedAt?: Date;
};

export type ApplyAiWebhookResultOutput = {
  applied: boolean;
  noOp: boolean;
  campaignStatus: string;
  aiJobStatus: string;
};

export type AiDiagnosticsListInput = {
  companyId: string;
  campaignId?: string;
  status?: "queued" | "completed" | "failed";
};

export type AiDiagnosticsListOutput = {
  items: Array<{
    aiJobId: string;
    campaignId: string;
    provider: string;
    status: string;
    requestedAt: Date;
    completedAt: Date | null;
    idempotencyKey: string;
    receipt: {
      receiptId: string;
      idempotencyKey: string;
      receivedAt: Date;
      lastReceivedAt: Date;
      deliveryCount: number;
      payloadSummary: string;
    } | null;
  }>;
};

type AiCommentPatch = {
  questionnaireId?: string;
  subjectEmployeeId?: string;
  raterEmployeeId?: string;
  competencyComments: Record<
    string,
    {
      processedText?: string;
      summaryText?: string;
    }
  >;
};

const asObjectRecord = (value: unknown): Record<string, unknown> | undefined => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return undefined;
  }
  return value as Record<string, unknown>;
};

const toNonEmptyString = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const parseAiCommentPatches = (payload: Record<string, unknown>): AiCommentPatch[] => {
  const rawItems = payload.questionnaire_comments;
  if (!Array.isArray(rawItems)) {
    return [];
  }

  const patches: AiCommentPatch[] = [];
  for (const item of rawItems) {
    const itemRecord = asObjectRecord(item);
    if (!itemRecord) {
      continue;
    }

    const questionnaireId = toNonEmptyString(itemRecord.questionnaire_id);
    const subjectEmployeeId = toNonEmptyString(itemRecord.subject_employee_id);
    const raterEmployeeId = toNonEmptyString(itemRecord.rater_employee_id);
    if (!questionnaireId && (!subjectEmployeeId || !raterEmployeeId)) {
      continue;
    }

    const commentsRecord = asObjectRecord(itemRecord.competency_comments);
    if (!commentsRecord) {
      continue;
    }

    const competencyComments: AiCommentPatch["competencyComments"] = {};
    for (const [competencyId, rawBundle] of Object.entries(commentsRecord)) {
      const bundleRecord = asObjectRecord(rawBundle);
      if (!bundleRecord) {
        continue;
      }

      const processedText = toNonEmptyString(bundleRecord.processed_text);
      const summaryText = toNonEmptyString(bundleRecord.summary_text);
      if (!processedText && !summaryText) {
        continue;
      }

      competencyComments[competencyId] = {
        ...(processedText ? { processedText } : {}),
        ...(summaryText ? { summaryText } : {}),
      };
    }

    if (Object.keys(competencyComments).length === 0) {
      continue;
    }

    patches.push({
      ...(questionnaireId ? { questionnaireId } : {}),
      ...(subjectEmployeeId ? { subjectEmployeeId } : {}),
      ...(raterEmployeeId ? { raterEmployeeId } : {}),
      competencyComments,
    });
  }

  return patches;
};

const mergeQuestionnaireDraftPayloadWithAiComments = (
  draftPayload: unknown,
  patch: AiCommentPatch,
): Record<string, unknown> => {
  const basePayload = asObjectRecord(draftPayload) ?? {};
  const nextPayload: Record<string, unknown> = {
    ...basePayload,
  };

  const existingComments = asObjectRecord(basePayload.competencyComments) ?? {};
  const nextComments: Record<string, unknown> = {
    ...existingComments,
  };

  for (const [competencyId, bundle] of Object.entries(patch.competencyComments)) {
    const existingBundle = asObjectRecord(existingComments[competencyId]) ?? {};
    nextComments[competencyId] = {
      ...existingBundle,
      ...(bundle.processedText ? { processedText: bundle.processedText } : {}),
      ...(bundle.summaryText ? { summaryText: bundle.summaryText } : {}),
    };
  }

  nextPayload.competencyComments = nextComments;
  return nextPayload;
};

const mapAiRunOutput = (
  row: {
    aiJobId: string;
    campaignId: string;
    provider: string;
    status: string;
    completedAt: Date | null;
    requestedAt: Date;
  },
  wasAlreadyCompleted: boolean,
): RunAiForCampaignOutput => {
  if (row.provider !== MVP_STUB_PROVIDER) {
    throw createOperationError("invalid_input", "Unexpected AI provider for MVP stub.", {
      provider: row.provider,
    });
  }

  if (row.status !== "completed") {
    throw createOperationError("invalid_transition", "AI job is not completed.", {
      status: row.status,
      aiJobId: row.aiJobId,
    });
  }

  return {
    campaignId: row.campaignId,
    aiJobId: row.aiJobId,
    provider: MVP_STUB_PROVIDER,
    status: "completed",
    completedAt: (row.completedAt ?? row.requestedAt).toISOString(),
    wasAlreadyCompleted,
  };
};

export const runAiForCampaign = async (
  input: RunAiForCampaignInput,
): Promise<RunAiForCampaignOutput> => {
  const pool = createPool();
  try {
    const db = createDb(pool);
    return await db.transaction(async (tx) => {
      const campaignRows = await tx
        .select({
          campaignId: campaigns.id,
          companyId: campaigns.companyId,
          status: campaigns.status,
        })
        .from(campaigns)
        .where(and(eq(campaigns.id, input.campaignId), eq(campaigns.companyId, input.companyId)))
        .limit(1);

      const campaign = campaignRows[0];
      if (!campaign) {
        throw createOperationError("not_found", "Campaign not found in active company.", {
          campaignId: input.campaignId,
          companyId: input.companyId,
        });
      }

      if (campaign.status === "processing_ai") {
        throw createOperationError("ai_job_conflict", "AI processing is already running.", {
          campaignId: input.campaignId,
        });
      }

      if (
        campaign.status !== "ended" &&
        campaign.status !== "ai_failed" &&
        campaign.status !== "completed"
      ) {
        throw createOperationError(
          "invalid_transition",
          "AI processing can be started only for ended/ai_failed campaigns.",
          {
            campaignId: input.campaignId,
            status: campaign.status,
          },
        );
      }

      const existingRows = await tx
        .select({
          aiJobId: aiJobs.id,
          campaignId: aiJobs.campaignId,
          provider: aiJobs.provider,
          status: aiJobs.status,
          completedAt: aiJobs.completedAt,
          requestedAt: aiJobs.requestedAt,
        })
        .from(aiJobs)
        .where(
          and(
            eq(aiJobs.campaignId, input.campaignId),
            eq(aiJobs.idempotencyKey, MVP_STUB_IDEMPOTENCY_KEY),
          ),
        )
        .orderBy(desc(aiJobs.createdAt))
        .limit(1);

      const existingJob = existingRows[0];
      if (existingJob) {
        if (campaign.status !== "completed") {
          await tx
            .update(campaigns)
            .set({
              status: "completed",
              updatedAt: new Date(),
            })
            .where(eq(campaigns.id, input.campaignId));
        }

        return mapAiRunOutput(existingJob, true);
      }

      const now = new Date();

      await tx
        .update(campaigns)
        .set({
          status: "processing_ai",
          updatedAt: now,
        })
        .where(eq(campaigns.id, input.campaignId));

      const insertedRows = await tx
        .insert(aiJobs)
        .values({
          companyId: input.companyId,
          campaignId: input.campaignId,
          provider: MVP_STUB_PROVIDER,
          status: "completed",
          idempotencyKey: MVP_STUB_IDEMPOTENCY_KEY,
          requestPayload: {
            campaignId: input.campaignId,
            mode: MVP_STUB_PROVIDER,
          },
          responsePayload: {
            result: "ok",
            mode: MVP_STUB_PROVIDER,
          },
          requestedAt: now,
          completedAt: now,
          createdAt: now,
          updatedAt: now,
        })
        .returning({
          aiJobId: aiJobs.id,
          campaignId: aiJobs.campaignId,
          provider: aiJobs.provider,
          status: aiJobs.status,
          completedAt: aiJobs.completedAt,
          requestedAt: aiJobs.requestedAt,
        });

      const insertedJob = insertedRows[0];
      if (!insertedJob) {
        throw createOperationError("invalid_transition", "Failed to create AI job.");
      }

      await tx
        .update(campaigns)
        .set({
          status: "completed",
          updatedAt: now,
        })
        .where(eq(campaigns.id, input.campaignId));

      return mapAiRunOutput(insertedJob, false);
    });
  } finally {
    await pool.end();
  }
};

export const applyAiWebhookResult = async (
  input: ApplyAiWebhookResultInput,
): Promise<ApplyAiWebhookResultOutput> => {
  const pool = createPool();
  try {
    const db = createDb(pool);
    return await db.transaction(async (tx) => {
      const aiJobRows = await tx
        .select({
          aiJobId: aiJobs.id,
          campaignId: aiJobs.campaignId,
          companyId: aiJobs.companyId,
          aiJobStatus: aiJobs.status,
          campaignStatus: campaigns.status,
        })
        .from(aiJobs)
        .innerJoin(campaigns, eq(campaigns.id, aiJobs.campaignId))
        .where(and(eq(aiJobs.id, input.aiJobId), eq(aiJobs.campaignId, input.campaignId)))
        .limit(1);

      const aiJob = aiJobRows[0];
      if (!aiJob) {
        throw createOperationError("not_found", "AI job not found for campaign.", {
          aiJobId: input.aiJobId,
          campaignId: input.campaignId,
        });
      }

      const now = input.receivedAt ?? new Date();
      const insertedReceipts = await tx
        .insert(aiWebhookReceipts)
        .values({
          companyId: aiJob.companyId,
          campaignId: aiJob.campaignId,
          aiJobId: aiJob.aiJobId,
          idempotencyKey: input.idempotencyKey,
          payload: input.payload,
          receivedAt: now,
          lastReceivedAt: now,
          deliveryCount: 1,
          createdAt: now,
        })
        .onConflictDoNothing()
        .returning({
          receiptId: aiWebhookReceipts.id,
        });

      const insertedReceipt = insertedReceipts[0];
      if (!insertedReceipt) {
        const existingReceipts = await tx
          .select({
            receiptId: aiWebhookReceipts.id,
            campaignId: aiWebhookReceipts.campaignId,
            aiJobId: aiWebhookReceipts.aiJobId,
            deliveryCount: aiWebhookReceipts.deliveryCount,
          })
          .from(aiWebhookReceipts)
          .where(eq(aiWebhookReceipts.idempotencyKey, input.idempotencyKey))
          .limit(1);

        const existingReceipt = existingReceipts[0];
        if (
          !existingReceipt ||
          existingReceipt.campaignId !== input.campaignId ||
          existingReceipt.aiJobId !== input.aiJobId
        ) {
          throw createOperationError("invalid_input", "Idempotency key already used.", {
            idempotencyKey: input.idempotencyKey,
          });
        }

        await tx
          .update(aiWebhookReceipts)
          .set({
            lastReceivedAt: now,
            deliveryCount: (existingReceipt.deliveryCount ?? 1) + 1,
          })
          .where(eq(aiWebhookReceipts.id, existingReceipt.receiptId));

        return {
          applied: false,
          noOp: true,
          campaignStatus: aiJob.campaignStatus,
          aiJobStatus: aiJob.aiJobStatus,
        };
      }

      const nextCampaignStatus = input.status === "completed" ? "completed" : "ai_failed";
      const nextAiJobStatus = input.status === "completed" ? "completed" : "failed";

      if (input.status === "completed") {
        const commentPatches = parseAiCommentPatches(input.payload);
        for (const patch of commentPatches) {
          const rows = await tx
            .select({
              questionnaireId: questionnaires.id,
              draftPayload: questionnaires.draftPayload,
            })
            .from(questionnaires)
            .where(
              patch.questionnaireId
                ? and(
                    eq(questionnaires.companyId, aiJob.companyId),
                    eq(questionnaires.campaignId, input.campaignId),
                    eq(questionnaires.id, patch.questionnaireId),
                  )
                : and(
                    eq(questionnaires.companyId, aiJob.companyId),
                    eq(questionnaires.campaignId, input.campaignId),
                    eq(questionnaires.subjectEmployeeId, patch.subjectEmployeeId ?? ""),
                    eq(questionnaires.raterEmployeeId, patch.raterEmployeeId ?? ""),
                  ),
            )
            .limit(1);

          const row = rows[0];
          if (!row) {
            continue;
          }

          const nextDraftPayload = mergeQuestionnaireDraftPayloadWithAiComments(
            row.draftPayload,
            patch,
          );

          await tx
            .update(questionnaires)
            .set({
              draftPayload: nextDraftPayload,
              updatedAt: now,
            })
            .where(eq(questionnaires.id, row.questionnaireId));
        }
      }

      await tx
        .update(aiJobs)
        .set({
          status: nextAiJobStatus,
          completedAt: input.status === "completed" ? now : null,
          responsePayload: input.status === "completed" ? input.payload : {},
          errorPayload: input.status === "failed" ? input.payload : null,
          updatedAt: now,
        })
        .where(eq(aiJobs.id, input.aiJobId));

      await tx
        .update(campaigns)
        .set({
          status: nextCampaignStatus,
          updatedAt: now,
        })
        .where(eq(campaigns.id, input.campaignId));

      return {
        applied: true,
        noOp: false,
        campaignStatus: nextCampaignStatus,
        aiJobStatus: nextAiJobStatus,
      };
    });
  } finally {
    await pool.end();
  }
};

export const getCampaignStatusForDebug = async (campaignId: string): Promise<string> => {
  const pool = createPool();
  try {
    const db = createDb(pool);
    const rows = await db
      .select({
        status: campaigns.status,
      })
      .from(campaigns)
      .where(eq(campaigns.id, campaignId))
      .limit(1);

    const campaign = rows[0];
    if (!campaign) {
      throw createOperationError("not_found", "Campaign not found.", { campaignId });
    }

    return campaign.status;
  } finally {
    await pool.end();
  }
};

export const listAiJobsForCampaignForDebug = async (campaignId: string): Promise<string[]> => {
  const pool = createPool();
  try {
    const db = createDb(pool);
    const rows = await db
      .select({
        aiJobId: aiJobs.id,
      })
      .from(aiJobs)
      .where(eq(aiJobs.campaignId, campaignId))
      .orderBy(aiJobs.createdAt);

    return rows.map((row) => row.aiJobId);
  } finally {
    await pool.end();
  }
};

export const getAiJobStatusForDebug = async (aiJobId: string): Promise<string> => {
  const pool = createPool();
  try {
    const db = createDb(pool);
    const rows = await db
      .select({
        status: aiJobs.status,
      })
      .from(aiJobs)
      .where(eq(aiJobs.id, aiJobId))
      .limit(1);

    const aiJob = rows[0];
    if (!aiJob) {
      throw createOperationError("not_found", "AI job not found.", { aiJobId });
    }

    return aiJob.status;
  } finally {
    await pool.end();
  }
};

export const countAiWebhookReceiptsForDebug = async (idempotencyKey: string): Promise<number> => {
  const pool = createPool();
  try {
    const db = createDb(pool);
    const rows = await db
      .select({
        receiptId: aiWebhookReceipts.id,
      })
      .from(aiWebhookReceipts)
      .where(eq(aiWebhookReceipts.idempotencyKey, idempotencyKey));

    return rows.length;
  } finally {
    await pool.end();
  }
};

const summarizeWebhookPayload = (payload: unknown): string => {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return "Webhook payload";
  }

  const record = payload as Record<string, unknown>;
  const commentCount = Array.isArray(record.questionnaire_comments)
    ? record.questionnaire_comments.length
    : 0;
  const status =
    typeof record.status === "string" && record.status.trim().length > 0 ? record.status : null;

  return status ? `${status} · comments=${commentCount}` : `comments=${commentCount}`;
};

export const listAiDiagnostics = async (
  input: AiDiagnosticsListInput,
): Promise<AiDiagnosticsListOutput> => {
  const pool = createPool();
  try {
    const db = createDb(pool);
    const jobFilters = [eq(aiJobs.companyId, input.companyId)];
    if (input.campaignId) {
      jobFilters.push(eq(aiJobs.campaignId, input.campaignId));
    }
    if (input.status) {
      jobFilters.push(eq(aiJobs.status, input.status));
    }

    const jobRows = await db
      .select({
        aiJobId: aiJobs.id,
        campaignId: aiJobs.campaignId,
        provider: aiJobs.provider,
        status: aiJobs.status,
        requestedAt: aiJobs.requestedAt,
        completedAt: aiJobs.completedAt,
        idempotencyKey: aiJobs.idempotencyKey,
      })
      .from(aiJobs)
      .where(and(...jobFilters))
      .orderBy(desc(aiJobs.requestedAt), asc(aiJobs.id));

    const receiptRows = await db
      .select({
        receiptId: aiWebhookReceipts.id,
        aiJobId: aiWebhookReceipts.aiJobId,
        idempotencyKey: aiWebhookReceipts.idempotencyKey,
        receivedAt: aiWebhookReceipts.receivedAt,
        lastReceivedAt: aiWebhookReceipts.lastReceivedAt,
        deliveryCount: aiWebhookReceipts.deliveryCount,
        payload: aiWebhookReceipts.payload,
      })
      .from(aiWebhookReceipts)
      .where(
        input.campaignId
          ? and(
              eq(aiWebhookReceipts.companyId, input.companyId),
              eq(aiWebhookReceipts.campaignId, input.campaignId),
            )
          : eq(aiWebhookReceipts.companyId, input.companyId),
      )
      .orderBy(desc(aiWebhookReceipts.receivedAt), asc(aiWebhookReceipts.id));

    const receiptsByJobId = new Map(
      receiptRows.map((row) => [
        row.aiJobId,
        {
          receiptId: row.receiptId,
          idempotencyKey: row.idempotencyKey,
          receivedAt: row.receivedAt,
          lastReceivedAt: row.lastReceivedAt,
          deliveryCount: row.deliveryCount,
          payloadSummary: summarizeWebhookPayload(row.payload),
        },
      ]),
    );

    return {
      items: jobRows.map((row) => ({
        ...row,
        receipt: receiptsByJobId.get(row.aiJobId) ?? null,
      })),
    };
  } finally {
    await pool.end();
  }
};
