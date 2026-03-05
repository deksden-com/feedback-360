import { createOperationError } from "@feedback-360/api-contract";
import { and, desc, eq } from "drizzle-orm";

import { createDb, createPool } from "./db";
import {
  aiCommentAggregates,
  aiJobs,
  aiWebhookReceipts,
  campaignAssignments,
  campaigns,
  questionnaires,
} from "./schema";

const MVP_STUB_PROVIDER = "mvp_stub";
const MVP_STUB_IDEMPOTENCY_KEY = "mvp_stub_default";

type AiCommentAggregateGroup = "manager" | "peers" | "subordinates" | "self";

type AiCommentAggregateRowInput = {
  campaignId: string;
  companyId: string;
  subjectEmployeeId: string;
  competencyId: string;
  raterGroup: AiCommentAggregateGroup;
  rawText?: string;
  processedText?: string;
  summaryText?: string;
};

type DbLike = Pick<ReturnType<typeof createDb>, "select" | "insert" | "delete">;

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

const mapAssignmentRoleToAggregateGroup = (
  value: string | null,
): AiCommentAggregateGroup | undefined => {
  if (value === "manager") {
    return "manager";
  }
  if (value === "peer") {
    return "peers";
  }
  if (value === "subordinate") {
    return "subordinates";
  }
  if (value === "self") {
    return "self";
  }
  return undefined;
};

const normalizeCommentText = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
};

const extractCommentRecords = (
  payload: unknown,
): Array<{
  competencyId: string;
  rawText?: string;
  processedText?: string;
  summaryText?: string;
}> => {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    return [];
  }

  const competencyComments = (payload as Record<string, unknown>).competencyComments;
  if (
    typeof competencyComments !== "object" ||
    competencyComments === null ||
    Array.isArray(competencyComments)
  ) {
    return [];
  }

  const records: Array<{
    competencyId: string;
    rawText?: string;
    processedText?: string;
    summaryText?: string;
  }> = [];
  for (const [competencyId, value] of Object.entries(competencyComments)) {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      continue;
    }
    const rawText = normalizeCommentText((value as Record<string, unknown>).rawText);
    const processedText = normalizeCommentText((value as Record<string, unknown>).processedText);
    const summaryText = normalizeCommentText((value as Record<string, unknown>).summaryText);

    if (!rawText && !processedText && !summaryText) {
      continue;
    }

    records.push({
      competencyId,
      ...(rawText ? { rawText } : {}),
      ...(processedText ? { processedText } : {}),
      ...(summaryText ? { summaryText } : {}),
    });
  }

  return records;
};

