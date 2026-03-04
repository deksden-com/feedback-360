import { createOperationError } from "@feedback-360/api-contract";
import { and, eq } from "drizzle-orm";

import { createDb, createPool } from "./db";
import { campaigns, companies, competencyModelVersions } from "./schema";

type CreateCampaignInput = {
  companyId: string;
  modelVersionId: string;
  name: string;
  startAt: string;
  endAt: string;
  timezone?: string;
};

export type CreateCampaignOutput = {
  campaignId: string;
  companyId: string;
  modelVersionId: string;
  name: string;
  status: "draft";
  startAt: string;
  endAt: string;
  timezone: string;
  createdAt: string;
};

const parseTimestamp = (value: string, fieldName: string): Date => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw createOperationError(
      "invalid_input",
      `${fieldName} must be a valid ISO datetime string.`,
    );
  }
  return parsed;
};

export const createCampaign = async (input: CreateCampaignInput): Promise<CreateCampaignOutput> => {
  const name = input.name.trim();
  if (name.length === 0) {
    throw createOperationError("invalid_input", "Campaign name must be non-empty.");
  }

  const startAt = parseTimestamp(input.startAt, "startAt");
  const endAt = parseTimestamp(input.endAt, "endAt");
  if (endAt <= startAt) {
    throw createOperationError("invalid_input", "endAt must be greater than startAt.");
  }

  const pool = createPool();
  try {
    const db = createDb(pool);
    return await db.transaction(async (tx) => {
      const companyRows = await tx
        .select({
          timezone: companies.timezone,
        })
        .from(companies)
        .where(eq(companies.id, input.companyId))
        .limit(1);

      const company = companyRows[0];
      if (!company) {
        throw createOperationError("not_found", "Company not found.", {
          companyId: input.companyId,
        });
      }

      const modelRows = await tx
        .select({
          modelVersionId: competencyModelVersions.id,
        })
        .from(competencyModelVersions)
        .where(
          and(
            eq(competencyModelVersions.id, input.modelVersionId),
            eq(competencyModelVersions.companyId, input.companyId),
          ),
        )
        .limit(1);

      if (!modelRows[0]) {
        throw createOperationError("not_found", "Model version not found in active company.", {
          modelVersionId: input.modelVersionId,
          companyId: input.companyId,
        });
      }

      const timezone = input.timezone?.trim() || company.timezone;
      const now = new Date();
      const insertedRows = await tx
        .insert(campaigns)
        .values({
          companyId: input.companyId,
          modelVersionId: input.modelVersionId,
          name,
          status: "draft",
          timezone,
          startAt,
          endAt,
          lockedAt: null,
          createdAt: now,
          updatedAt: now,
        })
        .returning({
          campaignId: campaigns.id,
          createdAt: campaigns.createdAt,
        });

      const campaign = insertedRows[0];
      if (!campaign) {
        throw createOperationError("invalid_transition", "Failed to create campaign.");
      }

      return {
        campaignId: campaign.campaignId,
        companyId: input.companyId,
        modelVersionId: input.modelVersionId,
        name,
        status: "draft",
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        timezone,
        createdAt: campaign.createdAt.toISOString(),
      };
    });
  } finally {
    await pool.end();
  }
};
