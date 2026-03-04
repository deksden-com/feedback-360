import { createOperationError } from "@feedback-360/api-contract";
import { and, desc, eq } from "drizzle-orm";

import { createDb, createPool } from "./db";
import { aiJobs, campaigns } from "./schema";

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