const rebuildAiCommentAggregatesFromQuestionnairesInTx = async (
  tx: DbLike,
  input: {
    companyId: string;
    campaignId: string;
    source: string;
    now: Date;
  },
): Promise<number> => {
  const questionnaireRows = await tx
    .select({
      questionnaireId: questionnaires.id,
      subjectEmployeeId: questionnaires.subjectEmployeeId,
      draftPayload: questionnaires.draftPayload,
      raterRole: campaignAssignments.raterRole,
    })
    .from(questionnaires)
    .leftJoin(
      campaignAssignments,
      and(
        eq(campaignAssignments.campaignId, questionnaires.campaignId),
        eq(campaignAssignments.subjectEmployeeId, questionnaires.subjectEmployeeId),
        eq(campaignAssignments.raterEmployeeId, questionnaires.raterEmployeeId),
      ),
    )
    .where(
      and(
        eq(questionnaires.companyId, input.companyId),
        eq(questionnaires.campaignId, input.campaignId),
        eq(questionnaires.status, "submitted"),
      ),
    );

  const rowsByScope = new Map<
    string,
    {
      campaignId: string;
      companyId: string;
      subjectEmployeeId: string;
      competencyId: string;
      raterGroup: AiCommentAggregateGroup;
      rawTexts: string[];
      processedTexts: string[];
      summaryTexts: string[];
    }
  >();
  for (const row of questionnaireRows) {
    const raterGroup = mapAssignmentRoleToAggregateGroup(row.raterRole);
    if (!raterGroup) {
      continue;
    }

    const commentRecords = extractCommentRecords(row.draftPayload);
    for (const comment of commentRecords) {
      const key = `${row.subjectEmployeeId}:${comment.competencyId}:${raterGroup}`;
      const entry = rowsByScope.get(key) ?? {
        campaignId: input.campaignId,
        companyId: input.companyId,
        subjectEmployeeId: row.subjectEmployeeId,
        competencyId: comment.competencyId,
        raterGroup,
        rawTexts: [],
        processedTexts: [],
        summaryTexts: [],
      };
      if (comment.rawText) {
        entry.rawTexts.push(comment.rawText);
      }
      if (comment.processedText) {
        entry.processedTexts.push(comment.processedText);
      }
      if (comment.summaryText) {
        entry.summaryTexts.push(comment.summaryText);
      }
      rowsByScope.set(key, entry);
    }
  }

  const rowsToInsert = [...rowsByScope.values()].map((entry) => {
    const row: AiCommentAggregateRowInput = {
      campaignId: entry.campaignId,
      companyId: entry.companyId,
      subjectEmployeeId: entry.subjectEmployeeId,
      competencyId: entry.competencyId,
      raterGroup: entry.raterGroup,
      ...(entry.rawTexts.length > 0 ? { rawText: entry.rawTexts.join("\n\n") } : {}),
      ...(entry.processedTexts.length > 0
        ? { processedText: entry.processedTexts.join("\n\n") }
        : {}),
      ...(entry.summaryTexts.length > 0 ? { summaryText: entry.summaryTexts.join("\n\n") } : {}),
    };
    return row;
  });

  await tx
    .delete(aiCommentAggregates)
    .where(
      and(
        eq(aiCommentAggregates.companyId, input.companyId),
        eq(aiCommentAggregates.campaignId, input.campaignId),
      ),
    );

  if (rowsToInsert.length > 0) {
    await tx.insert(aiCommentAggregates).values(
      rowsToInsert.map((row) => ({
        companyId: row.companyId,
        campaignId: row.campaignId,
        subjectEmployeeId: row.subjectEmployeeId,
        competencyId: row.competencyId,
        raterGroup: row.raterGroup,
        rawText: row.rawText ?? null,
        processedText: row.processedText ?? null,
        summaryText: row.summaryText ?? null,
        source: input.source,
        createdAt: input.now,
        updatedAt: input.now,
      })),
    );
  }

  return rowsToInsert.length;
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

      const now = new Date();

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
              updatedAt: now,
            })
            .where(eq(campaigns.id, input.campaignId));
        }

        await rebuildAiCommentAggregatesFromQuestionnairesInTx(tx, {
          companyId: input.companyId,
          campaignId: input.campaignId,
          source: MVP_STUB_PROVIDER,
          now,
        });

        return mapAiRunOutput(existingJob, true);
      }

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

      await rebuildAiCommentAggregatesFromQuestionnairesInTx(tx, {
        companyId: input.companyId,
        campaignId: input.campaignId,
        source: MVP_STUB_PROVIDER,
        now,
      });

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
            campaignId: aiWebhookReceipts.campaignId,
            aiJobId: aiWebhookReceipts.aiJobId,
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

        return {
          applied: false,
          noOp: true,
          campaignStatus: aiJob.campaignStatus,
          aiJobStatus: aiJob.aiJobStatus,
        };
      }

      const nextCampaignStatus = input.status === "completed" ? "completed" : "ai_failed";
      const nextAiJobStatus = input.status === "completed" ? "completed" : "failed";

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

      if (input.status === "completed") {
        await rebuildAiCommentAggregatesFromQuestionnairesInTx(tx, {
          companyId: aiJob.companyId,
          campaignId: input.campaignId,
          source: "webhook",
          now,
        });
      }

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

export const countAiCommentAggregatesForCampaignForDebug = async (
  campaignId: string,
): Promise<number> => {
  const pool = createPool();
  try {
    const db = createDb(pool);
    const rows = await db
      .select({
        aggregateId: aiCommentAggregates.id,
      })
      .from(aiCommentAggregates)
      .where(eq(aiCommentAggregates.campaignId, campaignId));

    return rows.length;
  } finally {
    await pool.end();
  }
};
